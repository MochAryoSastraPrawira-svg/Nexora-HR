import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>(() => {
  // Theme toggling removed: always run in light mode.
  // Kept as no-op store for backward-compat if something still imports it.
  return {
    theme: "light",
    toggleTheme: () => {},
  };
});

