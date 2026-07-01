# 上线收尾清单 — toton123.xyz 域名接入

目标：`app.toton123.xyz`（前端 Cloudflare）+ `api.toton123.xyz`（后端 API Gateway），端到端登录跑通。

前提：`toton123.xyz` 的 DNS 已托管在 Cloudflare 账号 `iwillsaynothing1978@gmail.com` 下。

---

## ✅ 已完成（我这边）

- [x] 前端部署到 Cloudflare Pages：`my-better-t-app.pages.dev`
- [x] 后端部署到 Lambda + API Gateway：`https://vlbqyfth63.execute-api.us-east-1.amazonaws.com`（注册/登录接口已验证 200，Lambda 连 Aurora 正常）
- [x] 前端已用 `VITE_SERVER_URL=https://api.toton123.xyz` 重构建并重新部署
- [x] 代码加跨子域 Cookie：`packages/auth/src/index.ts` → `crossSubDomainCookies { domain: ".toton123.xyz" }`
- [x] Lambda 已重建（含上面改动），待重部署
- [x] 已申请 ACM 证书 `api.toton123.xyz`
      ARN：`arn:aws:acm:us-east-1:496251221975:certificate/bee33d01-15fc-4786-b7e8-8d61f06e1c08`

---

## ⏳ 你要做的事（按顺序）

### 步骤 1 — 在 Cloudflare 加「证书验证」DNS 记录
Cloudflare → `toton123.xyz` → DNS → 添加记录：

| 类型 | 名称 | 目标 | 代理状态 |
|---|---|---|---|
| CNAME | `_ed4dad956ee52ef3025a24bb9211e097.api` | `_f2b7fe367b17c2efcbad1b1ab8109f7e.jkddzztszm.acm-validations.aws` | **DNS only（灰云）** |

> 名称只填 `_ed4dad956ee52ef3025a24bb9211e097.api`（Cloudflare 会自动补 `.toton123.xyz`）。加完等几分钟证书会变 ISSUED。

### 步骤 2 — [x] 已完成（我这边）
证书已 ISSUED；已创建 API Gateway 自定义域名 `api.toton123.xyz`（REGIONAL，绑证书）并映射到 HTTP API `vlbqyfth63` 的 `$default` stage。
目标域名：`d-puke6n669j.execute-api.us-east-1.amazonaws.com`

### 步骤 3 — 在 Cloudflare 加「api 指向后端」DNS 记录

| 类型 | 名称 | 目标 | 代理状态 |
|---|---|---|---|
| CNAME | `api` | `d-puke6n669j.execute-api.us-east-1.amazonaws.com` | **DNS only（灰云）** |

### 步骤 4 — 前端加自定义域名 `app.toton123.xyz`
Cloudflare → Workers & Pages → `my-better-t-app` → Custom domains → Set up a custom domain → 填 `app.toton123.xyz`。Cloudflare 自动配 DNS + 签发证书。

### 步骤 5 — 重新部署后端（带上跨子域 Cookie 改动）
```bash
cd /Users/zhaoyu/my-better-t-app
pnpm -F server build:lambda
set -a; . apps/server/.env.prod; set +a
sam deploy --confirm-changeset \
  --parameter-overrides Stage=prod \
    DatabaseUrl="$DATABASE_URL" BetterAuthSecret="$BETTER_AUTH_SECRET" \
    BetterAuthUrl="$BETTER_AUTH_URL" CorsOrigin="$CORS_ORIGIN"
```
（`.env.prod` 里 `BETTER_AUTH_URL=https://api.toton123.xyz`、`CORS_ORIGIN=https://app.toton123.xyz` 已是对的）

### 步骤 6 — 端到端验证
打开 `https://app.toton123.xyz`，注册/登录。DevTools → Application → Cookies 里应看到会话 Cookie 写在 `.toton123.xyz` 上。

---

## 完成判定
- [x] `https://api.toton123.xyz/` 返回 `OK`（curl 验证 200）
- [x] `https://app.toton123.xyz` 打得开登录页（200）
- [x] 注册接口经自定义域名 200，CORS 头 + Set-Cookie（HttpOnly/Secure/SameSite=None）均正确
- [ ] 浏览器里注册/登录成功、刷新后仍保持登录态 ← 请你亲自在 https://app.toton123.xyz 点一次确认

## 可选收尾
当前部署的 Lambda 尚未包含 `crossSubDomainCookies` 代码改动（该改动已在源码里、Lambda 已重建但未重部署）。
现网 Cookie 是 host-only 挂在 `api.toton123.xyz` 上，app→api 同主域请求会正常携带，登录即可工作。
若想让 Cookie 域变为 `.toton123.xyz`（多子域共享，更稳），重跑步骤 5 的 `sam deploy` 即可。
