#!/usr/bin/env bash
# Port bandligini tekshiradi
set -euo pipefail

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tlnH 2>/dev/null | awk '{print $4}' | grep -qE ":${port}$"
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

who_uses_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tlnpH 2>/dev/null | grep ":${port} " || true
    return
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true
  fi
}

find_free_port() {
  local start="${1:-3000}"
  local end="${2:-3010}"
  local p
  for ((p=start; p<=end; p++)); do
    if ! port_in_use "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

# CLI: bash scripts/check-port.sh [port]
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  PORT="${1:-3000}"
  if port_in_use "$PORT"; then
    echo "BAND: port $PORT ishlatilmoqda"
    who_uses_port "$PORT"
    FREE=$(find_free_port "$((PORT+1))" 3010 || true)
    [[ -n "$FREE" ]] && echo "Bo'sh port: $FREE"
    exit 1
  fi
  echo "OK: port $PORT bo'sh"
fi
