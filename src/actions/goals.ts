"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { createGoalSchema, updateGoalProgressSchema, requestGoalCompletionSchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/tasks";

/** Worker sets their own marketing target, e.g. "5000 zhliadnutí tento mesiac". */
export async function createMarketingGoal(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (user.role !== "WORKER") {
    return { ok: false, error: "Táto funkcia je len pre pracovníkov" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = createGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { title, targetValue, unit } = parsed.data;
  const parsedTarget = targetValue ? Number.parseInt(targetValue, 10) : NaN;

  const goal = await prisma.marketingGoal.create({
    data: {
      userId: user.id,
      title,
      targetValue: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null,
      unit: unit || null,
      currentValue: 0,
    },
  });

  revalidatePath("/my-tasks");
  revalidatePath("/marketing-strategia");
  return { ok: true, data: { id: goal.id } };
}

/** Worker logs how far along they are toward their own goal. */
export async function updateGoalProgress(goalId: string, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const goal = await prisma.marketingGoal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== user.id) {
    return { ok: false, error: "Nenájdené" };
  }
  if (goal.status !== "ACTIVE") {
    return { ok: false, error: "Cieľ už je uzavretý" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateGoalProgressSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.marketingGoal.update({
    where: { id: goalId },
    data: { currentValue: parsed.data.currentValue },
  });

  revalidatePath("/my-tasks");
  revalidatePath("/marketing-strategia");
  return { ok: true, data: undefined };
}

/** Worker marks their goal as fulfilled and picks 5 or 10 points to request for it; admin still has to approve. */
export async function requestGoalCompletion(goalId: string, points: number): Promise<ActionResult> {
  const user = await requireUser();

  const goal = await prisma.marketingGoal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== user.id) {
    return { ok: false, error: "Nenájdené" };
  }
  if (goal.status !== "ACTIVE") {
    return { ok: false, error: "Cieľ už je uzavretý" };
  }

  const parsed = requestGoalCompletionSchema.safeParse({ points });
  if (!parsed.success) {
    return { ok: false, error: "Vyberte 5 alebo 10 bodov" };
  }

  const existing = await prisma.pointsAdjustment.findUnique({ where: { goalId } });
  if (existing && existing.status === "PENDING") {
    return { ok: false, error: "Žiadosť pre tento cieľ už čaká na schválenie" };
  }

  await prisma.pointsAdjustment.create({
    data: {
      userId: user.id,
      amount: parsed.data.points,
      reason: `Splnený marketingový cieľ: ${goal.title}`,
      requestedByWorker: true,
      status: "PENDING",
      category: "GENERAL",
      goalId: goal.id,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "SYSTEM",
        title: "Splnený marketingový cieľ",
        message: `${user.name} splnil cieľ "${goal.title}" a žiada o +${parsed.data.points} b.`,
      },
    });
  }

  revalidatePath("/my-tasks");
  revalidatePath("/dashboard");
  revalidatePath("/marketing-strategia");
  return { ok: true, data: undefined };
}

/** Worker deletes an active goal they no longer want to pursue. */
export async function deleteGoal(goalId: string): Promise<ActionResult> {
  const user = await requireUser();

  const goal = await prisma.marketingGoal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== user.id) {
    return { ok: false, error: "Nenájdené" };
  }
  if (goal.status !== "ACTIVE") {
    return { ok: false, error: "Splnený cieľ nie je možné odstrániť" };
  }

  await prisma.marketingGoal.delete({ where: { id: goalId } });

  revalidatePath("/my-tasks");
  revalidatePath("/marketing-strategia");
  return { ok: true, data: undefined };
}

/**
 * Admin approves or rejects a worker's goal-completion points request. On
 * approval the goal is marked COMPLETED; on rejection the request is
 * detached from the goal so the worker can try again later.
 */
export async function decideGoalCompletion(
  adjustmentId: string,
  decision: "APPROVE" | "REJECT"
): Promise<ActionResult> {
  await requireAdmin();

  const adjustment = await prisma.pointsAdjustment.findUnique({ where: { id: adjustmentId } });
  if (!adjustment || !adjustment.requestedByWorker || adjustment.status !== "PENDING" || !adjustment.goalId) {
    return { ok: false, error: "Žiadosť už bola vybavená" };
  }

  if (decision === "APPROVE") {
    await prisma.$transaction([
      prisma.pointsAdjustment.update({
        where: { id: adjustmentId },
        data: { status: "APPROVED", decidedAt: new Date() },
      }),
      prisma.marketingGoal.update({
        where: { id: adjustment.goalId },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.pointsAdjustment.update({
      where: { id: adjustmentId },
      data: { status: "REJECTED", decidedAt: new Date(), goalId: null },
    });
  }

  await prisma.notification.create({
    data: {
      userId: adjustment.userId,
      type: "SYSTEM",
      title: decision === "APPROVE" ? "Marketingový cieľ schválený" : "Žiadosť o body zamietnutá",
      message:
        decision === "APPROVE"
          ? `Admin ti schválil +${adjustment.amount} b. za splnený cieľ.`
          : `Admin zamietol tvoju žiadosť o +${adjustment.amount} b. Skús cieľ upraviť a požiadať znova.`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/my-tasks");
  revalidatePath("/account");
  revalidatePath("/marketing-strategia");
  return { ok: true, data: undefined };
}
