const MONTHS = [
  "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December",
];

export function AnalyticsFilters({
  profiles,
  current,
}: {
  profiles: { id: string; name: string }[];
  current: { year: number; month: number; profileId?: string };
}) {
  const years = Array.from({ length: 5 }, (_, i) => current.year - 2 + i);

  return (
    <form method="GET" className="flex flex-wrap items-center gap-3">
      <select
        name="month"
        defaultValue={current.month}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        name="year"
        defaultValue={current.year}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        name="profileId"
        defaultValue={current.profileId ?? ""}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">Všetky profily</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Zobraziť
      </button>
    </form>
  );
}
