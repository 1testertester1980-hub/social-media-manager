import { Film, CheckCircle2, AlertTriangle, Percent, Eye, Users2, Heart, MessageCircle, Plus, Trophy } from "lucide-react";
import { getDashboardData, getAllWorkerPoints } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfilePerformanceChart } from "@/components/dashboard/profile-performance-chart";
import { ResetOverdueButton } from "@/components/dashboard/reset-overdue-button";
import { formatNumber, formatPercent, formatDateTime, cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [{ kpis, todayTasks, overdueTasks, profilePerformance, overdueStatsResetAt }, workers, pointsByUser] = await Promise.all([
    getDashboardData(),
    prisma.user.findMany({ where: { role: "WORKER" }, orderBy: { name: "asc" } }),
    getAllWorkerPoints(),
  ]);

  const chartData = profilePerformance.map((p) => ({
    name: p.profile.name,
    views: p.views,
    color: p.profile.color,
  }));

  const totalPoints = Array.from(pointsByUser.values()).reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Prehľad obsahu naprieč všetkými profilmi</p>
        </div>
        <ButtonLink href="/content/new" size="md">
          <Plus className="h-4 w-4" />
          Nový Reel
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Naplánované tento mesiac" value={String(kpis.planned)} icon={Film} />
        <KpiCard label="Zverejnené" value={String(kpis.published)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Po termíne" value={String(kpis.overdue)} icon={AlertTriangle} tone="danger" />
        <KpiCard label="Miera dokončenia" value={formatPercent(kpis.completionRate)} icon={Percent} />
        <KpiCard label="Zhliadnutia" value={formatNumber(kpis.views)} icon={Eye} />
        <KpiCard label="Dosah" value={formatNumber(kpis.reach)} icon={Users2} />
        <KpiCard label="Páči sa mi to" value={formatNumber(kpis.likes)} icon={Heart} />
        <KpiCard label="Komentáre" value={formatNumber(kpis.comments)} icon={MessageCircle} />
        <KpiCard
          label="Celkové body pracovníkov"
          value={`${totalPoints >= 0 ? "+" : ""}${totalPoints}`}
          icon={Trophy}
          tone={totalPoints >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dnešné úlohy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {todayTasks.length === 0 ? (
                <EmptyState icon={Film} title="Na dnes nie sú naplánované žiadne Reely" />
              ) : (
                todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Po termíne</CardTitle>
              <ResetOverdueButton />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {overdueStatsResetAt && (
                <p className="mb-1 text-xs text-slate-400">
                  Zobrazené od posledného resetu: {formatDateTime(overdueStatsResetAt)}
                </p>
              )}
              {overdueTasks.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Žiadne úlohy po termíne" description="Skvelá práca!" />
              ) : (
                overdueTasks.map((task) => <TaskCard key={task.id} task={task} showDate />)
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Zhliadnutia podľa profilu</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePerformanceChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <CardTitle>Body pracovníkov</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {workers.length === 0 ? (
                <EmptyState icon={Trophy} title="Zatiaľ žiadni pracovníci" />
              ) : (
                workers.map((w) => {
                  const score = pointsByUser.get(w.id);
                  return (
                    <div key={w.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{w.name}</span>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          (score?.points ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {(score?.points ?? 0) >= 0 ? "+" : ""}
                        {score?.points ?? 0}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
