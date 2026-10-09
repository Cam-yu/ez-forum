import { t } from "elysia"

// 板块字段通用规则
const nameSchema = t.String({ minLength: 1, maxLength: 20, error: "板块名需 1-20 字" })
const descSchema = t.String({ maxLength: 100, error: "板块简介最长 100 字" })
const sortSchema = t.Integer({ minimum: 0, error: "排序值需为不小于 0 的整数" })

export const CategoryCreate = t.Object({
    name: nameSchema,
    description: t.Optional(descSchema),
    sort: t.Optional(sortSchema)
})

export const CategoryUpdate = t.Object({
    name: t.Optional(nameSchema),
    description: t.Optional(descSchema),
    sort: t.Optional(sortSchema)
})
