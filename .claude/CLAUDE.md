# 项目简介

`my-better-t-app` 是一个基于 TypeScript 全栈技术栈的 Web 应用，前端采用 Vite + React + TanStack（Router/Form/Query）+ tRPC，认证使用 Better Auth，当前核心功能为用户认证模块（登录/注册）。本项目以 **AWS 云端资源为主**进行部署与基础设施承载，完整的技术栈与架构详见：https://www.processon.com/view/link/62e77f4f7d9c08072e6eea09 （ProcessOn 架构图，主要技术栈均在该图中）。

---

## AWS Architecture Resources
本项目云端架构优先使用以下 AWS 资源，涉及功能设计、接口实现、部署方案、
权限配置和成本评估时，应优先参考这些服务边界：
- Aurora and RDS:业务数据库、项目记录、订单记录、用户生成任务元数据。
- Secrets Manager：效据库密码、第三方 API Key、支付密钥、AIGC 服务凭证等敏感配苣。
- Key Management Service：用户上传文件、生成视频、敏感数据和密钥材料加密。
- Lightsail：轻量部署、测试环境或独立服务承载。
- Amazon Bedrock: AIGC 能力入口，用于提示词理解、多模态生成链路或内容生成编排。
- Amazon Developer in chat applications：研发辅助、运维问答、团队协作中的AWS 开发支持。
- Amazon EventBridge: •异步任务事件、视频生成状态流转、支付成功事件、通知触发。
- 账单与成本管理：按项目跟踪AWS成本，评估生成任务、存储、数据库和队列成本。
- EC2: 后端服务、worker、AIGC 任务编排或需要常驻计算的服务。
- API Gateway：对外API 入口，承接 WebApp 与后端服务之间的请求。
- Amazon Q Business：面向业务知识库、运营文档或内部向答能力。
- Amazon Developer；代码开发、AWS 资源配置和排障辅助。
- Amazon Q:AWS 侧智能助手与资源查询辅助。
- IAM Identity Center：团队成员、控制台访问、权限边界和 SSO 管理。
- S3：用户上传图片/音频、生成视频、缩略图、静态资源和下载文件存储。

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
