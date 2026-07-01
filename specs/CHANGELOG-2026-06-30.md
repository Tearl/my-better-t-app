# 变更日志 — 2026-06-30

## Feature 1: user-auth-login

### 新增
- T-008：登录流程的联调与 E2E 测试，覆盖默认登录态展示、邮箱/密码校验报错、登录成功 toast、登录失败 toast（后端错误信息透传）、提交中加载态（按钮禁用防重复提交）、表单合法性驱动的提交按钮禁用/启用、会话加载态（`useSession().isPending` → `Loader`）、忘记密码占位入口。
- 已跑 `pnpm dlx ultracite check`。

### 关键文件
- `apps/web/e2e/login.spec.ts` — 登录流程 E2E 用例（8 个 test，Better Auth 接口通过 `page.route` mock）。
- `apps/web/playwright.config.ts` — Playwright 配置，`webServer` 自动拉起 `pnpm dev`（端口 3001）。
- `apps/web/package.json` — 新增 `test:e2e` 脚本与 `@playwright/test` devDependency。
- `.gitignore` — 新增 `test-results`、`playwright-report`、`playwright/.cache`、`blob-report`。

### 架构决策
- E2E 测试不依赖真实的 AWS 承载的 Better Auth 服务，统一通过拦截 `**/api/auth/get-session`、`**/api/auth/sign-in/email` 等端点 mock 响应，保证测试可在无后端环境下稳定运行。
- 校验用例使用 `user@localhost` 同时满足 HTML5 `type="email"` 原生约束与触发更严格的 Zod 邮箱正则报错，复用同一条提交路径验证非法邮箱场景。

## Feature 2: user-auth-register

### 新增
- T-006：注册流程的联调与 E2E 测试，覆盖切换到注册模式的字段/标题联动与表单重置、四项校验报错（用户名过短/邮箱非法/密码过短/确认密码不一致，且错误归属正确字段）、注册成功 toast、注册失败 toast（后端错误信息透传）、社交登录占位提示（微信/QQ）、注册→登录模式切换的表单与成功态重置。
- 已跑 `pnpm dlx ultracite check`。

### 关键文件
- `apps/web/e2e/register.spec.ts` — 注册流程 E2E 用例（7 个 test，Better Auth 接口通过 `page.route` mock）。

### 架构决策
- 复用 Feature 1 建立的 Playwright 配置与 mock 模式（`mockNoSession`、端点拦截），未引入额外测试基础设施。
- 确认密码校验报错验证其归属于 `confirm` 字段而非顶层错误，覆盖此前 PLAN.md 风险点中提到的 “refine 错误 path 配置不当” 场景。

## PLAN.md 状态更新
- Feature 1（user-auth-login）：T-008 完成，所有任务已交付。
- Feature 2（user-auth-register）：T-006 完成，所有任务已交付。
