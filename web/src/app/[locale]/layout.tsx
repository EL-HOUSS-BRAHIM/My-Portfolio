import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return (
    <>
      <a href="#main" className="skip-link">
        {locale === "ar"
          ? "انتقل إلى المحتوى"
          : locale === "fr"
            ? "Aller au contenu"
            : "Skip to content"}
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
