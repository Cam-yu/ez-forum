/**
 * 创建/提升管理员账号
 * 用法: bun scripts/createAdmin.ts <username> <password> [nickname]
 */
import { isUniqueConstraintViolation } from "@prisma/orm-family-sql/errors"
import { db } from "../src/prisma/db"

const [username, password, nickname] = process.argv.slice(2)

if (!username || !password) {
    console.error("用法: bun scripts/createAdmin.ts <username> <password> [nickname]")
    process.exit(1)
}
if (!/^[a-zA-Z0-9_]{5,20}$/.test(username)) {
    console.error("用户名需 5-20 位字母、数字或下划线")
    process.exit(1)
}
if (password.length < 8 || password.length > 72) {
    console.error("密码需 8-72 位")
    process.exit(1)
}

const hashed = await Bun.password.hash(password)
const existing = await db.orm.public.User.where({ username }).select('id', 'role').first()

try {
    if (existing) {
        if (existing.role === 'admin') {
            console.log(`用户 ${username} 已经是管理员`)
        } else {
            await db.orm.public.User.where({ id: existing.id }).update({ role: 'admin' })
            console.log(`已将用户 ${username} (id=${existing.id}) 提升为管理员`)
        }
    } else {
        const created = await db.orm.public.User.select('id', 'username', 'role').create({
            username,
            password: hashed,
            nickname: nickname || username,
            role: 'admin'
        })
        console.log(`管理员创建成功: id=${created.id} username=${created.username}`)
    }
} catch (error) {
    if (isUniqueConstraintViolation(error)) {
        console.error("用户名已存在")
        process.exit(1)
    }
    throw error
}
process.exit(0)
