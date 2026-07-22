"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-triggered header background/border, split into its own tiny
 * client island so it can sit as a direct sibling of the header's content
 * wrapper (full header width via `inset-0` on the `relative` <header>)
 * without nesting inside the max-w-6xl content column.
 */
export default function MarketingNavBackground() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`absolute inset-0 -z-10 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
      aria-hidden
    />
  );
}
