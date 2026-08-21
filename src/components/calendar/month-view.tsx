import Link from "next/link";
import { Plus } from "lucide-react";
import { cn, tzDayKey, formatTime } from "@/lib/utils";
import { format } from "@/lib/calendar";

type Task = {
  id: string;
  title: string;
  deadlineAt: Date;
  status: string;
  profile: { name: string; color: string };
};

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

export function MonthView({
  days,
  tasksByDay,
  currentMonth,
  todayKey,
  isAdmin,
}: {
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  currentMonth: number;
  todayKey: string;
  isAdmin: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = tzDayKey(day);
          const tasks = tasksByDay.get(key) ?? [];
          const inMonth = day.getMonth() === currentMonth;
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={cn(
                "group relative min-h-[100px] border-b border-r border-slate-100 p-1.5 last:border-r-0",
                !inMonth && "bg-slate-50/50"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday ? "bg-indigo-600 text-white" : inMonth ? "text-slate-700" : "text-slate-350 text-slate-300"
                  )}
                >
                  {format(day, "d")}
                </span>
                {isAdmin && (
                  <Link
                    href={`/content/new?date=${key}`}
                    className="hidden text-slate-400 hover:text-indigo-600 group-hover:block"
                    aria-label="Nový Reel"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {tasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: task.profile.color }}
                    title={`${formatTime(task.deadlineAt)} · ${task.title}`}
                  >
                    {formatTime(task.deadlineAt)} {task.title}
                  </Link>
                ))}
                {tasks.length > 3 && (
                  <span className="px-1.5 text-[11px] text-slate-400">+{tasks.length - 3} ďalšie</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
