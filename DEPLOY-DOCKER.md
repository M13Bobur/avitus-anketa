# Docker orqali deploy qilish (boshqa kompyuter)

Bu qo'llanma loyihani **boshqa kompyuterga** ko'chirib, faqat **Docker** bilan ishlatish uchun.

## Talablar (yangi kompyuterda)

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+
- Internet (image build va Telegram uchun)
- Kamida 2 GB bo'sh disk

Node.js yoki MongoDB **alohida o'rnatish shart emas** — hammasi container ichida ishlaydi.

---

## 1-qadam: Kodni ko'chirish

### Variant A — Git orqali (tavsiya etiladi)

```bash
git clone <repo-url> avitus-anketa
cd avitus-anketa
```

### Variant B — ZIP/USB orqali

Loyihani arxivlang (**node_modules** va **dist** ni qo'shmasdan ham bo'ladi):

```bash
# Eski kompyuterda
cd /home/bobur/project
tar --exclude='node_modules' --exclude='**/dist' --exclude='.git' \
  -czf avitus-anketa.tar.gz avitus-anketa/
```

Yangi kompyuterga ko'chiring va oching:

```bash
tar -xzf avitus-anketa.tar.gz
cd avitus-anketa
```

---

## 2-qadam: Environment sozlash

```bash
cp .env.docker.example .env
nano .env   # yoki boshqa editor
```

**Majburiy** maydonlar:

| O'zgaruvchi | Misol | Izoh |
|-------------|-------|------|
| `JWT_SECRET` | `my-super-secret-key-2024` | Uzun, tasodifiy matn |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | [@BotFather](https://t.me/BotFather) dan |
| `CORS_ORIGIN` | `http://192.168.1.50:3000` | Server IP yoki domen |
| `APP_PORT` | `3000` | Tashqi port |

`CORS_ORIGIN` da serverning **haqiqiy IP manzili** yoki domeni bo'lishi kerak.

---

## 3-qadam: Ishga tushirish

```bash
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh
```

Yoki qo'lda:

```bash
docker compose build
docker compose up -d
```

---

## 4-qadam: Tekshirish

```bash
# Containerlar holati
docker compose ps

# Backend loglari
docker compose logs -f backend

# Brauzerda oching
# http://SERVER_IP:3000/login/
# Login: admin / admin123
```

Swagger: `http://SERVER_IP:3000/api/docs`

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

# Ma'lumotlarni saqlab qolgan holda to'xtatish
docker compose stop

# HAMMASINI o'chirish (MongoDB ma'lumotlari ham!)
docker compose down -v
```

---

## Tuzilma

```
┌─────────────────────────────────────────┐
│  Server (Docker Host)                   │
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
│  │   emas — xavfsizroq)              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Ma'lumotlar Docker volume larda saqlanadi:
- `mongodb_data` — baza
- `uploads_data` — rezyume va fotolar

---

## Telegram proxy (serverda blok bo'lsa)

Agar server `api.telegram.org` ga ulana olmasa, `.env` ga qo'shing:

```env
TELEGRAM_PROXY=http://PROXY_IP:7890
TELEGRAM_RETRY_ATTEMPTS=5
```

Proxy boshqa mashinada bo'lsa, uning IP manzilini yozing.

---

## Yangilash (yangi kod chiqqanda)

```bash
cd avitus-anketa
git pull   # yoki yangi arxivni qo'ying
docker compose build --no-cache
docker compose up -d
```

MongoDB va upload ma'lumotlari saqlanadi.

---

## Muammolar

### `JWT_SECRET is required` / `TELEGRAM_BOT_TOKEN is required`
`.env` fayl to'ldirilmagan. `cp .env.docker.example .env` va qiymatlarni kiriting.

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
`.env` da `APP_PORT=3001` qilib, `http://IP:3001` dan kiring.

---

## Production tavsiyalar

1. `SEED_ADMIN_PASSWORD` ni kuchli parolga almashtiring
2. `JWT_SECRET` ni uzoq tasodifiy qiling
3. Nginx + SSL (HTTPS) qo'shing
4. Firewall: faqat 80/443 port ochiq qolsin
5. Muntazam `docker compose pull` va backup oling

```bash
# MongoDB backup
docker exec avitus-mongodb mongodump --db avitus-anketa --out /data/db/backup
docker cp avitus-mongodb:/data/db/backup ./backup
```
