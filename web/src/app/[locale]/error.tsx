"use client";
import { useLocale } from "next-intl";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const locale = useLocale();
  return (
    <section className="container section">
      <h1>
        {locale === "ar"
          ? "المحتوى غير متاح مؤقتًا"
          : locale === "fr"
            ? "Contenu momentanément indisponible"
            : "Content temporarily unavailable"}
      </h1>
      <button className="button" onClick={reset}>
        {locale === "ar"
          ? "حاول مجددًا"
          : locale === "fr"
            ? "Réessayer"
            : "Try again"}
      </button>
    </section>
  );
}
