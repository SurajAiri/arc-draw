import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In Next.js 16, this file is "proxy.ts" (renamed from middleware.ts)
// The exported function must be named "proxy"
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API auth routes, and Next.js internals
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("refresh_token");
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Already signed in? Don't show login/register again — go straight to the dashboard.
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
