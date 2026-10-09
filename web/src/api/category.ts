import { request, type ApiResult } from "./http";
import type { Category } from "./types";

export const categoryApi = {
  list: () => request<ApiResult<Category[]>>("GET", "/category"),

  create: (body: { name: string; description?: string; sort?: number }) =>
    request<ApiResult<Category>>("POST", "/category", { body }),

  update: (id: number, body: { name?: string; description?: string; sort?: number }) =>
    request<ApiResult<Category>>("PATCH", `/category/${id}`, { body }),

  remove: (id: number) => request<ApiResult<null>>("DELETE", `/category/${id}`),
};
