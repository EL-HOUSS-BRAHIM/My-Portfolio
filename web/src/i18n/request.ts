import { getRequestConfig } from "next-intl/server";
import { isLocale } from "./routing";
export default getRequestConfig(async ({ requestLocale }) => {
  const candidate = await requestLocale;
  const locale = candidate && isLocale(candidate) ? candidate : "en";
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
