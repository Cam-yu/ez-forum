import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../prisma/db";
import { fail } from "../utils/response";

type JwtContext = { verify(token: string): Promise<{ sub: string } | false> };

// 按 token 解析当前账号；账号删除后旧 token 立即失效
const resolveUser = async (sub: string) => {
  const id = Number(sub);
  if (!Number.isInteger(id) || id < 1) return null;
  return db.orm.public.User.where({ id }).select("id", "role").first();
};

// 解析 Authorization 头并返回当前账号；未携带 / 伪造 / 过期 / 账号已删除 都返回 null
const parseAuth = async (jwt: JwtContext, authorization?: string) => {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = await jwt.verify(token);
  if (!payload) return null;
  return resolveUser(payload.sub);
};

// 登录守卫：需携带 Authorization: Bearer <token>
// 校验通过后向上下文注入 userId / userRole；未登录直接 401
export const auth = new Elysia({ name: "auth" })
    .use(jwt({
        name: "jwt",
        secret: process.env.JWT_SECRET!,
        exp: "7d", // token 有效期 7 天，过期后 verify 返回 false
        schema: t.Object({
            sub: t.String(),
            username: t.String()
        })
    }))
    .macro({
        // 强制登录 -> 401; 通过后注入 userId / userRole
        signIn(enabled: boolean) {
            if (!enabled) return {}
            return {
                async resolve({ jwt, headers: { authorization } }: { jwt: JwtContext; headers: { authorization?: string } }) {
                    const user = await parseAuth(jwt, authorization)
                    if (!user) return fail(401, "请先登录")
                    return { userId: user.id, userRole: user.role }
                }
            }
        },
        // 可选登录：有效 token 就注入 userId / userRole，否则注入 undefined（不拦截）
        signInOptional(enabled: boolean) {
            if (!enabled) return {}
            return {
                async resolve({ jwt, headers: { authorization } }: { jwt: JwtContext; headers: { authorization?: string } }) {
                    const user = await parseAuth(jwt, authorization)
                    return { userId: user?.id, userRole: user?.role }
                }
            }
        },
        // 管理员守卫：需登录且角色为 admin，否则 401 / 403
        adminOnly(enabled: boolean) {
            if (!enabled) return {}
            return {
                async resolve({ jwt, headers: { authorization } }: { jwt: JwtContext; headers: { authorization?: string } }) {
                    const user = await parseAuth(jwt, authorization)
                    if (!user) return fail(401, "请先登录")
                    if (user.role !== "admin") return fail(403, "需要管理员权限")
                    return { userId: user.id, userRole: user.role }
                }
            }
        }
    })
