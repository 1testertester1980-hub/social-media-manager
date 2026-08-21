"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { appSettingsSchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/tasks";

export async function getAppSettings() {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  return (
    settings ?? {
      id: "singleton",
      telegramBotToken: null,
      timezone: "Europe/Bratislava",
      updatedAt: new Date(),
    }
  );
}

export async function updateAppSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = appSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", telegramBotToken: d.telegramBotToken || null, timezone: d.timezone },
    update: { telegramBotToken: d.telegramBotToken || null, timezone: d.timezone },
  });

  revalidatePath("/settings");
  return { ok: true, data: undefined };
}
