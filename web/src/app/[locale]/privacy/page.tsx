import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/page-intro";
export default async function Privacy() {
  const t = await getTranslations("pages");
  return (
    <div className="container">
      <PageIntro label="PRIVACY" title={t("privacyTitle")} intro="" />
      <div className="prose">
        <p>{t("privacyBody")}</p>
      </div>
    </div>
  );
}
