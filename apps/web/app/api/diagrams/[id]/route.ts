import { db } from "@/lib/db";
import { diagrams } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

// GET /api/diagrams/[id] — fetch a single diagram with scene data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  const [diagram] = await db
    .select()
    .from(diagrams)
    .where(and(eq(diagrams.id, id), eq(diagrams.userId, auth.userId)))
    .limit(1);

  if (!diagram) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(diagram);
}

// PATCH /api/diagrams/[id] — sync scene data (optimistic concurrency) or rename
const PatchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sync"),
    sceneData: z.record(z.string(), z.unknown()),
    version: z.number().int().min(0), // client's last known version
    force: z.boolean().optional(),    // true = force overwrite on conflict resolution
  }),
  z.object({
    type: z.literal("rename"),
    title: z.string().min(1).max(200),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (parsed.data.type === "rename") {
    const [updated] = await db
      .update(diagrams)
      .set({ title: parsed.data.title })
      .where(and(eq(diagrams.id, id), eq(diagrams.userId, auth.userId)))
      .returning({ id: diagrams.id, title: diagrams.title });

    if (!updated) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(updated);
  }

  // sync type — optimistic concurrency
  const { sceneData, version, force } = parsed.data;

  let result;
  if (force) {
    // Force overwrite — client won the conflict resolution dialog
    [result] = await db
      .update(diagrams)
      .set({
        sceneData,
        version: sql`version + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(diagrams.id, id), eq(diagrams.userId, auth.userId)))
      .returning({ id: diagrams.id, version: diagrams.version });
  } else {
    // Optimistic concurrency: only update if version matches
    [result] = await db
      .update(diagrams)
      .set({
        sceneData,
        version: sql`version + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagrams.id, id),
          eq(diagrams.userId, auth.userId),
          eq(diagrams.version, version)
        )
      )
      .returning({ id: diagrams.id, version: diagrams.version });
  }

  if (!result) {
    // 0 rows updated = conflict
    return Response.json({ conflict: true }, { status: 409 });
  }

  return Response.json({ ok: true, version: result.version });
}

// DELETE /api/diagrams/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  const [deleted] = await db
    .delete(diagrams)
    .where(and(eq(diagrams.id, id), eq(diagrams.userId, auth.userId)))
    .returning({ id: diagrams.id });

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
