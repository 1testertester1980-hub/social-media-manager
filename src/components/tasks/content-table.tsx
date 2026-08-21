import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  status: string;
  deadlineAt: Date;
  publishedAt: Date | null;
  profile: { name: string; color: string };
  assignedUser: { name: string } | null;
  analytics: { views: number; reach: number } | null;
};

export function ContentTable({ rows }: { rows: Row[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Dátum</th>
              <th className="px-4 py-3">Profil</th>
              <th className="px-4 py-3">Reel</th>
              <th className="px-4 py-3">Priradené</th>
              <th className="px-4 py-3">Stav</th>
              <th className="px-4 py-3">Zverejnené</th>
              <th className="px-4 py-3 text-right">Zhliadnutia</th>
              <th className="px-4 py-3 text-right">Dosah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-4 py-3 text-slate-600">{formatDate(row.deadlineAt)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.profile.color }} />
                    {row.profile.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/tasks/${row.id}`} className="hover:text-indigo-600">
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.assignedUser?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {row.publishedAt ? formatDate(row.publishedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {row.analytics ? formatNumber(row.analytics.views) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {row.analytics ? formatNumber(row.analytics.reach) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/tasks/${row.id}`}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.profile.color }} />
                {row.profile.name}
              </span>
              <StatusBadge status={row.status} />
            </div>
            <p className="text-sm font-medium text-slate-900">{row.title}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatDate(row.deadlineAt)}</span>
              <span>{row.assignedUser?.name ?? "Nepriradené"}</span>
            </div>
            {row.analytics && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{formatNumber(row.analytics.views)} zhliadnutí</span>
                <span>{formatNumber(row.analytics.reach)} dosah</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
