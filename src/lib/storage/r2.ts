import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 — stockage photos RenovAI et rapports PDF (API compatible S3)
const globalForR2 = globalThis as unknown as { r2?: S3Client };

export const r2 =
  globalForR2.r2 ??
  new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForR2.r2 = r2;
}

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "immoplatform";

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  return publicBase ? `${publicBase}/${key}` : key;
}

// URL présignée (lecture) pour les objets non publics — rapports PDF agences
export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}
