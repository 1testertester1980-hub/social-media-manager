"use client";

import { useState } from "react";
import { Coins, Flame, TrendingDown, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";

function reelWord(n: number) {
  if (n === 1) return "Reel";
  if (n >= 2 && n <= 4) return "Reely";
  return "Reelov";
}

type EarningsSummary = {
  pointsMode: "STANDARD" | "SIMPLE";
  netPoints: number;
  netEuros: number;
  earnedEuros: number;
  lostEuros: number;
  overdueCount: number;
  pupioMissedDays: number;
  maxEuros: number;
  daysInMonth: number;
  totalReelsMonth: number;
  reelsPerDay: number;
  rotationReelsPerDay: number;
  pupioReelsPerDay: number;
  todayTotal: number;
  todayDone: number;
  todayRemaining: number;
  todayRemainingEuros: number;
  projectedMonthEndEuros: number;
};

export function EarningsBanner({ summary }: { summary: EarningsSummary }) {
  const [showInfo, setShowInfo] = useState(false);
  const isSimple = summary.pointsMode === "SIMPLE";
  const pct = summary.maxEuros > 0 ? Math.min(100, Math.round((summary.earnedEuros / summary.maxEuros) * 100)) : 0;
  const hasPendingToday = summary.todayRemaining > 0;
  const isNegative = summary.netEuros < 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-emerald-600" />
        <h2 className="text-sm font-semibold text-slate-900">Tvoj zárobok</h2>
        {isSimple && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            jednoduchý režim
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("text-4xl font-bold", isNegative ? "text-red-600" : "text-emerald-700")}>
          {isNegative ? "" : "+"}
          {summary.netEuros} €
        </span>
        <button
          onClick={() => setShowInfo(true)}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
          aria-label="Ako sa to počíta?"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">tvoj aktuálny zostatok — 1 bod = 1 €</p>

      <div className="mt-4 flex items-baseline justify-between gap-2 text-xs text-slate-500">
        <span>Tento mesiac: {summary.earnedEuros} €</span>
        <span>max {summary.maxEuros} €</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3">
        <TrendingUp className="h-6 w-6 shrink-0 text-indigo-600" />
        <p className="text-sm font-semibold text-indigo-900">
          Ak od teraz vydáš <strong>každý deň všetky Reely</strong>, na konci mesiaca budeš mať{" "}
          <strong>{summary.projectedMonthEndEuros} €</strong>.
        </p>
      </div>

      {summary.lostEuros > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <TrendingDown className="h-4 w-4 shrink-0" />
          Tento mesiac si už prišiel o <strong>{summary.lostEuros} €</strong>
          {isSimple ? " — dni bez Pupio Reelu." : " — Reely po termíne alebo bez Pupio."}
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
            <p className="font-semibold text-slate-900">
              Tvoj zostatok {summary.netEuros} € — čo to je
            </p>
            <p className="mt-1 text-slate-600">
              {isSimple ? (
                <>
                  Si v <strong>jednoduchom režime</strong>: keď v jeden deň zverejníš oba bežné
                  Reely, dostaneš +3 body dokopy — žiadne strhávanie za bežné Reely, nikdy nebudeš
                  za ne v mínuse. Pupio ostáva rovnaké: +1 bod za Reel, mínus jeho vlastná
                  penalizácia za deň bez Reelu. Plus prípadné bonusy či manuálne úpravy od admina
                  — spočítané za celý čas, nielen tento mesiac.
                </>
              ) : (
                <>
                  Tvoj skutočný, aktuálny súčet: +3 body za každý zverejnený bežný Reel, +1 bod za
                  každý Pupio Reel, mínus všetky penalizácie za meškanie a chýbajúce Pupio Reely,
                  plus prípadné bonusy alebo manuálne úpravy od admina — spočítané za celý čas,
                  nielen tento mesiac.
                </>
              )}{" "}
              Presne rovnaké číslo vidíš aj v sekcii <strong>Profil</strong>, kde si môžeš{" "}
              <strong>kedykoľvek prepnúť režim bodovania</strong>.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Odkiaľ je max {summary.maxEuros} € (tento mesiac)</p>
            <p className="mt-1 text-slate-600">
              Denne máš naplánovaných {summary.rotationReelsPerDay} Reely z rotácie
              {isSimple ? " (spolu 3 body, ak zverejníš oba)" : " (á 3 body)"} a{" "}
              {summary.pupioReelsPerDay} Pupio Reely (á 1 bod). Tento mesiac má {summary.daysInMonth}{" "}
              dní, takže ak by si zverejnil úplne všetko:
            </p>
            <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              {isSimple
                ? `(3 b. + ${summary.pupioReelsPerDay} × 1 b.)`
                : `(${summary.rotationReelsPerDay} × 3 b. + ${summary.pupioReelsPerDay} × 1 b.)`}{" "}
              × {summary.daysInMonth} dní = {summary.maxEuros} b. = {summary.maxEuros} €
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              Odhad na koniec mesiaca: {summary.projectedMonthEndEuros} €
            </p>
            <p className="mt-1 text-slate-600">
              Tvoj aktuálny zostatok ({summary.netEuros} €) + čo ešte môžeš dnes získať + čo môžeš
              získať každý ďalší deň do konca mesiaca, ak odteraz zverejníš úplne všetko na čas —
              žiadne ďalšie meškania ani chýbajúce Pupio dni. Je to reálny odhad, nie teoretické
              maximum od 1. dňa mesiaca (to je to {summary.maxEuros} € vyššie).
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Ako môžeš prísť o peniaze</p>
            <ul className="mt-1 flex flex-col gap-1 text-slate-600">
              {isSimple ? (
                <li>
                  • Za bežné Reely sa ti <strong>nič nestrháva</strong> — jediný spôsob, ako v
                  jednoduchom režime prísť o body, je deň bez Pupio Reelu (pozri nižšie).
                </li>
              ) : (
                <li>
                  • <strong>-5 €</strong> za každý Reel, ktorý sa nestihne zverejniť do termínu
                  (20:00) — od 27. 8. 2026, predtým -3 €. Pravidelnosť je dôležitá. Tento mesiac:{" "}
                  {summary.overdueCount}×.
                </li>
              )}
              <li>
                • Rovnaký postih za každý deň (od 26. 8. 2026), kedy nezverejníš ani jeden Pupio
                Reel — tento mesiac: {summary.pupioMissedDays}×.
              </li>
              <li>• Prípadná manuálna penalizácia od admina sa tiež rovno odráta.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Dnešok</p>
            <p className="mt-1 text-slate-600">
              Dnes máš naplánovaných {summary.todayTotal} Reelov, {summary.todayDone} už hotových.
              Zvyšných {summary.todayRemaining}{" "}
              {isSimple ? "(bežné Reely spolu 3 body, Pupio á 1 bod)" : "(bežné Reely á 3 body, Pupio á 1 bod)"} je
              spolu ešte {summary.todayRemainingEuros} € na stole.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
