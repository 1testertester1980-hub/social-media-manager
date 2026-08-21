import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  suffix,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  suffix?: string;
}) {
  const toneStyles = {
    default: "bg-indigo-50 text-indigo-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {value}
            {suffix && <span className="ml-1 text-sm font-normal text-slate-400">{suffix}</span>}
          </p>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneStyles)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}
