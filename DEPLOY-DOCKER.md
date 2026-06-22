# Ubuntu Server 24.04 — Docker deploy

Bu qo'llanma **Avitus Anketa** loyihasini **Ubuntu Server 24.04 LTS** da Docker bilan ishga tushirish uchun.

Node.js va MongoDB alohida o'rnatilmaydi — hammasi container ichida ishlaydi.

---

## Talablar

| Resurs | Minimum |
|--------|---------|
| OS | Ubuntu Server 24.04 LTS |
| RAM | 2 GB (4 GB tavsiya) |
| Disk | 5 GB bo'sh |
| Tarmoq | Internet (build va Telegram uchun) |

---

## 1-qadam: Serverga ulanish

```bash
ssh user@SERVER_IP
```

---

## 2-qadam: Docker o'rnatish

### Variant A — avtomatik skript (tavsiya)

```bash
# Loyiha papkasida yoki skriptni serverga ko'chirib:
sudo bash scripts/install-docker-ubuntu24.sh
```

Skriptdan keyin (agar `docker` guruhiga qo'shilgan bo'lsangiz):

```bash
newgrp docker
# yoki SSH sessiyani qayta oching
```

### Variant B — qo'lda

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

Tekshirish:

```bash
docker --version
docker compose version
```

---

## 3-qadam: Loyihani serverga ko'chirish

### Git orqali (tavsiya)

```bash
cd ~
git clone <repo-url> avitus-anketa
cd avitus-anketa
```

### ZIP/arxiV orqali

Mahalliy kompyuterdan (node_modules va dist siz):

```bash
tar --exclude='node_modules' --exclude='**/dist' --exclude='.git' \
  -czf avitus-anketa.tar.gz avitus-anketa/

scp avitus-anketa.tar.gz user@SERVER_IP:~/
```

Serverda:

```bash
tar -xzf avitus-anketa.tar.gz
cd avitus-anketa
```

---

## 4-qadam: Environment sozlash

```bash
cp .env.docker.example .env
nano .env   # faqat TELEGRAM_BOT_TOKEN ni kiriting
```

Yoki avtomatik (IP va JWT_SECRET o'zi to'ldiriladi):

```bash
bash scripts/setup-env.sh
```

**Majburiy** — faqat `TELEGRAM_BOT_TOKEN` (qolganlari skript to'ldiradi):

| O'zgaruvchi | Izoh |
|-------------|------|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) dan |
| `JWT_SECRET` | `setup-env.sh` avtomatik yaratadi |
| `CORS_ORIGIN` | `setup-env.sh` server IP ni qo'yadi |

---

## 5-qadam: Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

Agar Nginx + HTTPS ishlatsangiz, faqat 80/443 oching, 3000 ni yoping.

---

## 6-qadam: Deploy

```bash
chmod +x scripts/*.sh
./scripts/docker-deploy.sh
```

To'liq qayta build:

```bash
./scripts/docker-deploy.sh --no-cache
```

Tekshirish:

```bash
./scripts/docker-status.sh
```

---

## 7-qadam: Tekshirish

```bash
docker compose ps
docker compose logs -f backend
```

Brauzerda:

| Xizmat | URL |
|--------|-----|
| Admin panel | `http://SERVER_IP:3000/login/` |
| Swagger | `http://SERVER_IP:3000/api/docs` |
| Login | `admin` / `.env` dagi parol |

Containerlar `healthy` / `running` holatda bo'lishi kerak.

---

## Tuzilma

```
┌─────────────────────────────────────────┐
│  Ubuntu Server 24.04 (Docker Host)      │
│  Port 3000                              │
│  ┌───────────────────────────────────┐  │
│  │  avitus-backend                   │  │
│  │  - Express API                    │  │
│  │  - Telegram Bot                   │  │
│  │  - Admin panel (static)           │  │
│  └──────────────┬────────────────────┘  │
│                 │                       │
│  ┌──────────────▼────────────────────┐  │
│  │  avitus-mongodb                   │  │
│  │  (ichki tarmoq, tashqariga ochiq  │  │
│  │   emas)                           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Ma'lumotlar Docker volume larda:
- `mongodb_data` — baza
- `uploads_data` — rezyume va fotolar

Containerlar `restart: unless-stopped` — server qayta yonganda avtomatik ishga tushadi.

---

## Foydali buyruqlar

```bash
# To'xtatish
docker compose down

# Qayta ishga tushirish
docker compose restart backend

# Loglar
docker compose logs -f

# To'liq qayta build
docker compose down
docker compose build --no-cache
docker compose up -d

# Ma'lumotlarni saqlab to'xtatish
docker compose stop

# HAMMASINI o'chirish (MongoDB ma'lumotlari ham!)
docker compose down -v
```

---

## Yangilash

```bash
cd ~/avitus-anketa
git pull
docker compose build --no-cache
docker compose up -d
```

MongoDB va upload ma'lumotlari saqlanadi.

---

## Telegram proxy

Agar server `api.telegram.org` ga ulana olmasa:

```env
TELEGRAM_PROXY=http://PROXY_IP:7890
TELEGRAM_RETRY_ATTEMPTS=5
```

---

## Nginx + HTTPS (ixtiyoriy, production)

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/avitus-anketa`:

```nginx
server {
    listen 80;
    server_name anketa.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/avitus-anketa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d anketa.example.com
```

`.env` da `CORS_ORIGIN=https://anketa.example.com` qiling.

---

## Muammolar

### `permission denied` (docker)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### `JWT_SECRET is required` / `TELEGRAM_BOT_TOKEN is required`
```bash
cp .env.docker.example .env
nano .env
```

### Admin ochilmaydi
```bash
docker compose logs backend | grep -i admin
```
`Serving admin panel from` xabari chiqishi kerak.

### Bot ishlamaydi
```bash
docker compose logs backend | grep -i telegram
```
Token noto'g'ri yoki tarmoq/proxy muammosi.

### Port band
`.env` da `APP_PORT=3001` qilib, firewall va brauzer URL ni yangilang.

### `avitus-mongodb is unhealthy`

Avval loglarni ko'ring:

```bash
docker compose logs mongodb
docker inspect avitus-mongodb --format '{{json .State}}'
```

**AVX yo'q (eski CPU)** — logda `requires a CPU with AVX support` chiqsa:

```bash
grep -o avx /proc/cpuinfo || echo "AVX yo'q"
```

`docker-compose.yml` da `image: mongo:4.4` ishlatiladi (loyihada allaqachon shunday). Keyin:

```bash
docker compose down -v
docker compose up -d
```

**Buzilgan volume** (oldingi muvaffaqiyatsiz urinishdan):

```bash
docker compose down -v
docker compose up -d
```

> `-v` MongoDB ma'lumotlarini o'chiradi. Faqat birinchi deploy yoki ma'lumot muhim emas bo'lsa ishlating.

**Xotira yetishmasa** (1–2 GB RAM VPS):

```bash
free -h
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
docker compose up -d
```

`docker-compose.yml` da MongoDB cache allaqachon `0.5 GB` ga cheklangan.

### Build xatolik (xotira yetishmasa)
```bash
# Swap qo'shish (2 GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Backup

```bash
docker exec avitus-mongodb mongodump --db avitus-anketa --out /data/db/backup
docker cp avitus-mongodb:/data/db/backup ./backup-$(date +%F)
```

---

## Production checklist

- [ ] `JWT_SECRET` — uzoq tasodifiy qiymat
- [ ] `SEED_ADMIN_PASSWORD` — kuchli parol
- [ ] `CORS_ORIGIN` — haqiqiy server IP/domen
- [ ] UFW: faqat kerakli portlar ochiq
- [ ] HTTPS (Nginx + Certbot)
- [ ] Muntazam MongoDB backup
