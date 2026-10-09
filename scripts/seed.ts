/**
 * 灌入演示数据：板块、演示用户、帖子、评论。
 * 幂等：已存在的板块/用户名会跳过。
 * 用法: bun scripts/seed.ts
 */
import { db } from "../src/prisma/db"

const CATEGORIES = [
    { name: "综合讨论", description: "论坛大事小情，畅所欲言", sort: 0 },
    { name: "前端开发", description: "Vue / React / 工程化", sort: 1 },
    { name: "后端开发", description: "Node / Bun / 数据库 / 架构", sort: 2 },
    { name: "资源分享", description: "好工具、好文章、好项目", sort: 3 },
    { name: "闲聊灌水", description: "没有主题，只有快乐", sort: 99 }
]

const USERS = [
    { username: "demo", nickname: "演示用户", password: "demo12345", role: 'user' as const },
    { username: "xiaoming", nickname: "小明", password: "demo12345", role: 'user' as const }
]

const run = async () => {
    // 板块
    for (const category of CATEGORIES) {
        const exists = await db.orm.public.Category.where({ name: category.name }).select('id').first()
        if (exists) continue
        await db.orm.public.Category.select('id').create(category)
        console.log(`板块已创建: ${category.name}`)
    }
    const categories = await db.orm.public.Category.select('id', 'name').all()
    const categoryId = (name: string) => categories.find((c) => c.name === name)?.id

    // 用户
    for (const user of USERS) {
        const exists = await db.orm.public.User.where({ username: user.username }).select('id').first()
        if (exists) continue
        await db.orm.public.User.select('id').create({
            username: user.username,
            nickname: user.nickname,
            password: await Bun.password.hash(user.password),
            role: user.role
        })
        console.log(`用户已创建: ${user.username} (密码 ${user.password})`)
    }
    const demo = await db.orm.public.User.where({ username: "demo" }).select('id').first()
    const ming = await db.orm.public.User.where({ username: "xiaoming" }).select('id').first()
    if (!demo || !ming) throw new Error("演示用户缺失")

    // 帖子
    const posts = [
        {
            user_id: demo.id,
            title: "欢迎来到 FoxDo 论坛",
            context: "这是一个基于 Bun + Elysia + Prisma 8 + Vue 3 的全栈论坛演示项目。\n\n发帖需要管理员审核通过后才会公开展示，欢迎体验注册、发帖、评论、点赞等完整流程。",
            category_id: categoryId("综合讨论"),
            review_status: 'approved' as const
        },
        {
            user_id: ming.id,
            title: "Bun 为什么这么快？",
            context: "Bun 使用 Zig 实现了从零开始的运行时，HTTP、文件 IO、SQLite 全部内置。\n\n对比 Node.js，Bun 启动快 4 倍，Elysia 在其上跑出了非常夸张的 QPS。",
            category_id: categoryId("后端开发"),
            review_status: 'approved' as const
        },
        {
            user_id: demo.id,
            title: "Vue 3.5 组合式 API 实践小结",
            context: "ref / computed / watch 三板斧加上 composable 拆分逻辑，代码复用率比 mixin 时代好太多了。\n\n大家项目中还有什么好用的组合式函数推荐？",
            category_id: categoryId("前端开发"),
            review_status: 'approved' as const
        }
    ]
    for (const post of posts) {
        const exists = await db.orm.public.Post.where({ title: post.title }).select('id').first()
        if (exists) continue
        await db.orm.public.Post.select('id').create({ ...post, is_public: true })
        console.log(`帖子已创建: ${post.title}`)
    }
    const welcome = await db.orm.public.Post.where({ title: "欢迎来到 FoxDo 论坛" }).select('id').first()

    // 评论
    if (welcome && !(await db.orm.public.Comment.where({ post_id: welcome.id }).select('id').first())) {
        const c1 = await db.orm.public.Comment.select('id').create({
            post_id: welcome.id,
            user_id: ming.id,
            content: "支持，界面挺清爽的！"
        })
        await db.orm.public.Comment.select('id').create({
            post_id: welcome.id,
            user_id: demo.id,
            parent_id: c1.id,
            content: "感谢支持～有问题随时发帖"
        })
        console.log("演示评论已创建")
    }

    console.log("演示数据灌入完成")
}
try {
    await run()
} catch (error) {
    console.error("seed 失败:", error)
    process.exit(1)
}
process.exit(0)
