# Avitus Anketa — HR Telegram Anketa Tizimi

Avitus dorixonalar tarmog'i uchun HR bo'limi Telegram anketa tizimi. Nomzodlar Telegram bot orqali anketa to'ldiradi, HR xodimlari admin panel orqali arizalarni ko'rib chiqadi.

## Texnologiyalar

| Qism | Stack |
|------|-------|
| Backend | Node.js 22+, Express, TypeScript, MongoDB, Telegraf, JWT, Zod, Winston |
| Admin | Next.js 15, TailwindCSS, Shadcn/UI, TanStack Query, Axios |
| Shared | TypeScript types (monorepo package) |
| Deploy | Docker Compose, PM2 |

## Papka strukturasi

```
avitus-anketa/
├── apps/
│   ├── backend/                 # Express API + Telegram Bot
│   │   ├── src/
│   │   │   ├── bot/             # Telegraf bot va FSM
│   │   │   ├── config/          # Konfiguratsiya, logger, swagger
│   │   │   ├── domain/          # Domain errors
│   │   │   ├── application/     # Services, DTO, validation
│   │   │   ├── infrastructure/  # MongoDB, repositories
│   │   │   ├── presentation/    # Routes, middleware
│   │   │   ├── scripts/         # Seed script
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── admin/                   # Next.js Admin Panel
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   ├── components/      # UI komponentlar
│       │   ├── context/         # Auth context
│       │   └── lib/             # API client, utils
│       ├── dist/                # Static build (backend serve qiladi)
│       └── package.json
├── packages/
│   └── shared-types/            # Umumiy TypeScript tiplar
├── docker-compose.yml
├── ecosystem.config.js          # PM2
├── .env.example
└── package.json
```

## Tez boshlash

### 1. Talablar

- Node.js 22+
- MongoDB 7+
- Telegram Bot Token ([@BotFather](https://t.me/BotFather))

### 2. O'rnatish

```bash
# Repozitoriy
cd avitus-anketa

# Environment
cp .env.example .env
# .env faylida TELEGRAM_BOT_TOKEN va JWT_SECRET ni to'ldiring

# Dependencies
npm install

# Build (shared-types → admin → backend)
npm run build

# Seed (default admin yaratish)
npm run seed
```

### 3. Ishga tushirish

```bash
# Development
npm run dev:backend    # Backend + Bot (port 3000)
npm run dev:admin      # Admin dev server (port 3001)

# Production (bitta server)
npm run build
npm start              # Backend admin/dist ni ham serve qiladi
```

**Production URL:** `http://localhost:3000` — API, Swagger va Admin panel bitta portda.

### 4. Docker

Boshqa kompyuterga deploy qilish uchun to'liq qo'llanma: **[DEPLOY-DOCKER.md](./DEPLOY-DOCKER.md)**

```bash
cp .env.docker.example .env
# .env ni tahrirlang (JWT_SECRET, TELEGRAM_BOT_TOKEN, CORS_ORIGIN)

chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh
```

Yoki qo'lda:

```bash
docker compose up -d --build
```

**URL:** `http://SERVER_IP:3000` — Admin + API + Bot bitta containerda.

## Default admin

| Login | Parol |
|-------|-------|
| admin | admin123 |

> Production muhitida parolni darhol o'zgartiring!

## Telegram Bot buyruqlari

| Buyruq | Vazifa |
|--------|--------|
| `/start` | Anketa boshlash |
| `/cancel` | Anketani bekor qilish |
| `/status` | Joriy bosqichni ko'rish |
| `/restart` | Anketani boshidan boshlash |

## API

- **Swagger:** `http://localhost:3000/api/docs`
- **Base URL:** `http://localhost:3000/api`

### Asosiy endpointlar

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Joriy admin |
| GET | `/api/dashboard/stats` | Statistika |
| GET | `/api/applications` | Arizalar ro'yxati |
| GET | `/api/applications/:id` | Ariza tafsiloti |
| PATCH | `/api/applications/:id/status` | Status o'zgartirish |
| GET | `/api/files/:filename` | Fayl yuklab olish |

## Admin Panel

| Sahifa | URL |
|--------|-----|
| Login | `/login/` |
| Dashboard | `/dashboard/` |
| Arizalar | `/applications/` |
| Ariza tafsiloti | `/applications/view/?id=...` |

## Arxitektura

Backend **Clean Architecture** tamoyillariga asoslangan:

- **Domain** — business errors
- **Application** — services, DTO, validation (Zod)
- **Infrastructure** — MongoDB models, repositories
- **Presentation** — Express routes, middleware

Telegram bot **FSM (Finite State Machine)** orqali 28 bosqichli anketa o'tkazadi. Progress MongoDB da saqlanadi — bot restart bo'lsa ham yo'qolmaydi.

## Xavfsizlik

- Helmet, CORS, Rate Limiting
- JWT Authentication + RBAC
- bcrypt password hashing
- MongoDB sanitization
- Zod input validation

## PM2 Deployment

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

## Environment o'zgaruvchilari

Batafsil `.env.example` faylida.

| O'zgaruvchi | Tavsif |
|-------------|--------|
| `MONGODB_URI` | MongoDB connection string |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `JWT_SECRET` | JWT imo kaliti |
| `PORT` | Server porti (default: 3000) |
| `ADMIN_DIST_PATH` | Admin build papkasi |

## Litsenziya

Private — Avitus internal use.
