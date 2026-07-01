import { expect, type Page, test } from "@playwright/test";

/**
 * E2E coverage for the login flow (feature: user-auth-login, task T-008).
 *
 * The Better Auth backend is mocked via route interception so the suite can
 * run without a live AWS-hosted auth service. Mocks target the
 * `better-auth/react` client endpoints used by `authClient.signIn.email`
 * and `authClient.useSession`.
 */

const SESSION_ENDPOINT = "**/api/auth/get-session";
const SIGN_IN_ENDPOINT = "**/api/auth/sign-in/email";

async function mockNoSession(page: Page) {
	await page.route(SESSION_ENDPOINT, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(null),
		})
	);
}

async function fillLoginForm(
	page: Page,
	{ email, password }: { email: string; password: string }
) {
	await page.getByPlaceholder("电子邮箱").fill(email);
	await page.getByPlaceholder("密码").fill(password);
}

function loginSubmitButton(page: Page) {
	return page.locator('form button[type="submit"]');
}

test.describe("登录流程", () => {
	test.beforeEach(async ({ page }) => {
		await mockNoSession(page);
	});

	test("默认展示登录模式的认证卡片", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByText("欢迎回来")).toBeVisible();
		await expect(page.getByText("登录您的账户继续使用")).toBeVisible();
		await expect(page.getByPlaceholder("电子邮箱")).toBeVisible();
		await expect(page.getByPlaceholder("密码")).toBeVisible();
	});

	test("校验报错：非法邮箱与过短密码分别提示", async ({ page }) => {
		await page.goto("/");

		// "user@localhost" satisfies the native HTML5 `type="email"` constraint
		// (so the click actually submits) but fails the stricter Zod email
		// regex, exercising the same code path a malformed address would.
		await fillLoginForm(page, { email: "user@localhost", password: "123" });
		await loginSubmitButton(page).click();

		await expect(page.getByText("请输入有效的电子邮箱")).toBeVisible();
		await expect(page.getByText("密码至少需要 8 个字符")).toBeVisible();
	});

	test("登录成功：展示成功态按钮与成功 toast", async ({ page }) => {
		await page.route(SIGN_IN_ENDPOINT, (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					user: { id: "u1", email: "user@example.com" },
					token: "mock-session-token",
				}),
			})
		);

		await page.goto("/");
		await fillLoginForm(page, {
			email: "user@example.com",
			password: "password123",
		});
		await loginSubmitButton(page).click();

		await expect(page.getByText("登录成功")).toBeVisible();
		await expect(page.getByRole("button", { name: "✓ 成功" })).toBeVisible();
	});

	test("登录失败：展示后端返回的错误信息 toast", async ({ page }) => {
		await page.route(SIGN_IN_ENDPOINT, (route) =>
			route.fulfill({
				status: 401,
				contentType: "application/json",
				// better-fetch spreads the response body directly into
				// `error`, so `authClient`'s `error.error.message` maps to
				// this body's top-level `message` field.
				body: JSON.stringify({ message: "邮箱或密码错误" }),
			})
		);

		await page.goto("/");
		await fillLoginForm(page, {
			email: "user@example.com",
			password: "wrongpassword",
		});
		const submitButton = loginSubmitButton(page);
		await expect(submitButton).toBeEnabled();
		await submitButton.click();

		await expect(page.getByText("邮箱或密码错误")).toBeVisible();
	});

	test("提交中：按钮显示加载态并禁用，避免重复提交", async ({ page }) => {
		await page.route(SIGN_IN_ENDPOINT, async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					user: { id: "u1", email: "user@example.com" },
					token: "mock-session-token",
				}),
			});
		});

		await page.goto("/");
		await fillLoginForm(page, {
			email: "user@example.com",
			password: "password123",
		});

		const submitButton = loginSubmitButton(page);
		await submitButton.click();

		await expect(submitButton).toBeDisabled();
		await expect(page.getByText("登录成功")).toBeVisible();
	});

	test("提交禁用：表单非法时按钮禁用 canSubmit 行为，输入合法后启用", async ({
		page,
	}) => {
		await page.goto("/");

		await fillLoginForm(page, { email: "user@localhost", password: "123" });
		const submitButton = loginSubmitButton(page);
		await submitButton.click();
		await expect(page.getByText("请输入有效的电子邮箱")).toBeVisible();

		await fillLoginForm(page, {
			email: "user@example.com",
			password: "password123",
		});
		await expect(submitButton).toBeEnabled();
	});

	test("会话加载态：useSession isPending 时展示 Loader", async ({ page }) => {
		await page.unroute(SESSION_ENDPOINT);
		await page.route(SESSION_ENDPOINT, async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 800));
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(null),
			});
		});

		await page.goto("/");

		// While the session request is still pending, AuthForm renders only
		// the spinner inside AuthBackground — the auth card (title) must not
		// be visible yet.
		const spinner = page.locator(".animate-spin");
		await expect(spinner).toBeVisible();
		await expect(page.getByText("欢迎回来")).not.toBeVisible();

		// Once the mocked session response resolves, the loader is replaced
		// by the login card.
		await expect(page.getByText("欢迎回来")).toBeVisible();
		await expect(spinner).not.toBeVisible();
	});

	test("忘记密码占位入口提示即将上线且无报错", async ({ page }) => {
		const pageErrors: Error[] = [];
		page.on("pageerror", (error) => pageErrors.push(error));

		await page.goto("/");
		await page.getByRole("button", { name: "忘记密码？" }).click();

		await expect(page.getByText("找回密码功能即将上线")).toBeVisible();
		expect(pageErrors).toHaveLength(0);
	});
});
