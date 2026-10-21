"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { testimonialSchema } from "@/lib/models";
export function TestimonialForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("form");
  const locale = useLocale();
  const [state, setState] = useState(""),
    [busy, setBusy] = useState(false);
  const id = useRef<string | null>(null);
  return (
    <form
      className="contact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("");
        const form = e.currentTarget;
        const data = new FormData(form);
        id.current ??= crypto.randomUUID();
        const payload = {
          name: data.get("name"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          locale,
          submissionId: id.current,
        };
        if (!testimonialSchema.safeParse(payload).success) {
          setState("invalid");
          return;
        }
        setBusy(true);
        try {
          const response = await fetch("/api/testimonials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          setState(
            response.ok
              ? "success"
              : response.status === 429
                ? "limited"
                : "error",
          );
          if (response.ok) {
            form.reset();
            id.current = null;
          }
        } catch {
          setState("error");
        } finally {
          setBusy(false);
        }
      }}
    >
      {!enabled && <p className="notice">{t("unavailable")}</p>}
      <label>
        <span className="field-label">{t("name")} *</span>
        <input
          name="name"
          minLength={2}
          maxLength={100}
          autoComplete="name"
          required
        />
      </label>
      <label>
        <span className="field-label">
          {locale === "ar"
            ? "تجربتك في العمل معي"
            : locale === "fr"
              ? "Votre expérience de collaboration"
              : "Your experience working with me"}{" "}
          *
        </span>
        <textarea
          name="message"
          rows={6}
          minLength={20}
          maxLength={2000}
          required
        />
      </label>
      <label className="sr-only" aria-hidden="true">
        {t("website")}
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="checkbox-label">
        <input name="consent" type="checkbox" required />
        {locale === "ar"
          ? "أوافق على نشر اسمي وتعليقي بعد المراجعة."
          : locale === "fr"
            ? "J’accepte la publication de mon nom et de mon témoignage après modération."
            : "I consent to my name and feedback being published after moderation."}
      </label>
      <button className="button" disabled={busy || !enabled}>
        {busy ? t("sending") : t("submit")}
      </button>
      <p role="status" aria-live="polite">
        {state && t(state)}
      </p>
    </form>
  );
}
