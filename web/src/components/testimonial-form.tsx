"use client";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { testimonialSchema } from "@/lib/models";
import { usePublicSubmission } from "./use-public-submission";
export function TestimonialForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("form");
  const locale = useLocale();
  const { state, busy, ready, send, invalid } =
    usePublicSubmission("/api/testimonials");
  const hintId = useId();
  return (
    <form
      method="post"
      action="/api/testimonials"
      className="contact-form"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!enabled || busy || !ready) return;
        const form = e.currentTarget;
        const data = new FormData(form);
        const payload = {
          name: data.get("name"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          locale,
        };
        if (
          !testimonialSchema.omit({ submissionId: true }).safeParse(payload)
            .success
        ) {
          invalid();
          return;
        }
        if (await send(payload)) form.reset();
      }}
    >
      {!enabled && <p className="notice">{t("unavailable")}</p>}
      <fieldset className="form-fields" disabled={busy || !enabled || !ready}>
        <legend className="sr-only">{t("feedbackDetails")}</legend>
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
          <span className="field-label">{t("feedbackPrompt")} *</span>
          <textarea
            name="message"
            rows={6}
            minLength={20}
            maxLength={2000}
            required
            aria-describedby={hintId}
          />
          <span className="field-hint" id={hintId}>
            {t("messageHint", { min: 20, max: 2000 })}
          </span>
        </label>
        <label className="sr-only" aria-hidden="true">
          {t("website")}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="checkbox-label">
          <input name="consent" type="checkbox" required />
          {t("feedbackConsent")}
        </label>
        <button className="button" disabled={busy || !enabled}>
          {busy ? t("sending") : t("submitFeedback")}
        </button>
      </fieldset>
      <p role="status" aria-live="polite">
        {state && t(state === "success" ? "feedbackSuccess" : state)}
      </p>
    </form>
  );
}
