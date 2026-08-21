import Link from "next/link";
import { Plus } from "lucide-react";
import { cn, tzDayKey, formatTime } from "@/lib/utils";
import { format } from "@/lib/calendar";
import { StatusBadge } from "@/components/ui/badge";

type Task = {
  id: string;
  title: string;
  deadlineAt: Date;
  status: string;
  profile: { name: string; color: string };
};

export function WeekView({
  days,
  tasksByDay,
  todayKey,
  isAdmin,
}: {
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  todayKey: string;
  isAdmin: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const key = tzDayKey(day);
        const tasks = tasksByDay.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <div key={key} className="flex flex-col rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-slate-500">{format(day, "EEEEEE")}</p>
                <p className={cn("text-sm font-semibold", isToday ? "text-indigo-600" : "text-slate-900")}>
                  {format(day, "d. M.")}
                </p>
              </div>
              {isAdmin && (
                <Link href={`/content/new?date=${key}`} className="text-slate-400 hover:text-indigo-600">
                  <Plus className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2.5">
              {tasks.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-300">—</p>
              ) : (
                tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="rounded-lg border border-slate-100 p-2 hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.profile.color }} />
                      <span className="text-[11px] font-medium text-slate-500">{formatTime(task.deadlineAt)}</span>
                    </div>
                    <p className="truncate text-xs font-medium text-slate-900">{task.title}</p>
                    <div className="mt-1">
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
