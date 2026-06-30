# user-auth-register — 技术设计

## 设计版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-06-30 | v1   | 初始设计 |

## 项目架构

- 架构类型: pnpm monorepo（Turborepo），`apps/web` 前端 + `packages/ui` 共享 UI。
- 后端: Better Auth（AWS 云端资源承载，见 `.claude/CLAUDE.md`），前端经 `VITE_SERVER_URL` 访问。
- 涉及层: 前端展示层（`apps/web`）、共享 UI 层（复用 1.user-auth-login 已建组件）、认证客户端层。

## 功能模块设计

### 模块 1: 注册表单字段与条件渲染（apps/web）

在 `apps/web/src/components/auth-form.tsx` 的注册模式下渲染用户名、邮箱、密码、确认密码四个字段，复用 `AuthField`（用户名 `User` 图标、邮箱 `Mail`、密码/确认密码 `Lock` + password 切换）。用户名与确认密码字段以 `mode === "register"` 条件渲染。

**涉及层及关键设计:** 前端展示层；字段受控、错误取 `field.state.meta.errors[0]?.message`。

### 模块 2: 注册校验（apps/web）

`registerSchema`（Zod）：

- `username` ≥ 2、`email` 合法、`password` ≥ 8（复用 `passwordSchema`）。
- `.refine(data => data.password === data.confirm, { message: "两次输入的密码不一致", path: ["confirm"] })` 实现确认密码一致校验。
- `validators.onSubmit` 按 `mode` 选择 `loginSchema`（来自 1.user-auth-login）或 `registerSchema`。

**涉及层及关键设计:** 前端展示层；提交时整表校验，refine 错误归属 confirm 字段。

### 模块 3: 注册提交集成（apps/web）

`onSubmit`（mode=register）调用 `authClient.signUp.email({ name: username, email, password })`：

- `onSuccess` → `setSuccess(true)` + `toast.success("注册成功")`。
- `onError` → `toast.error(error.error.message ?? error.error.statusText)`。
- 提交态复用 `form.Subscribe` 的 `canSubmit`/`isSubmitting` 驱动 `AuthSubmitButton`。

**涉及层及关键设计:** 认证客户端层 + 前端展示层；复用 1.user-auth-login 的 `authClient`。

### 模块 4: 模式联动与第三方占位（apps/web）

- `switchMode` 在 register/login 间切换时 `form.reset()` + 清成功态；注册态标题「创建账号 / 填写信息完成注册」，`AuthSwitchPrompt` 文案「已有账号？去登录」。
- `AuthSocialButtons providers={["微信", "QQ"]} onSelect={name => toast.info(\`${name} 登录即将上线\`)}`，置于 `AuthDivider` 下方。

**涉及层及关键设计:** 前端展示层；社交按钮为占位，无真实 OAuth。

## 接口契约

- `authClient.signUp.email({ name, email, password }, { onSuccess, onError })` — Better Auth 邮箱注册。
- 第三方登录：本期无契约（占位 toast）。

## 数据模型

用户记录由 Better Auth 在后端创建（Aurora/RDS，见 AWS 架构）；前端不持久化模型。

## 安全考虑

- 密码、确认密码字段默认隐藏。
- 确认密码一致校验在前端先行拦截，降低无效注册请求。
- 社交占位按钮 `type="button"`，避免误提交。

## 技术决策

| 决策                 | 选项                                  | 理由                                               |
| -------------------- | ------------------------------------- | -------------------------------------------------- |
| 注册与登录同组件      | 复用 `auth-form.tsx` 的 mode 分支     | 单页双模式，最大化复用字段与提交逻辑               |
| 确认密码校验          | Zod `.refine` + `path: ["confirm"]`   | 错误精准归属确认密码字段，体验清晰                 |
| 第三方登录            | 本期占位 toast                        | 符合 PRD 非目标，避免未就绪的 OAuth 引入风险       |
