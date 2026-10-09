import { Elysia } from "elysia"
import cors from "@elysia/cors"
import openapi from "@elysia/openapi"
import { router } from "./router"
import { fail } from "./utils/response"

// 启动前校验关键环境变量，避免带病运行
const envChecks: Array<[string, number]> = [
    ["DATABASE_URL", 1],
    ["JWT_SECRET", 32] // 签名密钥过短会削弱 token 防伪能力
]
for (const [name, minLen] of envChecks) {
    const value = process.env[name]
    if (!value || value.length < minLen) {
        console.error(`环境变量 ${name} 未配置${minLen > 1 ? `（至少 ${minLen} 字符）` : ""}，请检查 .env`)
        process.exit(1)
    }
}

const MAX_BODY_BYTES = 1024 * 1024 // 请求体上限 1MB，防止超大 payload

const app = new Elysia()
    .use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }))
    .use(openapi())
    .onRequest(({ request, set }) => {
        set.headers["x-content-type-options"] = "nosniff"
        const contentLength = Number(request.headers.get("content-length") ?? 0)
        if (contentLength > MAX_BODY_BYTES) return fail(413, "请求体过大")
    })
    // 统一错误处理
    .onError(({ error, code }) => {
        if (code === "VALIDATION") {
            const msg = (error as { customError?: unknown }).customError
            return fail(422, typeof msg === "string" ? msg : "参数校验失败")
        }
        if (code === "PARSE") return fail(422, "请求体不是合法的 JSON")
        if (code === "NOT_FOUND") return fail(404, "接口不存在")
        console.error(`[${code}]`, error)
        return fail(500, "服务器内部错误")
    })
    .use(router)

app.listen(3000)

export type App = typeof app

console.log(`🦊 FoxDo is running at ${app.server?.hostname}:${app.server?.port}`)
