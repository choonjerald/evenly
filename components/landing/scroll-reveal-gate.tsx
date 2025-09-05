"use client";

import { useEffect, useState } from "react";
export function ScrollRevealGate({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.scrollY > 0) setRevealed(true);
    const onScroll = () => {
      if (window.scrollY > 0) setRevealed(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Enter" || e.key === " ") setRevealed(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return <div className="rb-reveal" data-on={revealed || undefined}>{children}</div>;
}
