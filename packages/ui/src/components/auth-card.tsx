import { cn } from "@my-better-t-app/ui/lib/utils";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import * as React from "react";

export type AuthMode = "login" | "register";

/** Ambient blurred orb used to decorate the auth background. */
function FloatingOrb({ className }: { className: string }) {
	return (
		<div
			className={cn(
				"pointer-events-none absolute rounded-full opacity-20 blur-3xl",
				className
			)}
		/>
	);
}

/**
 * Full-screen gradient backdrop with ambient orbs and a subtle grid.
 * Centers its children (typically an <AuthCard />).
 */
function AuthBackground({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"relative flex min-h-screen w-full items-center justify-center overflow-hidden",
				className
			)}
			style={{
				background:
					"linear-gradient(145deg, #0f0720 0%, #1a0840 40%, #0d1035 100%)",
			}}
		>
			{/* Ambient orbs */}
			<FloatingOrb className="-top-20 -left-20 h-96 w-96 bg-purple-600" />
			<FloatingOrb className="right-0 bottom-0 h-80 w-80 bg-violet-500" />
			<FloatingOrb className="top-1/2 left-1/4 h-48 w-48 bg-indigo-600" />

			{/* Subtle grid */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			{children}
		</div>
	);
}

/** Glassmorphism card container for the auth content. */
function AuthCard({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl",
				className
			)}
			style={{
				background: "rgba(255,255,255,0.05)",
				backdropFilter: "blur(24px)",
				border: "1px solid rgba(168,85,247,0.18)",
				boxShadow:
					"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.08) inset",
			}}
		>
			{children}
		</div>
	);
}

/** Branded header with an icon badge, title and subtitle. */
function AuthHeader({
	icon: Icon,
	title,
	subtitle,
}: {
	icon: React.ElementType;
	title: string;
	subtitle: string;
}) {
	return (
		<div className="px-8 pt-10 pb-6 text-center">
			<div
				className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
				style={{
					background: "linear-gradient(135deg, #7c3aed, #a855f7)",
					boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
				}}
			>
				<Icon className="text-white" size={22} />
			</div>
			<h1
				className="mb-1 font-semibold text-2xl text-white tracking-tight"
				style={{ fontFamily: "Playfair Display, serif" }}
			>
				{title}
			</h1>
			<p
				className="text-purple-300/60 text-sm"
				style={{ fontFamily: "Inter, sans-serif" }}
			>
				{subtitle}
			</p>
		</div>
	);
}

/** Segmented login / register switcher. */
function AuthTabs({
	mode,
	onModeChange,
	loginLabel = "登录",
	registerLabel = "注册",
}: {
	mode: AuthMode;
	onModeChange: (mode: AuthMode) => void;
	loginLabel?: string;
	registerLabel?: string;
}) {
	const tabs: { key: AuthMode; label: string }[] = [
		{ key: "login", label: loginLabel },
		{ key: "register", label: registerLabel },
	];

	return (
		<div
			className="mx-8 mb-6 flex rounded-xl p-1"
			style={{ background: "rgba(255,255,255,0.05)" }}
		>
			{tabs.map(({ key, label }) => (
				<button
					className="flex-1 rounded-lg py-2 font-medium text-sm transition-all duration-200"
					key={key}
					onClick={() => onModeChange(key)}
					style={{
						fontFamily: "Inter, sans-serif",
						background:
							mode === key
								? "linear-gradient(135deg, #7c3aed, #a855f7)"
								: "transparent",
						color: mode === key ? "#fff" : "rgba(168,85,247,0.6)",
						boxShadow:
							mode === key ? "0 4px 16px rgba(124,58,237,0.35)" : "none",
					}}
					type="button"
				>
					{label}
				</button>
			))}
		</div>
	);
}

/** Body wrapper used to hold the form fields with the card's padding. */
function AuthBody({
	className,
	children,
	...props
}: React.ComponentProps<"form">) {
	return (
		<form className={cn("space-y-3.5 px-8 pb-8", className)} {...props}>
			{children}
		</form>
	);
}

type AuthFieldProps = Omit<
	React.ComponentProps<"input">,
	"onChange" | "value"
> & {
	icon: React.ElementType;
	value: string;
	onValueChange: (value: string) => void;
	/** Enables the show/hide password toggle. */
	password?: boolean;
	error?: string;
};

/** Icon-prefixed input with an optional password visibility toggle. */
function AuthField({
	icon: Icon,
	value,
	onValueChange,
	password = false,
	error,
	type,
	className,
	...props
}: AuthFieldProps) {
	const [show, setShow] = React.useState(false);
	const resolvedType = password ? (show ? "text" : "password") : type;

	return (
		<div className="space-y-1.5">
			<div className="group relative">
				<div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
					<Icon
						className="text-purple-400/60 transition-colors duration-200 group-focus-within:text-purple-300"
						size={18}
					/>
				</div>
				<input
					className={cn(
						"w-full rounded-xl border border-purple-500/20 bg-white/5 py-3.5 pr-11 pl-11 text-sm text-white placeholder-purple-300/40 transition-all duration-200 hover:border-purple-500/30 hover:bg-white/[0.06] focus:border-purple-400/60 focus:bg-white/[0.08] focus:outline-none",
						className
					)}
					onChange={(e) => onValueChange(e.target.value)}
					style={{ fontFamily: "Inter, sans-serif" }}
					type={resolvedType}
					value={value}
					{...props}
				/>
				{password && (
					<button
						className="absolute inset-y-0 right-4 flex items-center text-purple-400/50 transition-colors duration-200 hover:text-purple-300"
						onClick={() => setShow((v) => !v)}
						type="button"
					>
						{show ? <EyeOff size={16} /> : <Eye size={16} />}
					</button>
				)}
			</div>
			{error && (
				<p
					className="pl-1 text-red-400 text-xs"
					style={{ fontFamily: "Inter, sans-serif" }}
				>
					{error}
				</p>
			)}
		</div>
	);
}

/** Gradient submit button with loading and success states. */
function AuthSubmitButton({
	loading = false,
	success = false,
	successLabel = "✓ 成功",
	children,
	className,
	disabled,
	...props
}: React.ComponentProps<"button"> & {
	loading?: boolean;
	success?: boolean;
	successLabel?: string;
}) {
	return (
		<button
			className={cn(
				"flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed",
				className
			)}
			disabled={loading || disabled}
			style={{
				fontFamily: "Inter, sans-serif",
				background: success
					? "linear-gradient(135deg, #059669, #10b981)"
					: loading
						? "rgba(124,58,237,0.5)"
						: "linear-gradient(135deg, #7c3aed, #a855f7)",
				boxShadow: success
					? "0 8px 24px rgba(16,185,129,0.35)"
					: "0 8px 24px rgba(124,58,237,0.4)",
			}}
			type="submit"
			{...props}
		>
			{loading ? (
				<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
			) : success ? (
				successLabel
			) : (
				<>
					{children}
					<ArrowRight size={16} />
				</>
			)}
		</button>
	);
}

/** Labelled divider, e.g. "or". */
function AuthDivider({ label = "或" }: { label?: string }) {
	return (
		<div className="flex items-center gap-3 py-1">
			<div
				className="h-px flex-1"
				style={{ background: "rgba(168,85,247,0.15)" }}
			/>
			<span
				className="text-purple-400/40 text-xs"
				style={{ fontFamily: "Inter, sans-serif" }}
			>
				{label}
			</span>
			<div
				className="h-px flex-1"
				style={{ background: "rgba(168,85,247,0.15)" }}
			/>
		</div>
	);
}

/** Grid of social-login buttons. */
function AuthSocialButtons({
	providers,
	onSelect,
}: {
	providers: string[];
	onSelect?: (provider: string) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{providers.map((name) => (
				<button
					className="rounded-xl py-3 font-medium text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
					key={name}
					onClick={() => onSelect?.(name)}
					style={{
						fontFamily: "Inter, sans-serif",
						background: "rgba(255,255,255,0.05)",
						border: "1px solid rgba(168,85,247,0.15)",
						color: "rgba(168,85,247,0.7)",
					}}
					type="button"
				>
					{name} 登录
				</button>
			))}
		</div>
	);
}

/** Inline "no account? / already have an account?" prompt with a switch action. */
function AuthSwitchPrompt({
	text,
	actionLabel,
	onAction,
}: {
	text: string;
	actionLabel: string;
	onAction: () => void;
}) {
	return (
		<p
			className="pt-1 text-center text-purple-400/40 text-xs"
			style={{ fontFamily: "Inter, sans-serif" }}
		>
			{text}
			<button
				className="ml-1 text-purple-400 transition-colors duration-150 hover:text-purple-300"
				onClick={onAction}
				type="button"
			>
				{actionLabel}
			</button>
		</p>
	);
}

export {
	AuthBackground,
	AuthBody,
	AuthCard,
	AuthDivider,
	AuthField,
	AuthHeader,
	AuthSocialButtons,
	AuthSubmitButton,
	AuthSwitchPrompt,
	AuthTabs,
};
