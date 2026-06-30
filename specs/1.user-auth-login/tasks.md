# user-auth-login — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-06-30 | v1   | 初始任务 |

## 项目信息

- 项目名: my-better-t-app
- 架构类型: pnpm monorepo（Turborepo，apps/* + packages/*）
- specs 路径: specs/1.user-auth-login/

## 任务列表

### 功能 1: 认证 UI 组件库（packages/ui）

- [ ] T-001: 实现核心展示组件 `AuthBackground` / `AuthCard` / `AuthHeader` / `AuthBody` / `AuthField`（含密码显示切换与 error 文案）/ `AuthSubmitButton`（默认/加载/成功三态），导出 `AuthMode` 类型 ~30min
- [ ] T-002: 实现辅助组件 `AuthTabs`（受控分段控件）/ `AuthDivider` / `AuthSocialButtons` / `AuthSwitchPrompt` 并统一从 auth-card 导出 ~30min

### 功能 2: 认证客户端

- [ ] T-003: 配置 `apps/web/src/lib/auth-client.ts`，用 `createAuthClient({ baseURL: env.VITE_SERVER_URL })` 导出 `authClient` ~5min

### 功能 3: 登录表单与提交

- [ ] T-004: 装配登录表单（TanStack Form）字段电子邮箱 + 密码，接入 `AuthField`，定义 `loginSchema`（邮箱合法、密码 ≥ 8）并展示首条字段错误 ~30min
- [ ] T-005: 接入 `authClient.signIn.email`，实现成功态（按钮「✓ 成功」）+ toast「登录成功」、失败 toast 错误信息；用 `form.Subscribe` 联动 `canSubmit`/`isSubmitting` 驱动提交按钮 ~15min

### 功能 4: 模式切换与会话/加载态

- [ ] T-006: 实现 `mode` 状态与 `switchMode`（重置表单/清成功态），接入 `AuthTabs` 与标题/副标题联动；将 `AuthForm` 挂为根路由 `/`（`apps/web/src/routes/index.tsx`） ~15min
- [ ] T-007: 实现会话加载态（`useSession().isPending` → `AuthBackground` 内 `Loader`）与「忘记密码？」占位（toast「找回密码功能即将上线」） ~15min

### 集成与测试

- [ ] T-008: 登录流程联调与 E2E（校验报错 / 登录成功 toast / 失败 toast / 加载态 / 提交禁用），并跑 `pnpm dlx ultracite check` ~30min

## 依赖关系

- T-004 依赖 T-001（AuthField/AuthSubmitButton）。
- T-005 依赖 T-003（authClient）、T-004（表单）。
- T-006 依赖 T-002（AuthTabs）、T-004。
- T-007 依赖 T-003、T-006。
- T-008 依赖 T-005、T-006、T-007。

## 风险点

- `VITE_SERVER_URL` 未配置会导致 authClient 请求失败 → 联调前确认 `@my-better-t-app/env` 环境变量就绪。
- Better Auth 服务（AWS 承载）未就绪时，登录成功/失败路径无法真实验证 → 可先用 mock 或确认后端可用。
- 内联样式较多需通过 Biome/Ultracite 检查 → 提交前运行 `pnpm dlx ultracite fix`。
