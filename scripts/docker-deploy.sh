#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo ">>> .env topilmadi. .env.docker.example dan nusxa olinmoqda..."
  cp .env.docker.example .env
  echo ">>> .env faylini tahrirlang: JWT_SECRET, TELEGRAM_BOT_TOKEN, CORS_ORIGIN"
  exit 1
fi

echo ">>> Docker image build qilinmoqda..."
docker compose build --no-cache

echo ">>> Containerlar ishga tushirilmoqda..."
docker compose up -d

echo ""
echo ">>> Holat:"
docker compose ps

echo ""
echo ">>> Tayyor!"
echo "    Admin:   http://localhost:${APP_PORT:-3000}/login/"
echo "    Swagger: http://localhost:${APP_PORT:-3000}/api/docs"
echo "    Login:   admin / admin123  (agar .env da o'zgartirmagan bo'lsangiz)"
echo ""
echo "Loglar: docker compose logs -f backend"
