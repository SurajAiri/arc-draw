import { db } from "@/lib/db";
import { diagrams } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { uploadAsset } from "@/lib/s3";
import { and, eq } from "drizzle-orm";

// POST /api/assets — upload an image and store in MinIO/R2
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const diagramId = formData.get("diagramId") as string | null;

  if (!file || !diagramId) {
    return Response.json({ error: "Missing file or diagramId" }, { status: 400 });
  }

  // Verify the diagram exists and belongs to the authenticated user before
  // attaching an asset to it — never trust a client-supplied diagramId.
  const [owned] = await db
    .select({ id: diagrams.id })
    .from(diagrams)
    .where(and(eq(diagrams.id, diagramId), eq(diagrams.userId, auth.userId)))
    .limit(1);

  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;
  const ext = file.name.split(".").pop() ?? "bin";

  const result = await uploadAsset(diagramId, buffer, mimeType, ext);

  return Response.json(result, { status: 201 });
}
