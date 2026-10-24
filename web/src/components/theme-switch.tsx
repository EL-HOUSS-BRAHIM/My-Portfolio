"use client";
import { useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readTheme, syncTheme, type Theme } from "@/lib/theme";
const subscribe = (callback: () => void) => {
  const onStorage = () => {
    syncTheme();
    callback();
  };
  window.addEventListener("theme-change", callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("theme-change", callback);
    window.removeEventListener("storage", onStorage);
  };
};
export function ThemeSwitch() {
  const t = useTranslations("nav");
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (readTheme() === "system")
        document.documentElement.dataset.theme = media.matches
          ? "dark"
          : "light";
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system");
  return (
    <label className="theme-control">
      <span className="sr-only">{t("theme")}</span>
      <select
        aria-label={t("theme")}
        value={theme}
        onChange={(e) => {
          applyTheme(e.target.value as Theme);
        }}
      >
        <option value="system">◐ {t("system")}</option>
        <option value="light">☀ {t("light")}</option>
        <option value="dark">☾ {t("dark")}</option>
      </select>
    </label>
  );
}
