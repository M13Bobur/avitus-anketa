# Windows 11 ga deploy qilish

Bu qo'llanma **Avitus Anketa** loyihasini Windows 11 kompyuterida ishga tushirish uchun.

## Tavsiya: Docker (eng oson)

Node.js va MongoDB ni alohida o'rnatish shart emas — hammasi container ichida ishlaydi.

### Talablar

- Windows 11 (64-bit)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) (WSL 2 backend bilan)
- Kamida 4 GB RAM, 2 GB bo'sh disk
- Internet

### 1. Docker Desktop o'rnatish

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) ni yuklab oling va o'rnating
2. O'rnatishda **Use WSL 2 instead of Hyper-V** ni tanlang (tavsiya)
3. Kompyuterni qayta ishga tushiring
4. Docker Desktop ni oching — pastda **Engine running** ko'rinishi kerak

Tekshirish (PowerShell):

```powershell
docker --version
docker compose version
```

### 2. Loyihani ko'chirish

**Git orqali:**

```powershell
git clone <repo-url> avitus-anketa
cd avitus-anketa
```

**ZIP/USB orqali:** loyihani ko'chiring, `node_modules` va `dist` papkalarini qo'shmasdan ham bo'ladi (Docker build qiladi).

### 3. Environment sozlash

PowerShell da loyiha papkasida:

```powershell
Copy-Item .env.docker.example .env
notepad .env
```

**Majburiy** maydonlar:

| O'zgaruvchi | Misol | Izoh |
|-------------|-------|------|
| `JWT_SECRET` | `my-super-secret-key-2024` | Uzun, tasodifiy matn |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | [@BotFather](https://t.me/BotFather) dan |
| `CORS_ORIGIN` | `http://192.168.1.50:3000` | Windows kompyuter IP manzili |
| `APP_PORT` | `3000` | Tashqi port |

Windows IP manzilini topish:

```powershell
ipconfig
# "IPv4 Address" qatorini qidiring, masalan 192.168.1.50
```

`CORS_ORIGIN` ga shu IP ni yozing: `http://192.168.1.50:3000`

### 4. Ishga tushirish

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\docker-deploy.ps1
```

Yoki qo'lda:

```powershell
docker compose build
docker compose up -d
```

### 5. Windows Firewall

Boshqa kompyuterlar tarmoqdan kirishi uchun port oching (Administrator PowerShell):

```powershell
New-NetFirewallRule -DisplayName "Avitus Anketa" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 6. Tekshirish

Brauzerda oching:

- Admin: `http://localhost:3000/login/`
- Swagger: `http://localhost:3000/api/docs`
- Login: `admin` / `admin123`

Tarmoqdan (boshqa PC): `http://WINDOWS_IP:3000/login/`

Loglar:

```powershell
docker compose ps
docker compose logs -f backend
```

---

## Telegram proxy (Windows da Clash/V2Ray bo'lsa)

Agar Telegram serverga ulanmasa, `.env` ga qo'shing:

```env
TELEGRAM_PROXY=http://host.docker.internal:7890
TELEGRAM_RETRY_ATTEMPTS=5
```

`host.docker.internal` — Docker container ichidan Windows host ga ulanish uchun.

---

## Foydali buyruqlar (PowerShell)

```powershell
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

## Variant 2: Docker siz (Node.js + MongoDB)

Agar Docker ishlatmasangiz:

### Talablar

- [Node.js 22+](https://nodejs.org/)
- [MongoDB 7+](https://www.mongodb.com/try/download/community) (Windows xizmat sifatida)
- [PM2 for Windows](https://pm2.keymetrics.io/docs/usage/quick-start/) (ixtiyoriy)

### O'rnatish

```powershell
cd avitus-anketa

Copy-Item .env.example .env
notepad .env
# MONGODB_URI=mongodb://localhost:27017/avitus-anketa
# TELEGRAM_BOT_TOKEN va JWT_SECRET ni to'ldiring

npm install
npm run build
npm run seed
```

### Ishga tushirish

```powershell
# Oddiy
npm start

# PM2 bilan (avtomatik qayta ishga tushirish)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Admin: `http://localhost:3000/login/`

---

## Yangilash

```powershell
cd avitus-anketa
git pull
docker compose build --no-cache
docker compose up -d
```

MongoDB va upload ma'lumotlari saqlanadi.

---

## Muammolar

### `Docker is not running`
Docker Desktop ni oching va **Engine running** holatini kuting.

### `JWT_SECRET is required`
`.env` fayl to'ldirilmagan. `Copy-Item .env.docker.example .env` va qiymatlarni kiriting.

### Admin ochilmaydi
```powershell
docker compose logs backend | Select-String -Pattern "admin" -CaseSensitive:$false
```

### Port band
`.env` da `APP_PORT=3001` qilib, `http://localhost:3001` dan kiring.

### WSL 2 xatolik
PowerShell (Admin):

```powershell
wsl --update
wsl --set-default-version 2
```

Keyin Docker Desktop → Settings → General → **Use the WSL 2 based engine** yoqilgan bo'lsin.

---

## Production tavsiyalar

1. `SEED_ADMIN_PASSWORD` ni kuchli parolga almashtiring
2. `JWT_SECRET` ni uzoq tasodifiy qiling
3. IIS yoki Nginx reverse proxy + SSL (HTTPS)
4. Firewall: faqat kerakli portlar ochiq
5. Muntazam backup oling

```powershell
docker exec avitus-mongodb mongodump --db avitus-anketa --out /data/db/backup
docker cp avitus-mongodb:/data/db/backup ./backup
```
