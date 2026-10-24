import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ThemeSwitch } from "./theme-switch";
export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="footer">
      <div className="container footer-top">
        <Link href="/" className="footer-name" dir="ltr">
          Brahim El Houss<span className="accent">.</span>
        </Link>
        <p>{t("line")}</p>
        <a
          href="https://github.com/EL-HOUSS-BRAHIM"
          target="_blank"
          rel="noreferrer"
        >
          {t("github")} ↗
        </a>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {t("rights")}
        </span>
        <Link href="/privacy">{t("privacy")}</Link>
        <ThemeSwitch />
      </div>
    </footer>
  );
}
