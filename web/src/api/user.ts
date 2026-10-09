import { request, type ApiResult } from "./http";
import type { UserHome, UserInfo, UserRole } from "./types";

export const userApi = {
  register: (body: { nickname: string; username: string; password: string }) =>
    request<ApiResult<{ id: number; nickname: string; username: string }>>("POST", "/user", { body }),

  login: (body: { username: string; password: string }) =>
    request<ApiResult<{ token: string; role: UserRole }>>("POST", "/user/login", { body }),

  me: () => request<ApiResult<UserInfo>>("GET", "/user/me"),

  home: (id: number, page: number, pageSize: number) =>
    request<ApiResult<UserHome>>("GET", `/user/${id}`, { query: { page, pageSize } }),

  update: (id: number, body: { nickname?: string; username?: string }) =>
    request<ApiResult<{ id: number; nickname: string; username: string }>>("PATCH", `/user/${id}`, { body }),

  remove: (id: number) => request<ApiResult<null>>("DELETE", `/user/${id}`),
};
