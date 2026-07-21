import { db } from "@/lib/db";
import { diagrams } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// GET /api/diagrams — list all diagrams for the authenticated user
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const rows = await db
    .select({
      id: diagrams.id,
      title: diagrams.title,
      updatedAt: diagrams.updatedAt,
      version: diagrams.version,
    })
    .from(diagrams)
    .where(eq(diagrams.userId, auth.userId))
    .orderBy(desc(diagrams.updatedAt));

  return Response.json(rows);
}

// POST /api/diagrams — create a new diagram
const CreateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // body is optional
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [diagram] = await db
    .insert(diagrams)
    .values({
      userId: auth.userId,
      title: parsed.data.title ?? "Untitled Diagram",
      sceneData: {},
      version: 0,
    })
    .returning({ id: diagrams.id, title: diagrams.title, updatedAt: diagrams.updatedAt });

  return Response.json(diagram, { status: 201 });
}
