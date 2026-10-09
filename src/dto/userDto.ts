import { t } from "elysia"
import { nicknameSchema, passwordSchema, usernameSchema } from "./utils"

export const UserCreate = t.Object({
    nickname: nicknameSchema,
    username: usernameSchema,
    password: passwordSchema
})

export const UserUpdate = t.Object({
    nickname: t.Optional(nicknameSchema),
    username: t.Optional(usernameSchema)
})

export const LoginInput = t.Object({
    username: usernameSchema,
    password: passwordSchema
})

export const RoleInput = t.Object({
    role: t.Union([t.Literal("user"), t.Literal("admin")], { error: "role 只能是 user 或 admin" })
})
