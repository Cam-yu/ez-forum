import { request, type ApiResult, type PageResult } from "./http";
import type { AdminComment, AdminPost, AdminStats, AdminUser } from "./types";

export const adminApi = {
  stats: () => request<ApiResult<AdminStats>>("GET", "/admin/stats"),

  users: (page: number, pageSize: number) =>
    request<PageResult<AdminUser>>("GET", "/admin/user", { query: { page, pageSize } }),

  updateUserRole: (id: number, role: "user" | "admin") =>
    request<ApiResult<AdminUser>>("PATCH", `/admin/user/${id}/role`, { body: { role } }),

  removeUser: (id: number) => request<ApiResult<null>>("DELETE", `/admin/user/${id}`),

  posts: (params: { page: number; pageSize: number; status?: string; keyword?: string }) =>
    request<PageResult<AdminPost>>("GET", "/admin/post", { query: params }),

  reviewPost: (id: number, status: "approved" | "rejected") =>
    request<ApiResult<AdminPost>>("PATCH", `/admin/post/${id}/review`, { body: { status } }),

  removePost: (id: number) => request<ApiResult<null>>("DELETE", `/admin/post/${id}`),

  comments: (page: number, pageSize: number) =>
    request<PageResult<AdminComment>>("GET", "/admin/comment", { query: { page, pageSize } }),

  removeComment: (id: number) => request<ApiResult<null>>("DELETE", `/admin/comment/${id}`),
};
