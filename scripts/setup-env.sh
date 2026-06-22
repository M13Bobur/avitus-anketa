#!/usr/bin/env bash
# .env faylni Docker deploy uchun tayyorlaydi
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env"
EXAMPLE=".env.docker.example"

if [[ ! -f "$ENV_FILE" ]]; then
  echo ">>> .env yaratilmoqda ($EXAMPLE dan)..."
  cp "$EXAMPLE" "$ENV_FILE"
fi

# Server IP ni aniqlash
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [[ -z "$SERVER_IP" ]]; then
  SERVER_IP="127.0.0.1"
fi

# CORS_ORIGIN placeholder ni almashtirish
if grep -q 'YOUR_SERVER_IP' "$ENV_FILE"; then
  sed -i "s|http://YOUR_SERVER_IP:3000|http://${SERVER_IP}:3000|g" "$ENV_FILE"
  echo ">>> CORS_ORIGIN = http://${SERVER_IP}:3000"
fi

# JWT_SECRET placeholder bo'lsa — tasodifiy kalit yaratish
if grep -q 'change-this-to-a-long-random-secret-key' "$ENV_FILE"; then
  if command -v openssl >/dev/null 2>&1; then
    NEW_SECRET="$(openssl rand -hex 32)"
  else
    NEW_SECRET="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  fi
  sed -i "s|change-this-to-a-long-random-secret-key|${NEW_SECRET}|g" "$ENV_FILE"
  echo ">>> JWT_SECRET avtomatik yaratildi"
fi

# Majburiy maydonlarni tekshirish
ERRORS=0

if grep -qE '^TELEGRAM_BOT_TOKEN=(your-telegram-bot-token|)$' "$ENV_FILE"; then
  echo ">>> XATO: TELEGRAM_BOT_TOKEN .env da to'ldirilmagan"
  ERRORS=1
fi

if grep -qE '^JWT_SECRET=$' "$ENV_FILE"; then
  echo ">>> XATO: JWT_SECRET .env da bo'sh"
  ERRORS=1
fi

if [[ "$ERRORS" -ne 0 ]]; then
  echo ""
  echo ">>> .env faylni tahrirlang: nano .env"
  exit 1
fi

echo ">>> .env tayyor"
grep -E '^(APP_PORT|CORS_ORIGIN|SEED_ADMIN_USERNAME)=' "$ENV_FILE" || true
