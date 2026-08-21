import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Všetky stavy" },
  { value: "PLANNED", label: "Naplánované" },
  { value: "TODO", label: "Na spracovanie" },
  { value: "PUBLISHED", label: "Zverejnené" },
  { value: "OVERDUE", label: "Po termíne" },
  { value: "CANCELLED", label: "Zrušené" },
];

const SORT_OPTIONS = [
  { value: "deadline_asc", label: "Deadline (najskôr)" },
  { value: "deadline_desc", label: "Deadline (najneskôr)" },
  { value: "views_desc", label: "Najviac zhliadnutí" },
  { value: "created_desc", label: "Najnovšie" },
];

export function ContentFilters({
  profiles,
  current,
}: {
  profiles: { id: string; name: string }[];
  current: { q?: string; profileId?: string; status?: string; sort?: string };
}) {
  return (
    <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px] sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          name="q"
          defaultValue={current.q}
          placeholder="Hľadať Reel..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>
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
      <select
        name="status"
        defaultValue={current.status ?? ""}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        name="sort"
        defaultValue={current.sort ?? "deadline_asc"}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Filtrovať
      </button>
    </form>
  );
}
