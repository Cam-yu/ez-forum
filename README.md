# Elysia Forum

基于 **Bun + Elysia + Prisma ORM 8 + PostgreSQL + Vue 3** 的全栈论坛系统，支持板块、发帖审核流、两级评论、点赞、搜索与完整管理后台。深色/浅色双主题，界面风格参考 LinuxDo（Discourse）。

## 技术栈

| 端 | 技术 |
|---|---|
| 后端 | Bun · Elysia · @elysia/jwt · Prisma ORM 8 (contract 模式) · PostgreSQL 15+ |
| 前端 | Vue 3 · Vite · TypeScript · Pinia · Vue Router · Element Plus |

## 功能

- **用户**：注册（固定普通用户）、登录（JWT 7 天）、资料修改、注销（级联删除内容）、用户主页
- **帖子**：发布/编辑/删除（仅作者）、板块归类、审核流（发布 → 待审核 → 管理员通过/驳回，编辑后重新审核）、浏览量、标题搜索、最新/最热排序、分页
- **评论**：两级结构（评论 + 回复），本人或管理员可删，帖子评论计数自动校准
- **点赞**：每用户每帖一次，切换式点赞，计数防并发漂移
- **管理后台**：数据概览、帖子审核与搜索、评论管理、用户角色管理与删除、板块 CRUD

## 快速开始

```bash
# 0. 配置环境变量（参考 .env.example，填入数据库连接与 JWT 密钥）
cp .env.example .env

# 1. 安装依赖（后端 + 前端）
bun install
cd web && bun install && cd ..

# 2. 初始化数据库
bun prisma db init        # 首次建表；之后改了 contract.prisma 用下面两条
bun run contract:emit     # 修改契约后重新生成类型
bun run db:update         # 将契约变更应用到数据库

# 3. 灌入演示数据（板块 / 用户 / 帖子 / 评论）
bun run seed

# 4. 创建管理员（注册接口只产普通用户，管理员只能这样建）
bun run admin:create <用户名> <密码> [昵称]

# 5. 启动
bun run dev               # 后端 http://localhost:3000
cd web && bun run dev     # 前端 http://localhost:5173（/api 代理到后端）
```

演示账号（seed 创建）：`demo / demo12345678`、`xiaoming / demo12345678`。

## 项目结构

```
├── src/                      # 后端
│   ├── index.ts              # 入口：环境校验 / cors / openapi / 统一错误处理
│   ├── router/               # user / post / comment / category / admin 路由
│   ├── plugins/auth.ts       # JWT 插件：signIn / signInOptional / adminOnly 宏
│   ├── dto/                  # TypeBox 请求校验 schema
│   ├── prisma/               # contract.prisma、db 客户端、原生 SQL 封装
│   └── utils/                # 统一响应、内存限流
├── scripts/                  # 运维脚本：createAdmin / seed / apiTest
├── migrations/               # Prisma 迁移快照
└── web/                      # 前端 (Vue3 + Vite)
    └── src/
        ├── api/              # 请求封装 + 按模块的接口定义与类型
        ├── stores/           # Pinia：登录态 / 主题
        ├── router/           # 路由与守卫（登录 / 管理员）
        ├── layouts/          # 默认布局 / 管理后台布局
        ├── components/       # PostCard / CommentTree / Avatar / CategoryBadge
        ├── views/            # 页面（views/admin/ 为后台页面）
        └── utils/            # 时间格式化、色板
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `bun run dev` | 启动后端（watch 模式） |
| `cd web && bun run dev` | 启动前端开发服务器 |
| `cd web && bun run build` | 前端类型检查 + 生产构建 |
| `bun run contract:emit` | 修改 contract.prisma 后重新生成契约 |
| `bun run db:update` | 将契约变更应用到数据库 |
| `bun run seed` | 灌入演示数据（幂等，可重复执行） |
| `bun run admin:create <用户名> <密码> [昵称]` | 创建/提升管理员 |
| `bun scripts/apiTest.ts <管理员用户名> <管理员密码>` | 后端 API 冒烟测试（58 项断言） |

## API 一览

前缀 `/api`，OpenAPI 文档：<http://localhost:3000/openapi>

| 模块 | 接口 |
|---|---|
| 用户 | `POST /user` 注册 · `POST /user/login` 登录 · `GET /user/me` · `GET /user/:id` 主页 · `PATCH /user/:id` · `DELETE /user/:id` |
| 帖子 | `GET /post` 公开列表(搜索/板块/排序) · `GET /post/mine` · `GET /post/:id` 详情 · `POST /post` · `PATCH /post/:id` · `DELETE /post/:id` · `POST /post/:id/like` |
| 评论 | `GET /comment/post/:id` · `POST /comment/:id` · `DELETE /comment/:id` |
| 板块 | `GET /category` · `POST /category` · `PATCH /category/:id` · `DELETE /category/:id`（管理员） |
| 管理 | `GET /admin/stats` · `GET /admin/user` · `PATCH /admin/user/:id/role` · `DELETE /admin/user/:id` · `GET /admin/post` · `PATCH /admin/post/:id/review` · `DELETE /admin/post/:id` · `GET /admin/comment` · `DELETE /admin/comment/:id` |

统一响应：成功 `{msg, data}`，分页多 `page/pageSize/total`，失败 `{msg}` + 对应 HTTP 状态码。

## 安全措施

- 密码使用 `Bun.password`（Argon2id）哈希；登录失败统一文案 + 假哈希运算抹平时间差，防用户名枚举
- JWT 签发 7 天过期；每次请求回库校验账号存在性，注销后旧 token 立即失效
- 登录 / 注册接口基于 IP 的滑动窗口限流（内存版，多实例部署需换 Redis）
- 全部 SQL 经 ORM 参数化；原生 SQL 用标签模板传参，LIKE 关键词转义 `% _`
- TypeBox 严格校验所有输入（长度上限、类型、枚举），请求体上限 1MB
- 权限宏守卫（登录 / 可选登录 / 管理员），资源操作校验归属（仅本人 / 作者 / 管理员）
- 管理员不可降级 / 删除自己；前端纯文本渲染（`white-space: pre-wrap`），无 `v-html`，天然防 XSS
- 启动时强校验 `JWT_SECRET`（≥32 字符）等环境变量

## 部署

1. 配置生产环境 `DATABASE_URL` 与强随机 `JWT_SECRET`（`openssl rand -hex 32`），建议设置 `CORS_ORIGIN` 为站点自身域名
2. 后端：`bun prisma db update` 同步数据库后 `bun run src/index.ts`（可配合 systemd / pm2 / Docker 守护）
3. 前端：`cd web && bun run build`，将 `web/dist` 交给 Nginx / Caddy 托管，并把 `/api` 反向代理到后端 3000 端口

## 备注

- Prisma 8 RC 的 contract 查询构建器仅支持等值条件，模糊搜索 / 联表 / 原子自增通过 `src/prisma/raw.ts` 的原生 SQL 封装实现，全部参数化
- 限流为单机内存实现；多实例部署请将 `src/utils/rateLimit.ts` 替换为 Redis 实现
