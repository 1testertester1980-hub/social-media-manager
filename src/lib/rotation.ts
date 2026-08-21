import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyTaskAssigned } from "@/lib/notify";
import { zonedTimeToUtc, tzDayKey } from "@/lib/utils";

const APP_TZ = "Europe/Bratislava";

/**
 * Which 2 profiles get a Reel each day. Keyed by JS Date#getUTCDay() applied
 * to the calendar date (0 = Sunday ... 6 = Saturday). Profile ids equal their
 * seeded names (see prisma/seed.ts). Each profile appears roughly evenly
 * across the week.
 */
export const WEEKDAY_ROTATION: Record<number, [string, string]> = {
  1: ["Chlapec na medicíne", "Mediktest"], // Pondelok
  2: ["Mediktest CZ", "Dievča na medicíne"], // Utorok
  3: ["Studigenius", "Chlapec na medicíne"], // Streda
  4: ["Mediktest", "Mediktest CZ"], // Štvrtok
  5: ["Dievča na medicíne", "Studigenius"], // Piatok
  6: ["Chlapec na medicíne", "Mediktest"], // Sobota
  0: ["Mediktest CZ", "Dievča na medicíne"], // Nedeľa
};

export const DAILY_DEADLINE_HOUR = 20;
export const DAILY_DEADLINE_MINUTE = 0;

/** How many days ahead to pre-populate, so the calendar shows upcoming assignments. */
const HORIZON_DAYS = 14;

/** Y/M/D of "today" as seen in Europe/Bratislava, independent of server TZ. */
function todayYmd() {
  const [year, month, day] = tzDayKey(new Date()).split("-").map(Number);
  return { year, month, day };
}

/**
 * Creates rotation tasks (2 profiles/day) for today through the next
 * HORIZON_DAYS days, for the single active worker, wherever they don't
 * already exist. Idempotent per profile/worker/day — safe to call
 * repeatedly (uses two bulk reads, not one query per day). Deadlines are
 * always 20:00 Europe/Bratislava time, correctly converted regardless of the
 * server's own timezone. Called on every page load and from the daily cron,
 * so the calendar always shows a rolling two-week preview of upcoming
 * assignments.
 */
export async function generateDailyTasks() {
  const { year, month, day } = todayYmd();

  const worker = await prisma.user.findFirst({
    where: { role: "WORKER", active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!worker) return { created: 0 };

  const profiles = await prisma.profile.findMany({ where: { active: true } });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Precompute each day's Y/M/D, weekday and deadline via pure calendar
  // arithmetic (no timezone ambiguity) anchored on "today" in Bratislava.
  const days = Array.from({ length: HORIZON_DAYS }, (_, offset) => {
    const cursor = new Date(Date.UTC(year, month - 1, day + offset));
    const cy = cursor.getUTCFullYear();
    const cm = cursor.getUTCMonth() + 1;
    const cd = cursor.getUTCDate();
    return {
      offset,
      weekday: cursor.getUTCDay(),
      dayKey: `${cy}-${String(cm).padStart(2, "0")}-${String(cd).padStart(2, "0")}`,
      deadline: zonedTimeToUtc(cy, cm, cd, DAILY_DEADLINE_HOUR, DAILY_DEADLINE_MINUTE, APP_TZ),
    };
  });

  const horizonStart = zonedTimeToUtc(year, month, day, 0, 0, APP_TZ);
  const horizonEnd = new Date(days[days.length - 1].deadline.getTime() + 86400000);

  const existingTasks = await prisma.contentTask.findMany({
    where: { assignedUserId: worker.id, deadlineAt: { gte: horizonStart, lt: horizonEnd } },
    select: { profileId: true, deadlineAt: true },
  });
  const existingKeys = new Set(existingTasks.map((t) => `${t.profileId}|${tzDayKey(t.deadlineAt)}`));

  let created = 0;

  for (const d of days) {
    const profileIds = WEEKDAY_ROTATION[d.weekday];
    if (!profileIds) continue;

    for (const profileId of profileIds) {
      const profile = profileById.get(profileId);
      if (!profile) continue;
      if (existingKeys.has(`${profileId}|${d.dayKey}`)) continue;

      const task = await prisma.contentTask.create({
        data: {
          profileId,
          assignedUserId: worker.id,
          title: `Denný Reel - ${profile.name}`,
          deadlineAt: d.deadline,
          status: "PLANNED",
        },
      });
      created++;

      // Only ping the worker for today's tasks — pre-populated future days
      // are just a calendar preview, not something to act on yet.
      if (d.offset === 0) await notifyTaskAssigned(task.id);
    }
  }

  return { created };
}
