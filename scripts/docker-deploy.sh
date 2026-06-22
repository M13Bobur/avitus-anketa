#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NO_CACHE=""
if [[ "${1:-}" == "--no-cache" ]]; then
  NO_CACHE="--no-cache"
fi

echo "============================================"
echo "  Avitus Anketa — Docker Deploy"
echo "============================================"

# Docker tekshiruvi
if ! command -v docker >/dev/null 2>&1; then
  echo ">>> XATO: Docker o'rnatilmagan"
  echo ">>> sudo bash scripts/install-docker-ubuntu24.sh"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo ">>> XATO: Docker daemon ishlamayapti"
  echo ">>> sudo systemctl start docker"
  exit 1
fi

# .env tayyorlash
bash scripts/setup-env.sh

# Eski containerlarni tozalash (volume saqlanadi)
echo ""
echo ">>> Eski containerlar tozalanmoqda..."
docker compose down --remove-orphans 2>/dev/null || true

# Build
echo ""
echo ">>> Docker image build qilinmoqda (birinchi marta 5-15 daqiqa)..."
docker compose build ${NO_CACHE:+$NO_CACHE}

# Ishga tushirish
echo ""
echo ">>> Containerlar ishga tushirilmoqda..."
if docker compose up -d --force-recreate --remove-orphans --wait 2>/dev/null; then
  echo ">>> Barcha servislar healthy"
else
  echo ">>> --wait qo'llab-quvvatlanmaydi, qo'lda kutilmoqda..."
  UP_OUTPUT="$(docker compose up -d --force-recreate --remove-orphans 2>&1)" || {
    echo "$UP_OUTPUT"
    if echo "$UP_OUTPUT" | grep -qi 'address already in use'; then
      APP_PORT="$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 3000)"
      echo ""
      echo ">>> XATO: Port ${APP_PORT} band — backend ishga tushmaydi, bot ham ishlamaydi"
      echo ">>> Kim ishlatyapti:"
      bash scripts/check-port.sh "$APP_PORT" || true
      echo ""
      echo ">>> Tez yechim — boshqa port:"
      echo "    bash scripts/setup-env.sh && ./scripts/docker-deploy.sh"
      echo ""
      echo ">>> Yoki band processni to'xtating:"
      echo "    sudo ss -tlnp | grep :${APP_PORT}"
    fi
    exit 1
  }

  for i in $(seq 1 90); do
    MONGO_OK=$(docker inspect avitus-mongodb --format '{{.State.Health.Status}}' 2>/dev/null || echo "none")
    BACKEND_OK=$(docker inspect avitus-backend --format '{{.State.Status}}' 2>/dev/null || echo "none")

    if [[ "$MONGO_OK" == "healthy" && "$BACKEND_OK" == "running" ]]; then
      break
    fi

    if [[ "$BACKEND_OK" == "exited" ]]; then
      echo ">>> XATO: Backend to'xtadi!"
      docker compose logs --tail=30 backend
      exit 1
    fi

    printf "\r>>> Kutilmoqda... %ds (mongo=%s, backend=%s)  " "$i" "$MONGO_OK" "$BACKEND_OK"
    sleep 2
  done
  echo ""
fi

# Natija
echo ""
echo ">>> Holat:"
docker compose ps

BACKEND_STATUS=$(docker inspect avitus-backend --format '{{.State.Status}}' 2>/dev/null || echo "missing")
if [[ "$BACKEND_STATUS" != "running" ]]; then
  echo ""
  echo ">>> XATO: Backend ishlamayapti (status: $BACKEND_STATUS)"
  echo ">>> Loglar:"
  docker compose logs --tail=40 backend
  exit 1
fi

APP_PORT="$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 3000)"
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo localhost)"

echo ""
echo "============================================"
echo "  DEPLOY MUVAFFAQIYATLI!"
echo "============================================"
echo "  Admin:   http://${SERVER_IP}:${APP_PORT}/login/"
echo "  Swagger: http://${SERVER_IP}:${APP_PORT}/api/docs"
echo "  Login:   admin / admin123"
echo ""
echo "  Loglar:  docker compose logs -f backend"
echo "  To'xtat: docker compose down"
echo "============================================"
