"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
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
