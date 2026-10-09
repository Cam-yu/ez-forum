/** 与后端接口对齐的共享类型 */

export type UserRole = "user" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface UserInfo {
  id: number;
  nickname: string;
  username: string;
  role: UserRole;
  created_at?: string;
}

/** 帖子列表项（联表作者昵称与板块名） */
export interface PostSummary {
  id: number;
  title: string;
  user_id: number;
  nickname: string;
  category_id: number | null;
  category_name: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  create_at: string;
  /** 正文摘要（仅公开列表返回） */
  excerpt?: string;
}

/** 帖子详情 */
export interface PostDetail extends PostSummary {
  context: string;
  review_status: ReviewStatus;
  liked: boolean;
}

/** 我的帖子（含审核状态与管理字段） */
export interface MyPost extends PostSummary {
  context: string;
  is_public: boolean;
  review_status: ReviewStatus;
  update_at: string;
}

export interface CommentItem {
  id: number;
  user_id: number;
  nickname: string;
  parent_id: number | null;
  content: string;
  create_at: string;
  can_delete: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  sort: number;
  post_count: number;
}

/** 用户主页（资料 + 公开帖子，分页字段嵌在 data 内） */
export interface UserHome extends UserInfo {
  posts: PostSummary[];
  page: number;
  pageSize: number;
  total: number;
}

// ===== 管理端 =====

export interface AdminStats {
  user_count: number;
  post_count: number;
  comment_count: number;
  pending_count: number;
}

export interface AdminUser {
  id: number;
  nickname: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface AdminPost {
  id: number;
  title: string;
  user_id: number;
  nickname: string;
  category_id: number | null;
  category_name: string | null;
  is_public: boolean;
  review_status: ReviewStatus;
  view_count: number;
  like_count: number;
  comment_count: number;
  create_at: string;
}

export interface AdminComment {
  id: number;
  post_id: number;
  post_title: string;
  user_id: number;
  nickname: string;
  content: string;
  create_at: string;
}
