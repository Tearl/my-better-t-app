# user-auth-register — 任务清单

## 任务版本

| 日期       | 版本 | 说明     |
| ---------- | ---- | -------- |
| 2026-06-30 | v1   | 初始任务 |

## 项目信息

- 项目名: my-better-t-app
- 架构类型: pnpm monorepo（Turborepo，apps/* + packages/*）
- specs 路径: specs/2.user-auth-register/

## 任务列表

### 功能 1: 注册表单字段

- [ ] T-001: 在 auth-form 注册模式下条件渲染用户名 + 确认密码字段（复用 `AuthField`，用户名 `User`、确认密码 `Lock`+password 切换），与已有邮箱/密码字段组合 ~30min

### 功能 2: 注册校验

- [ ] T-002: 定义 `registerSchema`（username ≥ 2、email 合法、password ≥ 8）并用 `.refine` 实现确认密码一致（错误归属 confirm）；`validators.onSubmit` 按 mode 选择 schema ~15min

### 功能 3: 注册提交集成

- [ ] T-003: 接入 `authClient.signUp.email({ name, email, password })`，实现成功态 + toast「注册成功」、失败 toast 错误信息 ~15min

### 功能 4: 模式联动与第三方占位

- [ ] T-004: 注册态标题/副标题与 `AuthSwitchPrompt`（「已有账号？去登录」）联动，`switchMode` 切换时 reset 表单与成功态 ~15min
- [ ] T-005: 接入 `AuthSocialButtons`（微信/QQ），点击 toast「{渠道} 登录即将上线」占位 ~15min

### 集成与测试

- [ ] T-006: 注册流程联调与 E2E（四项校验报错 / 注册成功 toast / 失败 toast / 社交占位提示），并跑 `pnpm dlx ultracite check` ~30min

## 依赖关系

- 本 feature 整体依赖 1.user-auth-login（共享 UI 组件库与 authClient）。
- T-001 依赖 `1.T-001`（AuthField）。
- T-002 依赖 `1.T-004`（loginSchema 与表单结构）。
- T-003 依赖 `1.T-003`（authClient）、T-001、T-002。
- T-004 依赖 `1.T-006`（switchMode/AuthTabs）。
- T-005 依赖 `1.T-002`（AuthSocialButtons/AuthDivider）。
- T-006 依赖 T-003、T-004、T-005。

## 风险点

- 若 1.user-auth-login 尚未完成，本 feature 无法开工 → 严格按 PLAN.md 顺序 1 → 2。
- 确认密码 refine 的错误 path 配置不当会导致错误不显示在 confirm 字段 → 测试中重点验证 AC-002。
- Better Auth 注册策略（如邮箱唯一性、密码强度）由后端决定，前端错误展示需覆盖后端返回信息。
