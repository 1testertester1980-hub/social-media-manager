import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-700 ring-slate-200",
  TODO: "bg-blue-50 text-blue-700 ring-blue-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Naplánované",
  TODO: "Na spracovanie",
  PUBLISHED: "Zverejnené",
  OVERDUE: "Po termíne",
  CANCELLED: "Zrušené",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Badge({
  children,
  className,
  color,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-slate-100 text-slate-700 ring-slate-200",
        className
      )}
      style={color ? { backgroundColor: `${color}1a`, color, boxShadow: `inset 0 0 0 1px ${color}33` } : undefined}
    >
      {children}
    </span>
  );
}
