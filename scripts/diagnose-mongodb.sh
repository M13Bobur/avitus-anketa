#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Tizim ==="
free -h 2>/dev/null || true
grep -m1 'model name' /proc/cpuinfo 2>/dev/null || true
grep -q avx /proc/cpuinfo 2>/dev/null && echo "AVX: bor" || echo "AVX: YO'Q (mongo:4.4 ishlatiladi)"
echo ""

echo "=== Containerlar ==="
docker compose ps -a
echo ""

echo "=== MongoDB loglari ==="
docker compose logs --tail=20 mongodb 2>&1 || true
echo ""

echo "=== Backend loglari ==="
docker compose logs --tail=20 backend 2>&1 || true
echo ""

echo "=== MongoDB ping ==="
docker exec avitus-mongodb mongo --quiet --eval 'db.adminCommand({ ping: 1 })' 2>&1 || echo "ping muvaffaqiyatsiz"
