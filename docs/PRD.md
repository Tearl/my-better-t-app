# 产品需求文档（PRD）— 用户认证模块

> 版本：v1.0 ｜ 日期：2026-06-30 ｜ 负责人：前端团队
> 范围：本 PRD 描述当前 Web 前端已实现/在建的「用户认证」需求。仅覆盖前端可见的功能与交互，后端能力以 Better Auth 提供的接口为依赖。

---

## 1. 背景与目标

应用 `my-better-t-app` 需要一个统一的入口页，让访客完成**注册**与**登录**，并为后续业务页面提供会话状态。当前前端已将原先分散的多页认证（独立的 `login`、`sign-in-form`、`sign-up-form`、`dashboard`、`header`、`user-menu` 等）收敛为**单页、双模式（登录/注册）**的认证卡片，统一视觉风格与交互。

### 目标
- 提供一个美观、响应式、可访问的认证入口，登录与注册在同一卡片内通过 Tab 切换。
- 前端完成表单校验，减少无效请求，给出即时、本地化（中文）的错误提示。
- 与 Better Auth（邮箱 + 密码）打通，登录/注册成功后建立会话。
- 预留第三方登录（微信 / QQ）与「忘记密码」入口。

### 非目标（本期不做）
- 第三方社交登录的真实对接（仅占位提示「即将上线」）。
- 找回/重置密码的完整流程（仅占位提示）。
- 登录后的业务页面 / Dashboard（原 dashboard 已移除，后续单独立项）。
- 多语言 i18n（当前文案硬编码为简体中文）。

---

## 2. 技术栈与现状

| 维度 | 选型 |
| --- | --- |
| 构建 | Vite 8 + React 19 |
| 路由 | TanStack Router（文件路由） |
| 表单 | TanStack React Form + Zod 校验 |
| 数据 | TanStack Query + tRPC |
| 认证 | Better Auth（`better-auth/react`，邮箱+密码） |
| UI | 内部 UI 包 `@my-better-t-app/ui`、Tailwind CSS v4、lucide-react 图标 |
| 主题 | next-themes（默认 `dark`） |
| 通知 | sonner（`<Toaster richColors />`） |

**关键文件**
- 入口路由：[`apps/web/src/routes/index.tsx`](apps/web/src/routes/index.tsx) → 渲染 `AuthForm`
- 业务表单：[`apps/web/src/components/auth-form.tsx`](apps/web/src/components/auth-form.tsx)
- UI 组件库：[`packages/ui/src/components/auth-card.tsx`](packages/ui/src/components/auth-card.tsx)
- 认证客户端：[`apps/web/src/lib/auth-client.ts`](apps/web/src/lib/auth-client.ts)
- 根布局：[`apps/web/src/routes/__root.tsx`](apps/web/src/routes/__root.tsx)

---

## 3. 功能需求

### 3.1 模式切换（登录 / 注册）
- 卡片顶部提供分段控件（`AuthTabs`），在「登录」「注册」之间切换。
- 卡片底部提供文字切换入口（`AuthSwitchPrompt`）：登录态显示「还没有账号？立即注册」，注册态显示「已有账号？去登录」。
- 切换模式时：重置表单、清空成功态、更新标题/副标题与校验规则。
- 标题随模式变化：登录「欢迎回来 / 登录您的账户继续使用」，注册「创建账号 / 填写信息完成注册」。

### 3.2 注册
**字段**：用户名、电子邮箱、密码、确认密码。
**校验（Zod，提交时触发）**：
- 用户名：至少 2 个字符（「用户名至少需要 2 个字符」）。
- 邮箱：合法邮箱格式（「请输入有效的电子邮箱」）。
- 密码：至少 8 个字符（「密码至少需要 8 个字符」）。
- 确认密码：必须与密码一致（「两次输入的密码不一致」，错误归属到确认密码字段）。

**行为**：校验通过后调用 `authClient.signUp.email({ name, email, password })`。
- 成功：进入成功态（按钮显示「✓ 成功」），toast 「注册成功」。
- 失败：toast 显示后端错误信息（`error.message` 或 `statusText`）。

### 3.3 登录
**字段**：电子邮箱、密码（用户名/确认密码字段隐藏）。
**校验**：邮箱合法、密码至少 8 个字符。
**行为**：调用 `authClient.signIn.email({ email, password })`。
- 成功：成功态 + toast 「登录成功」。
- 失败：toast 显示后端错误信息。
- 提供「忘记密码？」入口，点击 toast 提示「找回密码功能即将上线」。

### 3.4 第三方登录（占位）
- 在分隔线（`AuthDivider`，文案「或」）下方展示两个按钮：「微信登录」「QQ登录」。
- 点击 toast 提示「{渠道} 登录即将上线」。本期不做真实对接。

### 3.5 会话与加载态
- 通过 `authClient.useSession()` 获取会话；当 `isPending` 时，展示居中 `Loader`（包裹在认证背景内）。
- 提交按钮在 `isSubmitting` 期间显示加载动画并禁用；表单不可提交时（`canSubmit` 为 false）禁用按钮。

---

## 4. 交互与视觉规范

- **整体风格**：玻璃拟态（glassmorphism）暗色卡片，紫/靛色渐变背景，含三枚模糊光晕（`FloatingOrb`）与极淡网格。
- **卡片**：最大宽度 `max-w-sm`，圆角 `rounded-2xl`，半透明 + `backdrop-blur`。
- **图标**：标题徽章 `Sparkles`；字段前缀图标 用户名 `User`、邮箱 `Mail`、密码 `Lock`。
- **字体**：标题 `Playfair Display`，正文/控件 `Inter`。
- **输入框**：图标前缀、聚焦高亮、密码字段带显示/隐藏切换（`Eye`/`EyeOff`）。
- **提交按钮**：渐变填充，含「默认 / 加载中 / 成功」三态，成功态切换为绿色渐变。
- **字段错误**：在输入框下方以红色小字展示首条错误信息。

---

## 5. 可访问性与质量要求

- 表单字段需有可识别的 `name`、`placeholder`，密码切换、社交按钮等均为 `<button type="button">` 避免误提交。
- 键盘可操作：Tab 可达所有交互元素，回车提交表单。
- 文案统一简体中文，错误信息清晰可读。
- 遵循项目 Ultracite/Biome 规范（`pnpm dlx ultracite fix` 通过）。

---

## 6. 验收标准

| # | 场景 | 预期 |
| --- | --- | --- |
| 1 | 打开首页 | 显示认证卡片，默认「登录」模式 |
| 2 | 切换到注册 | 出现用户名、确认密码字段，标题更新，表单清空 |
| 3 | 注册校验 | 用户名<2、邮箱非法、密码<8、两次密码不一致 分别给出对应中文错误 |
| 4 | 注册成功 | 按钮变绿显示成功，toast「注册成功」 |
| 5 | 登录成功 | toast「登录成功」，会话建立 |
| 6 | 登录/注册失败 | toast 显示后端错误信息 |
| 7 | 忘记密码 / 微信 / QQ | 点击均弹出「即将上线」提示，无报错 |
| 8 | 会话加载中 | 显示 Loader |
| 9 | 提交中 | 按钮 loading 且禁用，防止重复提交 |

---

## 7. 后续规划（Backlog）

- 第三方登录（微信 / QQ / 更多）真实对接。
- 找回密码 / 邮箱验证流程。
- 登录后业务页面与受保护路由、用户菜单（`user-menu`）、顶部导航（`header`）。
- i18n 多语言支持。
- 记住登录状态 / 自动登录的体验优化。
