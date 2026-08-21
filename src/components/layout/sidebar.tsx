"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, WORKER_NAV } from "./nav-config";
import { signOutAction } from "@/app/(app)/actions";

export function Sidebar({
  role,
  mobileOpen,
  onClose,
}: {
  role: "ADMIN" | "WORKER";
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? ADMIN_NAV : WORKER_NAV;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">Social Media</p>
              <p className="text-xs text-slate-500 leading-tight">Manager</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400" onClick={onClose} aria-label="Zavrieť menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", active ? "text-indigo-600" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4.5 w-4.5 text-slate-400" />
              Odhlásiť sa
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
