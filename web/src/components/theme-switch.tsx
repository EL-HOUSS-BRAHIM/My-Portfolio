"use client";
import { useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";
const subscribe = (callback: () => void) => {
  window.addEventListener("theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("theme-change", callback);
    window.removeEventListener("storage", callback);
  };
};
export function ThemeSwitch() {
  const t = useTranslations("nav");
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if ((localStorage.getItem("theme") || "system") === "system")
        document.documentElement.dataset.theme = media.matches
          ? "dark"
          : "light";
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const theme = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem("theme") || "system",
    () => "system",
  );
  return (
    <label className="theme-control">
      <span className="sr-only">{t("theme")}</span>
      <select
        aria-label={t("theme")}
        value={theme}
        onChange={(e) => {
          const value = e.target.value;
          localStorage.setItem("theme", value);
          document.documentElement.dataset.theme =
            value === "system"
              ? matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
              : value;
          window.dispatchEvent(new Event("theme-change"));
        }}
      >
        <option value="system">◐ {t("system")}</option>
        <option value="light">☀ {t("light")}</option>
        <option value="dark">☾ {t("dark")}</option>
      </select>
    </label>
  );
}
