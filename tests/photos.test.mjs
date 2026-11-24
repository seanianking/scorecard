import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processPhoto, PhotoError, sniffImageType } from "../src/lib/photo-processing.js";

const solid = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: "#a85ea4" } });

test("strips EXIF metadata (e.g. GPS, device info) and outputs JPEG", async () => {
  const input = await solid(400, 300)
    .withExif({ IFD0: { Copyright: "secret-owner", Make: "PhoneCo" } })
    .jpeg()
    .toBuffer();
  assert.ok((await sharp(input).metadata()).exif, "fixture should carry EXIF");

  const out = await processPhoto(input);
  const meta = await sharp(out).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.exif, undefined);
  assert.ok(!out.includes(Buffer.from("secret-owner")));
});

test("downsizes large photos to 800px on the longest side, keeps small ones", async () => {
  const big = await processPhoto(await solid(3000, 2000).png().toBuffer());
  const bm = await sharp(big).metadata();
  assert.equal(bm.width, 800);
  assert.equal(bm.height, 533);

  const small = await processPhoto(await solid(300, 400).webp().toBuffer());
  const sm = await sharp(small).metadata();
  assert.deepEqual([sm.width, sm.height], [300, 400]);
});

test("applies EXIF orientation so photos display upright", async () => {
  // Orientation 6 = rotate 90° clockwise to display; a 400x200 image should come out 200x400.
  const input = await solid(400, 200).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const meta = await sharp(await processPhoto(input)).metadata();
  assert.deepEqual([meta.width, meta.height], [200, 400]);
});

test("rejects non-images regardless of claimed type", async () => {
  for (const bad of [
    Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"),
    Buffer.from("%PDF-1.7 fake"),
    Buffer.from("GIF89a......"),
    Buffer.alloc(0),
  ]) {
    await assert.rejects(processPhoto(bad), PhotoError);
  }
});

test("rejects truncated/corrupt images that pass the magic-byte check", async () => {
  const jpeg = await solid(200, 200).jpeg().toBuffer();
  assert.equal(sniffImageType(jpeg), "jpeg");
  await assert.rejects(processPhoto(jpeg.subarray(0, 40)), PhotoError);
});
