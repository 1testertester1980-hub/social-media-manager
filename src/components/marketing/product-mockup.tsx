const KPIS = [
  { label: "Zverejnené", value: "128" },
  { label: "Body", value: "+342" },
  { label: "Dokončenie", value: "94%" },
];

const BARS = [40, 65, 50, 80, 60, 90, 70];

export function ProductMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-slate-900 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-[11px] text-slate-500">social-media-manager-iw91dee.vercel.app</span>
      </div>
      <div className="flex">
        <div className="hidden w-10 shrink-0 flex-col items-center gap-4 border-r border-white/5 bg-slate-950/60 py-4 sm:flex">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-4 rounded-full bg-white/10" />
          ))}
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
                <p className="truncate text-[8px] text-slate-500 sm:text-[9px]">{kpi.label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-24 items-end gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            {BARS.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-t bg-gradient-to-t from-indigo-500/40 to-indigo-400/80"
              />
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                <div className="h-1.5 flex-1 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
