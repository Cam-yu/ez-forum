import Elysia from "elysia"
import { db } from "../prisma/db"
import { INT, TS, TEXT, sql, rawRows, rawExec } from "../prisma/raw"
import { CommentCreate } from "../dto/commentDto"
import { ToId } from "../dto/utils"
import { auth } from "../plugins/auth"
import { fail, ok, okMsg } from "../utils/response"

type CommentRow = {
    id: number
    user_id: number
    nickname: string
    parent_id: number | null
    content: string
    create_at: string
}

const COMMENT_ROW_SPEC = {
    id: INT,
    user_id: INT,
    nickname: TEXT,
    parent_id: { codecId: INT, nullable: true },
    content: TEXT,
    create_at: TS
}

// 帖子对当前用户是否可见（公开+过审，或作者本人）
const postVisibleTo = async (postId: number, userId?: number) => {
    const post = await db.orm.public.Post.where({ id: postId })
        .select('user_id', 'is_public', 'review_status').first()
    if (!post) return null
    const visible = (post.is_public && post.review_status === 'approved') || post.user_id === userId
    return visible ? post : null
}

// 评论数校准（增删后重算，避免并发漂移）
export const recountComment = (postId: number) =>
    rawExec(sql`
        update "post" set comment_count = (select count(*) from "comment" where post_id = ${postId})
        where id = ${postId}
    `.affectedCount().build())

export const commentRouter = new Elysia({ prefix: '/comment' })
    .use(auth)

    // 帖子的全部评论: 一级评论 + 回复扁平返回, 前端按 parent_id 组装两级结构
    .get("/post/:id", async ({ params: { id }, userId, userRole }) => {
        const post = await postVisibleTo(id, userId)
        if (!post) return fail(404, "帖子不存在或未公开")

        const comments = await rawRows<CommentRow>(sql`
            select cm.id, cm.user_id, u.nickname, cm.parent_id, cm.content, cm.create_at
            from "comment" cm
            join "user" u on u.id = cm.user_id
            where cm.post_id = ${id}
            order by cm.id asc
            limit 500
        `.returnsRow(COMMENT_ROW_SPEC).build())

        return ok({
            total: comments.length,
            // 每条评论附上"是否可删"(本人或管理员)，前端无需再判断
            comments: comments.map((c) => ({
                ...c,
                can_delete: userId !== undefined && (c.user_id === userId || userRole === 'admin')
            }))
        })
    }, { signInOptional: true, params: ToId, detail: { summary: "帖子评论列表", tags: ["评论"] } })

    // 发表评论 / 回复: 需登录; 回复仅支持挂在一级评论下（两级结构）
    .post("/:id", async ({ body, params: { id }, userId }) => {
        const post = await postVisibleTo(id, userId)
        if (!post) return fail(404, "帖子不存在或未公开")

        if (body.parent_id) {
            const parent = await db.orm.public.Comment.where({ id: body.parent_id })
                .select('id', 'post_id', 'parent_id').first()
            if (!parent || parent.post_id !== id || parent.parent_id !== null) {
                return fail(404, "回复的评论不存在")
            }
        }

        const created = await db.orm.public.Comment.select('id', 'content', 'parent_id', 'create_at')
            .create({
                post_id: id,
                user_id: userId,
                content: body.content,
                ...(body.parent_id ? { parent_id: body.parent_id } : {})
            })
        await recountComment(id)
        return ok(created, body.parent_id ? "回复成功" : "评论成功")
    }, { signIn: true, params: ToId, body: CommentCreate, detail: { summary: "发表评论/回复 (需登录)", tags: ["评论"] } })

    // 删除评论: 本人或管理员; 一级评论的回复随之级联删除
    .delete("/:id", async ({ params: { id }, userId, userRole }) => {
        const comment = await db.orm.public.Comment.where({ id })
            .select('id', 'user_id', 'post_id').first()
        if (!comment) return fail(404, "评论不存在")
        if (comment.user_id !== userId && userRole !== 'admin') return fail(403, "无权删除该评论")

        await db.orm.public.Comment.where({ id }).delete()
        await recountComment(comment.post_id)
        return okMsg("评论已删除")
    }, { signIn: true, params: ToId, detail: { summary: "删除评论 (本人或管理员)", tags: ["评论"] } })
