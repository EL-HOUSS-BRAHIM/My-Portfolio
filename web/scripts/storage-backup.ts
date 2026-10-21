import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";
const root = resolve(process.argv[2] || "");
if (!process.argv[2]) throw new Error("Provide a backup directory");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
type Entry = {
  bucket: string;
  path: string;
  sha256: string;
  bytes: number;
  contentType: string;
};
function local(bucket: string, path: string) {
  const target = resolve(root, bucket, path);
  if (!target.startsWith(root + sep))
    throw new Error("Unsafe storage object path");
  return target;
}
if (process.argv.includes("--restore")) {
  if (!process.argv.includes("--apply"))
    throw new Error(
      "Restore requires --apply and a dedicated recovery project",
    );
  const manifest: Entry[] = JSON.parse(
    await readFile(resolve(root, "manifest.json"), "utf8"),
  );
  for (const entry of manifest) {
    if (!["portfolio", "drafts"].includes(entry.bucket))
      throw new Error("Unexpected bucket");
    const bytes = await readFile(local(entry.bucket, entry.path));
    if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256)
      throw new Error("Backup checksum mismatch");
    const { error } = await db.storage
      .from(entry.bucket)
      .upload(entry.path, bytes, {
        contentType: entry.contentType,
        upsert: false,
      });
    if (error)
      throw new Error(
        `Restore failed for ${entry.bucket}/${entry.path}; use an empty recovery bucket`,
      );
  }
  console.info(`Restored ${manifest.length} storage objects`);
} else {
  await mkdir(root, { recursive: true });
  const manifest: Entry[] = [];
  for (const bucket of ["portfolio", "drafts"]) {
    async function walk(prefix: string) {
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await db.storage.from(bucket).list(prefix, {
          limit: 100,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw new Error("Storage listing failed");
        for (const item of data) {
          const path = prefix ? `${prefix}/${item.name}` : item.name;
          if (!item.id) {
            await walk(path);
            continue;
          }
          const { data: blob, error: downloadError } = await db.storage
            .from(bucket)
            .download(path);
          if (downloadError) throw new Error("Storage download failed");
          const bytes = Buffer.from(await blob.arrayBuffer());
          const target = local(bucket, path);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, bytes, { mode: 0o600 });
          manifest.push({
            bucket,
            path,
            sha256: createHash("sha256").update(bytes).digest("hex"),
            bytes: bytes.length,
            contentType: blob.type || "application/octet-stream",
          });
        }
        if (data.length < 100) break;
      }
    }
    await walk("");
  }
  await writeFile(
    resolve(root, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { mode: 0o600 },
  );
  console.info(`Backed up ${manifest.length} storage objects with checksums`);
}
