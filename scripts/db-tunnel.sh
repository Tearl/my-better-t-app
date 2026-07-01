#!/usr/bin/env bash
# 本地开发连 Aurora 的 SSM 端口转发隧道。
# 用法：在一个独立终端里跑 `pnpm db:tunnel`，保持它开着，再启后端。
# 需要本机已装 session-manager-plugin（~/bin 已放，确保在 PATH）。
set -euo pipefail

export PATH="$HOME/bin:$PATH"

EC2_ID="${DB_TUNNEL_EC2:-i-045e7eb667d3a37fa}"                 # web-server 跳板
RDS_HOST="${DB_TUNNEL_HOST:-database-japan.cluster-cetgw04im841.us-east-1.rds.amazonaws.com}"
REMOTE_PORT="${DB_TUNNEL_REMOTE_PORT:-5432}"
LOCAL_PORT="${DB_TUNNEL_LOCAL_PORT:-55432}"

echo "→ 开隧道：localhost:${LOCAL_PORT} → ${EC2_ID} → ${RDS_HOST}:${REMOTE_PORT}"
echo "  (保持此终端开启；Ctrl-C 关闭隧道)"

exec aws ssm start-session \
  --target "$EC2_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"${RDS_HOST}\"],\"portNumber\":[\"${REMOTE_PORT}\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
