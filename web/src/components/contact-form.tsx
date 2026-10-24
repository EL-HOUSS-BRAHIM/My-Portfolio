"use client";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { ArrowUpRight } from "lucide-react";
import { contactSchema } from "@/lib/models";
import { usePublicSubmission } from "./use-public-submission";
export function ContactForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("form");
  const locale = useLocale();
  const { state, busy, ready, send, invalid } =
    usePublicSubmission("/api/contact");
  const hintId = useId();
  return (
    <form
      method="post"
      action="/api/contact"
      className="contact-form"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!enabled || busy || !ready) return;
        const form = e.currentTarget;
        const fields = new FormData(form);
        const payload = {
          name: fields.get("name"),
          email: fields.get("email"),
          subject: fields.get("subject"),
          message: fields.get("message"),
          consent: fields.get("consent") === "on",
          locale,
          website: fields.get("website"),
        };
        if (
          !contactSchema.omit({ submissionId: true }).safeParse(payload).success
        ) {
          invalid();
          return;
        }
        if (await send(payload)) form.reset();
      }}
    >
      {!enabled && <p className="form-notice">{t("unavailable")}</p>}
      <fieldset className="form-fields" disabled={busy || !enabled || !ready}>
        <legend className="sr-only">{t("contactDetails")}</legend>
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
            aria-describedby={hintId}
          />
          <span className="field-hint" id={hintId}>
            {t("messageHint", { min: 20, max: 5000 })}
          </span>
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
      </fieldset>
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
