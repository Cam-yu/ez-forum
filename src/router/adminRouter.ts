import Elysia from "elysia"
import { db } from "../prisma/db"
import { INT, TS, TEXT, BOOL, sql, rawRows } from "../prisma/raw"
import { AdminPostQuery, ReviewInput } from "../dto/adminDto"
import { RoleInput } from "../dto/userDto"
import { PAGE_DEFAULT, PAGE_SIZE_DEFAULT, Pagination, ToId } from "../dto/utils"
import { auth } from "../plugins/auth"
import { recountComment } from "./commentRouter"
import { fail, ok, okMsg, okPage } from "../utils/response"

type AdminPostRow = {
    id: number
    title: string
    user_id: number
    nickname: string
    category_id: number | null
    category_name: string | null
    is_public: boolean
    review_status: string
    view_count: number
    like_count: number
    comment_count: number
    create_at: string
}

const ADMIN_POST_SPEC = {
    id: INT,
    title: TEXT,
    user_id: INT,
    nickname: TEXT,
    category_id: { codecId: INT, nullable: true },
    category_name: { codecId: TEXT, nullable: true },
    is_public: BOOL,
    review_status: TEXT,
    view_count: INT,
    like_count: INT,
    comment_count: INT,
    create_at: TS
}

type AdminCommentRow = {
    id: number
    post_id: number
    post_title: string
    user_id: number
    nickname: string
    content: string
    create_at: string
}

const ADMIN_COMMENT_SPEC = {
    id: INT,
    post_id: INT,
    post_title: TEXT,
    user_id: INT,
    nickname: TEXT,
    content: TEXT,
    create_at: TS
}

export const adminRouter = new Elysia({ prefix: '/admin' })
    .use(auth)

    // 概览统计
    .get("/stats", async () => {
        const count = async (model: typeof db.orm.public.User | typeof db.orm.public.Post | typeof db.orm.public.Comment) =>
            (await model.aggregate((a) => ({ c: a.count() }))).c
        const pending = await db.orm.public.Post
            .where({ review_status: 'pending' }).aggregate((a) => ({ c: a.count() }))
        return ok({
            user_count: await count(db.orm.public.User),
            post_count: await count(db.orm.public.Post),
            comment_count: await count(db.orm.public.Comment),
            pending_count: pending.c
        })
    }, { adminOnly: true, detail: { summary: "概览统计 (管理员)", tags: ["管理"] } })

    // ===== 用户管理 =====

    // 用户列表 (分页)
    .get("/user", async ({ query: { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT } }) => {
        const [pageNum, size] = [Number(page), Number(pageSize)]
        const [users, { count }] = await Promise.all([
            db.orm.public.User.select('id', 'nickname', 'username', 'role', 'created_at')
                .orderBy([(U) => U.id.asc()])
                .limit(size)
                .offset((pageNum - 1) * size)
                .all(),
            db.orm.public.User.aggregate((a) => ({ count: a.count() }))
        ])
        return okPage(users, pageNum, size, count)
    }, { adminOnly: true, query: Pagination, detail: { summary: "用户列表 (分页)", tags: ["管理"] } })

    // 修改用户角色
    .patch("/user/:id/role", async ({ body, params: { id }, userId }) => {
        if (id === userId) return fail(400, "不能修改自己的角色")

        const targetId = await db.orm.public.User.where({ id }).select('id').first()
        if (!targetId) return fail(404, `ID ${id} 不存在`)

        const roleUpdate = await db.orm.public.User.where({ id })
            .select('id', 'nickname', 'username', 'role')
            .update({ role: body.role })
        return ok(roleUpdate, "角色已更新")
    }, { adminOnly: true, params: ToId, body: RoleInput, detail: { summary: "修改用户角色", tags: ["管理"] } })

    // 删除用户 (其帖子/评论级联删除)
    .delete("/user/:id", async ({ params: { id }, userId }) => {
        if (id === userId) return fail(400, "不能删除自己")

        const targetId = await db.orm.public.User.where({ id }).select('id').first()
        if (!targetId) return fail(404, `ID ${id} 不存在`)

        await db.orm.public.User.where({ id }).delete()
        return okMsg("用户已删除")
    }, { adminOnly: true, params: ToId, detail: { summary: "删除用户", tags: ["管理"] } })

    // ===== 帖子管理 =====

    // 帖子列表: 按审核状态筛选, 不传 status = 全部; 支持关键词搜索 (分页)
    .get("/post", async ({ query }) => {
        const page = Number(query.page ?? PAGE_DEFAULT)
        const pageSize = Number(query.pageSize ?? PAGE_SIZE_DEFAULT)
        const status = String(query.status ?? "")
        const keyword = String(query.keyword ?? "")

        const [posts, totalRows] = await Promise.all([
            rawRows<AdminPostRow>(sql`
                select p.id, p.title, p.user_id, u.nickname, p.category_id, c.name as category_name,
                       p.is_public, p.review_status, p.view_count, p.like_count, p.comment_count, p.create_at
                from "post" p
                join "user" u on u.id = p.user_id
                left join "category" c on c.id = p.category_id
                where (${status} = '' or p.review_status = ${status})
                  and (${keyword} = '' or p.title ilike ${'%' + keyword.replace(/[\\%_]/g, "\\$&") + '%'})
                order by p.create_at desc, p.id desc
                limit ${pageSize} offset ${(page - 1) * pageSize}
            `.returnsRow(ADMIN_POST_SPEC).build()),
            rawRows<{ total: number }>(sql`
                select count(*)::int as total from "post" p
                where (${status} = '' or p.review_status = ${status})
                  and (${keyword} = '' or p.title ilike ${'%' + keyword.replace(/[\\%_]/g, "\\$&") + '%'})
            `.returnsRow({ total: INT }).build())
        ])
        return okPage(posts, page, pageSize, totalRows[0]?.total ?? 0)
    }, { adminOnly: true, query: AdminPostQuery, detail: { summary: "帖子管理列表 (状态筛选/搜索, 分页)", tags: ["管理"] } })

    // 审核: 通过 / 驳回
    .patch("/post/:id/review", async ({ body, params: { id } }) => {
        const targetId = await db.orm.public.Post.where({ id }).select('id').first()
        if (!targetId) return fail(404, "帖子不存在")

        const postReview = await db.orm.public.Post.where({ id })
            .select('id', 'title', 'review_status', 'update_at')
            .update({ review_status: body.status })
        return ok(postReview, body.status === 'approved' ? '已通过审核' : '已驳回')
    }, { adminOnly: true, params: ToId, body: ReviewInput, detail: { summary: "审核帖子", tags: ["管理"] } })

    // 删除任意帖子
    .delete("/post/:id", async ({ params: { id } }) => {
        const targetId = await db.orm.public.Post.where({ id }).select('id').first()
        if (!targetId) return fail(404, "帖子不存在")

        await db.orm.public.Post.where({ id }).delete()
        return okMsg("帖子已删除")
    }, { adminOnly: true, params: ToId, detail: { summary: "删除任意帖子", tags: ["管理"] } })

    // ===== 评论管理 =====

    // 评论列表 (分页, 含所属帖子标题与评论者)
    .get("/comment", async ({ query: { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT } }) => {
        const [pageNum, size] = [Number(page), Number(pageSize)]
        const [comments, totalRows] = await Promise.all([
            rawRows<AdminCommentRow>(sql`
                select cm.id, cm.post_id, p.title as post_title, cm.user_id, u.nickname, cm.content, cm.create_at
                from "comment" cm
                join "post" p on p.id = cm.post_id
                join "user" u on u.id = cm.user_id
                order by cm.id desc
                limit ${size} offset ${(pageNum - 1) * size}
            `.returnsRow(ADMIN_COMMENT_SPEC).build()),
            rawRows<{ total: number }>(sql`
                select count(*)::int as total from "comment"
            `.returnsRow({ total: INT }).build())
        ])
        return okPage(comments, pageNum, size, totalRows[0]?.total ?? 0)
    }, { adminOnly: true, query: Pagination, detail: { summary: "评论列表 (分页)", tags: ["管理"] } })

    // 删除任意评论 (一级评论的回复级联删除)
    .delete("/comment/:id", async ({ params: { id } }) => {
        const comment = await db.orm.public.Comment.where({ id }).select('id', 'post_id').first()
        if (!comment) return fail(404, "评论不存在")

        await db.orm.public.Comment.where({ id }).delete()
        await recountComment(comment.post_id)
        return okMsg("评论已删除")
    }, { adminOnly: true, params: ToId, detail: { summary: "删除任意评论", tags: ["管理"] } })
