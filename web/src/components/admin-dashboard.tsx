"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  blankContent,
  kinds,
  type Content,
  type ContentInput,
} from "@/lib/models";
import type { Locale } from "@/i18n/routing";
import {
  saveContent,
  deleteContent,
  setMessageStatus,
  moderateTestimonial,
  uploadMedia,
  signOut,
} from "@/app/[locale]/admin/actions";
type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};
type Testimonial = {
  id: string;
  name: string;
  message: string;
  locale: string;
};
type Media = { id: string; path: string; bucket: string; mime_type: string };
type Job = { id: string; state: string; attempts: number };
type Audit = {
  id: number;
  action: string;
  kind: string | null;
  created_at: string;
};
export function AdminDashboard({
  initialContent,
  messages,
  testimonials,
  outbox,
  media,
  audit,
}: {
  initialContent: Content[];
  messages: Message[];
  testimonials: Testimonial[];
  outbox: Job[];
  media: Media[];
  audit: Audit[];
}) {
  const [editing, setEditing] = useState<ContentInput>(blankContent()),
    [locale, setLocale] = useState<Locale>("en"),
    [notice, setNotice] = useState(""),
    [preview, setPreview] = useState(false),
    [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof ContentInput>(key: K, value: ContentInput[K]) =>
    setEditing((old) => ({ ...old, [key]: value }));
  const text = editing.translations[locale];
  const setText = (key: keyof typeof text, value: string | boolean) =>
    setEditing((old) => ({
      ...old,
      translations: {
        ...old.translations,
        [locale]: { ...old.translations[locale], [key]: value },
      },
    }));
  return (
    <div className="container admin-shell">
      <div className="admin-nav">
        <div>
          <p className="eyebrow">PRIVATE / PUBLISHING</p>
          <h1 style={{ fontSize: 35 }}>Your workspace.</h1>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            start(async () => {
              await signOut();
              window.location.reload();
            })
          }
        >
          Sign out
        </button>
      </div>
      <p className="notice" role="status" aria-live="polite">
        {notice ||
          "Translations publish independently. Public media is visible to anyone with its URL; keep unpublished files in drafts."}
      </p>
      <div className="admin-grid" style={{ marginTop: 25 }}>
        <aside className="admin-list">
          <button className="button" onClick={() => setEditing(blankContent())}>
            + New content
          </button>
          {initialContent.map((c) => (
            <button
              key={c.id}
              aria-pressed={editing.id === c.id}
              onClick={() => {
                setEditing(c);
                setNotice("");
              }}
            >
              <strong>{c.translations.en.title}</strong>
              <br />
              <span className="eyebrow">
                {c.kind} ·{" "}
                {(["en", "fr", "ar"] as Locale[])
                  .filter((l) => c.translations[l].published)
                  .join(" / ") || "Draft"}
              </span>
            </button>
          ))}
        </aside>
        <form
          method="post"
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const result = await saveContent(editing);
              setNotice(result.message);
              if (result.ok && result.id) set("id", result.id);
              router.refresh();
            });
          }}
        >
          <div className="form-row">
            <label>
              Content type
              <select
                value={editing.kind}
                onChange={(e) =>
                  set("kind", e.target.value as ContentInput["kind"])
                }
              >
                {kinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              URL slug
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={editing.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Category
              <input
                value={editing.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </label>
            <label>
              Display order
              <input
                type="number"
                min={0}
                max={10000}
                value={editing.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </label>
          </div>
          <label>
            Technologies / tags (comma separated)
            <input
              value={editing.tags.join(", ")}
              onChange={(e) =>
                set(
                  "tags",
                  e.target.value.split(",").map((s) => s.trim()),
                )
              }
            />
          </label>
          <label>
            Image URL (published media only)
            <input
              value={editing.image}
              onChange={(e) => set("image", e.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              Public source URL
              <input
                type="url"
                value={editing.source_url}
                onChange={(e) => set("source_url", e.target.value)}
              />
            </label>
            <label>
              Demo URL / résumé URL for profile settings
              <input
                type="url"
                value={editing.demo_url}
                onChange={(e) => set("demo_url", e.target.value)}
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={editing.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Featured project
          </label>
          <div className="filters" role="group" aria-label="Translation">
            {(["en", "fr", "ar"] as Locale[]).map((l) => (
              <button
                type="button"
                key={l}
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
              >
                {l.toUpperCase()}
                {editing.translations[l].published ? " ✓" : ""}
              </button>
            ))}
          </div>
          <fieldset dir={locale === "ar" ? "rtl" : "ltr"}>
            <legend>{locale.toUpperCase()} content</legend>
            <label>
              Title
              <input
                value={text.title}
                maxLength={180}
                onChange={(e) => setText("title", e.target.value)}
              />
            </label>
            <label>
              Summary
              <textarea
                rows={3}
                value={text.summary}
                maxLength={600}
                onChange={(e) => setText("summary", e.target.value)}
              />
            </label>
            <label>
              Body (Markdown, HTML disabled)
              <textarea
                rows={12}
                value={text.body}
                maxLength={60000}
                onChange={(e) => setText("body", e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={text.published}
                onChange={(e) => setText("published", e.target.checked)}
              />
              Published translation
            </label>
            <button
              type="button"
              className="button secondary"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Hide preview" : "Preview draft"}
            </button>
            {preview && (
              <div className="prose">
                <h2>{text.title}</h2>
                <p>{text.summary}</p>
                <ReactMarkdown>{text.body}</ReactMarkdown>
              </div>
            )}
          </fieldset>
          <div className="admin-actions">
            <button className="button" disabled={pending}>
              {pending ? "Saving…" : "Save content"}
            </button>
            {editing.id && (
              <button
                type="button"
                className="button secondary"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this content and all translations?"))
                    return;
                  start(async () => {
                    const result = await deleteContent(editing.id!);
                    setNotice(result.message);
                    if (result.ok) setEditing(blankContent());
                    router.refresh();
                  });
                }}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
      <section className="admin-messages">
        <h2>Media library</h2>
        <p>
          Images are normalized to WebP. Upload to drafts until the file is
          ready to be public.
        </p>
        <form
          method="post"
          className="admin-form"
          style={{ marginBlock: 20 }}
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            start(async () => {
              const result = await uploadMedia(form);
              setNotice(
                result.message + (result.url ? ` · ${result.url}` : ""),
              );
              router.refresh();
            });
          }}
        >
          <div className="form-row">
            <label>
              File
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
              />
            </label>
            <label>
              Visibility
              <select name="bucket">
                <option value="drafts">Private draft</option>
                <option value="portfolio">Public — immediately visible</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              English description
              <input name="alt_en" />
            </label>
            <label>
              French description
              <input name="alt_fr" />
            </label>
            <label>
              Arabic description
              <input name="alt_ar" dir="rtl" />
            </label>
          </div>
          <button className="button" disabled={pending}>
            Upload file
          </button>
        </form>
        <ul className="media-list">
          {media.map((m) => (
            <li key={m.id}>
              {m.bucket} / {m.path} · {m.mime_type}
              {m.bucket === "portfolio" && (
                <button
                  className="text-link"
                  onClick={() => {
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${m.path}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => setNotice("Public URL copied"))
                      .catch(() => setNotice(url));
                  }}
                >
                  Copy URL
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="admin-messages">
        <h2>Enquiries</h2>
        {messages.length === 0 && <p>No enquiries yet.</p>}
        {messages.map((m) => (
          <article className="message-card" key={m.id}>
            <h3>{m.subject || "New enquiry"}</h3>
            <p>
              {m.name} · {m.email} ·{" "}
              {new Date(m.created_at).toLocaleDateString()}
            </p>
            <p>{m.message}</p>
            <label>
              Status
              <select
                defaultValue={m.status}
                onChange={(e) => {
                  const value = e.target.value;
                  start(async () => {
                    const r = await setMessageStatus(m.id, value);
                    setNotice(
                      r.ok ? "Status updated" : "Could not update status",
                    );
                    router.refresh();
                  });
                }}
              >
                {["unread", "read", "replied", "archived"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </section>
      <section className="admin-messages">
        <h2>Testimonials awaiting moderation</h2>
        {testimonials.map((t) => (
          <article className="message-card" key={t.id}>
            <h3>{t.name}</h3>
            <p>{t.message}</p>
            <p>
              Approval records consent review. Create a testimonial content
              entry to choose its public wording and translations.
            </p>
            <div className="admin-actions">
              {["approved", "rejected"].map((status) => (
                <button
                  className="button secondary"
                  key={status}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await moderateTestimonial(t.id, status);
                      setNotice(
                        r.ok ? "Moderation saved" : "Could not save moderation",
                      );
                      router.refresh();
                    })
                  }
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
      <section className="admin-messages">
        <h2>Email delivery</h2>
        {outbox.length ? (
          outbox.map((j) => (
            <p key={j.id}>
              {j.state} · {j.attempts} attempts · {j.id}
            </p>
          ))
        ) : (
          <p>No pending or failed deliveries.</p>
        )}
      </section>
      <section className="admin-messages">
        <h2>Publishing activity</h2>
        {audit.map((a) => (
          <p key={a.id}>
            {a.action} · {a.kind} · {new Date(a.created_at).toLocaleString()}
          </p>
        ))}
      </section>
    </div>
  );
}
