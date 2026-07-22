"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useIsAuthenticated } from "@/lib/auth/useIsAuthenticated";

interface AuthAwareCtaProps {
  className?: string;
  loggedOutLabel: string;
  loggedInLabel: string;
}

/**
 * The primary CTA button, swapped between logged-out/logged-in copy on the
 * client. Isolated into its own small component so the surrounding
 * marketing page can stay a server component and be statically generated
 * (see useIsAuthenticated for why this moved off the server).
 */
export default function AuthAwareCta({
  className,
  loggedOutLabel,
  loggedInLabel,
}: AuthAwareCtaProps) {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Link
      href={isAuthenticated ? "/dashboard" : "/register"}
      className={className}
    >
      {isAuthenticated ? loggedInLabel : loggedOutLabel}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
