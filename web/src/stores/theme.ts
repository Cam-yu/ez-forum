import { defineStore } from "pinia";

const THEME_KEY = "forum_theme";
export type ThemeMode = "dark" | "light";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: (localStorage.getItem(THEME_KEY) as ThemeMode) || "dark",
  }),

  actions: {
    /** 应用到 <html class="dark">，Element Plus 暗色变量随之生效 */
    apply() {
      document.documentElement.classList.toggle("dark", this.mode === "dark");
    },

    toggle() {
      this.mode = this.mode === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, this.mode);
      this.apply();
    },

    init() {
      this.apply();
    },
  },
});
