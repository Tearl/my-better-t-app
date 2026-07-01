# CI/CD 启用清单 — GitHub Actions

push 到 `main` 自动:构建并部署**后端**(SAM → Lambda)+ **前端**(Cloudflare Pages)。
用 AWS OIDC 免长期密钥。workflow：`.github/workflows/deploy.yml`。

---

## ✅ 已完成（代码/模板）
- [x] `.github/workflows/deploy.yml`：修正 stack 名为 `my-better-t-app`，新增前端 Cloudflare 部署 job
- [x] `infra/github-oidc.yaml`：一键创建 GitHub OIDC 部署角色的 CloudFormation 模板
- [x] 已确认账号里 GitHub OIDC provider **已存在** → 模板参数 `CreateOIDCProvider=false`

## ⏳ 你要做的（都用你自己的账号）

### 步骤 1 — 建 AWS 部署角色（一次性）
```bash
cd /Users/zhaoyu/my-better-t-app
aws cloudformation deploy \
  --template-file infra/github-oidc.yaml \
  --stack-name my-better-t-app-github-oidc \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides CreateOIDCProvider=false \
  --region us-east-1
```
角色 ARN（固定，因为模板里指定了角色名）：
`arn:aws:iam::496251221975:role/my-better-t-app-github-deploy`

### 步骤 2 — 建 Cloudflare API Token
Cloudflare 控制台 → 右上头像 → My Profile → API Tokens → Create Token
→ 用 "Edit Cloudflare Workers" 模板，或自定义权限：**Account → Cloudflare Pages → Edit**。
生成后复制 token（只显示一次）。

### 步骤 3 — 在 GitHub 仓库配 Secrets
仓库 → Settings → Secrets and variables → Actions → New repository secret，逐个加：

| Secret 名 | 值 |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::496251221975:role/my-better-t-app-github-deploy` |
| `DATABASE_URL` | 取自本地 `apps/server/.env.prod`（那行 `DATABASE_URL=` 的值） |
| `BETTER_AUTH_SECRET` | 取自本地 `apps/server/.env.prod` |
| `BETTER_AUTH_URL` | `https://api.toton123.xyz` |
| `CORS_ORIGIN` | `https://app.toton123.xyz` |
| `CLOUDFLARE_API_TOKEN` | 步骤 2 生成的 token |
| `CLOUDFLARE_ACCOUNT_ID` | `f350f1151c3d19066f82fd0c42e8ecd2` |

（可选）Variables 里加 `VITE_SERVER_URL = https://api.toton123.xyz`，方便以后改域名不动 workflow。

### 步骤 4 — 提交并推送，触发首次自动部署
```bash
git add -A
git commit -m "ci: enable GitHub Actions deploy (SAM + Cloudflare)"
git push origin main
```
push 后去仓库 **Actions** 页看运行；两条 job（server / web）应都变绿。

---

## 验证
- Actions 里 `deploy-server` 打印出 `ApiUrl`
- Actions 里 `deploy-web` 显示 Cloudflare 部署成功
- 打开 `https://app.toton123.xyz` 仍正常

## 说明
- 只在改动 `apps/** packages/** template.yaml samconfig.toml` 时触发（纯文档改动不触发）。
- 后端角色权限见 `infra/github-oidc.yaml`，为 SAM 部署所需的最小可用集，可按需收紧。
- 首次 push 会同时把本轮所有改动（VpcConfig、跨子域 Cookie、_redirects 等）一起部署上去。
