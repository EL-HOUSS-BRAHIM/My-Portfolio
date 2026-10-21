/** Read-only by default. Uses a reconciled JSON export, never a live MySQL connection. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { contentSchema, kinds, type ContentInput } from "../src/lib/models";
const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const source = option("--source");
if (!source)
  throw new Error(
    "Usage: npm run import:legacy -- --source export.json [--kind project] [--apply --reconciled]",
  );
const apply = args.includes("--apply");
if (apply && !args.includes("--reconciled"))
  throw new Error(
    "Compare PHP, JSON and MySQL sources first, then supply --reconciled",
  );
const raw = JSON.parse(await readFile(resolve(source), "utf8"));
const kind = z.enum(kinds).parse(option("--kind") || "project");
const plural = {
  project: "projects",
  post: "posts",
  skill: "skills",
  experience: "experience",
  education: "education",
  service: "services",
  settings: "settings",
  testimonial: "testimonials",
}[kind];
const rows: Array<Record<string, unknown>> = Array.isArray(raw)
  ? raw
  : raw[plural];
if (!Array.isArray(rows))
  throw new Error(`Expected array or ${plural} property`);
const sourceName = basename(source);
const report: {
  source: string;
  dryRun: boolean;
  rows: unknown[];
  warnings: string[];
} = { source: sourceName, dryRun: !apply, rows: [], warnings: [] };
if (kind === "testimonial")
  throw new Error(
    "Testimonials must be verified for authenticity and consent, then entered through the moderation workflow",
  );
const db = apply
  ? createClient(
      z.url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
      z.string().min(10).parse(process.env.SUPABASE_SECRET_KEY),
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  : null;
function idFor(key: string) {
  const h = createHash("sha256").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
for (const [index, row] of rows.entries()) {
  const legacyId = String(row.id ?? index);
  const id = idFor(`${kind}:${sourceName}:${legacyId}`);
  const title = String(
    row.title || row.name || row.degree || row.institution || "Untitled",
  );
  const slug =
    String(
      row.slug ||
        title
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
    ).slice(0, 110) || `legacy-${index}`;
  const https = (value: unknown) =>
    typeof value === "string" && value.startsWith("https://") ? value : "";
  const entry: ContentInput = contentSchema.parse({
    id,
    kind,
    slug,
    category: String(row.category || ""),
    tags:
      typeof row.technologies === "string"
        ? row.technologies.split(",").map((v) => v.trim())
        : [],
    image: "",
    source_url: https(row.github_url),
    demo_url: https(row.demo_url),
    featured: Boolean(row.featured),
    sort_order: Number(row.order_position || index),
    translations: {
      en: {
        title,
        summary: String(row.short_description || "").slice(0, 600),
        body: String(row.description || ""),
        published: false,
      },
      fr: { title: "", summary: "", body: "", published: false },
      ar: { title: "", summary: "", body: "", published: false },
    },
  });
  const checksum = createHash("sha256")
    .update(JSON.stringify(row))
    .digest("hex");
  if (row.image_data || row.image_url)
    report.warnings.push(
      `Record ${legacyId}: migrate its image separately to private Storage, validate checksum, and publish only after review`,
    );
  if (db) {
    const { data: previous, error: lookupError } = await db
      .from("legacy_imports")
      .select("checksum,target_id")
      .eq("source", `${kind}:${sourceName}`)
      .eq("legacy_id", legacyId)
      .maybeSingle();
    if (lookupError) throw new Error("Import mapping lookup failed");
    if (previous?.checksum === checksum) {
      report.rows.push({
        legacyId,
        id: previous.target_id,
        action: "unchanged",
      });
      continue;
    }
    if (previous)
      throw new Error(
        `Source record ${legacyId} changed after a previous import; reconcile before overwriting dashboard edits`,
      );
    const { error } = await db.rpc("save_content", { payload: entry });
    if (error) throw new Error(`Import failed for ${legacyId}: ${error.code}`);
    const timestamps: Record<string, string> = {};
    for (const key of ["created_at", "updated_at"])
      if (
        typeof row[key] === "string" &&
        !Number.isNaN(Date.parse(row[key] as string))
      )
        timestamps[key] = new Date(row[key] as string).toISOString();
    if (Object.keys(timestamps).length) {
      const { error: e } = await db
        .from("content")
        .update(timestamps)
        .eq("id", id);
      if (e) throw new Error("Could not preserve timestamps");
    }
    const { error: mappingError } = await db.from("legacy_imports").insert({
      source: `${kind}:${sourceName}`,
      legacy_id: legacyId,
      target_id: id,
      checksum,
    });
    if (mappingError) throw new Error("Could not save reconciliation mapping");
  }
  report.rows.push({
    legacyId,
    id,
    slug,
    action: apply ? "imported-draft" : "would-import-draft",
  });
}
const output = option("--report");
if (output) await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.info(JSON.stringify(report, null, 2));
