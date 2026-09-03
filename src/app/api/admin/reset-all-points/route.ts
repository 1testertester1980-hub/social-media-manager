import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getUserPoints } from "@/lib/queries";

/**
 * One-off, temporary route: zeroes every worker's current net points
 * balance to 0, right now, regardless of which points mode they're in —
 * via a single balancing PointsAdjustment per worker (never by editing
 * task/publish history), same audit-log-only approach used everywhere
 * else in this app. Idempotent to run twice (a worker already at 0 is
 * skipped). Delete this route after running it once.
 */
export async function GET() {
  await requireAdmin();

  const workers = await prisma.user.findMany({ where: { role: "WORKER" } });
  const results: { userId: string; name: string; before: number; adjustment: number }[] = [];

  for (const worker of workers) {
    const score = await getUserPoints(worker.id);
    if (score.points === 0) {
      results.push({ userId: worker.id, name: worker.name, before: 0, adjustment: 0 });
      continue;
    }
    await prisma.pointsAdjustment.create({
      data: {
        userId: worker.id,
        amount: -score.points,
        reason: "Vynulovanie bodov na 0 (admin)",
        requestedByWorker: false,
        status: "APPROVED",
        category: "GENERAL",
      },
    });
    results.push({ userId: worker.id, name: worker.name, before: score.points, adjustment: -score.points });
  }

  return NextResponse.json({ ok: true, results });
}
