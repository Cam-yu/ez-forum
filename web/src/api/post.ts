import { request, type ApiResult, type PageResult } from "./http";
import type { MyPost, PostDetail, PostSummary } from "./types";

export interface PostListParams {
  page?: number;
  pageSize?: number;
  category_id?: number;
  keyword?: string;
  sort?: "new" | "hot";
}

export const postApi = {
  list: (params: PostListParams) =>
    request<PageResult<PostSummary>>("GET", "/post", { query: params }),

  mine: (page: number, pageSize: number) =>
    request<PageResult<MyPost>>("GET", "/post/mine", { query: { page, pageSize } }),

  detail: (id: number) => request<ApiResult<PostDetail>>("GET", `/post/${id}`),

  create: (body: { title: string; context: string; category_id?: number }) =>
    request<ApiResult<{ id: number; title: string; review_status: string }>>("POST", "/post", { body }),

  update: (id: number, body: { title: string; context: string; category_id?: number }) =>
    request<ApiResult<{ id: number; review_status: string }>>("PATCH", `/post/${id}`, { body }),

  remove: (id: number) => request<ApiResult<null>>("DELETE", `/post/${id}`),

  like: (id: number) =>
    request<ApiResult<{ liked: boolean; like_count: number }>>("POST", `/post/${id}/like`),
};
