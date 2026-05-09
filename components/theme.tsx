"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MoonIcon, SunIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME, type Theme } from "./theme-shared";

export type { Theme };
export { THEME_COOKIE_NAME };

type ThemeContextValue = {
  theme: Theme | null;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme | null;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme | null>(initialTheme);

  useEffect(() => {
    if (initialTheme !== null) {
      return;
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client init when no cookie override exists; server rendered without data-theme so CSS @media handles first paint
    setTheme(mql.matches ? "dark" : "light");
    const onChange = (e: MediaQueryListEvent) => {
      if (document.cookie.includes(`${THEME_COOKIE_NAME}=`)) {
        return;
      }
      setTheme(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, [initialTheme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-transparent bg-transparent text-ink-2 transition-all duration-150 ease-pantry hover:border-paper-3 hover:bg-paper-2 hover:text-ink-0 active:scale-95",
        className,
      )}
    >
      {theme === null ? (
        <span className="block h-4 w-4" aria-hidden />
      ) : isDark ? (
        <SunIcon size={16} />
      ) : (
        <MoonIcon size={16} />
      )}
    </button>
  );
}
