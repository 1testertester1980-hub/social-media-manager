import Link from "next/link";
import { Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatTime, formatDate } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  topic: string | null;
  deadlineAt: Date;
  status: string;
  profile: { name: string; color: string };
};

export function WorkerTaskCard({ task, showDate = false }: { task: Task; showDate?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: task.profile.color }} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{task.profile.name}</p>
          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
          {task.topic && <p className="text-xs text-slate-500">{task.topic}</p>}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {showDate ? `${formatDate(task.deadlineAt)} ` : ""}
              {formatTime(task.deadlineAt)}
            </span>
            <StatusBadge status={task.status} />
          </div>
        </div>
      </div>
      <Link
        href={`/tasks/${task.id}`}
        className="flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:px-5"
      >
        Otvoriť
      </Link>
    </div>
  );
}
