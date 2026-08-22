import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function getStoredTheme(defaultTheme: Theme): Theme {
  try {
    const storedPreferences = localStorage.getItem("userPreferences");
    if (storedPreferences) {
      const parsed = JSON.parse(storedPreferences) as { theme?: Theme };
      if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") return parsed.theme;
    }
  } catch {
    // Fall back to the legacy theme key when preferences are malformed.
  }

  const legacyTheme = localStorage.getItem("theme");
  return legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : defaultTheme;
}

export function getSystemTheme(): ResolvedTheme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => (switchable ? getStoredTheme(defaultTheme) : defaultTheme));
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (!switchable || typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? "dark" : "light");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener?.("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.("change", handleSystemThemeChange);
  }, [switchable]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");

    if (switchable) {
      localStorage.setItem("theme", theme);
      try {
        const storedPreferences = localStorage.getItem("userPreferences");
        const preferences = storedPreferences ? JSON.parse(storedPreferences) : {};
        localStorage.setItem("userPreferences", JSON.stringify({ ...preferences, theme }));
      } catch {
        localStorage.setItem("userPreferences", JSON.stringify({ theme }));
      }
    }
  }, [theme, resolvedTheme, switchable]);

  const toggleTheme = switchable ? () => setTheme((current) => (current === "system" ? (resolvedTheme === "light" ? "dark" : "light") : current === "light" ? "dark" : "light")) : undefined;
  const setThemeExplicit = switchable ? (nextTheme: Theme) => setTheme(nextTheme) : undefined;

  return <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme: setThemeExplicit, switchable }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
