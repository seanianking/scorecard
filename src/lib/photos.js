import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { processPhoto, PhotoError, MAX_UPLOAD_BYTES } from "./photo-processing.js";

export { PhotoError, MAX_UPLOAD_BYTES };

// Photos live outside /public so they can only be fetched through the authorized
// /api/photos/[contestantId] route. Use object storage (e.g. a private S3 bucket) in production.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "photos");
const KEY_PATTERN = /^[A-Za-z0-9_-]{20,64}\.jpg$/;

function keyPath(key) {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid photo key");
  return path.join(UPLOAD_DIR, key);
}

// Validates, re-encodes and stores an uploaded File. Returns the new storage key.
export async function savePhoto(file) {
  if (!file || typeof file === "string" || file.size === 0) throw new PhotoError("Choose a photo to upload.");
  if (file.size > MAX_UPLOAD_BYTES) throw new PhotoError("That photo is too large. The limit is 10 MB.");

  const output = await processPhoto(Buffer.from(await file.arrayBuffer()));
  const key = `${randomBytes(24).toString("base64url")}.jpg`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const tmp = `${keyPath(key)}.tmp`;
  await writeFile(tmp, output, { mode: 0o600 });
  await rename(tmp, keyPath(key));
  return key;
}

export async function readPhoto(key) {
  try {
    return await readFile(keyPath(key));
  } catch {
    return null;
  }
}

export async function deletePhoto(key) {
  if (!key) return;
  await unlink(keyPath(key)).catch(() => {});
}

export function photoUrl(contestant) {
  if (!contestant?.photoKey) return null;
  const v = contestant.photoUpdatedAt ? new Date(contestant.photoUpdatedAt).getTime() : 0;
  return `/api/photos/${contestant.id}?v=${v}`;
}
