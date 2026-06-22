#!/usr/bin/env bash
# Ubuntu Server 24.04 LTS da Docker Engine + Compose o'rnatish
# Ishlatish: sudo bash scripts/install-docker-ubuntu24.sh

set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo ">>> sudo bilan ishga tushiring: sudo bash $0"
  exit 1
fi

echo ">>> Tizim yangilanmoqda..."
apt-get update
apt-get install -y ca-certificates curl gnupg

echo ">>> Docker GPG kaliti qo'shilmoqda..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo ">>> Docker repozitoriyasi qo'shilmoqda..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ">>> Docker xizmati yoqilmoqda..."
systemctl enable docker
systemctl start docker

if id -nG "${SUDO_USER:-root}" 2>/dev/null | grep -qw docker; then
  echo ">>> Foydalanuvchi allaqachon docker guruhida."
else
  if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
    usermod -aG docker "${SUDO_USER}"
    echo ">>> ${SUDO_USER} docker guruhiga qo'shildi."
    echo ">>> Eslatma: guruh yangilanishi uchun logout/login qiling yoki: newgrp docker"
  fi
fi

echo ""
echo ">>> Tayyor!"
docker --version
docker compose version
