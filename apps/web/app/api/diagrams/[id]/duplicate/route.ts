import { db } from "@/lib/db";
import { diagrams } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { and, eq } from "drizzle-orm";

// POST /api/diagrams/[id]/duplicate — clone a diagram
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  const [source] = await db
    .select()
    .from(diagrams)
    .where(and(eq(diagrams.id, id), eq(diagrams.userId, auth.userId)))
    .limit(1);

  if (!source) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [clone] = await db
    .insert(diagrams)
    .values({
      userId: auth.userId,
      title: `${source.title} (copy)`,
      sceneData: source.sceneData as object,
      version: 0,
    })
    .returning({ id: diagrams.id, title: diagrams.title, updatedAt: diagrams.updatedAt });

  return Response.json(clone, { status: 201 });
}
