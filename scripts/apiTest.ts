/**
 * API 冒烟测试：直接请求本机开发服务器，覆盖核心接口与权限规则。
 * 前置：服务已启动 (bun run dev)、已执行 seed、已创建管理员 admin/管理员密码。
 * 用法: bun scripts/apiTest.ts <adminUsername> <adminPassword>
 */
const BASE = "http://localhost:3000/api"

let passed = 0
let failed = 0
const fail = (name: string, detail: unknown) => {
    failed++
    console.error(`✗ ${name}`, detail)
}
const ok = (name: string) => {
    passed++
    console.log(`✓ ${name}`)
}

const expect = (name: string, cond: boolean, detail: unknown = "") => {
    cond ? ok(name) : fail(name, detail)
}

async function api(
    method: string,
    path: string,
    opts: { token?: string; body?: unknown } = {}
) {
    const res = await fetch(BASE + path, {
        method,
        headers: {
            "content-type": "application/json",
            ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {})
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined
    })
    let json: any = null
    try { json = await res.json() } catch { /* 忽略非JSON */ }
    return { status: res.status, json }
}

const unique = Date.now().toString(36)
const userA = { username: `toma_${unique}`, password: "password123", nickname: "测试甲" }
const userB = { username: `tomb_${unique}`, password: "password123", nickname: "测试乙" }

const run = async () => {
    const [adminName, adminPass] = process.argv.slice(2)
    if (!adminName || !adminPass) {
        console.error("用法: bun scripts/apiTest.ts <adminUsername> <adminPassword>")
        process.exit(1)
    }

    // ===== 公开接口 =====
    let r = await api("GET", "/post")
    expect("公开帖子列表 200", r.status === 200 && Array.isArray(r.json.data), r)
    const seededTotal = r.json.total

    r = await api("GET", "/post?keyword=Bun")
    expect("关键词搜索", r.status === 200 && r.json.data.every((p: any) => p.title.includes("Bun")), r.json)

    r = await api("GET", "/post?category_id=2")
    expect("板块过滤", r.status === 200 && r.json.data.every((p: any) => p.category_id === 2), r.json)

    r = await api("GET", "/post?sort=hot&pageSize=100")
    expect("最热排序 200", r.status === 200, r.status)

    r = await api("GET", "/post?pageSize=999")
    expect("pageSize 超上限 422", r.status === 422, r)

    r = await api("GET", "/category")
    expect("板块列表 200", r.status === 200 && r.json.data.length >= 5, r.json)
    const categoryId = r.json.data[0].id

    // ===== 注册 / 登录 =====
    r = await api("POST", "/user", { body: userA })
    expect("注册成功", r.status === 200 && r.json.data.role === undefined, r.json)

    r = await api("POST", "/user", { body: userA })
    expect("重复注册 409", r.status === 409, r)

    r = await api("POST", "/user", { body: { ...userB, password: "123" } })
    expect("弱密码 422", r.status === 422, r)

    r = await api("POST", "/user", { body: { ...userB, username: "bad name!" } })
    expect("非法用户名 422", r.status === 422, r)

    r = await api("POST", "/user", { body: userB })
    expect("乙注册成功", r.status === 200, r.json)

    r = await api("POST", "/user/login", { body: { username: userA.username, password: "wrong_password" } })
    expect("错误密码 401", r.status === 401, r)

    r = await api("POST", "/user/login", { body: { username: userA.username, password: userA.password } })
    expect("登录成功", r.status === 200 && !!r.json.data.token, r.json)
    const tokenA: string = r.json.data.token

    r = await api("POST", "/user/login", { body: { username: userB.username, password: userB.password } })
    const tokenB: string = r.json.data?.token
    expect("乙登录成功", r.status === 200 && !!tokenB, r.json)

    r = await api("POST", "/user/login", { body: { username: adminName, password: adminPass } })
    const adminToken: string = r.json.data?.token
    expect("管理员登录成功", r.status === 200 && r.json.data?.role === "admin", r.json?.data?.role)

    // ===== 登录态 =====
    r = await api("GET", "/user/me", { token: tokenA })
    expect("me 返回本人", r.status === 200 && r.json.data.username === userA.username, r.json)

    r = await api("GET", "/user/me")
    expect("me 未登录 401", r.status === 401, r)

    r = await api("GET", "/user/me", { token: "fake.token.value" })
    expect("伪造 token 401", r.status === 401, r)

    // ===== 发帖 / 审核流 =====
    r = await api("POST", "/post", { token: tokenA, body: { title: `测试帖子_${unique}`, context: "测试内容", category_id: categoryId } })
    expect("发帖成功(待审核)", r.status === 200 && r.json.data.review_status === "pending", r.json)
    const postId = r.json.data.id

    r = await api("POST", "/post", { token: tokenA, body: { title: "", context: "x" } })
    expect("空标题 422", r.status === 422, r)

    r = await api("GET", `/post/${postId}`)
    expect("未过审帖子对游客不可见", r.status === 404, r.status)

    r = await api("GET", `/post/${postId}`, { token: tokenB })
    expect("未过审帖子对他人不可见", r.status === 404, r.status)

    r = await api("GET", `/post/${postId}`, { token: tokenA })
    expect("未过审帖子对作者可见", r.status === 200 && r.json.data.context === "测试内容", r.json)

    r = await api("PATCH", `/post/${postId}`, { token: tokenB, body: { title: "抢", context: "抢" } })
    expect("他人修改 403", r.status === 403, r.status)

    // 管理员审核
    r = await api("GET", "/admin/post?status=pending", { token: adminToken })
    expect("管理端待审列表", r.status === 200 && r.json.data.some((p: any) => p.id === postId), r.json?.data?.length)

    r = await api("GET", "/admin/post?status=pending", { token: tokenA })
    expect("普通用户访问管理端 403", r.status === 403, r.status)

    r = await api("PATCH", `/admin/post/${postId}/review`, { token: adminToken, body: { status: "approved" } })
    expect("审核通过", r.status === 200 && r.json.data.review_status === "approved", r.json)

    r = await api("GET", `/post/${postId}`)
    expect("过审后游客可见", r.status === 200 && r.json.data.view_count === 1, r.json?.data?.view_count)

    // 作者修改后重新进入待审核
    r = await api("PATCH", `/post/${postId}`, { token: tokenA, body: { title: `测试帖子改_${unique}`, context: "内容2", category_id: categoryId } })
    expect("作者修改成功", r.status === 200 && r.json.data.review_status === "pending", r.json)
    await api("PATCH", `/admin/post/${postId}/review`, { token: adminToken, body: { status: "approved" } })

    // ===== 点赞 =====
    r = await api("POST", `/post/${postId}/like`, { token: tokenB })
    expect("点赞成功", r.status === 200 && r.json.data.liked === true && r.json.data.like_count === 1, r.json)

    r = await api("POST", `/post/${postId}/like`, { token: tokenB })
    expect("取消点赞", r.status === 200 && r.json.data.liked === false && r.json.data.like_count === 0, r.json)

    r = await api("POST", `/post/${postId}/like`, { token: tokenB })
    expect("再次点赞", r.status === 200 && r.json.data.like_count === 1, r.json)

    // ===== 评论 =====
    r = await api("POST", `/comment/${postId}`, { body: { content: "游客评论" } })
    expect("未登录评论 401", r.status === 401, r.status)

    r = await api("POST", `/comment/${postId}`, { token: tokenB, body: { content: "前排支持" } })
    expect("评论成功", r.status === 200, r.json)
    const commentId = r.json.data.id

    r = await api("POST", `/comment/${postId}`, { token: tokenA, body: { content: "回复甲", parent_id: commentId } })
    expect("回复成功", r.status === 200 && r.json.data.parent_id === commentId, r.json)
    const replyId = r.json.data.id

    r = await api("POST", `/comment/${postId}`, { token: tokenA, body: { content: "回复的回复", parent_id: replyId } })
    expect("不支持三级回复 404", r.status === 404, r.status)

    r = await api("GET", `/comment/post/${postId}`)
    expect("评论列表(游客)", r.status === 200 && r.json.data.total === 2 && r.json.data.comments.every((c: any) => !c.can_delete), r.json)

    r = await api("GET", `/comment/post/${postId}`, { token: tokenB })
    expect("评论列表(乙可删自己的)", r.status === 200 && r.json.data.comments.filter((c: any) => c.can_delete).length === 1, r.json)

    r = await api("GET", `/post/${postId}`)
    expect("评论计数同步", r.json.data.comment_count === 2, r.json?.data?.comment_count)

    r = await api("DELETE", `/comment/${commentId}`, { token: tokenA })
    expect("删他人评论 403", r.status === 403, r.status)

    r = await api("DELETE", `/comment/${replyId}`, { token: tokenA })
    expect("删自己的回复", r.status === 200, r.status)

    r = await api("DELETE", `/comment/${commentId}`, { token: adminToken })
    expect("管理员删任意评论(级联回复)", r.status === 200, r.status)

    r = await api("GET", `/post/${postId}`)
    expect("删除后评论计数归零", r.json.data.comment_count === 0, r.json?.data?.comment_count)

    // ===== 用户主页 / 资料 =====
    r = await api("GET", "/user/me", { token: tokenA })
    const uidA = r.json.data.id

    r = await api("GET", `/user/${uidA}`)
    expect("用户主页", r.status === 200 && r.json.data.posts.length === 1 && r.json.data.total === 1, r.json?.data?.total)

    r = await api("PATCH", `/user/${uidA}`, { token: tokenB, body: { nickname: "被改名" } })
    expect("改他人资料 403", r.status === 403, r.status)

    r = await api("PATCH", `/user/${uidA}`, { token: tokenA, body: { nickname: "测试甲改" } })
    expect("改自己资料", r.status === 200 && r.json.data.nickname === "测试甲改", r.json)

    // ===== 管理员功能 =====
    r = await api("GET", "/admin/stats", { token: adminToken })
    expect("概览统计", r.status === 200 && r.json.data.user_count >= 3 && r.json.data.post_count >= seededTotal, r.json)

    r = await api("PATCH", `/admin/user/${uidA}/role`, { token: adminToken, body: { role: "admin" } })
    expect("提升角色", r.status === 200 && r.json.data.role === "admin", r.json)

    const adminMe = await api("GET", "/user/me", { token: adminToken })
    r = await api("PATCH", `/admin/user/${adminMe.json.data.id}/role`, { token: adminToken, body: { role: "user" } })
    expect("不能改自己角色 400", r.status === 400, r.status)

    r = await api("PATCH", `/admin/user/${uidA}/role`, { token: adminToken, body: { role: "user" } })
    expect("降回普通用户", r.status === 200 && r.json.data.role === "user", r.json)

    r = await api("GET", "/admin/comment", { token: adminToken })
    expect("管理端评论列表", r.status === 200 && Array.isArray(r.json.data), r.status)

    r = await api("GET", "/admin/user", { token: tokenB })
    expect("管理端用户列表需管理员 403", r.status === 403, r.status)

    // ===== 注销清理 =====
    r = await api("DELETE", `/post/${postId}`, { token: tokenB })
    expect("删他人帖子 403", r.status === 403, r.status)

    r = await api("DELETE", `/user/${uidA}`, { token: tokenB })
    expect("删他人账号 403", r.status === 403, r.status)

    // 甲发一个新帖子再注销，验证级联删除
    r = await api("POST", "/post", { token: tokenA, body: { title: `注销前帖子_${unique}`, context: "x" } })
    const postA2 = r.json.data.id
    r = await api("DELETE", `/user/${uidA}`, { token: tokenA })
    expect("注销账号", r.status === 200, r.status)

    r = await api("GET", "/user/me", { token: tokenA })
    expect("注销后旧token失效 401", r.status === 401, r.status)

    r = await api("GET", `/post/${postA2}`, { token: adminToken })
    expect("注销后其帖子级联删除", r.status === 404, r.status)

    // ===== 限流 =====
    let limited = false
    for (let i = 0; i < 12; i++) {
        const lr = await api("POST", "/user/login", { body: { username: `brute_${unique}`, password: "wrongpass123" } })
        if (lr.status === 429) { limited = true; break }
    }
    expect("登录限流 429", limited)

    console.log(`\n结果: ${passed} 通过, ${failed} 失败`)
    process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
    console.error("测试执行异常:", e)
    process.exit(1)
})
