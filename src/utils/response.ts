/**
 * 统一响应结构：
 * 成功 {msg, data}
 * 分页成功 {msg, data, page, pageSize, total}
 * 无数据成功   {msg}
 * 失败 {msg} + HTTP状态码
 */
import { status } from "elysia";

// 成功（默认文案：获取成功）
export const ok = <T>(data: T, msg = "获取成功") => ({ msg, data });

// 无数据的成功（如删除）
export const okMsg = (msg: string) => ({ msg });

// 分页成功
export const okPage = <T>(data: T[], page: number, pageSize: number, total: number) =>
    ({ msg: "获取成功", data, page, pageSize, total });

// 失败：自动设置HTTP状态码
export const fail = <const Code extends number>(code: Code, msg: string) =>
    status(code, { msg })