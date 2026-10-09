import { t } from "elysia"
import { PAGE_DEFAULT, PAGE_SIZE_MAX } from "./utils"

// 帖子字段通用规则
export const titleSchema = t.String({ minLength: 1, maxLength: 120, error: "标题需 1-120 字" })
export const contentSchema = t.String({ minLength: 1, maxLength: 20000, error: "内容需 1-20000 字" })

// 发布
export const PostCreate = t.Object({
    title: titleSchema,
    context: contentSchema,
    category_id: t.Optional(t.Integer({ minimum: 1, error: "板块 ID 不合法" }))
})

// 修改
export const PostUpdate = t.Object({
    title: titleSchema,
    context: contentSchema,
    category_id: t.Optional(t.Integer({ minimum: 1, error: "板块 ID 不合法" }))
})

// 公开列表查询: 板块过滤 + 关键词搜索 + 排序
export const PostListQuery = t.Object({
    page: t.Optional(t.Integer({ minimum: PAGE_DEFAULT, error: "page 最小为1" })),
    pageSize: t.Optional(t.Integer({ minimum: 1, maximum: PAGE_SIZE_MAX, error: `pageSize 需在1-${PAGE_SIZE_MAX}之间` })),
    category_id: t.Optional(t.Integer({ minimum: 1, error: "板块 ID 不合法" })),
    keyword: t.Optional(t.String({ minLength: 1, maxLength: 50, error: "关键词最长 50 字" })),
    sort: t.Optional(t.Union([t.Literal("new"), t.Literal("hot")], { error: "sort 只能是 new 或 hot" }))
})
