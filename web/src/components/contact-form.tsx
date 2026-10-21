"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { contactSchema } from "@/lib/models";
export function ContactForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("form");
  const locale = useLocale();
  const [state, setState] = useState("");
  const id = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="contact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("");
        const form = e.currentTarget;
        const fields = new FormData(form);
        id.current ??= crypto.randomUUID();
        const payload = {
          name: fields.get("name"),
          email: fields.get("email"),
          subject: fields.get("subject"),
          message: fields.get("message"),
          consent: fields.get("consent") === "on",
          locale,
          website: fields.get("website"),
          submissionId: id.current,
        };
        if (!contactSchema.safeParse(payload).success) {
          setState("invalid");
          return;
        }
        setBusy(true);
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            setState("success");
            form.reset();
            id.current = null;
          } else {
            const result = await response.json();
            setState(
              result.code === "limited"
                ? "limited"
                : result.code === "invalid"
                  ? "invalid"
                  : "unavailable",
            );
          }
        } catch {
          setState("error");
        } finally {
          setBusy(false);
        }
      }}
    >
      {!enabled && <p className="form-notice">{t("unavailable")}</p>}
      <div className="form-row">
        <label>
          <span className="field-label">{t("name")} *</span>
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label>
          <span className="field-label">{t("email")} *</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            dir="ltr"
          />
        </label>
      </div>
      <label>
        <span className="field-label">{t("subject")}</span>
        <input name="subject" maxLength={180} />
      </label>
      <label>
        <span className="field-label">{t("message")} *</span>
        <textarea
          name="message"
          rows={6}
          required
          minLength={20}
          maxLength={5000}
        />
      </label>
      <label className="sr-only" aria-hidden="true">
        {t("website")}
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" name="consent" required />
        {t("consent")}
      </label>
      <div>
        <button type="submit" className="button" disabled={busy || !enabled}>
          {busy ? t("sending") : t("submit")}
          <ArrowUpRight size={18} />
        </button>
      </div>
      <div aria-live="polite" role="status">
        {state && (
          <p
            className={`form-notice ${state !== "success" ? "form-error" : ""}`}
          >
            {t(state)}
          </p>
        )}
      </div>
    </form>
  );
}
