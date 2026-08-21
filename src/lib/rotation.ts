import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyTaskAssigned } from "@/lib/notify";

/**
 * Which 2 profiles get a Reel each day. Keyed by JS Date#getDay() (0 = Sunday
 * ... 6 = Saturday). Profile ids equal their seeded names (see prisma/seed.ts).
 * Each profile appears roughly evenly across the week.
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

export const DAILY_DEADLINE_HOUR = 19;
export const DAILY_DEADLINE_MINUTE = 0;

/**
 * Creates today's rotation tasks (2 profiles/day) for the single active
 * worker, if they don't already exist. Safe to call repeatedly — idempotent
 * per profile/worker/day. Called on every page load and from the daily cron.
 */
export async function generateDailyTasks() {
  const now = new Date();
  const todayStart = new Date(now.toDateString());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const profileIds = WEEKDAY_ROTATION[now.getDay()];
  if (!profileIds) return { created: 0 };

  const worker = await prisma.user.findFirst({
    where: { role: "WORKER", active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!worker) return { created: 0 };

  const deadline = new Date(todayStart);
  deadline.setHours(DAILY_DEADLINE_HOUR, DAILY_DEADLINE_MINUTE, 0, 0);

  let created = 0;
  for (const profileId of profileIds) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.active) continue;

    const existing = await prisma.contentTask.findFirst({
      where: {
        profileId,
        assignedUserId: worker.id,
        deadlineAt: { gte: todayStart, lt: todayEnd },
      },
    });
    if (existing) continue;

    const task = await prisma.contentTask.create({
      data: {
        profileId,
        assignedUserId: worker.id,
        title: `Denný Reel - ${profile.name}`,
        deadlineAt: deadline,
        status: "PLANNED",
      },
    });
    created++;
    await notifyTaskAssigned(task.id);
  }

  return { created };
}
