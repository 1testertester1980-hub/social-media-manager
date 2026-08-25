"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createUserSchema, updateUserSchema, pointsPenaltySchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/tasks";

export async function createUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existing) return { ok: false, error: "Používateľ s týmto emailom už existuje" };

  const passwordHash = await bcrypt.hash(d.password, 10);
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      passwordHash,
      role: d.role,
      telegramChatId: d.telegramChatId || null,
    },
  });

  revalidatePath("/settings/users");
  return { ok: true, data: { id: user.id } };
}

export async function updateUser(userId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateUserSchema.safeParse({
    ...raw,
    active: raw.active === "true" ? true : raw.active === "false" ? false : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const data: Record<string, unknown> = {};
  if (d.name) data.name = d.name;
  if (d.role) data.role = d.role;
  if (d.telegramChatId !== undefined) data.telegramChatId = d.telegramChatId || null;
  if (d.active !== undefined) data.active = d.active;
  if (d.bonusPoints !== undefined && !Number.isNaN(d.bonusPoints)) data.bonusPoints = d.bonusPoints;
  if (d.password) data.passwordHash = await bcrypt.hash(d.password, 10);

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/settings/users");
  return { ok: true, data: undefined };
}

/** Admin issues a points penalty (with a mandatory reason) as a permanent log entry. */
export async function addPointsPenalty(userId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = pointsPenaltySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { amount, reason } = parsed.data;

  await prisma.pointsAdjustment.create({ data: { userId, amount, reason } });
  await prisma.notification.create({
    data: {
      userId,
      type: "SYSTEM",
      title: "Boli ti odpočítané body",
      message: `${amount} b. — dôvod: ${reason}`,
    },
  });

  revalidatePath("/settings/users");
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Admin decides the final Pupio quality-bonus points for a Reel — their own
 * chosen number, independent of what the worker asked for. Always results
 * in an APPROVED entry (even if the admin picks 0), so it's a single
 * "decide" action rather than a separate approve/reject.
 */
export async function decideQualityRequest(adjustmentId: string, decidedAmount: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(decidedAmount) || decidedAmount < 0 || decidedAmount > 20) {
    return { ok: false, error: "Zadajte počet bodov 0-20" };
  }

  const adjustment = await prisma.pointsAdjustment.findUnique({ where: { id: adjustmentId } });
  if (!adjustment || !adjustment.requestedByWorker || adjustment.status !== "PENDING" || adjustment.category !== "PUPIO_QUALITY") {
    return { ok: false, error: "Žiadosť už bola vybavená" };
  }

  await prisma.pointsAdjustment.update({
    where: { id: adjustmentId },
    data: { status: "APPROVED", decidedAmount, decidedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: adjustment.userId,
      type: "SYSTEM",
      title: "Pupio kvalitné body pridelené",
      message: `Za "${adjustment.reason}" ti admin pridelil ${decidedAmount} b. (žiadal si ${adjustment.amount} b.)`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/my-tasks");
  revalidatePath("/account");
  return { ok: true, data: undefined };
}
