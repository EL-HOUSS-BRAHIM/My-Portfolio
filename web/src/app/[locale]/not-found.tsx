import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
export default async function NotFound() {
  const t = await getTranslations("pages");
  return (
    <div className="container section">
      <p className="eyebrow">404</p>
      <h1>{t("notFound")}</h1>
      <Link className="text-link" href="/">
        {t("returnHome")} ↗
      </Link>
    </div>
  );
}
