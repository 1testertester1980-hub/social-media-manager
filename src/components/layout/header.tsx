"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "./sidebar";

export function AppHeader({
  role,
  userName,
  unreadCount,
  title,
}: {
  role: "ADMIN" | "WORKER";
  userName: string;
  unreadCount: number;
  title?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden">
        <Sidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="text-slate-500 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Otvoriť menu"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          {title && <h1 className="text-base font-semibold text-slate-900">{title}</h1>}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="relative text-slate-500 hover:text-slate-700" aria-label="Notifikácie">
            <Bell className="h-5.5 w-5.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{userName}</span>
          </div>
        </div>
      </header>
    </>
  );
}
