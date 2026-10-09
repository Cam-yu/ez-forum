import Elysia from "elysia"
import { db } from "../prisma/db"
import { INT, TS, TEXT, sql, rawRows, rawExec } from "../prisma/raw"
import { PostCreate, PostListQuery, PostUpdate } from "../dto/postDto"
import { PAGE_DEFAULT, PAGE_SIZE_DEFAULT, ToId } from "../dto/utils"
import { auth } from "../plugins/auth"
import { fail, ok, okMsg, okPage } from "../utils/response"

// LIKE 关键词转义，防止 % _ 通配符被当成通配语法
const likeKw = (keyword: string) => `%${keyword.replace(/[\\%_]/g, "\\$&")}%`

// 帖子行（联表作者昵称与板块名）
type PostRow = {
    id: number
    title: string
    user_id: number
    nickname: string
    category_id: number | null
    category_name: string | null
    view_count: number
    like_count: number
    comment_count: number
    create_at: string
    excerpt?: string
}

const POST_ROW_SPEC = {
    id: INT,
    title: TEXT,
    user_id: INT,
    nickname: TEXT,
    category_id: { codecId: INT, nullable: true },
    category_name: { codecId: TEXT, nullable: true },
    view_count: INT,
    like_count: INT,
    comment_count: INT,
    create_at: TS
}

// 列表行额外带 120 字正文摘要
const LIST_ROW_SPEC = { ...POST_ROW_SPEC, excerpt: TEXT }

// 过滤条件用"哨兵值短路"：categoryId 传 0 / keyword 传 '' 表示不过滤，单模板覆盖全部组合
// sort: new=最新, hot=最热（点赞>浏览）
const postListPlans = (categoryId: number, keyword: string, sort: string, limit: number, offset: number) => {
    const kw = likeKw(keyword)
    return {
        rows: sql`
            select p.id, p.title, p.user_id, u.nickname, p.category_id, c.name as category_name,
                   p.view_count, p.like_count, p.comment_count, p.create_at,
                   left(p.context, 120) as excerpt
            from "post" p
            join "user" u on u.id = p.user_id
            left join "category" c on c.id = p.category_id
            where p.is_public = true and p.review_status = 'approved'
              and (${categoryId} <= 0 or p.category_id = ${categoryId})
              and (${keyword} = '' or p.title ilike ${kw})
            order by
                case when ${sort} = 'hot' then p.like_count else 0 end desc,
                case when ${sort} = 'hot' then p.view_count else 0 end desc,
                p.create_at desc, p.id desc
            limit ${limit} offset ${offset}
        `.returnsRow(LIST_ROW_SPEC).build(),
        total: sql`
            select count(*)::int as total from "post" p
            where p.is_public = true and p.review_status = 'approved'
              and (${categoryId} <= 0 or p.category_id = ${categoryId})
              and (${keyword} = '' or p.title ilike ${kw})
        `.returnsRow({ total: INT }).build()
    }
}

export const postRouter = new Elysia({ prefix: '/post' })
    .use(auth)

    // 公开帖子列表: 公开且已过审, 支持板块过滤 / 关键词搜索 / 最新最热排序, 分页
    .get("/", async ({ query: { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT, category_id = 0, keyword = "", sort = "new" } }) => {
        // 校验通过后 Elysia 会把 query 值转成 schema 类型，这里兜底转换以保证类型稳定
        const [pageNum, size, categoryId] = [Number(page), Number(pageSize), Number(category_id)]
        const plans = postListPlans(categoryId, String(keyword), String(sort), size, (pageNum - 1) * size)
        const [posts, totalRows] = await Promise.all([rawRows<PostRow>(plans.rows), rawRows<{ total: number }>(plans.total)])
        return okPage(posts, pageNum, size, totalRows[0]?.total ?? 0)
    }, { query: PostListQuery, detail: { summary: "公开帖子列表 (板块过滤/搜索/排序, 分页)", tags: ["帖子"] } })

    // 我的帖子: 含待审核/被驳回 (放在 /:id 之前注册)
    .get("/mine", async ({ userId, query: { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT } }) => {
        const [pageNum, size] = [Number(page), Number(pageSize)]
        const isMine = { user_id: userId }
        const [posts, { count }] = await Promise.all([
            db.orm.public.Post.where(isMine)
                .select('id', 'title', 'context', 'category_id', 'is_public', 'review_status',
                    'view_count', 'like_count', 'comment_count', 'create_at', 'update_at')
                .orderBy([(P) => P.create_at.desc()])
                .limit(size)
                .offset((pageNum - 1) * size)
                .all(),
            db.orm.public.Post.where(isMine).aggregate((a) => ({ count: a.count() }))
        ])
        return okPage(posts, pageNum, size, count)
    }, { signIn: true, detail: { summary: "我的帖子 (含各审核状态, 分页)", tags: ["帖子"] } })

    // 帖子详情: 公开+过审 任何人可以看; 未过审的仅作者本人可看 (管理员走 /admin)
    .get("/:id", async ({ params: { id }, userId }) => {
        const [post] = await rawRows<PostRow>(sql`
            select p.id, p.title, p.user_id, u.nickname, p.category_id, c.name as category_name,
                   p.view_count, p.like_count, p.comment_count, p.create_at
            from "post" p
            join "user" u on u.id = p.user_id
            left join "category" c on c.id = p.category_id
            where p.id = ${id}
        `.returnsRow(POST_ROW_SPEC).build())

        const full = await db.orm.public.Post.where({ id })
            .select('user_id', 'context', 'is_public', 'review_status').first()
        const visible = !!full && ((full.is_public && full.review_status === 'approved') || full.user_id === userId)
        if (!post || !full || !visible) return fail(404, "帖子不存在或未公开")

        // 浏览量只对公开已过审的帖子累计
        if (full.is_public && full.review_status === 'approved') {
            await rawExec(sql`update "post" set view_count = view_count + 1 where id = ${id}`.affectedCount().build())
            post.view_count += 1
        }

        // 已登录时附带点赞状态
        const liked = userId
            ? (await db.orm.public.PostLike.where({ post_id: id, user_id: userId }).select('post_id').first()) !== null
            : false

        return ok({ ...post, context: full.context, review_status: full.review_status, liked })
    }, { signInOptional: true, params: ToId, detail: { summary: "帖子详情 (自动累计浏览量)", tags: ["帖子"] } })

    // 发布: 作者取自token, 默认进入待审核状态
    .post("/", async ({ body, userId }) => {
        if (body.category_id) {
            const category = await db.orm.public.Category.where({ id: body.category_id }).select('id').first()
            if (!category) return fail(404, "所选板块不存在")
        }
        const postCreate = await db.orm.public.Post.select('id', 'title', 'category_id', 'review_status').create({
            user_id: userId,
            title: body.title,
            context: body.context,
            ...(body.category_id ? { category_id: body.category_id } : {})
        })
        return ok(postCreate, "发布成功, 等待审核")
    }, { signIn: true, body: PostCreate, detail: { summary: "发布帖子 (需登录, 默认待审核)", tags: ["帖子"] } })

    // 修改: 仅作者; 修改后重新进入待审核状态
    .patch("/:id", async ({ body, params: { id }, userId }) => {
        const target = await db.orm.public.Post.where({ id }).select('id', 'user_id').first()
        if (!target) return fail(404, "帖子不存在")
        if (target.user_id !== userId) return fail(403, "无权修改该帖子")

        if (body.category_id) {
            const category = await db.orm.public.Category.where({ id: body.category_id }).select('id').first()
            if (!category) return fail(404, "所选板块不存在")
        }
        const postUpdate = await db.orm.public.Post.where({ id })
            .select('id', 'title', 'context', 'category_id', 'review_status', 'update_at')
            .update({ ...body, review_status: 'pending' })
        return ok(postUpdate, "修改成功, 帖子重新进入待审核")
    }, { signIn: true, params: ToId, body: PostUpdate, detail: { summary: "修改帖子 (仅作者, 改后需重新审核)", tags: ["帖子"] } })

    // 删除: 仅作者
    .delete("/:id", async ({ params: { id }, userId }) => {
        const target = await db.orm.public.Post.where({ id }).select('id', 'user_id').first()
        if (!target) return fail(404, "帖子不存在")
        if (target.user_id !== userId) return fail(403, "无权删除该帖子")

        await db.orm.public.Post.where({ id }).delete()
        return okMsg("帖子删除成功")
    }, { signIn: true, params: ToId, detail: { summary: "删除帖子 (仅作者)", tags: ["帖子"] } })

    // 点赞 / 取消点赞 (切换)
    .post("/:id/like", async ({ params: { id }, userId }) => {
        const target = await db.orm.public.Post.where({ id })
            .select('id', 'is_public', 'review_status').first()
        if (!target || !(target.is_public && target.review_status === 'approved')) {
            return fail(404, "帖子不存在或未公开")
        }

        const liked = await db.orm.public.PostLike.where({ post_id: id, user_id: userId }).select('post_id').first()
        try {
            if (liked) {
                await db.orm.public.PostLike.where({ post_id: id, user_id: userId }).delete()
            } else {
                await db.orm.public.PostLike.select('post_id').create({ post_id: id, user_id: userId })
            }
        } catch (error) {
            // 并发下重复点赞触发唯一约束，按已点赞处理
            if (!String(error).includes("duplicate key")) throw error
        }
        // 用实际行数校准计数，避免并发漂移
        const [row] = await rawRows<{ like_count: number }>(sql`
            update "post" set like_count = (select count(*) from "postLike" where post_id = ${id})
            where id = ${id} returning like_count
        `.returnsRow({ like_count: INT }).build())

        return ok({ liked: !liked, like_count: row?.like_count ?? 0 }, !liked ? "已点赞" : "已取消点赞")
    }, { signIn: true, params: ToId, detail: { summary: "点赞/取消点赞 (需登录)", tags: ["帖子"] } })
