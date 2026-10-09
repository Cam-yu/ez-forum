import { defineStore } from "pinia";
import { userApi } from "@/api/user";
import { getToken, onUnauthorized, setToken } from "@/api/http";
import type { UserInfo } from "@/api/types";

const TOKEN_KEY = "forum_token";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    user: null as UserInfo | null,
    /** 首次 restore 是否已完成，路由守卫依赖它避免误判 */
    ready: false as boolean,
  }),

  getters: {
    isSignedIn: (s) => !!s.token && !!s.user,
    isAdmin: (s) => s.user?.role === "admin",
  },

  actions: {
    /** 应用启动时恢复登录态：校验本地 token 并拉取用户信息 */
    async restore() {
      if (this.token && !this.user) {
        try {
          this.user = (await userApi.me()).data;
        } catch {
          this.clear();
        }
      }
      this.ready = true;
    },

    async login(username: string, password: string) {
      const { data } = await userApi.login({ username, password });
      setToken(data.token);
      this.token = data.token;
      this.user = (await userApi.me()).data;
    },

    /** 退出登录；silent 时不跳转（由调用方决定跳转逻辑） */
    logout() {
      this.clear();
      location.href = "/login";
    },

    clear() {
      setToken("");
      this.token = "";
      this.user = null;
    },

    /** http 层检测到 401 时的统一回调 */
    bindUnauthorized() {
      onUnauthorized(() => this.clear());
    },
  },
});

export { getToken };
