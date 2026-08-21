import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CalendarNav } from "@/components/calendar/calendar-nav";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import {
  getMonthGrid,
  getWeekDays,
  addMonths,
  addWeeks,
  addDays,
  format,
  skLocale,
} from "@/lib/calendar";
import { tzDayKey } from "@/lib/utils";

type View = "month" | "week" | "day";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "ADMIN";

  const sp = await searchParams;
  const view: View = sp.view === "week" || sp.view === "day" ? sp.view : "month";
  const anchor = sp.date ? new Date(`${sp.date}T00:00:00`) : new Date();
  const todayKey = tzDayKey(new Date());

  let rangeStart: Date;
  let rangeEnd: Date;
  let days: Date[];

  if (view === "month") {
    days = getMonthGrid(anchor);
    rangeStart = days[0];
    rangeEnd = addDays(days[days.length - 1], 1);
  } else if (view === "week") {
    days = getWeekDays(anchor);
    rangeStart = days[0];
    rangeEnd = addDays(days[days.length - 1], 1);
  } else {
    days = [anchor];
    rangeStart = anchor;
    rangeEnd = addDays(anchor, 1);
  }

  const where = isAdmin
    ? { deadlineAt: { gte: rangeStart, lt: rangeEnd } }
    : { deadlineAt: { gte: rangeStart, lt: rangeEnd }, assignedUserId: user.id };

  const tasks = await prisma.contentTask.findMany({
    where,
    include: { profile: true, assignedUser: true },
    orderBy: { deadlineAt: "asc" },
  });

  const tasksByDay = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const key = tzDayKey(task.deadlineAt);
    if (!tasksByDay.has(key)) tasksByDay.set(key, []);
    tasksByDay.get(key)!.push(task);
  }

  const dateParam = tzDayKey(anchor);
  const buildDateHref = (d: Date) => `?view=${view}&date=${tzDayKey(d)}`;

  let prevHref: string;
  let nextHref: string;
  let label: string;

  if (view === "month") {
    prevHref = buildDateHref(addMonths(anchor, -1));
    nextHref = buildDateHref(addMonths(anchor, 1));
    label = format(anchor, "LLLL yyyy", { locale: skLocale });
  } else if (view === "week") {
    prevHref = buildDateHref(addWeeks(anchor, -1));
    nextHref = buildDateHref(addWeeks(anchor, 1));
    label = `${format(days[0], "d.M.")} – ${format(days[6], "d.M.yyyy")}`;
  } else {
    prevHref = buildDateHref(addDays(anchor, -1));
    nextHref = buildDateHref(addDays(anchor, 1));
    label = format(anchor, "EEEE d. MMMM yyyy", { locale: skLocale });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Kalendár</h1>
        <p className="text-sm text-slate-500">Prehľad naplánovaných a zverejnených Reelov</p>
      </div>

      <CalendarNav
        view={view}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={`?view=${view}&date=${todayKey}`}
        label={label.charAt(0).toUpperCase() + label.slice(1)}
        dateParam={dateParam}
      />

      {view === "month" && (
        <MonthView days={days} tasksByDay={tasksByDay} currentMonth={anchor.getMonth()} todayKey={todayKey} isAdmin={isAdmin} />
      )}
      {view === "week" && <WeekView days={days} tasksByDay={tasksByDay} todayKey={todayKey} isAdmin={isAdmin} />}
      {view === "day" && <DayView day={anchor} tasks={tasksByDay.get(dateParam) ?? []} isAdmin={isAdmin} />}
    </div>
  );
}
