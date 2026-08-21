import Link from "next/link";
import { Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatTime, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TaskCardTask = {
  id: string;
  title: string;
  topic: string | null;
  deadlineAt: Date;
  status: string;
  profile: { name: string; color: string };
  assignedUser?: { name: string } | null;
};

export function TaskCard({ task, showDate = false }: { task: TaskCardTask; showDate?: boolean }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: task.profile.color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
        </div>
        <p className="truncate text-xs text-slate-500">
          {task.profile.name}
          {task.topic ? ` · ${task.topic}` : ""}
          {task.assignedUser ? ` · ${task.assignedUser.name}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={cn("flex items-center gap-1 text-xs font-medium text-slate-500")}>
          <Clock className="h-3.5 w-3.5" />
          {showDate ? `${formatDate(task.deadlineAt)} ` : ""}
          {formatTime(task.deadlineAt)}
        </span>
        <StatusBadge status={task.status} />
      </div>
    </Link>
  );
}
