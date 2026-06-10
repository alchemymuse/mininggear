import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// Storage abstraction. Local driver writes to /public/uploads and returns a
// web path. Swap STORAGE_DRIVER=r2 and implement saveToR2 for production —
// the rest of the app only calls saveUpload() and never touches the driver.

const ALLOWED_IMAGE = /^image\/(png|jpe?g|webp|gif|avif)$/i;
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export type SavedFile = { url: string; name: string };

function extFromName(name: string, fallback = "bin") {
  const e = name.split(".").pop();
  return e && e.length <= 5 ? e.toLowerCase() : fallback;
}

async function saveLocal(buffer: Buffer, ext: string, subdir: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

// Production stub — implement with @aws-sdk/client-s3 against R2/S3.
async function saveR2(_buffer: Buffer, _ext: string, _subdir: string): Promise<string> {
  throw new Error("R2 storage not configured. Set STORAGE_DRIVER=local for dev, or implement saveR2().");
}

export async function saveUpload(file: File, subdir = "listings"): Promise<SavedFile> {
  if (file.size > MAX_BYTES) throw new Error("File too large (max 12 MB).");
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extFromName(file.name);
  const url =
    process.env.STORAGE_DRIVER === "r2"
      ? await saveR2(buffer, ext, subdir)
      : await saveLocal(buffer, ext, subdir);
  return { url, name: file.name };
}

export function isImage(file: File) {
  return ALLOWED_IMAGE.test(file.type);
}
