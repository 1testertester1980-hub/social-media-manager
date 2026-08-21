"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import {
  createTaskSchema,
  updateTaskSchema,
  publishTaskSchema,
  analyticsSchema,
} from "@/lib/validation";
import { notifyTaskAssigned, notifyTaskPublished } from "@/lib/notify";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function combineDeadline(date: string, time: string) {
  // Interpreted in server local time; the app targets Europe/Bratislava deployments.
  return new Date(`${date}T${time}:00`);
}

export async function createTask(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const task = await prisma.contentTask.create({
    data: {
      profileId: d.profileId,
      title: d.title,
      topic: d.topic || null,
      brief: d.brief || null,
      caption: d.caption || null,
      assignedUserId: d.assignedUserId || null,
      deadlineAt: combineDeadline(d.deadlineDate, d.deadlineTime),
      adminNotes: d.adminNotes || null,
      attachmentUrl: d.attachmentUrl || null,
      status: "PLANNED",
    },
  });

  if (task.assignedUserId) {
    await notifyTaskAssigned(task.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath("/my-tasks");
  return { ok: true, data: { id: task.id } };
}

export async function updateTask(taskId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const existing = await prisma.contentTask.findUnique({ where: { id: taskId } });
  if (!existing) return { ok: false, error: "Úloha neexistuje" };

  const data: Record<string, unknown> = {};
  if (d.profileId) data.profileId = d.profileId;
  if (d.title) data.title = d.title;
  if (d.topic !== undefined) data.topic = d.topic || null;
  if (d.brief !== undefined) data.brief = d.brief || null;
  if (d.caption !== undefined) data.caption = d.caption || null;
  if (d.assignedUserId !== undefined) data.assignedUserId = d.assignedUserId || null;
  if (d.adminNotes !== undefined) data.adminNotes = d.adminNotes || null;
  if (d.attachmentUrl !== undefined) data.attachmentUrl = d.attachmentUrl || null;
  if (d.status) data.status = d.status;
  if (d.deadlineDate && d.deadlineTime) {
    data.deadlineAt = combineDeadline(d.deadlineDate, d.deadlineTime);
  }

  const wasUnassigned = !existing.assignedUserId;
  const updated = await prisma.contentTask.update({ where: { id: taskId }, data });

  if (wasUnassigned && updated.assignedUserId) {
    await notifyTaskAssigned(updated.id);
  } else if (
    d.assignedUserId &&
    existing.assignedUserId &&
    d.assignedUserId !== existing.assignedUserId
  ) {
    await notifyTaskAssigned(updated.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  return { ok: true, data: undefined };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.contentTask.delete({ where: { id: taskId } });
  revalidatePath("/dashboard");
  revalidatePath("/content");
  revalidatePath("/calendar");
  return { ok: true, data: undefined };
}

export async function cancelTask(taskId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.contentTask.update({ where: { id: taskId }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard");
  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true, data: undefined };
}

export async function publishTask(taskId: string, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const task = await prisma.contentTask.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, error: "Úloha neexistuje" };
  if (user.role !== "ADMIN" && task.assignedUserId !== user.id) {
    return { ok: false, error: "Nemáte oprávnenie na túto úlohu" };
  }
  if (user.role !== "ADMIN" && task.status === "OVERDUE") {
    return { ok: false, error: "Termín uplynul, kontaktujte administrátora." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = publishTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.contentTask.update({
      where: { id: taskId },
      data: {
        status: "PUBLISHED",
        instagramUrl: d.instagramUrl,
        workerNotes: d.workerNote || null,
        publishedAt: new Date(),
      },
    });

    if (d.views || d.reach || d.likes || d.comments) {
      await tx.analytics.upsert({
        where: { taskId },
        create: {
          taskId,
          views: d.views ?? 0,
          reach: d.reach ?? 0,
          likes: d.likes ?? 0,
          comments: d.comments ?? 0,
        },
        update: {
          views: d.views ?? 0,
          reach: d.reach ?? 0,
          likes: d.likes ?? 0,
          comments: d.comments ?? 0,
        },
      });
    }
  });

  await notifyTaskPublished(taskId);

  revalidatePath("/dashboard");
  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  return { ok: true, data: undefined };
}

export async function updateAnalytics(taskId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = analyticsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.analytics.upsert({
    where: { taskId },
    create: { taskId, ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
