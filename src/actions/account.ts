"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendTelegramMessage } from "@/lib/telegram";
import type { ActionResult } from "@/actions/tasks";

const schema = z.object({
  telegramChatId: z.string().max(100).optional().or(z.literal("")),
  password: z.string().min(6).optional().or(z.literal("")),
});

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
 * No balance reset either way — switching only changes which rules apply
 * going forward. His total is simply recomputed under the new mode's
 * rules from the same real task history (no per-Reel points/overdue
 * penalty for regular Reels while in SIMPLE), so he keeps going from
 * wherever he already is, not from an artificial number.
 */
export async function setPointsMode(mode: "STANDARD" | "SIMPLE"): Promise<ActionResult> {
  const user = await requireUser();

  if (mode !== "STANDARD" && mode !== "SIMPLE") return { ok: false, error: "Neplatný režim" };

  await prisma.user.update({ where: { id: user.id }, data: { pointsMode: mode } });

  if (mode === "SIMPLE") {
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { telegramChatId: true } });
    await sendTelegramMessage(
      fullUser?.telegramChatId,
      "📢 <b>Prepol si na jednoduchý režim bodovania</b>\n\n2 bežné Reely za deň = <b>+3 body dokopy</b>, žiadne strhávanie bodov za bežné Reely. Pupio ostáva rovnaké. Pokračuješ tam, kde si skončil — žiadny reset."
    );
  }

  revalidatePath("/account");
  revalidatePath("/my-tasks");
  revalidatePath("/pravidla");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
