/** 统一请求封装：携带 token、解析 {msg,data} 结构、统一错误提示 */

export interface ApiResult<T> {
  msg: string;
  data: T;
}

export interface PageResult<T> extends ApiResult<T[]> {
  page: number;
  pageSize: number;
  total: number;
}

const TOKEN_KEY = "forum_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? "";
export const setToken = (token: string) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Query = object;

const buildUrl = (path: string, query?: Query) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return `/api${path}${qs ? `?${qs}` : ""}`;
};

let unauthorizedHandler: (() => void) | null = null;

/** 401 时的统一处理由 store 注册（清除登录态并跳转登录页） */
export const onUnauthorized = (handler: () => void) => {
  unauthorizedHandler = handler;
};

export async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && token) {
    // 本地保存的 token 已失效（过期/账号删除），重置登录态
    setToken("");
    unauthorizedHandler?.();
    throw new ApiError("登录已过期，请重新登录", 401);
  }

  let json: ApiResult<unknown> | null = null;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("服务异常，请稍后重试", res.status);
  }

  if (!res.ok) throw new ApiError(json?.msg ?? `请求失败 (${res.status})`, res.status);
  return json as T;
}

export const http = {
  get: <T>(path: string, query?: Query) => request<PageResult<T> | ApiResult<T>>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<ApiResult<T>>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<ApiResult<T>>("PATCH", path, { body }),
  delete: <T>(path: string) => request<ApiResult<T>>("DELETE", path),
};
