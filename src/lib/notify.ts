import "server-only";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, appUrl } from "@/lib/telegram";
import { formatDateTime } from "@/lib/utils";
import type { NotificationType } from "@/generated/prisma";

async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      taskId: params.taskId,
    },
  });
}

export async function notifyTaskAssigned(taskId: string) {
  const task = await prisma.contentTask.findUnique({
    where: { id: taskId },
    include: { profile: true, assignedUser: true },
  });
  if (!task || !task.assignedUser) return;

  const title = "Nová úloha";
  const message = `${task.profile.name}: ${task.title} — deadline ${formatDateTime(task.deadlineAt)}`;
  await createNotification({
    userId: task.assignedUser.id,
    type: "TASK_ASSIGNED",
    title,
    message,
    taskId: task.id,
  });

  await sendTelegramMessage(
    task.assignedUser.telegramChatId,
    `📱 <b>Nová úloha</b>\n\n` +
      `Profil: ${task.profile.name}\n` +
      `Reel: ${task.title}\n` +
      `Deadline: ${formatDateTime(task.deadlineAt)}\n\n` +
      `Otvoriť úlohu:\n${appUrl(`/tasks/${task.id}`)}`
  );
}

export async function notifyTaskOverdue(taskId: string) {
  const task = await prisma.contentTask.findUnique({
    where: { id: taskId },
    include: { profile: true, assignedUser: true },
  });
  if (!task) return;

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
  const recipients = [...admins, ...(task.assignedUser ? [task.assignedUser] : [])];

  for (const recipient of recipients) {
    await createNotification({
      userId: recipient.id,
      type: "TASK_OVERDUE",
      title: "Úloha po termíne",
      message: `${task.profile.name}: ${task.title} — deadline bol ${formatDateTime(task.deadlineAt)}`,
      taskId: task.id,
    });
  }

  await sendTelegramMessage(
    task.assignedUser?.telegramChatId,
    `⚠️ <b>Úloha po termíne</b>\n\n` +
      `${task.profile.name}\n` +
      `Reel: ${task.title}\n` +
      `Deadline: ${formatDateTime(task.deadlineAt)}`
  );
}

const PUPIO_MIN_ANNOUNCEMENT_TITLE = "Pupio: minimálne 1 Reel denne";

/**
 * One-time announcement of the new "at least 1 Pupio Reel/day, -3 body from
 * 26.8.2026" rule to every active worker. Idempotent — checked by title, so
 * safe to call on every page load; only actually sends once per worker.
 */
export async function announcePupioMinimumRuleIfNeeded() {
  const workers = await prisma.user.findMany({ where: { role: "WORKER", active: true } });

  for (const worker of workers) {
    const already = await prisma.notification.findFirst({
      where: { userId: worker.id, title: PUPIO_MIN_ANNOUNCEMENT_TITLE },
    });
    if (already) continue;

    await createNotification({
      userId: worker.id,
      type: "SYSTEM",
      title: PUPIO_MIN_ANNOUNCEMENT_TITLE,
      message:
        "Pupio nemá termín, ale musíš zverejniť aspoň 1 Reel denne. Od 26. 8. 2026 sa ti za každý deň bez ani jedného Pupio Reelu strhnú 3 body.",
    });

    await sendTelegramMessage(
      worker.telegramChatId,
      `📢 <b>Pupio: minimálne 1 Reel denne</b>\n\n` +
        `Pupio nemá pevný termín, ale musíš zverejniť aspoň 1 Reel denne.\n` +
        `Od <b>26. 8. 2026</b>: ak za daný deň nezverejníš ani jeden Pupio Reel, strhnú sa ti <b>-3 body</b>.`
    );
  }
}

export async function notifyTaskPublished(taskId: string) {
  const task = await prisma.contentTask.findUnique({
    where: { id: taskId },
    include: { profile: true, assignedUser: true },
  });
  if (!task) return;

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: "TASK_PUBLISHED",
      title: "Reel zverejnený",
      message: `${task.profile.name}: ${task.title} bol zverejnený${task.assignedUser ? ` (${task.assignedUser.name})` : ""}`,
      taskId: task.id,
    });
    await sendTelegramMessage(
      admin.telegramChatId,
      `✅ <b>Reel zverejnený</b>\n\n` +
        `Profil: ${task.profile.name}\n` +
        `Reel: ${task.title}\n` +
        `Link: ${task.instagramUrl ?? "—"}`
    );
  }
}
