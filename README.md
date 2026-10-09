<div align="center">

# 🦊 EZ Forum

**基于 Bun + Elysia + Prisma ORM 8 + Vue 3 的全栈论坛系统**

`Bun` · `Elysia` · `Prisma ORM 8` · `PostgreSQL 15+` · `Vue 3` · `Element Plus` · `TypeScript`

深色 / 浅色双主题 · 发帖审核流 · 两级评论 · 点赞 · 板块 · 管理后台

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [项目结构](#-项目结构) · [API 一览](#-api-一览) · [部署](#-部署)

</div>

---

## 📸 项目预览

**首页（深色 / 浅色主题一键切换）**

| 深色主题 | 浅色主题 |
|---|---|
| ![首页 深色](docs/screenshots/home-dark.png) | ![首页 浅色](docs/screenshots/home-light.png) |

**帖子详情 / 发布帖子**

| 帖子详情（评论 + 点赞） | 发布帖子 |
|---|---|
| ![帖子详情](docs/screenshots/post-detail.png) | ![发布帖子](docs/screenshots/post-edit.png) |

**管理后台**

| 数据概览 + 待审快捷处理 | 帖子审核管理 |
|---|---|
| ![管理后台概览](docs/screenshots/admin-dashboard.png) | ![帖子管理](docs/screenshots/admin-posts.png) |

## ✨ 功能特性

**用户系统**
- 注册 / 登录，JWT 签发 7 天有效期，注销后旧 token 立即失效
- 个人资料修改、账号注销（帖子和评论级联删除）
- 用户主页：展示资料与已过审的公开帖子

**帖子与审核流**
- 发布 / 编辑 / 删除（归属校验，仅作者可操作）
- 完整审核流：发布 → **待审核** → 管理员通过 / 驳回；编辑已通过的帖子会重新进入审核
- 板块归类、标题关键词搜索、**最新 / 最热**双排序、分页
- 浏览量自动累计，点赞 / 取消点赞（每用户每帖一次，计数防并发漂移）

**评论**
- 两级结构：一级评论 + 回复，扁平存储、前端组装
- 本人或管理员可删除，一级评论删除时回复级联清理
- 帖子评论计数删除后自动校准

**管理后台**
- 数据概览：用户 / 帖子 / 评论 / 待审核数量统计 + 待审帖子快捷通过 / 驳回
- 帖子管理：按审核状态筛选、标题搜索、审核与删除
- 评论管理、用户管理（角色切换 / 删除，防止自删自降）、板块 CRUD

**界面**
- 深色 / 浅色主题一键切换（跟随 Element Plus 暗色体系，偏好本地持久化）
- LinuxDo（Discourse）风格：左侧板块导航、话题列表、彩色板块徽章、直角锐利造型
- 1920×1080 标准分辨率优化，窄屏自动降级为单列布局

## 🛠 技术栈

| 端 | 技术 |
|---|---|
| 后端 | [Bun](https://bun.sh) · [Elysia](https://elysiajs.com) · @elysia/jwt · [Prisma ORM 8](https://www.prisma.io) (contract 模式) · PostgreSQL 15+ |
| 前端 | Vue 3 · Vite · TypeScript · Pinia · Vue Router · Element Plus |
| 测试 | 自研 API 冒烟测试脚本（58 项断言，覆盖全部接口与权限规则） |

## 🚀 快速开始

> 前置要求：[Bun](https://bun.sh) 1.1+、PostgreSQL 15+

```bash
# 0. 配置环境变量（填入数据库连接串与 JWT 密钥）
cp .env.example .env

# 1. 安装依赖（后端 + 前端）
bun install
cd web && bun install && cd ..

# 2. 初始化数据库
bun prisma db init        # 首次建表；之后修改契约用下面两条
bun run contract:emit     # 修改 contract.prisma 后重新生成类型
bun run db:update         # 将契约变更应用到数据库

# 3. 灌入演示数据（板块 / 用户 / 帖子 / 评论，幂等可重复执行）
bun run seed

# 4. 创建管理员（注册接口固定产生普通用户，管理员只能这样建）
bun run admin:create <用户名> <密码> [昵称]

# 5. 启动
bun run dev               # 后端 http://localhost:3000
cd web && bun run dev     # 前端 http://localhost:5173（/api 代理到后端）
```

演示账号（seed 创建）：`demo / demo12345678`、`xiaoming / demo12345678`。

## 🗂 项目结构

```
├── src/                      # 后端
│   ├── index.ts              # 入口：环境校验 / cors / openapi / 统一错误处理
│   ├── router/               # user / post / comment / category / admin 路由
│   ├── plugins/auth.ts       # JWT 插件：signIn / signInOptional / adminOnly 权限宏
│   ├── dto/                  # TypeBox 请求校验 schema
│   ├── prisma/               # contract.prisma、db 客户端、原生 SQL 封装
│   └── utils/                # 统一响应结构、内存限流
├── scripts/                  # 运维脚本：createAdmin / seed / apiTest
├── migrations/               # Prisma 迁移快照
├── docs/screenshots/         # README 截图
└── web/                      # 前端 (Vue3 + Vite)
    └── src/
        ├── api/              # 请求封装 + 按模块的接口定义与类型
        ├── stores/           # Pinia：登录态 / 主题偏好
        ├── router/           # 路由与守卫（登录 / 管理员）
        ├── layouts/          # 默认布局 / 管理后台布局
        ├── components/       # PostCard / CommentTree / Avatar / CategoryBadge
        ├── views/            # 页面（views/admin/ 为后台页面）
        └── utils/            # 时间格式化、色板
```

## 📸 常用命令

| 命令 | 说明 |
|---|---|
| `bun run dev` | 启动后端（watch 模式） |
| `cd web && bun run dev` | 启动前端开发服务器 |
| `cd web && bun run build` | 前端类型检查 + 生产构建 |
| `bun run contract:emit` | 修改 contract.prisma 后重新生成契约 |
| `bun run db:update` | 将契约变更应用到数据库 |
| `bun run seed` | 灌入演示数据 |
| `bun run admin:create <用户名> <密码> [昵称]` | 创建 / 提升管理员 |
| `bun scripts/apiTest.ts <管理员用户名> <管理员密码>` | API 冒烟测试（58 项断言） |

## 🔌 API 一览

前缀 `/api`，内置 OpenAPI 文档：<http://localhost:3000/openapi>

| 模块 | 接口 |
|---|---|
| 用户 | `POST /user` 注册 · `POST /user/login` 登录 · `GET /user/me` · `GET /user/:id` 主页 · `PATCH /user/:id` 修改资料 · `DELETE /user/:id` 注销 |
| 帖子 | `GET /post` 公开列表(搜索/板块/排序) · `GET /post/mine` 我的 · `GET /post/:id` 详情 · `POST /post` 发布 · `PATCH /post/:id` 修改 · `DELETE /post/:id` 删除 · `POST /post/:id/like` 点赞 |
| 评论 | `GET /comment/post/:id` 列表 · `POST /comment/:id` 发表 · `DELETE /comment/:id` 删除 |
| 板块 | `GET /category` 列表 · `POST /category` · `PATCH /category/:id` · `DELETE /category/:id`（管理员） |
| 管理 | `GET /admin/stats` 概览 · 用户管理 · 帖子审核 · 评论管理（均需管理员权限） |

统一响应：成功 `{msg, data}`，分页多 `page / pageSize / total`，失败 `{msg}` + 对应 HTTP 状态码。

## 🔒 安全措施

- **密码存储**：`Bun.password`（Argon2id）哈希；登录失败统一文案 + 假哈希运算抹平响应时间差，防用户名枚举
- **认证**：JWT 7 天过期；每次请求回库校验账号存在性，注销后旧 token 立即失效
- **限流**：登录 / 注册接口基于 IP 的滑动窗口限流（内存版，多实例部署需换 Redis）
- **注入防护**：全部 SQL 经 ORM 参数化；原生 SQL 用标签模板传参，LIKE 关键词转义 `% _`
- **输入校验**：TypeBox 严格校验所有输入（类型、长度上限、枚举），请求体上限 1MB
- **权限控制**：权限宏守卫（登录 / 可选登录 / 管理员），资源操作逐一校验归属；管理员不可降级 / 删除自己
- **XSS 防护**：前端纯文本渲染（`white-space: pre-wrap`），全程无 `v-html`
- **启动自检**：强制校验 `JWT_SECRET`（≥32 字符）等关键环境变量

## 📦 部署

1. 配置生产环境 `DATABASE_URL` 与强随机 `JWT_SECRET`（`openssl rand -hex 32`），建议将 `CORS_ORIGIN` 设为站点自身域名
2. 后端：`bun prisma db update` 同步数据库，`bun run src/index.ts` 启动（可配合 systemd / pm2 / Docker 守护）
3. 前端：`cd web && bun run build`，将 `web/dist` 交给 Nginx / Caddy 托管，`/api` 反向代理到后端 3000 端口

## 🧪 测试

```bash
# 后端 API 冒烟测试：58 项断言，覆盖注册登录、审核流、权限、级联删除、限流等
bun scripts/apiTest.ts <管理员用户名> <管理员密码>

# 前端类型检查 + 生产构建
cd web && bun run build
```

## ❓ 备注

- **Prisma 8 RC**：contract 查询构建器目前仅支持等值条件，模糊搜索 / 联表 / 原子自增通过 `src/prisma/raw.ts` 的原生 SQL 封装实现（标签模板全参数化），正式版发布后可平滑替换
- **限流**：单机内存实现；多实例部署请将 `src/utils/rateLimit.ts` 替换为 Redis 实现
- **视图渲染**：帖子内容为纯文本（保留换行），如需 Markdown 渲染建议在前端引入 markdown-it 并开启 sanitize

---

<div align="center">
</div>
