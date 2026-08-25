"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/actions/tasks";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await requireUser();
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== user.id) {
    return { ok: false, error: "Nenájdené" };
  }
  await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
  revalidatePath("/notifications");
  return { ok: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true, data: undefined };
}

export async function deleteAllNotifications(): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  revalidatePath("/notifications");
  return { ok: true, data: undefined };
}
