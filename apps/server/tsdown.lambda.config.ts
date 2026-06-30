import { defineConfig } from "tsdown";

// Lambda 专用打包：把所有依赖（含 node_modules）内联进单文件，
// 产出 dist-lambda/lambda.mjs，由 SAM 直接 zip 上传，无需 node_modules。
export default defineConfig({
	entry: "./src/lambda.ts",
	format: "esm",
	platform: "node",
	target: "node20",
	outDir: "./dist-lambda",
	clean: true,
	// 全部内联，保证 Lambda 包自包含
	noExternal: [/.*/],
	outExtensions: () => ({ js: ".mjs" }),
});
