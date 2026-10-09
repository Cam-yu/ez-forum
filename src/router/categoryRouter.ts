import { isUniqueConstraintViolation } from "@prisma/orm-family-sql/errors"
import Elysia from "elysia"
import { db } from "../prisma/db"
import { INT, sql, rawRows } from "../prisma/raw"
import { CategoryCreate, CategoryUpdate } from "../dto/categoryDto"
import { ToId } from "../dto/utils"
import { auth } from "../plugins/auth"
import { fail, ok, okMsg } from "../utils/response"

// 板块下公开已过审的帖子数
const approvedCountByCategory = async () => {
    const rows = await rawRows<{ category_id: number; total: number }>(sql`
        select category_id, count(*)::int as total
        from "post"
        where is_public = true and review_status = 'approved' and category_id is not null
        group by category_id
    `.returnsRow({ category_id: INT, total: INT }).build())
    return new Map(rows.map((r) => [r.category_id, r.total]))
}

export const categoryRouter = new Elysia({ prefix: '/category' })
    .use(auth)

    // 板块列表: 按sort升序, 附带帖子数
    .get("/", async () => {
        const categories = await db.orm.public.Category
            .select('id', 'name', 'description', 'sort')
            .orderBy([(C) => C.sort.asc(), (C) => C.id.asc()])
            .all()
        const counts = await approvedCountByCategory()
        return ok(categories.map((c) => ({ ...c, post_count: counts.get(c.id) ?? 0 })))
    }, { detail: { summary: "板块列表 (含帖子数)", tags: ["板块"] } })

    // 新建板块
    .post("/", async ({ body }) => {
        try {
            const created = await db.orm.public.Category.select('id', 'name', 'description', 'sort')
                .create({ name: body.name, description: body.description ?? "", sort: body.sort ?? 0 })
            return ok(created, "板块创建成功")
        } catch (error) {
            if (isUniqueConstraintViolation(error)) return fail(409, "板块名已存在")
            throw error
        }
    }, { adminOnly: true, body: CategoryCreate, detail: { summary: "新建板块 (管理员)", tags: ["板块"] } })

    // 修改板块
    .patch("/:id", async ({ body, params: { id } }) => {
        const target = await db.orm.public.Category.where({ id }).select('id').first()
        if (!target) return fail(404, "板块不存在")
        try {
            const updated = await db.orm.public.Category.where({ id })
                .select('id', 'name', 'description', 'sort').update(body)
            return ok(updated, "板块已更新")
        } catch (error) {
            if (isUniqueConstraintViolation(error)) return fail(409, "板块名已存在")
            throw error
        }
    }, { adminOnly: true, params: ToId, body: CategoryUpdate, detail: { summary: "修改板块 (管理员)", tags: ["板块"] } })

    // 删除板块: 板块下帖子变为未分类
    .delete("/:id", async ({ params: { id } }) => {
        const target = await db.orm.public.Category.where({ id }).select('id').first()
        if (!target) return fail(404, "板块不存在")
        await db.orm.public.Category.where({ id }).delete()
        return okMsg("板块已删除")
    }, { adminOnly: true, params: ToId, detail: { summary: "删除板块 (管理员)", tags: ["板块"] } })
