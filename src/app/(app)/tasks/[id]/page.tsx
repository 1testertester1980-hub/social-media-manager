import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Paperclip, Calendar as CalendarIcon, Clock, AlertTriangle, KeyRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PublishForm } from "@/components/tasks/publish-form";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { AnalyticsForm } from "@/components/tasks/analytics-form";
import { DangerZone } from "@/components/tasks/danger-zone";
import { AllowLateSubmissionButton } from "@/components/tasks/allow-late-submission-button";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const task = await prisma.contentTask.findUnique({
    where: { id },
    include: { profile: true, assignedUser: true, analytics: true },
  });
  if (!task) notFound();

  const isAdmin = user.role === "ADMIN";
  const isOwner = task.assignedUserId === user.id;
  if (!isAdmin && !isOwner) notFound();

  const canPublish =
    task.status !== "PUBLISHED" &&
    task.status !== "CANCELLED" &&
    (isAdmin || (isOwner && (task.status !== "OVERDUE" || task.lateSubmissionAllowed)));
  const lockedForWorker =
    isOwner && !isAdmin && task.status === "OVERDUE" && !task.lateSubmissionAllowed;

  const [profiles, workers] = isAdmin
    ? await Promise.all([
        prisma.profile.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
        prisma.user.findMany({ where: { role: "WORKER", active: true }, orderBy: { name: "asc" } }),
      ])
    : [[], []];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: task.profile.color }} />
            <span className="text-sm font-medium text-slate-500">{task.profile.name}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{task.title}</h1>
          {task.topic && <p className="mt-1 text-sm text-slate-500">{task.topic}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={task.status} />
          {isAdmin && (
            <TaskEditForm
              task={{
                id: task.id,
                profileId: task.profileId,
                title: task.title,
                topic: task.topic,
                brief: task.brief,
                caption: task.caption,
                assignedUserId: task.assignedUserId,
                deadlineAt: task.deadlineAt,
                adminNotes: task.adminNotes,
                attachmentUrl: task.attachmentUrl,
                status: task.status,
              }}
              profiles={profiles}
              workers={workers}
            />
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 text-sm">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{formatDate(task.deadlineAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{formatTime(task.deadlineAt)}</span>
          </div>
          {task.assignedUser && (
            <div className="flex items-center gap-3 text-sm sm:col-span-2">
              <span className="text-slate-500">Priradené:</span>
              <span className="font-medium text-slate-900">{task.assignedUser.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {task.brief && (
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{task.brief}</p>
          </CardContent>
        </Card>
      )}

      {task.caption && (
        <Card>
          <CardHeader>
            <CardTitle>Popis (caption)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{task.caption}</p>
          </CardContent>
        </Card>
      )}

      {task.attachmentUrl && (
        <Card>
          <CardContent className="flex items-center gap-3">
            <Paperclip className="h-4 w-4 text-slate-400" />
            <a
              href={task.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Otvoriť prílohu
            </a>
          </CardContent>
        </Card>
      )}

      {isAdmin && task.adminNotes && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle>Interné poznámky (len admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{task.adminNotes}</p>
          </CardContent>
        </Card>
      )}

      {task.status === "PUBLISHED" && task.instagramUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Zverejnené</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">Zverejnené:</span>
              <span className="font-medium text-slate-900">
                {task.publishedAt ? formatDateTime(task.publishedAt) : "—"}
              </span>
            </div>
            <a
              href={task.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Zobraziť Reel na Instagrame
            </a>
            {task.workerNotes && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{task.workerNotes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {lockedForWorker && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-900">Termín uplynul</p>
              <p className="mt-0.5 text-sm text-red-700">
                Túto úlohu už nie je možné označiť ako zverejnenú. Kontaktuj administrátora,
                aby ju upravil alebo zverejnil za teba.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && task.status === "OVERDUE" && !task.lateSubmissionAllowed && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Pracovník žiada o výnimku?</p>
              <p className="mt-0.5 text-sm text-amber-700">
                Povolíš mu, aby aj napriek uplynutému termínu mohol tento Reel sám označiť ako zverejnený.
              </p>
            </div>
            <AllowLateSubmissionButton taskId={task.id} />
          </CardContent>
        </Card>
      )}

      {task.status === "OVERDUE" && task.lateSubmissionAllowed && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              Administrátor povolil neskoršie zverejnenie — Reel je stále možné označiť ako zverejnený.
            </p>
          </CardContent>
        </Card>
      )}

      {canPublish && <PublishForm taskId={task.id} qualityTracked={task.profile.qualityTracked} />}

      {isAdmin && task.status === "PUBLISHED" && (
        <AnalyticsForm taskId={task.id} analytics={task.analytics} />
      )}

      {isAdmin && <DangerZone taskId={task.id} status={task.status} />}

      <Link href={isAdmin ? "/content" : "/my-tasks"} className="text-sm text-slate-500 hover:text-slate-700">
        ← Späť
      </Link>
    </div>
  );
}
