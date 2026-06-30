import {
	AuthBackground,
	AuthBody,
	AuthCard,
	AuthDivider,
	AuthField,
	AuthHeader,
	type AuthMode,
	AuthSocialButtons,
	AuthSubmitButton,
	AuthSwitchPrompt,
	AuthTabs,
} from "@my-better-t-app/ui/components/auth-card";
import { useForm } from "@tanstack/react-form";
import { Lock, Mail, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

const passwordSchema = z.string().min(8, "密码至少需要 8 个字符");

const loginSchema = z.object({
	username: z.string(),
	email: z.email("请输入有效的电子邮箱"),
	password: passwordSchema,
	confirm: z.string(),
});

const registerSchema = z
	.object({
		username: z.string().min(2, "用户名至少需要 2 个字符"),
		email: z.email("请输入有效的电子邮箱"),
		password: passwordSchema,
		confirm: z.string(),
	})
	.refine((data) => data.password === data.confirm, {
		message: "两次输入的密码不一致",
		path: ["confirm"],
	});

export default function AuthForm() {
	const { isPending } = authClient.useSession();

	const [mode, setMode] = useState<AuthMode>("login");
	const [success, setSuccess] = useState(false);

	const form = useForm({
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirm: "",
		},
		onSubmit: async ({ value }) => {
			if (mode === "login") {
				await authClient.signIn.email(
					{ email: value.email, password: value.password },
					{
						onSuccess: () => {
							setSuccess(true);
							toast.success("登录成功");
						},
						onError: (error) => {
							toast.error(error.error.message || error.error.statusText);
						},
					}
				);
				return;
			}

			await authClient.signUp.email(
				{
					name: value.username,
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						setSuccess(true);
						toast.success("注册成功");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: mode === "login" ? loginSchema : registerSchema,
		},
	});

	const switchMode = (next: AuthMode) => {
		if (next === mode) {
			return;
		}
		setMode(next);
		setSuccess(false);
		form.reset();
	};

	if (isPending) {
		return (
			<AuthBackground>
				<Loader />
			</AuthBackground>
		);
	}

	return (
		<AuthBackground>
			<AuthCard>
				<AuthHeader
					icon={Sparkles}
					subtitle={
						mode === "login" ? "登录您的账户继续使用" : "填写信息完成注册"
					}
					title={mode === "login" ? "欢迎回来" : "创建账号"}
				/>

				<AuthTabs mode={mode} onModeChange={switchMode} />

				<AuthBody
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					{mode === "register" && (
						<form.Field name="username">
							{(field) => (
								<AuthField
									error={field.state.meta.errors[0]?.message}
									icon={User}
									name={field.name}
									onBlur={field.handleBlur}
									onValueChange={field.handleChange}
									placeholder="用户名"
									type="text"
									value={field.state.value}
								/>
							)}
						</form.Field>
					)}

					<form.Field name="email">
						{(field) => (
							<AuthField
								error={field.state.meta.errors[0]?.message}
								icon={Mail}
								name={field.name}
								onBlur={field.handleBlur}
								onValueChange={field.handleChange}
								placeholder="电子邮箱"
								type="email"
								value={field.state.value}
							/>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<AuthField
								error={field.state.meta.errors[0]?.message}
								icon={Lock}
								name={field.name}
								onBlur={field.handleBlur}
								onValueChange={field.handleChange}
								password
								placeholder="密码"
								value={field.state.value}
							/>
						)}
					</form.Field>

					{mode === "register" && (
						<form.Field name="confirm">
							{(field) => (
								<AuthField
									error={field.state.meta.errors[0]?.message}
									icon={Lock}
									name={field.name}
									onBlur={field.handleBlur}
									onValueChange={field.handleChange}
									password
									placeholder="确认密码"
									value={field.state.value}
								/>
							)}
						</form.Field>
					)}

					{mode === "login" && (
						<div className="flex justify-end">
							<button
								className="text-purple-400/60 text-xs transition-colors duration-150 hover:text-purple-300"
								onClick={() => toast.info("找回密码功能即将上线")}
								style={{ fontFamily: "Inter, sans-serif" }}
								type="button"
							>
								忘记密码？
							</button>
						</div>
					)}

					<div className="pt-2">
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<AuthSubmitButton
									disabled={!canSubmit}
									loading={isSubmitting}
									success={success}
								>
									{mode === "login" ? "登录" : "注册"}
								</AuthSubmitButton>
							)}
						</form.Subscribe>
					</div>

					<AuthDivider />

					<AuthSocialButtons
						onSelect={(name) => toast.info(`${name} 登录即将上线`)}
						providers={["微信", "QQ"]}
					/>

					<AuthSwitchPrompt
						actionLabel={mode === "login" ? "立即注册" : "去登录"}
						onAction={() => switchMode(mode === "login" ? "register" : "login")}
						text={mode === "login" ? "还没有账号？" : "已有账号？"}
					/>
				</AuthBody>
			</AuthCard>
		</AuthBackground>
	);
}
