import { db } from "@/lib/db";
import { refreshTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    // Revoke by deleting the row
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.id, refreshToken))
      .catch(() => {}); // silently ignore if already gone
  }

  // Clear all auth cookies (real tokens + the client-readable marker)
  clearAuthCookies(cookieStore);

  return Response.json({ ok: true });
}
