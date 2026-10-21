import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-sans-arabic";
import "./globals.css";
import { siteUrl } from "@/lib/env";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Brahim El Houss — Software Engineer",
    template: "%s · Brahim El Houss",
  },
  description:
    "Thoughtful software, built with curiosity and care. Brahim El Houss, software engineer in Casablanca, Morocco.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme')||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t}catch{}",
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={await getMessages()}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
