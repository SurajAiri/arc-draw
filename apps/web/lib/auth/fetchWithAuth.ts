// Wraps `fetch` so that a single expired 15-minute access token never looks
// like "being logged out" to the user. The refresh_token cookie is valid for
// REFRESH_TOKEN_EXPIRY_DAYS (30 days), so on a 401 we try /api/auth/refresh
// once and, if that succeeds, transparently retry the original request.
// Only if the refresh itself fails (refresh token missing/expired/revoked)
// do we surface the 401 to the caller, who should then send the user to
// /login — that's a real session end, not routine token rotation.

let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  // De-dupe concurrent refreshes (e.g. several requests 401 at once) so we
  // don't race multiple rotations of the same refresh token against the
  // server, which would invalidate all but one of them.
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Drop-in replacement for `fetch` for same-origin, cookie-authenticated
 * requests. Behaves exactly like `fetch` except a 401 triggers one
 * refresh-and-retry attempt before the response is returned to the caller.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const refreshed = await refreshAccessToken();
  if (!refreshed) return res; // genuinely signed out — caller should redirect to /login

  return fetch(input, init);
}
