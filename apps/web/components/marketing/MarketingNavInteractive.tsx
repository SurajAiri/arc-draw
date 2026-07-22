"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useIsAuthenticated } from "@/lib/auth/useIsAuthenticated";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#preview", label: "Preview" },
];

/**
 * The interactive parts of the nav: the mobile menu toggle/panel and the
 * auth-aware CTA buttons. Split out from MarketingNav (which stays a server
 * component) so the static bits — logo, text links — paint immediately
 * instead of waiting on client hydration. The scroll-triggered background
 * lives in the separate MarketingNavBackground component (see MarketingNav).
 */
export default function MarketingNavInteractive() {
  const isAuthenticated = useIsAuthenticated();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden md:flex items-center gap-3">
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="group flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all"
          >
            Go to dashboard
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </>
        )}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden p-2 -mr-2 text-foreground"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="md:hidden absolute top-full inset-x-0 bg-background/95 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex-1 text-center text-sm font-medium bg-primary text-primary-foreground rounded-xl px-4 py-2.5"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex-1 text-center text-sm font-medium text-foreground border border-border rounded-xl px-4 py-2.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="flex-1 text-center text-sm font-medium bg-primary text-primary-foreground rounded-xl px-4 py-2.5"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
