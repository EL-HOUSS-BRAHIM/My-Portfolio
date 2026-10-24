export type Theme = "system" | "light" | "dark";
let sessionTheme: Theme = "system";

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    // Private browsing and storage restrictions must not break the page.
  }
  return sessionTheme;
}

export function applyTheme(theme: Theme) {
  sessionTheme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // The preference still applies for the current page when storage is denied.
  }
  syncTheme(theme);
  window.dispatchEvent(new Event("theme-change"));
}

export function syncTheme(theme = readTheme()) {
  document.documentElement.dataset.theme =
    theme === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
}
