import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
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
      if (parsed.theme === "light" || parsed.theme === "dark") return parsed.theme;
    }
  } catch {
    // Fall back to the legacy theme key when preferences are malformed.
  }

  const legacyTheme = localStorage.getItem("theme");
  return legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => (switchable ? getStoredTheme(defaultTheme) : defaultTheme));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");

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
  }, [theme, switchable]);

  const toggleTheme = switchable ? () => setTheme((current) => (current === "light" ? "dark" : "light")) : undefined;

  return <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
