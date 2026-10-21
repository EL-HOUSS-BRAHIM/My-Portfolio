"use server";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { contentSchema } from "@/lib/models";
import { siteUrl } from "@/lib/env";
async function authorized() {
  const h = await headers();
  if (h.get("origin") !== new URL(siteUrl()).origin)
    throw new Error("Invalid origin");
  return requireAdmin();
}
export async function saveContent(input: unknown) {
  const { db } = await authorized();
  const result = contentSchema.safeParse(input);
  if (!result.success)
    return {
      ok: false,
      message: result.error.issues[0]?.message || "Check content fields",
    };
  try {
    const { data, error } = await db.rpc("save_content", {
      payload: result.data,
    });
    if (error)
      return {
        ok: false,
        message:
          "Content could not be saved. Check publication and access permissions.",
      };
    revalidateTag("content", "max");
    return { ok: true, id: String(data), message: "Content saved" };
  } catch {
    return { ok: false, message: "Content could not be saved" };
  }
}
export async function deleteContent(id: string) {
  const { db } = await authorized();
  const { error } = await db.from("content").delete().eq("id", id);
  if (error) return { ok: false, message: "Could not delete content" };
  revalidateTag("content", "max");
  return { ok: true, message: "Content deleted" };
}
export async function setMessageStatus(id: string, status: string) {
  const { db } = await authorized();
  if (!["unread", "read", "replied", "archived"].includes(status))
    return { ok: false };
  const { error } = await db
    .from("contact_messages")
    .update({ status })
    .eq("id", id);
  return { ok: !error };
}
export async function moderateTestimonial(id: string, status: string) {
  const { db } = await authorized();
  if (!["approved", "rejected"].includes(status)) return { ok: false };
  const { error } = await db
    .from("testimonial_submissions")
    .update({ status })
    .eq("id", id);
  return { ok: !error };
}
export async function uploadMedia(form: FormData) {
  const { db } = await authorized();
  const file = form.get("file");
  const bucket = form.get("bucket") === "portfolio" ? "portfolio" : "drafts";
  if (!(file instanceof File) || file.size < 1 || file.size > 5242880)
    return { ok: false, message: "Choose a file up to 5 MB" };
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let ext = "webp",
    mime = "image/webp";
  try {
    if (file.type === "application/pdf") {
      if (buffer.subarray(0, 5).toString() !== "%PDF-")
        return { ok: false, message: "Invalid PDF" };
      ext = "pdf";
      mime = "application/pdf";
    } else {
      const meta = await sharp(buffer, {
        limitInputPixels: 25000000,
      }).metadata();
      if (!["jpeg", "png", "webp"].includes(meta.format || ""))
        return {
          ok: false,
          message: "Only JPEG, PNG, WebP or PDF files are accepted",
        };
      buffer = await sharp(buffer, { limitInputPixels: 25000000 })
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    }
  } catch {
    return { ok: false, message: "This image could not be processed" };
  }
  const path = `${randomUUID()}.${ext}`;
  const { error } = await db.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (error) return { ok: false, message: "Upload failed" };
  const alt = {
    en: String(form.get("alt_en") || ""),
    fr: String(form.get("alt_fr") || ""),
    ar: String(form.get("alt_ar") || ""),
  };
  const { error: recordError } = await db
    .from("media_assets")
    .insert({ path, bucket, mime_type: mime, alt });
  if (recordError) {
    await db.storage.from(bucket).remove([path]);
    return { ok: false, message: "Media record failed" };
  }
  const url =
    bucket === "portfolio"
      ? db.storage.from(bucket).getPublicUrl(path).data.publicUrl
      : (await db.storage.from(bucket).createSignedUrl(path, 300)).data
          ?.signedUrl;
  return {
    ok: true,
    message:
      bucket === "portfolio"
        ? "Public file uploaded"
        : "Private draft uploaded; preview link expires in 5 minutes",
    url,
  };
}
export async function signOut() {
  const { db } = await requireAdmin();
  await db.auth.signOut();
}
