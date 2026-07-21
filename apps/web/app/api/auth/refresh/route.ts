import { db } from "@/lib/db";
import { refreshTokens } from "@/lib/db/schema";
import {
  signAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from "@/lib/auth/jwt";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const oldRefreshToken = cookieStore.get("refresh_token")?.value;

  if (!oldRefreshToken) {
    return Response.json({ error: "No refresh token" }, { status: 401 });
  }

  // Verify it exists, is not revoked, and hasn't expired
  const [tokenRow] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.id, oldRefreshToken),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenRow) {
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // Rotate: delete old, insert new
  await db.delete(refreshTokens).where(eq(refreshTokens.id, oldRefreshToken));

  const newAccessToken = signAccessToken(tokenRow.userId);
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({
    id: newRefreshToken,
    userId: tokenRow.userId,
    expiresAt,
  });

  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("access_token", newAccessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  cookieStore.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return Response.json({ ok: true });
}
