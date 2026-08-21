import { prisma } from "@/lib/prisma";
import { getAnalyticsData } from "@/lib/queries";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { PublishedOverTimeChart, ProfileBarChart } from "@/components/analytics/analytics-charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Film, CheckCircle2, AlertTriangle, Percent, Eye, Users2, Heart, MessageCircle } from "lucide-react";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; profileId?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const [profiles, data] = await Promise.all([
    prisma.profile.findMany({ orderBy: { name: "asc" } }),
    getAnalyticsData({ year, month, profileId: sp.profileId || undefined }),
  ]);

  const viewsByProfile = data.perProfile.map((p) => ({ name: p.profile.name, value: p.views, color: p.profile.color }));
  const reachByProfile = data.perProfile.map((p) => ({ name: p.profile.name, value: p.reach, color: p.profile.color }));
  const completionByProfile = data.perProfile.map((p) => ({
    name: p.profile.name,
    value: Math.round(p.completionRate),
    color: p.profile.color,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Analytika</h1>
        <p className="text-sm text-slate-500">Mesačný prehľad výkonnosti obsahu</p>
      </div>

      <AnalyticsFilters profiles={profiles} current={{ year, month, profileId: sp.profileId }} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Naplánované" value={String(data.overall.planned)} icon={Film} />
        <KpiCard label="Zverejnené" value={String(data.overall.published)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Po termíne" value={String(data.overall.overdue)} icon={AlertTriangle} tone="danger" />
        <KpiCard label="Miera dokončenia" value={formatPercent(data.overall.completionRate)} icon={Percent} />
        <KpiCard label="Zhliadnutia" value={formatNumber(data.overall.views)} icon={Eye} />
        <KpiCard label="Dosah" value={formatNumber(data.overall.reach)} icon={Users2} />
        <KpiCard label="Páči sa mi to" value={formatNumber(data.overall.likes)} icon={Heart} />
        <KpiCard label="Komentáre" value={formatNumber(data.overall.comments)} icon={MessageCircle} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Priem. zhliadnutia</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(Math.round(data.averages.views))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Priem. dosah</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(Math.round(data.averages.reach))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Priem. páči sa mi to</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(Math.round(data.averages.likes))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Priem. komentáre</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(Math.round(data.averages.comments))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zverejnené Reely v čase</CardTitle>
          </CardHeader>
          <CardContent>
            <PublishedOverTimeChart data={data.publishedOverTime} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zhliadnutia podľa profilu</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileBarChart data={viewsByProfile} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dosah podľa profilu</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileBarChart data={reachByProfile} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Miera dokončenia podľa profilu (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileBarChart data={completionByProfile} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prehľad podľa profilu</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Profil</th>
                <th className="px-5 py-3 text-right">Naplánované</th>
                <th className="px-5 py-3 text-right">Zverejnené</th>
                <th className="px-5 py-3 text-right">Po termíne</th>
                <th className="px-5 py-3 text-right">Dokončenie</th>
                <th className="px-5 py-3 text-right">Zhliadnutia</th>
                <th className="px-5 py-3 text-right">Dosah</th>
                <th className="px-5 py-3 text-right">Páči sa</th>
              </tr>
            </thead>
            <tbody>
              {data.perProfile.map((row) => (
                <tr key={row.profile.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.profile.color }} />
                      {row.profile.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.planned}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.published}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{row.overdue}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{formatPercent(row.completionRate)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{formatNumber(row.views)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{formatNumber(row.reach)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{formatNumber(row.likes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
