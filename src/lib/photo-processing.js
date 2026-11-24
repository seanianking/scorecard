// Pure image processing (no Next.js imports) so it can be unit tested with node:test.
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 800;
const MAX_INPUT_PIXELS = 50_000_000; // guards against decompression bombs

export class PhotoError extends Error {}

// Identify the real format from magic bytes; never trust the client's MIME type or filename.
export function sniffImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

/**
 * Re-encodes an uploaded image to a JPEG no larger than 800px on its longest side.
 * Re-encoding drops all metadata (EXIF GPS location, camera serials, etc.) and applies the
 * EXIF orientation so the photo displays upright.
 */
export async function processPhoto(input) {
  if (!sniffImageType(input)) throw new PhotoError("Upload a JPEG, PNG or WebP image.");
  try {
    return await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new PhotoError("That file couldn't be read as an image. Try a different photo.");
  }
}
