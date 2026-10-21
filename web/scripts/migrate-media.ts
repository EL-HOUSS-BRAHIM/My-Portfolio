/** Upload a reviewed legacy image/blob to private Storage, preserving its checksum. */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
const file = process.argv[2];
if (!file)
  throw new Error("Usage: tsx scripts/migrate-media.ts image-file [--apply]");
const input = await readFile(file);
if (input.length > 5242880)
  throw new Error("Image exceeds 5 MB; optimize it before importing");
const checksum = createHash("sha256").update(input).digest("hex");
const output = await sharp(input, { limitInputPixels: 25000000 })
  .rotate()
  .resize({
    width: 2000,
    height: 2000,
    fit: "inside",
    withoutEnlargement: true,
  })
  .webp({ quality: 85 })
  .toBuffer();
const path = `legacy/${checksum}.webp`;
if (process.argv.includes("--apply")) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await db.storage
    .from("drafts")
    .upload(path, output, { contentType: "image/webp", upsert: false });
  if (error && error.message !== "The resource already exists")
    throw new Error("Media upload failed");
  const { error: recordError } = await db
    .from("media_assets")
    .upsert(
      { path, bucket: "drafts", mime_type: "image/webp", alt: {} },
      { onConflict: "path", ignoreDuplicates: true },
    );
  if (recordError) throw new Error("Media record failed");
}
console.info(
  JSON.stringify({
    dryRun: !process.argv.includes("--apply"),
    sourceChecksum: checksum,
    outputChecksum: createHash("sha256").update(output).digest("hex"),
    bucket: "drafts",
    path,
    bytes: output.length,
  }),
);
