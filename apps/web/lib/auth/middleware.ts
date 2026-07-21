import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";

/**
 * Call this at the top of a route handler to get the authenticated userId.
 * Returns a 401 Response if the token is missing or invalid.
 */
export async function requireAuth(): Promise<
  { userId: string; error?: never } | { userId?: never; error: Response }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId: payload.sub };
}
