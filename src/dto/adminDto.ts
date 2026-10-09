import { t } from "elysia";
import { PAGE_DEFAULT, PAGE_SIZE_MAX } from "./utils";

// 管理端帖子列表: 分页 + 审核状态筛选 + 关键词搜索
export const AdminPostQuery = t.Object({
    page: t.Optional(t.Integer({ minimum: PAGE_DEFAULT, error: "page 最小值为1" })),
    pageSize: t.Optional(t.Integer({ minimum: 1, maximum: PAGE_SIZE_MAX, error: `pageSize 需在 1-${PAGE_SIZE_MAX} 之间` })),
    status: t.Optional(t.Union([
        t.Literal("pending"),
        t.Literal("approved"),
        t.Literal("rejected")
    ], { error: "status 只能是 pending / approved / rejected" })),
    keyword: t.Optional(t.String({ minLength: 1, maxLength: 50, error: "关键词最长 50 字" }))
})

// 审核动作: 只能通过或驳回
export const ReviewInput = t.Object({
    status: t.Union([
        t.Literal("approved"),
        t.Literal("rejected")
    ], { error: "只能提交 approved 或 rejected" })
})
