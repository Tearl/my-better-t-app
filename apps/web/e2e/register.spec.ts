import { expect, type Page, test } from "@playwright/test";

/**
 * E2E coverage for the register flow (feature: user-auth-register, task T-006).
 *
 * The Better Auth backend is mocked via route interception so the suite can
 * run without a live AWS-hosted auth service. Mocks target the
 * `better-auth/react` client endpoints used by `authClient.signUp.email`
 * and `authClient.useSession`.
 */

const SESSION_ENDPOINT = "**/api/auth/get-session";
const SIGN_UP_ENDPOINT = "**/api/auth/sign-up/email";

async function mockNoSession(page: Page) {
	await page.route(SESSION_ENDPOINT, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(null),
		})
	);
}

async function switchToRegister(page: Page) {
	await page.goto("/");
	await page.getByRole("button", { name: "注册", exact: true }).click();
	await expect(page.getByText("创建账号")).toBeVisible();
}

async function fillRegisterForm(
	page: Page,
	{
		username,
		email,
		password,
		confirm,
	}: { username: string; email: string; password: string; confirm: string }
) {
	await page.getByPlaceholder("用户名").fill(username);
	await page.getByPlaceholder("电子邮箱").fill(email);
	await page.getByPlaceholder("密码", { exact: true }).fill(password);
	await page.getByPlaceholder("确认密码").fill(confirm);
}

function registerSubmitButton(page: Page) {
	return page.locator('form button[type="submit"]');
}

test.describe("注册流程", () => {
	test.beforeEach(async ({ page }) => {
		await mockNoSession(page);
	});

	test("切换到注册模式出现用户名、确认密码字段，标题更新为创建账号，表单清空", async ({
		page,
	}) => {
		await switchToRegister(page);

		await expect(page.getByText("填写信息完成注册")).toBeVisible();
		await expect(page.getByPlaceholder("用户名")).toBeVisible();
		await expect(page.getByPlaceholder("确认密码")).toBeVisible();
		await expect(page.getByPlaceholder("用户名")).toHaveValue("");
		await expect(page.getByPlaceholder("电子邮箱")).toHaveValue("");
	});

	test("校验报错：用户名过短、邮箱非法、密码过短、确认密码不一致分别提示", async ({
		page,
	}) => {
		await switchToRegister(page);

		await fillRegisterForm(page, {
			username: "a",
			email: "user@localhost",
			password: "123",
			confirm: "456",
		});
		await registerSubmitButton(page).click();

		await expect(page.getByText("用户名至少需要 2 个字符")).toBeVisible();
		await expect(page.getByText("请输入有效的电子邮箱")).toBeVisible();
		await expect(page.getByText("密码至少需要 8 个字符")).toBeVisible();
	});

	test("校验报错：确认密码与密码不一致时单独提示且归属确认密码字段", async ({
		page,
	}) => {
		await switchToRegister(page);

		await fillRegisterForm(page, {
			username: "tester",
			email: "user@example.com",
			password: "password123",
			confirm: "password456",
		});
		await registerSubmitButton(page).click();

		await expect(page.getByText("两次输入的密码不一致")).toBeVisible();
	});

	test("注册成功：展示成功态按钮与成功 toast", async ({ page }) => {
		await page.route(SIGN_UP_ENDPOINT, (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					user: { id: "u1", email: "new@example.com" },
					token: "mock-session-token",
				}),
			})
		);

		await switchToRegister(page);
		await fillRegisterForm(page, {
			username: "newuser",
			email: "new@example.com",
			password: "password123",
			confirm: "password123",
		});
		await registerSubmitButton(page).click();

		await expect(page.getByText("注册成功")).toBeVisible();
		await expect(page.getByRole("button", { name: "✓ 成功" })).toBeVisible();
	});

	test("注册失败：展示后端返回的错误信息 toast", async ({ page }) => {
		await page.route(SIGN_UP_ENDPOINT, (route) =>
			route.fulfill({
				status: 422,
				contentType: "application/json",
				// better-fetch spreads the response body directly into
				// `error`, so `authClient`'s `error.error.message` maps to
				// this body's top-level `message` field.
				body: JSON.stringify({ message: "该邮箱已被注册" }),
			})
		);

		await switchToRegister(page);
		await fillRegisterForm(page, {
			username: "dupeuser",
			email: "dup@example.com",
			password: "password123",
			confirm: "password123",
		});
		await registerSubmitButton(page).click();

		await expect(page.getByText("该邮箱已被注册")).toBeVisible();
	});

	test("点击微信登录、QQ登录分别弹出即将上线提示且无报错", async ({ page }) => {
		const pageErrors: Error[] = [];
		page.on("pageerror", (error) => pageErrors.push(error));

		await switchToRegister(page);

		await page.getByRole("button", { name: "微信 登录" }).click();
		await expect(page.getByText("微信 登录即将上线")).toBeVisible();

		await page.getByRole("button", { name: "QQ 登录" }).click();
		await expect(page.getByText("QQ 登录即将上线")).toBeVisible();

		expect(pageErrors).toHaveLength(0);
	});

	test("模式联动：注册切回登录时重置表单与成功态，AuthSwitchPrompt 文案正确", async ({
		page,
	}) => {
		await switchToRegister(page);
		await expect(page.getByText("已有账号？")).toBeVisible();

		await fillRegisterForm(page, {
			username: "tester",
			email: "user@example.com",
			password: "password123",
			confirm: "password123",
		});

		await page.getByRole("button", { name: "去登录" }).click();

		await expect(page.getByText("欢迎回来")).toBeVisible();
		await expect(page.getByPlaceholder("电子邮箱")).toHaveValue("");
		await expect(page.getByPlaceholder("密码", { exact: true })).toHaveValue(
			""
		);
	});
});
