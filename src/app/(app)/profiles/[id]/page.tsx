import { notFound } from "next/navigation";
import Link from "next/link";
import { Film, CheckCircle2, Percent, Eye } from "lucide-react";
import { getProfilePerformance } from "@/lib/queries";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function ProfilePerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProfilePerformance(id);
  if (!data.profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: data.profile.color }} />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{data.profile.name}</h1>
          {data.profile.instagramUsername && <p className="text-sm text-slate-500">{data.profile.instagramUsername}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Reely tento mesiac" value={String(data.reelsThisMonth)} icon={Film} />
        <KpiCard label="Miera dokončenia" value={formatPercent(data.completionRate)} icon={Percent} />
        <KpiCard label="Zhliadnutia" value={formatNumber(data.totals.views)} icon={Eye} />
        <KpiCard label="Priem. zhliadnutia" value={formatNumber(Math.round(data.avgViews))} icon={CheckCircle2} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Reely</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.topTasks.length === 0 ? (
            <EmptyState icon={Film} title="Zatiaľ žiadne zverejnené Reely" />
          ) : (
            data.topTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                <span className="shrink-0 text-sm text-slate-500">
                  {formatNumber(task.analytics?.views ?? 0)} zhliadnutí
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posledné Reely</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.latestTasks.length === 0 ? (
            <EmptyState icon={Film} title="Zatiaľ žiadne Reely" />
          ) : (
            data.latestTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={{ ...task, profile: { name: data.profile!.name, color: data.profile!.color } }}
                showDate
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
