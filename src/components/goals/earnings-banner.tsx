"use client";

import { useState } from "react";
import { Coins, Flame, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";

function reelWord(n: number) {
  if (n === 1) return "Reel";
  if (n >= 2 && n <= 4) return "Reely";
  return "Reelov";
}

type EarningsSummary = {
  earnedEuros: number;
  lostEuros: number;
  overdueCount: number;
  pupioMissedDays: number;
  maxEuros: number;
  daysInMonth: number;
  totalReelsMonth: number;
  reelsPerDay: number;
  todayTotal: number;
  todayDone: number;
  todayRemaining: number;
  todayRemainingEuros: number;
};

export function EarningsBanner({ summary }: { summary: EarningsSummary }) {
  const [showInfo, setShowInfo] = useState(false);
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
        <button
          onClick={() => setShowInfo(true)}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
          aria-label="Ako sa to počíta?"
        >
          <Info className="h-4 w-4" />
        </button>
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

      <Dialog open={showInfo} onClose={() => setShowInfo(false)} title="Ako sa počíta zárobok">
        <div className="flex flex-col gap-4 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">1 bod = 1 €</p>
            <p className="mt-1 text-slate-600">
              Všetky body, ktoré si na účte zarobíš, sa jednoducho prepočítajú na eurá 1:1. Toto
              je motivačný prepočet — nič sa nevypláca automaticky, presné vyplatenie rieši admin.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Odkiaľ je max {summary.maxEuros} €</p>
            <p className="mt-1 text-slate-600">
              Denne máš naplánovaných {summary.reelsPerDay} Reelov (2 z rotácie + 3 na Pupio).
              Každý zverejnený Reel = +3 body. Tento mesiac má {summary.daysInMonth} dní, takže ak
              by si zverejnil úplne všetko:
            </p>
            <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              {summary.reelsPerDay} Reelov × {summary.daysInMonth} dní = {summary.totalReelsMonth}{" "}
              Reelov × 3 body = {summary.maxEuros} b. = {summary.maxEuros} €
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Ako môžeš prísť o peniaze</p>
            <ul className="mt-1 flex flex-col gap-1 text-slate-600">
              <li>
                • <strong>-5 €</strong> za každý Reel, ktorý sa nestihne zverejniť do termínu
                (20:00) — od 27. 8. 2026, predtým -3 €. Pravidelnosť je dôležitá. Tento mesiac:{" "}
                {summary.overdueCount}×.
              </li>
              <li>
                • Rovnaký postih za každý deň (od 26. 8. 2026), kedy nezverejníš ani jeden Pupio
                Reel — tento mesiac: {summary.pupioMissedDays}×.
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Dnešok</p>
            <p className="mt-1 text-slate-600">
              Dnes máš naplánovaných {summary.todayTotal} Reelov, {summary.todayDone} už hotových.
              Zvyšných {summary.todayRemaining} × 3 € = {summary.todayRemainingEuros} € je ešte na
              stole.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
