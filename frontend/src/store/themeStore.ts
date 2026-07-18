import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

const applyTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("data-theme", theme);
  if (typeof window !== "undefined") {
    localStorage.setItem("nexora-theme", theme);
  }
};

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("nexora-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  }
}));

applyTheme(getInitialTheme());

