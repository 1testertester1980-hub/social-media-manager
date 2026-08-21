import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarNav({
  view,
  prevHref,
  nextHref,
  todayHref,
  label,
  dateParam,
}: {
  view: "month" | "week" | "day";
  prevHref: string;
  nextHref: string;
  todayHref: string;
  label: string;
  dateParam: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link href={prevHref} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50" aria-label="Predchádzajúce">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link href={nextHref} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50" aria-label="Ďalšie">
          <ChevronRight className="h-4 w-4" />
        </Link>
        <Link href={todayHref} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
          Dnes
        </Link>
        <h2 className="ml-2 text-base font-semibold text-slate-900">{label}</h2>
      </div>
      <div className="flex rounded-lg border border-slate-300 p-0.5">
        {(["month", "week", "day"] as const).map((v) => (
          <Link
            key={v}
            href={`?view=${v}&date=${dateParam}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {v === "month" ? "Mesiac" : v === "week" ? "Týždeň" : "Deň"}
          </Link>
        ))}
      </div>
    </div>
  );
}
