"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import NotFoundSketch from "@/components/marketing/NotFoundSketch";
import { useIsAuthenticated } from "@/lib/auth/useIsAuthenticated";

/**
 * App-wide 404. Next.js renders this for any unmatched route under
 * app/layout.tsx, regardless of route group, so it's the catch-all for a
 * bad /diagram/:id link, a typo'd URL, anything.
 *
 * Kept in the same hand-drawn, whiteboard voice as the marketing page
 * (see SketchHero) rather than a generic error screen — the "404" itself
 * is the sketched diagram (see NotFoundSketch), so no separate brand mark
 * or small numeral label competing for attention above it.
 *
 * Primary CTA adapts to auth state: logged-in visitors are one tap from
 * their dashboard rather than being routed back through the marketing
 * page and register flow.
 */
export default function NotFound() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center relative overflow-hidden">
      {/* Same soft radial glow used behind the marketing hero, so this
          doesn't feel like a different app underneath the chrome. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 20%, var(--marker-dim), transparent 70%)",
        }}
      />

      <NotFoundSketch />

      <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight font-[family-name:var(--font-heading)]">
        This page never got{" "}
        <span className="marker-underline">drawn</span>
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Whatever you were looking for isn&apos;t here — maybe the link is
        old, maybe it never existed. Either way, no diagrams were lost.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
        >
          {isAuthenticated ? "Go to dashboard" : "Back to home"}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        {!isAuthenticated && (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-background/60 text-foreground font-medium text-sm hover:bg-background transition-all"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}
