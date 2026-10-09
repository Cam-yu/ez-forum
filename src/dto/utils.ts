import { t } from "elysia";

// 路径参数: /xxx/:id
export const ToId = t.Object({
    id: t.Integer({ minimum: 1, error: "ID 必须为正整数" })
})

// 分页默认值与上限
export const PAGE_DEFAULT = 1
export const PAGE_SIZE_DEFAULT = 10
export const PAGE_SIZE_MAX = 100

// 列表接口通用分页参数
export const Pagination = t.Object({
    page: t.Optional(t.Integer({ minimum: PAGE_DEFAULT, error: "page 最小为1" })),
    pageSize: t.Optional(t.Integer({ minimum: 1, maximum: PAGE_SIZE_MAX, error: `pageSize 需在1-${PAGE_SIZE_MAX}之间` }))
})

// 用户字段通用规则
export const nicknameSchema = t.String({ minLength: 2, maxLength: 20, error: "昵称需 2-20 个字符" })
export const usernameSchema = t.String({
    minLength: 5,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9_]+$",
    error: "用户名需 5-20 位字母、数字或下划线"
})
export const passwordSchema = t.String({ minLength: 8, maxLength: 72, error: "密码需 8-72 位" })
