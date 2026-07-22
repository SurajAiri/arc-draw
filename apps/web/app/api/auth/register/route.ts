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

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return Response.json(
      { error: firstError?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    return Response.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
    })
    .returning({ id: users.id });

  // Issue tokens
  const accessToken = signAccessToken(newUser.id);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({
    id: refreshToken,
    userId: newUser.id,
    expiresAt,
  });

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken,
    refreshToken,
    refreshTokenMaxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
  });

  return Response.json({ ok: true }, { status: 201 });
}
