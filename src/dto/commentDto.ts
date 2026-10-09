import { t } from "elysia"

// 发表评论: parent_id 为空是一级评论, 否则是该评论下的回复
export const CommentCreate = t.Object({
    content: t.String({ minLength: 1, maxLength: 1000, error: "评论需 1-1000 字" }),
    parent_id: t.Optional(t.Integer({ minimum: 1, error: "父评论 ID 不合法" }))
})
