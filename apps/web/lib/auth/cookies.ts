import type { cookies as CookiesFn } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof CookiesFn>>;

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes

/**
 * The real tokens are httpOnly so client-side JS can never read or leak
 * them via XSS. That correctly makes them invisible to `document.cookie`,
 * which means the client has no legitimate way to know "am I logged in"
 * without either a network round-trip or a separate signal.
 *
 * `auth_status` is that signal: a non-secret, non-httpOnly marker cookie
 * set/cleared in lockstep with the real tokens. It carries no auth power of
 * its own (the server never trusts it — every protected route still
 * verifies the real access token), it just mirrors whether a session
 * exists so client components can render the right copy instantly.
 */
const AUTH_STATUS_COOKIE = "auth_status";

export function setAuthCookies(
  cookieStore: CookieStore,
  {
    accessToken,
    refreshToken,
    refreshTokenMaxAge,
  }: { accessToken: string; refreshToken: string; refreshTokenMaxAge: number }
) {
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: refreshTokenMaxAge,
    path: "/",
  });

  // Mirrors the refresh token's lifetime since that's what keeps the
  // session alive across access-token rotations.
  cookieStore.set(AUTH_STATUS_COOKIE, "1", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: refreshTokenMaxAge,
    path: "/",
  });
}

export function clearAuthCookies(cookieStore: CookieStore) {
  cookieStore.set("access_token", "", { maxAge: 0, path: "/" });
  cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" });
  cookieStore.set(AUTH_STATUS_COOKIE, "", { maxAge: 0, path: "/" });
}

export { AUTH_STATUS_COOKIE };
