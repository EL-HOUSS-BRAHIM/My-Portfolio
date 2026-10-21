import { z } from "zod";
export const kinds = [
  "project",
  "post",
  "skill",
  "experience",
  "education",
  "service",
  "settings",
  "testimonial",
] as const;
export const localeSchema = z.enum(["en", "fr", "ar"]);
export const safeUrl = z
  .string()
  .max(2000)
  .refine((v) => !v || /^https:\/\//.test(v), "Use an HTTPS URL");
export const translationSchema = z
  .object({
    title: z.string().trim().max(180),
    summary: z.string().trim().max(600),
    body: z.string().max(60000),
    published: z.boolean(),
  })
  .refine((v) => !v.published || v.title.length >= 2, {
    message: "Published translations need a title",
  });
export const contentSchema = z
  .object({
    id: z.uuid().optional(),
    kind: z.enum(kinds),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120),
    category: z.string().max(80),
    tags: z.array(z.string().max(50)).max(15),
    image: z
      .string()
      .max(2000)
      .refine(
        (v) =>
          !v ||
          /^\/images\/[\w.-]+$/.test(v) ||
          /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/portfolio\/[a-zA-Z0-9_./-]+$/.test(
            v,
          ),
        "Use a public portfolio Storage URL",
      ),
    source_url: safeUrl,
    demo_url: safeUrl,
    featured: z.boolean(),
    sort_order: z.number().int().min(0).max(10000),
    translations: z.object({
      en: translationSchema,
      fr: translationSchema,
      ar: translationSchema,
    }),
  })
  .refine(
    (v) =>
      (!v.translations.fr.published && !v.translations.ar.published) ||
      v.translations.en.published,
    { message: "Publish English before translations" },
  );
export type ContentInput = z.infer<typeof contentSchema>;
export type Content = ContentInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().max(180),
  message: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
  locale: localeSchema,
  website: z.string().max(200).default(""),
  submissionId: z.uuid(),
});
export const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(100),
  message: z.string().trim().min(20).max(2000),
  consent: z.literal(true),
  locale: localeSchema,
  website: z.string().max(200).default(""),
  submissionId: z.uuid(),
});
export type ContactInput = z.infer<typeof contactSchema>;
export function blankContent(): ContentInput {
  return {
    kind: "project",
    slug: "",
    category: "web",
    tags: [],
    image: "",
    source_url: "",
    demo_url: "",
    featured: false,
    sort_order: 0,
    translations: {
      en: { title: "", summary: "", body: "", published: false },
      fr: { title: "", summary: "", body: "", published: false },
      ar: { title: "", summary: "", body: "", published: false },
    },
  };
}
