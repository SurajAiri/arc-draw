"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useIsAuthenticated } from "@/lib/auth/useIsAuthenticated";

/**
 * The bottom CTA banner's copy, badge, and button — all four pieces swap
 * together based on auth state, so they're grouped into one client
 * component rather than four separate inline branches. Below the fold and
 * non-LCP, so a client-side swap after mount has no visible cost. Keeping
 * this off the server lets the marketing page itself stay statically
 * generated (see useIsAuthenticated).
 */
export default function AuthAwareCtaBanner() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      <div className="relative inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3.5 py-1.5 text-xs font-mono text-muted-foreground mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.15_155)]" />
        {isAuthenticated ? "Synced and ready" : "Takes about 10 seconds"}
      </div>

      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 relative font-[family-name:var(--font-heading)]">
        {isAuthenticated ? (
          "Pick up right where you left off"
        ) : (
          <>
            Ready to sketch your{" "}
            <span className="marker-underline">next system</span>?
          </>
        )}
      </h2>
      <p className="text-muted-foreground mb-8 relative max-w-md mx-auto">
        {isAuthenticated
          ? "Your diagrams are waiting in your dashboard, exactly where you left them."
          : "Free to use, no credit card, offline from the first click."}
      </p>
      <Link
        href={isAuthenticated ? "/dashboard" : "/register"}
        className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
      >
        {isAuthenticated ? "Go to dashboard" : "Create your workspace"}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </>
  );
}
