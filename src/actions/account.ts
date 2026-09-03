"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUserPoints } from "@/lib/queries";
import { sendTelegramMessage } from "@/lib/telegram";
import type { ActionResult } from "@/actions/tasks";

const schema = z.object({
  telegramChatId: z.string().max(100).optional().or(z.literal("")),
  password: z.string().min(6).optional().or(z.literal("")),
});

/** A fresh start feels better than a neutral zero — a small head start into the new mode. */
const POINTS_MODE_START_BALANCE = 15;

export async function updateOwnAccount(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const data: Record<string, unknown> = {};
  if (d.telegramChatId !== undefined) data.telegramChatId = d.telegramChatId || null;
  if (d.password) data.passwordHash = await bcrypt.hash(d.password, 10);

  await prisma.user.update({ where: { id: user.id }, data });

  revalidatePath("/account");
  return { ok: true, data: undefined };
}

/**
 * Worker switches their own points scoring mode:
 * - STANDARD: the full system (3 b./regular Reel, -5 penalty for a missed
 *   deadline; Pupio's own rules unchanged).
 * - SIMPLE: no penalties for the 2 daily rotation Reels — publishing both
 *   on a day earns a flat +3 for that day, publishing 0 or 1 earns
 *   nothing, never a debt. Pupio is identical in both modes.
 * Switching INTO SIMPLE always resets the worker's current net balance to
 * a flat +15 (via a balancing PointsAdjustment, never by editing history)
 * — a clean, encouraging restart, since the whole point of the mode is
 * escaping an existing negative streak. Switching back to STANDARD does
 * not touch the balance.
 */
export async function setPointsMode(mode: "STANDARD" | "SIMPLE"): Promise<ActionResult> {
  const user = await requireUser();

  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { pointsMode: true } });
  if (!current) return { ok: false, error: "Nenájdené" };
  if (mode !== "STANDARD" && mode !== "SIMPLE") return { ok: false, error: "Neplatný režim" };

  await prisma.user.update({ where: { id: user.id }, data: { pointsMode: mode } });

  if (mode === "SIMPLE" && current.pointsMode !== "SIMPLE") {
    // Compute the balance AFTER the mode switch (pointsMode is already
    // SIMPLE in the DB at this point), so this reflects what his total
    // actually is under the new mode's rules — not the old STANDARD
    // total, which included a since-irrelevant overdue penalty.
    const score = await getUserPoints(user.id);
    const delta = POINTS_MODE_START_BALANCE - score.points;
    if (delta !== 0) {
      await prisma.pointsAdjustment.create({
        data: {
          userId: user.id,
          amount: delta,
          reason: `Nový štart pri prechode na jednoduchý režim (${POINTS_MODE_START_BALANCE} b.)`,
          requestedByWorker: false,
          status: "APPROVED",
          category: "GENERAL",
        },
      });
    }
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { telegramChatId: true } });
  if (mode === "SIMPLE") {
    await sendTelegramMessage(
      fullUser?.telegramChatId,
      `📢 <b>Prepol si na jednoduchý režim bodovania</b>\n\n2 bežné Reely za deň = <b>+3 body dokopy</b>, žiadne strhávanie bodov za bežné Reely. Pupio ostáva rovnaké. Začínaš s <b>+${POINTS_MODE_START_BALANCE} bodmi</b>.`
    );
  }

  revalidatePath("/account");
  revalidatePath("/my-tasks");
  revalidatePath("/pravidla");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
