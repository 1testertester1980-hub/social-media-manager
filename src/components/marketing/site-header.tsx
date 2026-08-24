"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SiteHeader({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 120);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-md transition-transform duration-300",
        hidden && "-translate-y-full"
      )}
    >
      {children}
    </header>
  );
}
