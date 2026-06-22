#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Tizim ==="
free -h 2>/dev/null || true
echo ""
grep -m1 'model name' /proc/cpuinfo 2>/dev/null || true
echo ""

echo "=== Docker ==="
docker compose ps -a
echo ""

echo "=== MongoDB loglari (oxirgi 40 qator) ==="
docker compose logs --tail=40 mongodb 2>&1 || true
echo ""

echo "=== MongoDB container holati ==="
docker inspect avitus-mongodb --format 'Status: {{.State.Status}}
ExitCode: {{.State.ExitCode}}
Error: {{.State.Error}}
Health: {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>&1 || true
echo ""

echo "=== MongoDB healthcheck log ==="
docker inspect avitus-mongodb --format '{{range .State.Health.Log}}{{.ExitCode}} {{.Output}}{{"\n"}}{{end}}' 2>&1 || true
echo ""

echo "=== MongoDB ping (container ichida) ==="
docker exec avitus-mongodb mongosh --quiet --eval 'db.adminCommand({ ping: 1 })' 2>&1 || \
docker exec avitus-mongodb mongo --quiet --eval 'db.adminCommand({ ping: 1 })' 2>&1 || \
echo "mongo ping muvaffaqiyatsiz"
