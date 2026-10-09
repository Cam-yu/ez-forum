<div align="center">

# ⚡ EZ Forum

**基于 Bun + Elysia + Prisma ORM 8 与 Vue 3 的全栈论坛系统**

涵盖用户与权限、板块、发帖审核流、两级评论、点赞与管理后台，支持深色 / 浅色主题。

[快速开始](#快速开始) · [功能](#功能) · [API](#api-一览) · [安全](#安全措施) · [部署](#部署)

<img src="./docs/screenshots/home-dark.png" width="100%" alt="EZ Forum 首页：左侧板块导航与热门话题，右侧话题列表，深色主题" />

</div>

---

## 项目简介

EZ Forum 是一个可以直接投入使用的论坛系统：用户注册登录、在板块下发布帖子，帖子经管理员审核后公开，其他用户可以评论和点赞，管理员在后台集中处理内容与用户。前后端均使用 TypeScript，数据存储在自托管的 PostgreSQL 中。

本项目并非简化的教学示例。内容审核、权限归属校验、级联删除、接口限流这类实现成本较高但不可或缺的部分均已完整实现，因此代码量大于常见的教学项目，但可以直接部署到真实环境使用。

## 项目背景

现有方案的实际情况如下：

- **Discourse**：功能最完整，但依赖 Ruby 运行环境，实例内存占用 1~2 GB 起步，对个人开发者成本偏高
- **Flarum 等 PHP 论坛**：相对轻量，但插件质量参差不齐，凑齐功能后的维护成本并不比 Discourse 低
- **SaaS 社区平台**：注册即可使用，但审核规则、数据导出、服务存续均由平台控制
- **常见的练手项目**：可以运行，但普遍存在密码明文存储、SQL 拼接、缺少权限设计等问题——论坛恰好是用户数据的集中场景，这些环节不能省略

EZ Forum 的定位是中间路线：技术栈轻量（Bun + PostgreSQL），功能不追求大而全，但安全与治理相关的部分按生产环境的标准实现。

| 能力 | SaaS 社区平台 | 传统开源论坛 | 常见练手项目 | EZ Forum |
| --- | --- | --- | --- | --- |
| 部署门槛 | 注册即用，受制于平台 | 环境复杂，资源占用高 | 可以运行 | ✅ Bun + PostgreSQL，两条命令 |
| 内容审核 | 黑盒规则 | 依赖插件 | ❌ 无 | ✅ 内置审核流（待审 / 通过 / 驳回） |
| 管理后台 | 功能封闭 | 插件拼装 | ❌ 无 | ✅ 概览 / 帖子 / 评论 / 用户 / 板块 |
| 类型安全 | 封闭 | 脚本语言混杂 | 弱类型 | ✅ 前后端 TypeScript strict |
| 数据归属 | 平台所有 | 自持 | 自持 | ✅ 自持 PostgreSQL，可随时迁移 |
| 接口文档 | ❌ | 部分 | ❌ | ✅ 内置 OpenAPI |

## 功能

### 发帖与审核

帖子提交后进入待审核状态，管理员审核通过后才对外展示；作者编辑已通过的帖子，帖子会重新进入待审核。支持板块归类、标题关键词搜索、按最新或最热（点赞数）排序，全部列表均分页。浏览量仅在帖子对外可见后开始累计。

发布页面：

<img src="./docs/screenshots/post-edit.png" width="100%" alt="发布帖子：板块选择、标题与纯文本内容编辑器、审核提示" />

### 评论与点赞

评论采用两级结构（一级评论 + 回复），删除一级评论时回复一并删除，帖子上的评论计数随后自动重新统计。点赞每位用户每帖一次，可取消，计数按实际数据校准，并发场景下不会出现偏差。

帖子详情页：

<img src="./docs/screenshots/post-detail.png" width="100%" alt="帖子详情：正文、点赞按钮、两级评论列表" />

### 用户与权限

注册账号固定为普通用户，管理员由脚本创建或提升。登录签发 7 天有效期的 JWT，每次请求会核对账号是否仍然存在，注销后旧 token 立即失效。修改资料与注销账号仅限本人操作，注销会级联删除该用户的全部帖子和评论，操作前需要二次确认。

### 管理后台

概览页提供用户、帖子、评论、待审核四项统计与待审帖子列表；帖子支持按状态筛选、按标题搜索、通过 / 驳回 / 删除；用户支持调整角色与删除；板块支持增删改。管理员无法删除或降级自己。

<img src="./docs/screenshots/admin-dashboard.png" width="100%" alt="管理后台概览：四张统计卡片与待审核帖子快捷处理列表" />

<img src="./docs/screenshots/admin-posts.png" width="100%" alt="帖子管理：状态筛选、搜索、数据统计与操作按钮" />

### 主题与界面

深色 / 浅色两套主题一键切换，偏好保存在浏览器本地。界面为直角、高对比的样式，按 1920×1080 分辨率排版，窄屏自动切换为单列布局。

<img src="./docs/screenshots/home-light.png" width="100%" alt="浅色主题首页" />

## 快速开始

> [!NOTE]
> 前置要求：[Bun](https://bun.sh) 1.1+ 与 PostgreSQL 15+。安装完成后可执行 seed 脚本初始化演示数据（账号 `demo / demo12345678`）。

```bash
# 0. 配置环境变量（数据库连接串 + JWT 密钥，密钥建议使用 openssl rand -hex 32 生成）
cp .env.example .env

# 1. 安装依赖（后端 + 前端）
bun install
cd web && bun install && cd ..

# 2. 初始化数据库
bun prisma db init        # 首次建表；之后修改契约使用下面两条命令
bun run contract:emit     # 修改 contract.prisma 后重新生成类型
bun run db:update         # 将契约变更应用到数据库

# 3. 初始化演示数据（幂等，可重复执行）
bun run seed

# 4. 创建管理员（注册接口固定产生普通用户，管理员只能通过脚本创建）
bun run admin:create <用户名> <密码> [昵称]

# 5. 启动
bun run dev               # 后端 http://localhost:3000
cd web && bun run dev     # 前端 http://localhost:5173（/api 代理到后端）
```

## 项目结构

```
├── src/                      # 后端
│   ├── index.ts              # 入口：环境校验 / cors / openapi / 统一错误处理
│   ├── router/               # user / post / comment / category / admin 路由
│   ├── plugins/auth.ts       # JWT 插件：signIn / signInOptional / adminOnly 权限宏
│   ├── dto/                  # TypeBox 请求校验 schema
│   ├── prisma/               # contract.prisma、db 客户端、原生 SQL 封装
│   └── utils/                # 统一响应结构、内存限流
├── scripts/                  # createAdmin / seed / apiTest
├── migrations/               # Prisma 迁移快照
├── docs/screenshots/         # README 截图
└── web/                      # 前端
    └── src/
        ├── api/              # 请求封装与接口定义
        ├── stores/           # Pinia：登录态 / 主题
        ├── router/           # 路由与守卫
        ├── layouts/          # 默认布局 / 管理后台布局
        ├── components/       # PostCard / CommentTree / Avatar / CategoryBadge
        ├── views/            # 页面（admin/ 为后台）
        └── utils/            # 时间格式化、色板
```

## API 一览

接口前缀 `/api`，内置 OpenAPI 文档：<http://localhost:3000/openapi>

| 模块 | 接口 |
| --- | --- |
| 用户 | `POST /user` 注册 · `POST /user/login` 登录 · `GET /user/me` · `GET /user/:id` 主页 · `PATCH /user/:id` · `DELETE /user/:id` 注销 |
| 帖子 | `GET /post` 公开列表 · `GET /post/mine` 我的 · `GET /post/:id` 详情 · `POST /post` · `PATCH /post/:id` · `DELETE /post/:id` · `POST /post/:id/like` 点赞 |
| 评论 | `GET /comment/post/:id` · `POST /comment/:id` · `DELETE /comment/:id` |
| 板块 | `GET /category` · `POST /category` · `PATCH /category/:id` · `DELETE /category/:id`（管理员） |
| 管理 | `GET /admin/stats` · 用户管理 · 帖子审核 · 评论管理（均需管理员权限） |

响应格式全站统一：成功返回 `{msg, data}`，分页接口额外包含 `page / pageSize / total`，失败返回 `{msg}` 与对应的 HTTP 状态码。

## 安全措施

- 密码使用 `Bun.password`（Argon2id）哈希存储；登录失败返回统一文案，并执行一次假哈希运算抹平响应时间差，防止枚举用户名
- JWT 有效期 7 天，每次请求回库核对账号是否存在，注销后旧 token 立即失效
- 登录与注册接口实现了基于 IP 的滑动窗口限流（内存版，多实例部署需替换为 Redis）
- 全部 SQL 经 ORM 参数化；原生 SQL 使用标签模板传参，LIKE 关键词转义 `%` 与 `_`
- 所有输入经 TypeBox 校验（类型、长度、枚举），请求体上限 1 MB
- 管理员无法降级或删除自己；前端为纯文本渲染，未使用 `v-html`
- 启动时校验 `JWT_SECRET`（至少 32 字符）等关键环境变量，缺失时拒绝启动

## 部署

1. 配置生产环境 `DATABASE_URL` 与强随机 `JWT_SECRET`，`CORS_ORIGIN` 建议设置为站点域名
2. 后端：`bun prisma db update` 同步数据库，然后 `bun run src/index.ts`（可配合 systemd / pm2 守护）
3. 前端：`cd web && bun run build`，将 `web/dist` 交由 Nginx / Caddy 托管，`/api` 反向代理至后端 3000 端口

## 测试

```bash
# 后端 API 冒烟测试：58 项断言，覆盖注册登录、审核流、权限、级联删除、限流
bun scripts/apiTest.ts <管理员用户名> <管理员密码>

# 前端类型检查 + 生产构建
cd web && bun run build
```

## 已知限制

- Prisma 8 RC 的查询构建器目前仅支持等值条件，模糊搜索与联表统计通过 `src/prisma/raw.ts` 中的原生 SQL 实现（已全部参数化），正式版发布后可替换回构建器
- 限流为单机内存实现，多实例部署需替换为 Redis
- 帖子内容为纯文本展示，暂不支持 Markdown 渲染；如需支持，建议在前端引入 markdown-it 并进行 sanitize
- 暂未实现邮件验证与找回密码
- 移动端可正常浏览，但未做深度适配

## 反馈

问题与建议请提交 [Issue](../../issues)，并附上复现步骤与接口响应，以便定位和修复。
也可以联系QQ: 2209503099
