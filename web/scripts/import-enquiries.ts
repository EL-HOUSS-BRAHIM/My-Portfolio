/** Import a reconciled, private MySQL JSON export without sending historical emails. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const args = process.argv.slice(2);
const option = (key: string) => {
  const i = args.indexOf(key);
  return i < 0 ? undefined : args[i + 1];
};
const source = option("--source");
if (!source)
  throw new Error(
    "Provide --source /secure/contact-export.json [--apply --reconciled]",
  );
const apply = args.includes("--apply");
if (apply && !args.includes("--reconciled"))
  throw new Error("A reviewed --reconciled export is required");
const raw = JSON.parse(await readFile(source, "utf8"));
const records = z
  .array(
    z.object({
      id: z.union([z.number(), z.string()]),
      name: z.string().max(100),
      email: z.email().max(254),
      subject: z.string().max(180).nullish(),
      message: z.string().max(5000),
      status: z.enum(["unread", "read", "replied", "archived"]),
      created_at: z
        .string()
        .refine(
          (v) => !Number.isNaN(Date.parse(v)),
          "A valid original timestamp is required",
        ),
    }),
  )
  .parse(Array.isArray(raw) ? raw : raw.contact_messages);
const db = apply
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  : null;
let imported = 0,
  unchanged = 0;
for (const record of records) {
  const h = createHash("sha256")
    .update(`enquiry:${basename(source)}:${record.id}`)
    .digest("hex");
  const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
  const checksum = createHash("sha256")
    .update(JSON.stringify(record))
    .digest("hex");
  if (db) {
    const sourceName = `enquiry:${basename(source)}`;
    const { data: previous, error: lookupError } = await db
      .from("legacy_imports")
      .select("checksum")
      .eq("source", sourceName)
      .eq("legacy_id", String(record.id))
      .maybeSingle();
    if (lookupError) throw new Error("Mapping lookup failed");
    if (previous?.checksum === checksum) {
      unchanged++;
      continue;
    }
    if (previous)
      throw new Error(
        "A source record changed; reconcile it before overwriting enquiries",
      );
    const { error } = await db.from("contact_messages").upsert(
      {
        id,
        submission_id: id,
        name: record.name,
        email: record.email,
        subject: record.subject || "",
        message: record.message,
        status: record.status,
        created_at: new Date(record.created_at).toISOString(),
        locale: "en",
        consent_at: null,
        origin: "legacy",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw new Error("Historical enquiry import failed");
    const { error: mappingError } = await db.from("legacy_imports").insert({
      source: sourceName,
      legacy_id: String(record.id),
      target_id: id,
      checksum,
    });
    if (mappingError) throw new Error("Enquiry mapping failed");
  }
  imported++;
}
const report = {
  dryRun: !apply,
  source: basename(source),
  total: records.length,
  imported,
  unchanged,
  notificationsEnqueued: 0,
  consent: "Not inferred; legacy provenance recorded",
};
if (option("--report"))
  await writeFile(option("--report")!, JSON.stringify(report, null, 2) + "\n", {
    mode: 0o600,
  });
console.info(JSON.stringify(report, null, 2));
