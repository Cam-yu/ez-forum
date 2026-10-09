<div align="center">

# ⚡ EZ Forum

**Bun + Elysia + Prisma ORM 8 + Vue 3 全栈论坛系统**

> 目前处于快速开发阶段，软件和接口可能不稳定，欢迎反馈。

发帖有审核 · 评论有两级 · 点赞有账本 · 权限有守卫 · 深浅双主题

[快速开始](#-快速开始) · [功能总览](#-功能总览) · [API 一览](#-api-一览) · [安全措施](#-安全措施) · [部署](#-部署)

![Bun](https://img.shields.io/badge/Bun-1.3-f9f1e1?logo=bun&logoColor=black)
![Elysia](https://img.shields.io/badge/Elysia-latest-c7005d)
![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-8_RC-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue_3-5.x-4FC08D?logo=vuedotjs&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element_Plus-2.x-409EFF?logo=element&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)

<img src="./docs/screenshots/home-dark.png" width="100%" alt="EZ Forum 首页：左侧板块导航与热门话题，右侧话题列表，深色主题" />

</div>

---

## 为什么是 EZ Forum

每个混过社区的人，多少都想拥有一个自己的论坛——但大多数人的论坛死在了第零步：不是死于没想法，是死于工程量。

- **平台的枷锁**：SaaS 社区注册就能用，但审核规则、数据导出、界面定制全在别人手里，说关就关。
- **重型的门槛**：传统开源论坛功能是全，但 Ruby / PHP 环境加内存占用，个人玩家直接劝退；插件生态像拆盲盒。
- **散装的安全**：很多练手项目密码明文存储、SQL 拼接字符串、接口裸奔——论坛恰恰是收集用户数据的重灾区。
- **缺失的链路**：能发帖不能审，能评论不能管，界面是十年前的样式，功能像样点就得自己缝。

EZ Forum 把论坛当作一个工程问题来解决：发帖默认进入审核流，管理员一键放行；评论两级、点赞有账本，计数删帖后自动对账；权限声明成宏，校验交给 TypeBox，接口自带 OpenAPI 文档。前后端全 TypeScript strict，你的数据在你自己的 PostgreSQL 里，两条命令起服务，随时带走。

| 能力 | SaaS 社区平台 | 传统开源论坛 | 教程级项目 | EZ Forum |
| --- | --- | --- | --- | --- |
| 部署门槛 | 注册即用，受制于人 | 环境复杂，资源占用高 | 一键跑通 | ✅ Bun + PostgreSQL，两条命令 |
| 内容审核 | 黑盒规则，申诉无门 | 依赖插件 | ❌ 无 | ✅ 内置审核流（待审 / 通过 / 驳回） |
| 管理后台 | 功能封闭 | 插件拼装 | ❌ 无 | ✅ 概览 / 帖子 / 评论 / 用户 / 板块 |
| 类型安全 | 封闭 | 脚本语言混杂 | 弱类型 | ✅ 前后端全量 TypeScript strict |
| 数据归属 | 平台所有 | 自持 | 自持 | ✅ 自持 PostgreSQL，随时迁移 |
| 接口文档 | ❌ | 部分 | ❌ | ✅ 内置 OpenAPI |

## ✨ 功能总览

### 📝 帖子与审核流：内容有工作流

发帖默认进入**待审核**状态，管理员通过后才公开展示；作者编辑已通过的帖子会自动回炉重审——审核不是一句 if，是一条完整的状态机。

- 板块归类、标题关键词搜索、**最新 / 最热**双排序、分页一应俱全
- 浏览量自动累计，仅对公开且过审的帖子生效
- 归属校验贯穿始终：帖子只有作者能改能删，管理员不能越权替作者维护

<img src="./docs/screenshots/post-edit.png" width="100%" alt="发布帖子：板块选择、标题与纯文本内容编辑器、审核提示" />

### 💬 评论与点赞：互动有账本

评论采用两级结构（一级评论 + 回复），扁平存储、前端组装，删除一级评论时回复级联清理，帖子的评论计数自动对账。点赞每用户每帖一次、切换式，计数用实际行数校准，并发下不漂移。

<img src="./docs/screenshots/post-detail.png" width="100%" alt="帖子详情：正文、点赞按钮、两级评论列表" />

### 🛡 管理后台：治理有抓手

概览统计（用户 / 帖子 / 评论 / 待审核数）加待审帖子快捷处理；帖子按审核状态筛选、关键词搜索、一键通过 / 驳回；用户角色切换与删除（管理员不可自删自降）；板块 CRUD 与评论治理。

<img src="./docs/screenshots/admin-dashboard.png" width="100%" alt="管理后台概览：四张统计卡片与待审核帖子快捷处理列表" />

<img src="./docs/screenshots/admin-posts.png" width="100%" alt="帖子管理：状态筛选、搜索、数据统计与直角胶囊操作按钮" />

### 👥 用户系统：权限有守卫

注册固定产生普通用户，管理员只能通过脚本创建——权限从入口就收口。JWT 签发 7 天有效期，每次请求回库校验账号存在性，注销后旧 token 立即失效。资料修改、账号注销（帖子和评论级联删除）、公开的用户主页一应俱全。

### 🎨 还有更多

- 🌗 **深色 / 浅色双主题**：一键切换、本地持久化，Element Plus 暗色体系全组件跟随
- 🦾 **LinuxDo 风格界面**：左侧板块导航、话题列表、彩色板块徽章、直角锐利造型，1920×1080 标准优化
- 📚 **内置 OpenAPI**：全部接口自动生成文档，前端按同一契约开发
- 🧱 **统一响应结构**：成功 `{msg, data}`、分页、失败状态码全站一致，前端一层封装
- ⏱ **接口限流**：登录 / 注册基于 IP 的滑动窗口限流，防爆破防刷
- 🧪 **冒烟测试**：58 项断言覆盖全部接口与权限规则，一条命令回归

<details>

<summary><b>👥 用户系统细节</b>（点击展开）</summary>

- 注册接口固定产生普通用户，管理员由 `bun run admin:create` 脚本创建或提升——权限入口收口
- JWT 签发 7 天有效期；每次请求回库校验账号存在性，注销账号后旧 token 立即失效
- 登录失败统一文案 + 假哈希运算抹平响应时间差，防止用户名枚举
- 资料修改仅限本人；账号注销级联删除帖子和评论，不可恢复需二次确认
- 用户主页展示资料与已过审的公开帖子（分页）

</details>

## 🚀 快速开始

> [!NOTE]
> 前置要求：[Bun](https://bun.sh) 1.1+、PostgreSQL 15+。演示账号（seed 创建）：`demo / demo12345678`、`xiaoming / demo12345678`。

```bash
# 0. 配置环境变量（填入数据库连接串与 JWT 密钥，密钥建议 openssl rand -hex 32 生成）
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

## 🩻 双重血统：每个设计都有出处

EZ Forum 的核心设计不是拍脑袋——一边是服务端工程验证多年的实践，一边是社区产品打磨出来的共识：

| EZ Forum 能力 | 工程实践出处 | 社区产品共识 |
| --- | --- | --- |
| 帖子审核流 | 有限状态机（FSM）+ 内容工作流 | 先审后发的社区治理 |
| signIn / adminOnly 权限宏 | 声明式守卫、RBAC | 最小权限原则 |
| 点赞 / 评论计数对账 | 计数器与真实数据 reconciliation | 计数即口碑 |
| 契约模式（contract.prisma） | Schema-driven Development | 单一事实来源 |
| TypeBox 输入校验 | 契约式设计（Design by Contract） | 永远不信任客户端 |
| 统一响应结构 | API 契约优先 | 前后端和平共处 |
| 滑动窗口限流 | 滑动窗口日志算法 | 防爆破是底线 |
| 原生 SQL 标签模板 | 预编译语句（Prepared Statements） | 参数化，永远参数化 |

## 🔌 API 一览

前缀 `/api`，内置 OpenAPI 文档：<http://localhost:3000/openapi>

| 模块 | 接口 |
| --- | --- |
| 用户 | `POST /user` 注册 · `POST /user/login` 登录 · `GET /user/me` · `GET /user/:id` 主页 · `PATCH /user/:id` 修改资料 · `DELETE /user/:id` 注销 |
| 帖子 | `GET /post` 公开列表（搜索/板块/排序） · `GET /post/mine` 我的 · `GET /post/:id` 详情 · `POST /post` 发布 · `PATCH /post/:id` 修改 · `DELETE /post/:id` 删除 · `POST /post/:id/like` 点赞 |
| 评论 | `GET /comment/post/:id` 列表 · `POST /comment/:id` 发表 · `DELETE /comment/:id` 删除 |
| 板块 | `GET /category` 列表 · `POST /category` · `PATCH /category/:id` · `DELETE /category/:id`（管理员） |
| 管理 | `GET /admin/stats` 概览 · 帖子审核 · 评论管理 · 用户管理（均需管理员权限） |

统一响应：成功 `{msg, data}`，分页多 `page / pageSize / total`，失败 `{msg}` + 对应 HTTP 状态码。

## 🔒 安全措施

- **密码存储**：`Bun.password`（Argon2id）哈希；登录失败统一文案 + 假哈希运算抹平响应时间差，防用户名枚举
- **认证**：JWT 7 天过期；每次请求回库校验账号存在性，注销后旧 token 立即失效
- **限流**：登录 / 注册接口基于 IP 的滑动窗口限流（内存版，多实例部署需换 Redis）
- **注入防护**：全部 SQL 经 ORM 参数化；原生 SQL 用标签模板传参，LIKE 关键词转义 `% _`
- **输入校验**：TypeBox 严格校验所有输入（类型、长度上限、枚举），请求体上限 1MB
- **权限控制**：权限宏守卫（登录 / 可选登录 / 管理员），资源操作逐一校验归属；管理员不可降级 / 删除自己
- **XSS 防护**：前端纯文本渲染（`white-space: pre-wrap`），全程无 `v-html`
- **启动自检**：强制校验 `JWT_SECRET`（≥32 字符）等关键环境变量，缺失直接拒绝启动

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
- **内容渲染**：帖子为纯文本（保留换行）；如需 Markdown 渲染建议在前端引入 markdown-it 并做 sanitize
- **徽章说明**：顶部徽章来自 shields.io，GitHub 上正常显示；本地预览若裂图不影响任何功能

## 反馈

问题与建议请提 [Issue](../../issues)——附上复现步骤和接口响应，修复会快很多。

---

<div align="center">

**EZ Forum** · 用工程的方法，搭一个自己的社区

Bun + Elysia + Prisma + Vue

</div>
