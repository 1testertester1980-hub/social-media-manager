import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        Strana {page} z {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Predch.
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm ${
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
          }`}
        >
          Ďalej
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
