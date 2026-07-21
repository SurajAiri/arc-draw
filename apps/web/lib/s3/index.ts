import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET ?? "diagrams";

export interface UploadResult {
  assetId: string;
  url: string;
  s3Key: string;
}

export async function uploadAsset(
  diagramId: string,
  buffer: Buffer,
  mimeType: string,
  extension: string
): Promise<UploadResult> {
  const assetId = crypto.randomUUID();
  const s3Key = `diagrams/${diagramId}/assets/${assetId}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Insert asset row referencing the diagram
  await db.insert(assets).values({
    id: assetId,
    diagramId,
    s3Key,
  });

  // Build a public URL pointing at MinIO/R2 endpoint
  const endpoint = process.env.S3_ENDPOINT ?? "";
  const url = `${endpoint}/${BUCKET}/${s3Key}`;

  return { assetId, url, s3Key };
}
