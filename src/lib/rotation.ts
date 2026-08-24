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
 * Creates the daily task load for the single active worker, for today
 * through the next HORIZON_DAYS days, wherever it doesn't already exist.
 * Idempotent — safe to call repeatedly (bulk reads, not one query per
 * day/profile). Deadlines are always 20:00 Europe/Bratislava time, correctly
 * converted regardless of the server's own timezone. Called on every page
 * load and from the daily cron.
 *
 * Two independent schedules run side by side:
 * - WEEKDAY_ROTATION: 2 profiles/day, varying by weekday (the original 5
 *   profiles).
 * - Fixed-count profiles (Profile.dailyReelCount > 0, e.g. Pupio): exactly N
 *   Reels every single day, regardless of weekday.
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
  const fixedCountProfiles = profiles.filter((p) => p.dailyReelCount > 0);

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
  const existingCounts = new Map<string, number>();
  for (const t of existingTasks) {
    const key = `${t.profileId}|${tzDayKey(t.deadlineAt)}`;
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  let created = 0;

  for (const d of days) {
    // Rotation: 2 varying profiles/day.
    const rotationProfileIds = WEEKDAY_ROTATION[d.weekday] ?? [];
    for (const profileId of rotationProfileIds) {
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
      if (d.offset === 0) await notifyTaskAssigned(task.id);
    }

    // Fixed-count profiles: exactly N Reels every day, independent of weekday.
    for (const profile of fixedCountProfiles) {
      const key = `${profile.id}|${d.dayKey}`;
      const already = existingCounts.get(key) ?? 0;
      for (let i = already; i < profile.dailyReelCount; i++) {
        const task = await prisma.contentTask.create({
          data: {
            profileId: profile.id,
            assignedUserId: worker.id,
            title: `${profile.name} Reel ${i + 1}/${profile.dailyReelCount}`,
            deadlineAt: d.deadline,
            status: "PLANNED",
          },
        });
        created++;
        if (d.offset === 0) await notifyTaskAssigned(task.id);
      }
    }
  }

  return { created };
}
