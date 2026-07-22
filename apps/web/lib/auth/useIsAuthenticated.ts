"use client";

import { useEffect, useState } from "react";
import { AUTH_STATUS_COOKIE } from "@/lib/auth/cookies";

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
 *
 * NOTE: this checks the `auth_status` marker cookie, not the real
 * `access_token` / `refresh_token` cookies. Those are httpOnly on purpose
 * (so client-side JS, and therefore XSS, can never read or steal them),
 * which means `document.cookie` never contains them — checking for them
 * directly would always read as logged out. `auth_status` is a separate,
 * non-secret cookie set/cleared in lockstep with the real tokens purely so
 * the client has something legitimate to read (see lib/auth/cookies.ts).
 */
export function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const cookies = document.cookie;
    setIsAuthenticated(cookies.includes(`${AUTH_STATUS_COOKIE}=`));
  }, []);

  return isAuthenticated;
}
