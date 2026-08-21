import Link from "next/link";
import { Plus } from "lucide-react";
import { Film } from "lucide-react";
import { formatTime, tzDayKey } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type Task = {
  id: string;
  title: string;
  topic: string | null;
  deadlineAt: Date;
  status: string;
  profile: { name: string; color: string };
  assignedUser: { name: string } | null;
};

export function DayView({ day, tasks, isAdmin }: { day: Date; tasks: Task[]; isAdmin: boolean }) {
  const key = tzDayKey(day);
  const sorted = [...tasks].sort((a, b) => a.deadlineAt.getTime() - b.deadlineAt.getTime());

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {isAdmin && (
        <div className="flex justify-end border-b border-slate-100 p-3">
          <Link
            href={`/content/new?date=${key}`}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Nový Reel na tento deň
          </Link>
        </div>
      )}
      <div className="flex flex-col divide-y divide-slate-100">
        {sorted.length === 0 ? (
          <EmptyState icon={Film} title="Žiadne Reely v tento deň" />
        ) : (
          sorted.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50">
              <div className="w-14 shrink-0 text-sm font-semibold text-slate-700">{formatTime(task.deadlineAt)}</div>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: task.profile.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {task.profile.name}
                  {task.assignedUser ? ` · ${task.assignedUser.name}` : ""}
                </p>
              </div>
              <StatusBadge status={task.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
