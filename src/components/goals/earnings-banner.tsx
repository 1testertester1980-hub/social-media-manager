import { Coins, Flame, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

function reelWord(n: number) {
  if (n === 1) return "Reel";
  if (n >= 2 && n <= 4) return "Reely";
  return "Reelov";
}

type EarningsSummary = {
  earnedEuros: number;
  lostEuros: number;
  maxEuros: number;
  todayTotal: number;
  todayDone: number;
  todayRemaining: number;
  todayRemainingEuros: number;
};

export function EarningsBanner({ summary }: { summary: EarningsSummary }) {
  const pct = summary.maxEuros > 0 ? Math.min(100, Math.round((summary.earnedEuros / summary.maxEuros) * 100)) : 0;
  const hasPendingToday = summary.todayRemaining > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-emerald-600" />
        <h2 className="text-sm font-semibold text-slate-900">Tvoj zárobok tento mesiac</h2>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-emerald-700">{summary.earnedEuros} €</span>
        <span className="text-sm text-slate-500">/ max {summary.maxEuros} €</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {summary.lostEuros > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <TrendingDown className="h-4 w-4 shrink-0" />
          Už si prišiel o <strong>{summary.lostEuros} €</strong> — Reely po termíne alebo bez
          Pupio.
        </div>
      )}

      <div
        className={cn(
          "mt-3 flex items-center gap-3 rounded-xl px-4 py-3",
          hasPendingToday ? "bg-amber-100" : "bg-emerald-100"
        )}
      >
        <Flame className={cn("h-6 w-6 shrink-0", hasPendingToday ? "text-amber-600" : "text-emerald-600")} />
        {hasPendingToday ? (
          <p className="text-sm font-semibold text-amber-900">
            Dnes ti ešte chýba {summary.todayRemaining} {reelWord(summary.todayRemaining)} —
            nenechaj si ujsť {summary.todayRemainingEuros} €!
          </p>
        ) : summary.todayTotal > 0 ? (
          <p className="text-sm font-semibold text-emerald-900">
            Dnešný deň hotový — všetkých {summary.todayTotal} Reelov zverejnených! 🎉
          </p>
        ) : (
          <p className="text-sm font-semibold text-emerald-900">Na dnes nemáš naplánované žiadne Reely.</p>
        )}
      </div>
    </div>
  );
}
