# 生产部署手册 — my-better-t-app

前端部署到 **Cloudflare Pages**，后端部署到 **AWS Lambda + API Gateway HTTP API**（SAM），数据库使用 **Aurora PostgreSQL**。

> 本手册与仓库现有 IaC 对齐：根目录 `template.yaml`（SAM 模板）、`samconfig.toml`（SAM 配置）、`apps/server` 的 `build:lambda` 脚本、`packages/env` 的环境变量约束。

---

## 1. 架构总览

```
用户浏览器
  │  https://<你的前端域名>            (Cloudflare Pages，静态 SPA)
  ▼
Cloudflare Pages  ──fetch(credentials:include)──►  API Gateway HTTP API
                                                     │
                                                     ▼
                                              Lambda (Hono: tRPC + Better Auth)
                                                     │
                                                     ▼
                                              Aurora PostgreSQL (RDS)
```

- 前端是纯静态 SPA（Vite 产物 `apps/web/dist`），运行时只靠 `VITE_SERVER_URL` 找后端。
- 后端一个 Lambda 承接全部路由：`/api/auth/*`（Better Auth）、`/trpc/*`（tRPC）、`/`（健康检查）。
- 认证用 Cookie（`httpOnly` + `SameSite=None` + `Secure`），因此**前后端跨域时对域名有要求**，见第 7 节。

---

## 2. 前置条件

| 工具 / 账号 | 用途 | 检查 |
|---|---|---|
| Node ≥ 20、pnpm 11 | 构建 | `node -v` / `pnpm -v` |
| AWS CLI（已配置凭证） | 部署后端 | `aws sts get-caller-identity` |
| AWS SAM CLI | 打包上传 Lambda | `sam --version` |
| Cloudflare 账号 + Wrangler | 部署前端 | `pnpm dlx wrangler --version` |
| 一个 Aurora/RDS PostgreSQL 实例 | 业务库 | 见第 4 节 |
| （推荐）一个可控的域名 | 让前后端同主域，Cookie 才稳 | 见第 7 节 |

---

## 3. 环境变量矩阵

真实密钥**不入仓库**，由部署环境 / Secrets Manager 注入（见 `.claude/CLAUDE.md` 约定）。

### 后端（Lambda，经 SAM 参数注入 → `template.yaml`）
| 变量 | 说明 | 示例 |
|---|---|---|
| `DATABASE_URL` | Aurora 连接串（含库名） | `postgresql://postgres:<pwd>@<cluster-endpoint>:5432/my_better_t_app?sslmode=require` |
| `BETTER_AUTH_SECRET` | ≥32 位随机密钥 | `openssl rand -base64 32` 生成 |
| `BETTER_AUTH_URL` | 后端对外地址（API Gateway URL 或自定义域名） | `https://api.example.com` |
| `CORS_ORIGIN` | 允许跨域的前端地址 | `https://app.example.com` |
| `NODE_ENV` | 已在模板里固定 `production` | — |

### 前端（构建期注入，Vite 内联进产物）
| 变量 | 说明 | 值 |
|---|---|---|
| `VITE_SERVER_URL` | 后端根地址（**不带 `/trpc`**） | 与后端 `BETTER_AUTH_URL` 相同 |

> 注意：`VITE_*` 是**构建期**变量，改了必须重新 `build`。它会被打进静态 JS，不是运行时可改的。

---

## 4. 准备数据库（Aurora）

1. **准备一个生产库**。可复用现有 Aurora 集群，也可新开。建议为本项目单独建库：
   ```sql
   CREATE DATABASE my_better_t_app;
   ```
2. **把 Better Auth 的表结构推上去**（本项目用 drizzle-kit push，无 migration 文件）。在一台能连到该库的机器上：
   ```bash
   # apps/server/.env 里的 DATABASE_URL 指向生产库
   pnpm -F db db:push
   ```
   成功后库里应有 `user / session / account / verification` 四张表。
   - 若本机无法直连（如库在私有子网），用 SSM 端口转发隧道后再 push，参考本地开发的做法。
3. **密码存 Secrets Manager**（推荐，符合项目约定）：
   ```bash
   aws secretsmanager create-secret --name my-better-t-app/prod/database-url \
     --secret-string 'postgresql://postgres:<pwd>@<endpoint>:5432/my_better_t_app?sslmode=require'
   ```
   部署时从这里取值注入（第 5 节），不要把明文写进脚本或仓库。

> **Lambda 如何连到 Aurora（务必确认）**：当前 `template.yaml` 未给 Lambda 配 `VpcConfig`，即 Lambda 在 VPC 外运行。两种可行方式二选一：
> - **A（简单）**：Aurora 设为 publicly accessible，安全组放行……但 Lambda 出口 IP 不固定，需放宽较大网段，安全性差，仅测试可用。
> - **B（推荐，生产）**：给 Lambda 接入 VPC。在 `template.yaml` 的 `ServerFunction.Properties` 下加：
>   ```yaml
>   VpcConfig:
>     SecurityGroupIds: [sg-xxxxxxxx]        # 给 Lambda 用的 SG
>     SubnetIds: [subnet-aaa, subnet-bbb]     # Aurora 所在 VPC 的私有子网
>   ```
>   再在 Aurora 的安全组入站放行「Lambda 的 SG」的 5432。这样 DB 无需公网暴露。VPC 内 Lambda 若还要访问外网，需要 NAT 网关。

---

## 5. 部署后端（SAM → Lambda + API Gateway）

### 5.1 构建 Lambda 包
```bash
pnpm -F server build:lambda        # 产出 apps/server/dist-lambda/lambda.mjs（自包含，无需 node_modules）
```

### 5.2 部署
```bash
# 从 Secrets Manager 取 DATABASE_URL（或在 CI 里注入）
DB_URL=$(aws secretsmanager get-secret-value \
  --secret-id my-better-t-app/prod/database-url \
  --query SecretString --output text)

sam deploy \
  --parameter-overrides \
    Stage=prod \
    DatabaseUrl="$DB_URL" \
    BetterAuthSecret="$(openssl rand -base64 32)" \
    BetterAuthUrl="https://api.example.com" \
    CorsOrigin="https://app.example.com"
```
> `stack_name`、`region`、`capabilities` 等已在 `samconfig.toml` 固定（`us-east-1`）。首次也可跑 `sam deploy --guided` 生成/校对配置。
>
> ⚠️ `BetterAuthSecret` 每次部署都重新生成会导致**已登录会话全部失效**。生产请固定一个值（存 Secrets Manager 后每次取同一个），不要每次现生成。

### 5.3 取回后端地址
部署完成后看 Outputs 里的 `ApiUrl`：
```bash
aws cloudformation describe-stacks --stack-name my-better-t-app \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text
# 例：https://abcd1234.execute-api.us-east-1.amazonaws.com
```
这个值就是前端的 `VITE_SERVER_URL`（若配了自定义域名 `api.example.com`，用自定义域名）。

---

## 6. 部署前端（Cloudflare Pages）

### 6.1 SPA 路由回退（必需）
这是 TanStack Router 的 SPA，所有路径都要回退到 `index.html`，否则刷新子路由会 404。新建 `apps/web/public/_redirects`：
```
/*  /index.html  200
```

### 6.2 构建
```bash
# 后端地址注入构建（用第 5.3 拿到的 ApiUrl 或自定义域名）
VITE_SERVER_URL="https://api.example.com" pnpm -F web build
# 产物：apps/web/dist
```

### 6.3 部署到 Cloudflare Pages
**方式一：Wrangler 直传（快）**
```bash
pnpm dlx wrangler pages deploy apps/web/dist --project-name my-better-t-app
```
**方式二：Git 集成（推荐，自动 CI）** 在 Cloudflare 控制台 Pages 里连接仓库，设置：
- Framework preset：`None`（或 Vite）
- Build command：`pnpm -F web build`
- Build output directory：`apps/web/dist`
- Root directory：仓库根
- 环境变量：`VITE_SERVER_URL = https://api.example.com`

> monorepo 提示：Cloudflare 需要能装到 pnpm workspace 依赖。若默认构建失败，把 Build command 设成 `pnpm install && pnpm -F web build`，并确认 Node 版本为 20（`NODE_VERSION=20` 环境变量）。

---

## 7. 跨域与 Cookie（最关键，直接决定登录能否成功）

Better Auth 用 Cookie 保持会话。代码里已设 `SameSite=None; Secure; httpOnly`（`packages/auth/src/index.ts`），前端 fetch 也带了 `credentials:include`。据此：

1. **`CORS_ORIGIN` / `trustedOrigins` 必须是前端的真实 https 地址**（后端 `CORS_ORIGIN` 参数；`trustedOrigins` 代码里取的就是它）。
2. **强烈建议前后端同一注册域**，用子域区分：
   - 前端 `https://app.example.com`（Cloudflare Pages 自定义域名）
   - 后端 `https://api.example.com`（API Gateway 自定义域名）
   然后在 `createAuth()` 里开启跨子域 Cookie：
   ```ts
   advanced: {
     crossSubDomainCookies: { enabled: true, domain: ".example.com" },
     defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true },
   }
   ```
3. **为什么不建议直接用默认域名**：前端 `*.pages.dev` + 后端 `*.execute-api.amazonaws.com` 属于**不同站点**，登录 Cookie 会变成第三方 Cookie，Safari（ITP）默认拦、Chrome 也在逐步收紧，表现为「接口 200 但没登录态」。用同主域 + 自定义域名可彻底规避。
4. 两个自定义域名都必须是 **HTTPS**（`Secure` Cookie 的前提）。

---

## 8. 部署后自检

```bash
API=https://api.example.com

# 1) 健康检查
curl -s $API/            # 期望 OK

# 2) 注册（应 200 且返回 token/user）
curl -s -X POST $API/api/auth/sign-up/email \
  -H "Content-Type: application/json" -H "Origin: https://app.example.com" \
  -d '{"name":"probe","email":"probe@example.com","password":"password123"}' -i | head -20
#   关注：HTTP 200；响应头里有 Set-Cookie（含 SameSite=None; Secure）

# 3) 浏览器端到端：打开 https://app.example.com，注册/登录，
#    DevTools > Application > Cookies 里应看到会话 Cookie 写在 api.example.com 上。
```
关注 CORS：预检 `OPTIONS` 应返回带 `Access-Control-Allow-Origin: https://app.example.com` 和 `Access-Control-Allow-Credentials: true` 的响应头。

---

## 9. 日常更新与回滚

**更新后端**
```bash
pnpm -F server build:lambda && sam deploy --parameter-overrides Stage=prod DatabaseUrl="$DB_URL" ...
```
**更新前端**（改了 `VITE_SERVER_URL` 或代码都要重构建）
```bash
VITE_SERVER_URL="https://api.example.com" pnpm -F web build
pnpm dlx wrangler pages deploy apps/web/dist --project-name my-better-t-app
```
**回滚**
- 后端：`aws cloudformation` 里回滚到上一个 changeset，或重新部署上一个 commit 的产物。
- 前端：Cloudflare Pages 控制台每次部署都有历史版本，一键回滚。

---

## 10. 常见问题排查

| 症状 | 可能原因 | 处理 |
|---|---|---|
| 注册/登录 **500** | Lambda 连不上 Aurora | 查 CloudWatch 日志；确认第 4 节的 VPC/SG 配置；`DATABASE_URL` 是否正确、库/表是否已建 |
| 接口 **CORS 报错** | `CORS_ORIGIN` 与前端域名不一致 | 用前端真实 https 地址重部署后端 |
| 接口 200 **但没登录态** | 第三方 Cookie 被拦 | 按第 7 节改用同主域自定义域名 + `crossSubDomainCookies` |
| 前端刷新子路由 **404** | 缺 SPA 回退 | 加 `apps/web/public/_redirects` 后重构建 |
| 登录后**用户莫名被登出** | 每次部署换了 `BETTER_AUTH_SECRET` | 固定 secret（Secrets Manager 取同一个值） |
| 首次请求慢 | Lambda 冷启动 | 可按需配 Provisioned Concurrency（成本换延迟） |
| Cloudflare 构建失败 | monorepo 装依赖 | Build command 用 `pnpm install && pnpm -F web build`，Node 20 |

---

## 附：一次完整部署的最短路径

```bash
# 0. 前置：Aurora 已就绪、密码在 Secrets Manager、两个自定义域名已备好
# 1. 建表
pnpm -F db db:push
# 2. 后端
pnpm -F server build:lambda
DB_URL=$(aws secretsmanager get-secret-value --secret-id my-better-t-app/prod/database-url --query SecretString --output text)
sam deploy --parameter-overrides Stage=prod DatabaseUrl="$DB_URL" \
  BetterAuthSecret="$SAVED_SECRET" BetterAuthUrl="https://api.example.com" CorsOrigin="https://app.example.com"
# 3. 前端
VITE_SERVER_URL="https://api.example.com" pnpm -F web build
pnpm dlx wrangler pages deploy apps/web/dist --project-name my-better-t-app
# 4. 自检（第 8 节）
```
