"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeSwitch } from "./theme-switch";
import type { Locale } from "@/i18n/routing";
export function Header() {
  const t = useTranslations("nav");
  const path = usePathname();
  const search = useSearchParams().toString();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const links = [
    ["/work", "work"],
    ["/about", "about"],
    ["/services", "services"],
    ["/journal", "journal"],
  ] as const;
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="wordmark" aria-label="Brahim El Houss">
          <span className="brand-symbol" aria-hidden>
            be<span>.</span>
          </span>
          <span className="brand-caption">
            Brahim
            <br />
            El Houss
          </span>
        </Link>
        <nav className="desktop-nav" aria-label={t("menu")}>
          {links.map(([href, label]) => (
            <Link
              href={href}
              key={href}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <div className="locale-switch" aria-label={t("language")}>
            {/* A document navigation refreshes the root language and message provider. */}
            {(["en", "fr", "ar"] as Locale[]).map((l) => (
              <a
                key={l}
                href={`/${l}${path === "/" ? "" : path}${search ? `?${search}` : ""}`}
                lang={l}
                aria-label={{ en: "English", fr: "Français", ar: "العربية" }[l]}
                aria-current={locale === l ? "true" : undefined}
              >
                {l === "ar" ? "ع" : l.toUpperCase()}
              </a>
            ))}
          </div>
          <Link className="button small desktop-contact" href="/contact">
            {t("contact")}
            <ArrowUpRight size={15} />
          </Link>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className="mobile-menu icon-button"
              aria-label={t("menu")}
            >
              <Menu size={22} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="menu-overlay" />
              <Dialog.Content className="mobile-panel">
                <Dialog.Title className="eyebrow">Brahim El Houss</Dialog.Title>
                <Dialog.Description className="sr-only">
                  {t("menu")}
                </Dialog.Description>
                <Dialog.Close
                  className="icon-button close-menu"
                  aria-label={t("close")}
                >
                  <X />
                </Dialog.Close>
                <nav>
                  {links.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      aria-current={path.startsWith(href) ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {t(label)}
                    </Link>
                  ))}
                  <Link
                    href="/contact"
                    aria-current={path === "/contact" ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {t("contact")}
                  </Link>
                </nav>
                <ThemeSwitch />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
      <noscript>
        <style>
          {".mobile-menu, .theme-control { display: none !important; }"}
        </style>
        <nav className="container no-script-nav" aria-label={t("menu")}>
          {links.map(([href, label]) => (
            <Link key={href} href={href}>
              {t(label)}
            </Link>
          ))}
          <Link href="/contact">{t("contact")}</Link>
        </nav>
      </noscript>
    </header>
  );
}
