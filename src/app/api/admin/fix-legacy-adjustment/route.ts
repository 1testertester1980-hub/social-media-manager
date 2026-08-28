import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

/**
 * One-off, temporary route to resolve a single orphaned PENDING
 * PointsAdjustment left over from a since-removed worker-bonus-request
 * feature (no goalId, so no current admin UI can approve/reject it).
 * Admin decided +1 point (not the worker's original +2 ask), matching the
 * same "admin decides independently" pattern used for Pupio quality
 * points. Delete this route after running it once.
 */
export async function GET() {
  await requireAdmin();

  const target = await prisma.pointsAdjustment.findFirst({
    where: {
      category: "GENERAL",
      status: "PENDING",
      requestedByWorker: true,
      goalId: null,
      reason: "Snažil som sa na Edite pupio.sk",
    },
  });

  if (!target) {
    return NextResponse.json({ ok: false, message: "No matching orphaned adjustment found (already resolved?)." });
  }

  const updated = await prisma.pointsAdjustment.update({
    where: { id: target.id },
    data: { amount: 1, status: "APPROVED" },
  });

  return NextResponse.json({ ok: true, updated });
}
