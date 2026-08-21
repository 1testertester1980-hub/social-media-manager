import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { WorkerTaskCard } from "@/components/tasks/worker-task-card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function MyTasksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const now = new Date();
  const todayStart = new Date(now.toDateString());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const upcomingEnd = new Date(todayStart.getTime() + 14 * 86400000);

  const [todayTasks, overdueTasks, upcomingTasks] = await Promise.all([
    prisma.contentTask.findMany({
      where: { assignedUserId: user.id, deadlineAt: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
      include: { profile: true },
      orderBy: { deadlineAt: "asc" },
    }),
    prisma.contentTask.findMany({
      where: { assignedUserId: user.id, status: "OVERDUE" },
      include: { profile: true },
      orderBy: { deadlineAt: "asc" },
    }),
    prisma.contentTask.findMany({
      where: {
        assignedUserId: user.id,
        deadlineAt: { gte: todayEnd, lt: upcomingEnd },
        status: { notIn: ["CANCELLED", "PUBLISHED"] },
      },
      include: { profile: true },
      orderBy: { deadlineAt: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Moje úlohy</h1>
        <p className="text-sm text-slate-500">Ahoj {user.name}, tu sú tvoje úlohy</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dnes</h2>
        {todayTasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Na dnes nemáš žiadne úlohy" />
        ) : (
          <div className="flex flex-col gap-3">
            {todayTasks.map((task) => (
              <WorkerTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {overdueTasks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">Po termíne</h2>
          <div className="flex flex-col gap-3">
            {overdueTasks.map((task) => (
              <WorkerTaskCard key={task.id} task={task} showDate />
            ))}
          </div>
        </section>
      )}

      {upcomingTasks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Nadchádzajúce</h2>
          <div className="flex flex-col gap-3">
            {upcomingTasks.map((task) => (
              <WorkerTaskCard key={task.id} task={task} showDate />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
