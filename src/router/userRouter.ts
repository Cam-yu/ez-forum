import { isUniqueConstraintViolation } from "@prisma/orm-family-sql/errors"
import Elysia from "elysia"
import { db } from "../prisma/db"
import { LoginInput, UserCreate, UserUpdate } from "../dto/userDto"
import { PAGE_DEFAULT, PAGE_SIZE_DEFAULT, Pagination, ToId } from "../dto/utils"
import { auth } from "../plugins/auth"
import { rateLimit, requestIp } from "../utils/rateLimit"
import { fail, ok, okMsg } from "../utils/response"

// 登录口令的防爆破参数
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 60_000

// 注册防刷参数
const REGISTER_LIMIT = 5
const REGISTER_WINDOW_MS = 10 * 60_000

export const userRouter = new Elysia({ prefix: '/user' })
    .use(auth)

    // 注册：角色固定 user
    .post("/", async ({ body, request, server }) => {
        const ip = requestIp({ server, request })
        if (!rateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
            return fail(429, "注册过于频繁，请稍后再试")
        }
        try {
            const userReg = await db.orm.public.User.select('id', 'nickname', 'username').create({
                nickname: body.nickname,
                username: body.username,
                password: await Bun.password.hash(body.password)
            })
            return ok(userReg, "注册成功")
        } catch (error) {
            if (isUniqueConstraintViolation(error)) return fail(409, "用户名已存在")
            throw error
        }
    }, { body: UserCreate, detail: { summary: "注册 (角色固定为普通用户)", tags: ["用户"] } })

    // 登录：校验密码，签发 JWT（7 天过期在 auth 插件中配置）
    .post("/login", async ({ body, jwt, request, server }) => {
        const ip = requestIp({ server, request })
        if (!rateLimit(`login:${ip}:${body.username}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
            return fail(429, "尝试次数过多，请一分钟后再试")
        }
        const userLogin = await db.orm.public.User.where({ username: body.username })
            .select('id', 'username', 'password', 'role').first()
        // 账号不存在时也做一次哈希运算，抹平响应时间差，避免枚举用户名
        const passwordHash = userLogin?.password ?? (await Bun.password.hash("timing-pad"))
        const valid = await Bun.password.verify(body.password, passwordHash)
        if (!userLogin || !valid) return fail(401, "用户名或密码错误")

        const token = await jwt.sign({ sub: String(userLogin.id), username: userLogin.username })
        return ok({ token, role: userLogin.role }, "登陆成功")
    }, { body: LoginInput, detail: { summary: "登录, 返回token", tags: ["用户"] } })

    // 我的信息
    .get("/me", async ({ userId }) => {
        const userInfo = await db.orm.public.User.where({ id: userId })
            .select('id', 'nickname', 'username', 'role', 'created_at').first()
        return ok(userInfo)
    }, { signIn: true, detail: { summary: "我的信息 (需登录)", tags: ["用户"] } })

    // 用户主页：只展示: 公开 + 已过审 的帖子, 分页
    .get("/:id", async ({ params: { id }, query: { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT } }) => {
        const [pageNum, size] = [Number(page), Number(pageSize)]
        const userHome = await db.orm.public.User.where({ id })
            .select('id', 'nickname', 'username', 'role', 'created_at').first()
        if (!userHome) return fail(404, `ID ${id} 不存在`)

        const publicPost = { user_id: id, is_public: true, review_status: 'approved' as const }
        const [posts, { count }] = await Promise.all([
            db.orm.public.Post.where(publicPost)
                .select('id', 'title', 'context', 'category_id', 'view_count', 'like_count', 'comment_count', 'create_at')
                .orderBy([(P) => P.create_at.desc(), (P) => P.id.desc()])
                .limit(size)
                .offset((pageNum - 1) * size)
                .all(),
            db.orm.public.Post.where(publicPost).aggregate((a) => ({ count: a.count() }))
        ])
        return ok({ ...userHome, posts, page: pageNum, pageSize: size, total: count })
    }, { params: ToId, query: Pagination, detail: { summary: "用户主页 (含已过审公开帖子, 分页)", tags: ["用户"] } })

    // 修改资料, 仅本人
    .patch("/:id", async ({ body, params: { id }, userId }) => {
        if (userId !== id) return fail(403, "只能修改自己的资料")
        const targetId = await db.orm.public.User.where({ id }).select('id').first()
        if (!targetId) return fail(404, `ID ${id} 不存在`)

        try {
            const userUpdate = await db.orm.public.User.where({ id })
                .select('id', 'nickname', 'username').update(body)
            return ok(userUpdate, "资料修改成功")
        } catch (error) {
            if (isUniqueConstraintViolation(error)) return fail(409, "用户名已存在")
            throw error
        }
    }, { signIn: true, params: ToId, body: UserUpdate, detail: { summary: "修改资料 (仅本人)", tags: ["用户"] } })

    // 注销账号: 仅本人 (帖子/评论/点赞级联删除)
    .delete("/:id", async ({ params: { id }, userId }) => {
        if (userId !== id) return fail(403, "只能删除自己的账号")
        const targetId = await db.orm.public.User.where({ id }).select('id').first()
        if (!targetId) return fail(404, `ID ${id} 不存在`)

        await db.orm.public.User.where({ id }).delete()
        return okMsg("账号已删除")
    }, { signIn: true, params: ToId, detail: { summary: "注销账号 (仅本人)", tags: ["用户"] } })
