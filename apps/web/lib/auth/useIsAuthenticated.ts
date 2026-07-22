"use client";

import { useEffect, useState } from "react";

/**
 * Reads auth state from cookies on the client.
 *
 * The marketing page used to call `cookies()` on the server purely to
 * decide between "Start diagramming free" / "Go to dashboard" copy. That
 * one call forced the *entire* landing page to render dynamically on every
 * request instead of being statically generated at build time — a poor
 * trade for a couple of words of button copy.
 *
 * Moving the check here lets the page (and its LCP image) be served as a
 * static, cached response. Anonymous visitors — the overwhelming majority
 * of landing-page traffic — see the correct copy immediately, since the
 * default (`false`) matches the logged-out state. Logged-in visitors get a
 * near-instant client-side swap after mount, which is an acceptable
 * trade-off for a piece of UI this small and non-critical.
 */
export function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const cookies = document.cookie;
    setIsAuthenticated(
      cookies.includes("access_token=") || cookies.includes("refresh_token=")
    );
  }, []);

  return isAuthenticated;
}
