import "server-only";
import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import { env } from "../env";
import { db } from "./db";

/**
 * File storage. Cloudflare R2 (S3-compatible) when configured, otherwise the database —
 * enough for development and small deployments, and it keeps uploads behind our own auth.
 * Files are always served through /api/files/[...key] so access checks stay in one place.
 */
export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
}

class R2Storage implements StorageProvider {
  private client: S3Client;
  constructor(private bucket: string, accountId: string, accessKeyId: string, secretAccessKey: string) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  async put(key: string, data: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType }));
  }
  async get(key: string) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) return null;
      return { data: Buffer.from(bytes), contentType: res.ContentType ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }
}

class DatabaseStorage implements StorageProvider {
  async put(key: string, data: Buffer, contentType: string) {
    const bytes = new Uint8Array(data);
    await db.storedFile.upsert({ where: { key }, create: { key, data: bytes, contentType }, update: { data: bytes, contentType } });
  }
  async get(key: string) {
    const f = await db.storedFile.findUnique({ where: { key } });
    return f ? { data: Buffer.from(f.data), contentType: f.contentType } : null;
  }
}

let provider: StorageProvider | null = null;

export function storage(): StorageProvider {
  if (provider) return provider;
  const e = env();
  provider =
    e.R2_ACCOUNT_ID && e.R2_ACCESS_KEY_ID && e.R2_SECRET_ACCESS_KEY && e.R2_BUCKET
      ? new R2Storage(e.R2_BUCKET, e.R2_ACCOUNT_ID, e.R2_ACCESS_KEY_ID, e.R2_SECRET_ACCESS_KEY)
      : new DatabaseStorage();
  return provider;
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Magic-byte sniffing: the browser-supplied MIME type is not trusted. */
function sniff(buf: Buffer): string | null {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function storeImage(file: File, prefix: "logos" | "leads", allowSvg = false): Promise<string> {
  if (file.size === 0) throw new Error("EMPTY_FILE");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("FILE_TOO_LARGE");
  const buf = Buffer.from(await file.arrayBuffer());
  let type = sniff(buf);
  if (!type && allowSvg && file.type === "image/svg+xml") {
    const text = buf.toString("utf8");
    // SVGs can carry scripts; refuse anything active rather than trying to sanitise it.
    if (/<script|on\w+\s*=|javascript:|<foreignObject/i.test(text)) throw new Error("UNSAFE_SVG");
    type = "image/svg+xml";
  }
  if (!type || !ALLOWED_IMAGE_TYPES[type]) throw new Error("UNSUPPORTED_FILE");
  const key = `${prefix}/${randomBytes(16).toString("hex")}.${ALLOWED_IMAGE_TYPES[type]}`;
  await storage().put(key, buf, type);
  return `/api/files/${key}`;
}

export async function storeDocument(key: string, data: Buffer, contentType: string): Promise<string> {
  await storage().put(key, data, contentType);
  return `/api/files/${key}`;
}
