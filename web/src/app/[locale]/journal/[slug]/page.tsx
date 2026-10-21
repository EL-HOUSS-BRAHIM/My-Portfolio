import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import { ContentDetail } from "@/components/content-detail";
import { detailMeta } from "@/lib/detail-meta";
export const generateMetadata = ({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) => detailMeta(params, "post");
export default async function Post({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <ContentDetail {...{ locale, slug }} kind="post" />;
}
