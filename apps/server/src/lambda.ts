import { handle } from "hono/aws-lambda";

import { app } from "./app";

// AWS Lambda 入口（由 API Gateway HTTP API 触发）。
// 在 SAM template.yaml 中以 `lambda.handler` 引用。
export const handler = handle(app);
