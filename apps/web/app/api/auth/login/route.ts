import { db } from "@/lib/db";
import { users, refreshTokens } from "@/lib/db/schema";
import {
  signAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { z } from "zod";
import { cookies } from "next/headers";
import { setAuthCookies } from "@/lib/auth/cookies";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Issue tokens
  const accessToken = signAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({
    id: refreshToken,
    userId: user.id,
    expiresAt,
  });

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken,
    refreshToken,
    refreshTokenMaxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
  });

  return Response.json({ ok: true });
}
