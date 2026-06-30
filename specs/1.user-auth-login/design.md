# user-auth-login — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-06-30 | v1   | 初始设计 |

## 项目架构

- 架构类型: pnpm monorepo（Turborepo），`apps/web`（Vite 8 + React 19 前端）+ `packages/ui`（共享 UI）+ `packages/*`（env/api 等）。
- 后端: 以 AWS 云端资源承载（参见 `.claude/CLAUDE.md` AWS Architecture Resources）；认证由 Better Auth 服务提供，前端经 `VITE_SERVER_URL` 访问。
- 涉及层: 前端展示层（`apps/web`）、共享 UI 层（`packages/ui`）、认证客户端层（`better-auth/react`）。

## 功能模块设计

### 模块 1: 认证 UI 组件库（packages/ui）

在 `packages/ui/src/components/auth-card.tsx` 提供一组无业务、纯展示的组合式组件，遵循 CLAUDE.md「函数组件、不在组件内定义组件、语义化与可访问性、`type="button"`」规范：

- `AuthBackground`：全屏渐变背景 + 模糊光晕（`FloatingOrb`）+ 极淡网格，居中子元素。
- `AuthCard`：玻璃拟态卡片容器（`max-w-sm`、`rounded-2xl`、`backdrop-blur`）。
- `AuthHeader`：图标徽章 + 标题 + 副标题（icon 作为 prop，类型 `React.ElementType`）。
- `AuthTabs`：登录/注册分段控件，受控 `mode` + `onModeChange`。
- `AuthBody`：`<form>` 包装，承载字段。
- `AuthField`：图标前缀输入框，受控 `value` + `onValueChange`，可选 `password`（显示/隐藏切换）与 `error` 文案。
- `AuthSubmitButton`：渐变提交按钮，含 默认/加载中/成功 三态。
- `AuthDivider`：带文案分隔线。
- `AuthSocialButtons`：社交登录按钮网格，`providers` + `onSelect`。
- `AuthSwitchPrompt`：底部「无账号？/已有账号？」切换提示。
- 导出 `AuthMode = "login" | "register"` 类型，供 login/register feature 共用。

**涉及层及关键设计:** 共享 UI 层；组件全部受控、无副作用，颜色/阴影内联 + Tailwind 工具类；不引入业务依赖（不 import authClient），保证可被 register feature 复用。

### 模块 2: 认证客户端（apps/web）

`apps/web/src/lib/auth-client.ts` 用 `createAuthClient({ baseURL: env.VITE_SERVER_URL })` 创建 better-auth react 客户端，导出 `authClient`。供 `signIn.email` / `useSession` 使用。

**涉及层及关键设计:** 认证客户端层；baseURL 从 `@my-better-t-app/env/web` 读取，不硬编码。

### 模块 3: 登录表单与提交联动（apps/web）

`apps/web/src/components/auth-form.tsx` 装配上述 UI 组件，使用 TanStack React Form：

- `loginSchema`（Zod）：`email` 合法、`password` ≥ 8。
- `onSubmit`（mode=login）调用 `authClient.signIn.email`，`onSuccess` 置成功态 + `toast.success`，`onError` `toast.error(error.error.message ?? statusText)`。
- `form.Subscribe` 读取 `canSubmit` / `isSubmitting` 驱动 `AuthSubmitButton` 的禁用与 loading。
- 字段错误取 `field.state.meta.errors[0]?.message` 传入 `AuthField.error`。

**涉及层及关键设计:** 前端展示层；表单受控、提交时校验（`validators.onSubmit`）。

### 模块 4: 模式切换与会话/加载态（apps/web）

- `mode` 状态 + `switchMode(next)`：相同模式直接返回；否则 `setMode` + 清成功态 + `form.reset()`。
- `AuthTabs` 与 `AuthSwitchPrompt` 均调用 `switchMode`。
- `useSession().isPending` 为真时返回 `<AuthBackground><Loader/></AuthBackground>`。
- 「忘记密码？」按钮 `onClick` → `toast.info("找回密码功能即将上线")`。

**涉及层及关键设计:** 前端展示层；路由 `apps/web/src/routes/index.tsx` 将 `AuthForm` 挂为根路由 `/` 组件。

## 接口契约

- `authClient.signIn.email({ email, password }, { onSuccess, onError })` — Better Auth 邮箱登录。
- `authClient.useSession()` → `{ data, isPending }` — 会话状态。
- baseURL: `VITE_SERVER_URL`（指向 AWS 承载的 Better Auth 服务）。

## 数据模型

前端不持有持久化模型；会话由 Better Auth 管理（cookie/session）。用户与会话表存于后端（Aurora/RDS，见 AWS 架构）。

## 安全考虑

- 密码字段默认隐藏，提供显式显示切换。
- 非提交交互元素一律 `type="button"`，避免误触发表单提交。
- 错误信息来自后端，前端仅展示，不泄露内部细节。
- 凭证经由 `VITE_SERVER_URL` 的 HTTPS 端点传输；不在 localStorage 存明文密码。

## 技术决策

| 决策             | 选项                              | 理由                                                       |
| ---------------- | --------------------------------- | ---------------------------------------------------------- |
| UI 组件归属      | 放 `packages/ui` 而非 `apps/web`  | 登录/注册共用，避免重复，符合 monorepo 复用约定             |
| 表单库           | TanStack React Form + Zod         | 与项目既有依赖一致，类型安全、提交时校验                    |
| 登录/注册同页    | 单页双模式 Tab                    | 符合 PRD 收敛多页认证为单卡片的目标                          |
| 反馈方式         | sonner toast                      | 项目根布局已挂 `<Toaster richColors />`，统一通知体验       |
