#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Containerlar ==="
docker compose ps -a
echo ""

echo "=== Backend (oxirgi 20 qator) ==="
docker compose logs --tail=20 backend 2>&1 || echo "backend log yo'q"
echo ""

echo "=== MongoDB (oxirgi 10 qator) ==="
docker compose logs --tail=10 mongodb 2>&1 || echo "mongodb log yo'q"
echo ""

APP_PORT="$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 3000)"
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo 127.0.0.1)"

echo "=== HTTP tekshiruv ==="
if curl -sf "http://127.0.0.1:${APP_PORT}/api/docs" >/dev/null 2>&1; then
  echo "OK  http://${SERVER_IP}:${APP_PORT}/api/docs"
  echo "OK  http://${SERVER_IP}:${APP_PORT}/login/"
else
  echo "XATO  http://127.0.0.1:${APP_PORT} javob bermayapti"
fi
