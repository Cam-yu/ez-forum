import { request, type ApiResult } from "./http";
import type { CommentItem } from "./types";

export const commentApi = {
  listByPost: (postId: number) =>
    request<ApiResult<{ total: number; comments: CommentItem[] }>>("GET", `/comment/post/${postId}`),

  create: (postId: number, body: { content: string; parent_id?: number }) =>
    request<ApiResult<CommentItem>>("POST", `/comment/${postId}`, { body }),

  remove: (id: number) => request<ApiResult<null>>("DELETE", `/comment/${id}`),
};
