import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyTaskOverdue } from "@/lib/notify";

/**
 * Flips PLANNED/TODO tasks whose deadline has passed to OVERDUE and fires
 * notifications for the ones that just crossed the line. Idempotent — safe
 * to call from page loads and from a Vercel Cron endpoint alike.
 *
 * Quality-tracked profiles (Pupio) are exempt — there's no time limit on
 * those Reels, only a daily count, so they never get flagged as overdue.
 */
export async function syncOverdueTasks() {
  const now = new Date();
  const newlyOverdue = await prisma.contentTask.findMany({
    where: {
      status: { in: ["PLANNED", "TODO"] },
      deadlineAt: { lt: now },
      profile: { qualityTracked: false },
    },
    select: { id: true },
  });

  if (newlyOverdue.length === 0) return { updated: 0 };

  await prisma.contentTask.updateMany({
    where: { id: { in: newlyOverdue.map((t) => t.id) } },
    data: { status: "OVERDUE" },
  });

  for (const task of newlyOverdue) {
    await notifyTaskOverdue(task.id);
  }

  return { updated: newlyOverdue.length };
}
