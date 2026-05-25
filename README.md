# PawangCuaca

> *"Cuaca dari warga, untuk warga."*

Platform citizen science berbasis web untuk memvalidasi akurasi prediksi cuaca dengan laporan ground-truth dari lapangan, dilengkapi sistem autentikasi, role-based access control, dan fitur Cuaca Threads.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Struktur Project](#struktur-project)
- [Environment Variables](#environment-variables)
- [Quick Start (Development)](#quick-start-development)
- [Production Deployment (VPS)](#production-deployment-vps)
- [Docker Deployment](#docker-deployment)
- [User Flow](#user-flow)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Role & Akses](#role--akses)
- [Fitur Keunikan](#fitur-keunikan)
- [License](#license)

---

## Fitur Utama

- **Autentikasi** — Registrasi & login dengan approval system oleh SuperAdmin
- **3 Role Pengguna** — SuperAdmin, Produsen, Konsumen
- **Laporan Cuaca** — Produsen mengunggah laporan cuaca dengan media (foto/video/gif)
- **Cuaca Threads** — Thread berkelanjutan ala X/Twitter untuk storytelling cuaca
- **Voting Akurasi** — Konsumen memvalidasi akurasi laporan cuaca
- **Pawang Level** — Sistem gamifikasi reputasi untuk Produsen
- **Peta Interaktif** — Visualisasi sebaran laporan via Leaflet
- **Dockerization** — Deployment konsisten dengan Docker Compose
- **PM2 + Nginx** — Production deployment tanpa Docker via PM2 & Nginx

---

## Arsitektur Sistem

### Production (VPS — PM2 + Nginx)

```
Internet → System Nginx (:80/:443 SSL)
  → proxy_pass → pawangcuaca Nginx (:8080)
                   ├── /            → React SPA (/home/pawangcuaca/pawangcuaca/client/dist)
                   ├── /api/*       → Express API (PM2, :3004)
                   └── /uploads/*   → Express Static (PM2, :3004)
                                          ↓
                                  PostgreSQL (:5433)
```

### Docker

```
Internet → System Nginx (:80/:443 SSL)
  → proxy_pass → Docker Nginx (:8080 → container :80)
                   ├── /            → React SPA (Client Container)
                   ├── /api/*       → Express API (Server Container :3004)
                   └── /uploads/*   → Express Static (Server Container :3004)
                                          ↓
                                  PostgreSQL (DB Container :5432 internal, :5433 host)
```

### Port Allocation (VPS)

| Port | User | Service |
|---|---|---|
| 3000 | nafhan | jobtracker-prod (Next.js) |
| 3001 | nafhan | jobtracker-staging (Next.js) |
| 3002 | it-gdgoc | gdgoc-fe-prod (Vite preview) |
| 3003 | it-gdgoc | gdgoc-be-prod (Bun) |
| **3004** | **pawangcuaca** | **pawangcuaca server (Node.js)** |
| 3005 | — | (reserved) |
| 3006 | faris | faris app (Node) |
| **5433** | **pawangcuaca** | **PostgreSQL** |
| **8080** | **pawangcuaca** | **Nginx (pawangcuaca site)** |

### Docker Container Architecture

| Container | Image | Port (host→container) | Fungsi |
|---|---|---|---|
| `pawangcuaca_nginx` | nginx:alpine | 8080→80 | Reverse proxy, serve React build |
| `pawangcuaca_client` | Custom (node → nginx) | 80 (internal) | React SPA |
| `pawangcuaca_server` | Custom (node:20-alpine) | 3004→3004 | Express REST API |
| `pawangcuaca_db` | postgres:16-alpine | 5433→5432 | PostgreSQL database |

### Networks

- `pawangcuaca-internal` — DB <-> Server (tidak ter-expose ke internet)
- `pawangcuaca-external` — Nginx <-> Client <-> Server

### Volumes

- `pgdata` — Data PostgreSQL (persistent)
- `uploads` — Media yang diunggah (persistent)
- `./server/src/db/migrations` — Auto-run SQL migrations saat DB pertama kali start

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Framer Motion 11, Leaflet |
| Backend | Node.js 20, Express 4, PostgreSQL 16 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Upload | Multer (local filesystem) |
| Security | Helmet, CORS, express-rate-limit, Joi validation |
| Database | PostgreSQL 16, pg (node-postgres) |
| Infra | Docker, Nginx, PM2 (non-Docker) |
| Weather API | Open-Meteo (gratis, tanpa API key) |

---

## Struktur Project

```
pawangcuaca/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── contexts/            # AuthContext (JWT auth state)
│   │   ├── pages/               # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── CreateReportPage.jsx
│   │   │   ├── ReportsFeedPage.jsx
│   │   │   ├── ReportDetailPage.jsx
│   │   │   ├── CreateThreadPage.jsx
│   │   │   ├── ThreadsListPage.jsx
│   │   │   ├── ThreadDetailPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── CommunityPage.jsx
│   │   │   └── AboutPage.jsx
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API service (axios)
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # Utilities
│   ├── Dockerfile
│   ├── nginx.conf               # Client-internal nginx (SPA fallback)
│   └── package.json
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── routes/              # Express routers
│   │   ├── middleware/          # Auth, Role, Upload, Validation
│   │   ├── services/            # Business logic
│   │   ├── db/
│   │   │   ├── pool.js          # pg Pool config
│   │   │   └── migrations/      # SQL migration files
│   │   ├── utils/               # Errors, logger, helpers
│   │   └── app.js               # Express app setup
│   ├── uploads/                 # Media upload directory
│   ├── seed.js                  # SuperAdmin seeder
│   ├── entrypoint.sh            # Docker entrypoint (migrate + start)
│   ├── Dockerfile
│   └── package.json
├── nginx/                       # Nginx configs
│   ├── pawangcuaca.conf         # Production (VPS/PM2) config — port 8080
│   └── pawangcuaca-docker.conf  # Docker config — upstream server:3004
├── docker-compose.yml           # Docker Compose orchestration
├── ecosystem.config.js          # PM2 config (non-Docker production)
├── .env                         # Root env (Docker Compose variables)
└── docs/
    └── diagrams.md              # UML & Flowchart diagrams
```

---

## Environment Variables

### Root `.env` (Docker Compose)

```bash
DB_PASSWORD=pawangcuaca_secure_2026
JWT_SECRET=change_this_to_a_very_long_random_string_in_production
CLIENT_ORIGIN=https://pawangcuaca.space
```

### Server `.env`

```bash
# App
NODE_ENV=production          # development | production
PORT=3004                    # Server port (3004 on VPS)
CLIENT_ORIGIN=https://pawangcuaca.space  # or http://localhost:5173 (dev)

# Database
DATABASE_URL=postgresql://pawangcuaca_user:your_strong_password@localhost:5433/pawangcuaca_db
DB_POOL_MIN=2
DB_POOL_MAX=10

# Auth
JWT_SECRET=change_this_to_a_very_long_random_string_in_production
JWT_EXPIRES_IN=24h

# External API (Open-Meteo - free, no API key required)
# https://open-meteo.com/en/docs

# Cache
CACHE_TTL_SECONDS=600

# Security
TRUSTED_PROXIES=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info               # debug | info | warn | error

# Upload
UPLOAD_DIR=uploads
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=50
```

### Client `.env`

```bash
# Production
VITE_API_BASE_URL=https://pawangcuaca.space/api
VITE_APP_VERSION=1.0.0

# Development
# VITE_API_BASE_URL=http://localhost:3004/api
```

---

## Quick Start (Development)

Ada dua cara menjalankan platform: **Docker (recommended)** atau **manual**.

---

### Opsi A: Docker (Recommended)

Tidak perlu install PostgreSQL, Node.js, atau apapun — cukup Docker saja.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

#### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/username/pawangcuaca.git
cd pawangcuaca

# 2. Buat file .env
cat > .env << 'EOF'
DB_PASSWORD=pawangcuaca_secure_2026
JWT_SECRET=ganti_ini_dengan_string_random_yang_panjang_di_production
CLIENT_ORIGIN=http://localhost:8080
EOF

# 3. Build & jalankan semua container (DB + Server + Client + Nginx)
docker compose up -d --build

# 4. Tunggu database ready (±10 detik)
docker compose logs -f db
# Tunggu muncul "database system is ready to accept connections", lalu Ctrl+C

# 5. Seed SuperAdmin (hanya sekali)
docker compose exec server node seed.js

# 6. Buka browser → http://localhost:8080
```

**Selesai.** Database, backend, frontend, dan reverse proxy semuanya berjalan di Docker.

> Jika migration tidak berjalan otomatis (volume `pgdata` sudah ada dari sebelumnya), jalankan manual:
> ```bash
> docker compose exec server node src/db/migrate.js
> ```

---

### Opsi B: Manual (Tanpa Docker)

#### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

#### 1. Clone & Setup Database

```bash
git clone https://github.com/username/pawangcuaca.git
cd pawangcuaca

# Setup PostgreSQL (create database & user)
sudo -u postgres psql
CREATE DATABASE pawangcuaca_db;
CREATE USER pawangcuaca_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE pawangcuaca_db TO pawangcuaca_user;
\q
```

#### 2. Server Setup

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, dll
npm install
npm run migrate    # Run database migrations
npm run seed       # Create default SuperAdmin
npm run dev        # Start dev server on port 3004
```

#### 3. Client Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev        # Start dev server on port 5173
```

#### 4. Akses Platform (Manual)

| URL | Deskripsi |
|---|---|
| http://localhost:5173 | Frontend (React) |
| http://localhost:3004/api/health | API Health Check |
| http://localhost:5173/login | Halaman Login |
| http://localhost:5173/register | Halaman Registrasi |

---

### Akses Platform (Semua Opsi)

| URL | Docker | Manual |
|---|---|---|
| Halaman Utama | http://localhost:8080 | http://localhost:5173 |
| API Health Check | http://localhost:8080/api/health | http://localhost:3004/api/health |
| Login | http://localhost:8080/login | http://localhost:5173/login |
| Register | http://localhost:8080/register | http://localhost:5173/register |

### Default SuperAdmin

| Field | Value |
|---|---|
| Email | admin@pawangcuaca.space |
| Password | admin123 |

> ⚠️ Ganti password setelah login pertama!

---

## Production Deployment (VPS)

Panduan deploy ke VPS menggunakan **PM2 + Nginx** (tanpa Docker untuk app, Docker opsional untuk DB saja).

### Arsitektur Production

```
Internet → System Nginx (:80/:443 SSL, server_name pawangcuaca.space)
  → proxy_pass http://127.0.0.1:8080
    → pawangcuaca Nginx (:8080)
        ├── /           → /home/pawangcuaca/pawangcuaca/client/dist (React SPA)
        ├── /api/*      → http://127.0.0.1:3004 (Express via PM2)
        └── /uploads/*  → http://127.0.0.1:3004 (Express via PM2)
```

### 1. Setup VPS

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL 16
sudo apt install -y postgresql-16

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Setup PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE pawangcuaca_db;
CREATE USER pawangcuaca_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE pawangcuaca_db TO pawangcuaca_user;
\q

# Pastikan PostgreSQL listen di port 5433
# Edit /etc/postgresql/16/main/postgresql.conf:
#   port = 5433
# Edit /etc/postgresql/16/main/pg_hba.conf jika perlu
sudo systemctl restart postgresql
```

### 3. Deploy Application

```bash
# Clone sebagai user pawangcuaca
cd /home/pawangcuaca
git clone https://github.com/username/pawangcuaca.git
cd pawangcuaca
```

### 4. Server Setup

```bash
cd /home/pawangcuaca/pawangcuaca/server

# Install dependencies
npm ci --omit=dev

# Buat .env production
cat > .env << 'EOF'
NODE_ENV=production
PORT=3004
CLIENT_ORIGIN=https://pawangcuaca.space
DATABASE_URL=postgresql://pawangcuaca_user:your_strong_password@localhost:5433/pawangcuaca_db
DB_POOL_MIN=2
DB_POOL_MAX=10
JWT_SECRET=your_very_long_random_string_at_least_64_chars
JWT_EXPIRES_IN=24h
CACHE_TTL_SECONDS=600
TRUSTED_PROXIES=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
UPLOAD_DIR=uploads
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=50
EOF

# Run migrations
node src/db/migrate.js

# Seed SuperAdmin
node seed.js

# Buat direktori uploads & logs
mkdir -p uploads logs
```

### 5. Client Build

```bash
cd /home/pawangcuaca/pawangcuaca/client

# Buat .env production
cat > .env << 'EOF'
VITE_API_BASE_URL=https://pawangcuaca.space/api
VITE_APP_VERSION=1.0.0
EOF

# Install dependencies & build
npm ci
npm run build
# Output: /home/pawangcuaca/pawangcuaca/client/dist
```

### 6. Start dengan PM2

```bash
cd /home/pawangcuaca/pawangcuaca

# Buat direktori logs
mkdir -p /home/pawangcuaca/logs

# Start server
pm2 start ecosystem.config.js --env production

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup
```

`ecosystem.config.js`:

```js
module.exports = {
  apps: [{
    name: 'pawangcuaca-api',
    script: './server/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '300M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3004,
    },
    error_file: '/home/pawangcuaca/logs/error.log',
    out_file: '/home/pawangcuaca/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

### 7. Setup Nginx

```bash
# Copy nginx config ke sites-available
sudo cp /home/pawangcuaca/pawangcuaca/nginx/pawangcuaca.conf /etc/nginx/sites-available/pawangcuaca

# Symlink ke sites-enabled
sudo ln -sf /etc/nginx/sites-available/pawangcuaca /etc/nginx/sites-enabled/pawangcuaca

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

`/etc/nginx/sites-available/pawangcuaca`:

```nginx
server {
    listen 8080;
    server_name pawangcuaca.space www.pawangcuaca.space _;

    root /home/pawangcuaca/pawangcuaca/client/dist;
    index index.html;

    client_max_body_size 55M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location /uploads/ {
        proxy_pass         http://127.0.0.1:3004;
        proxy_set_header   Host $host;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

### 8. Setup SSL (Let's Encrypt)

```bash
# Pastikan system nginx sudah ada config untuk pawangcuaca.space di port 80/443
# yang me-redirect/proxy ke 8080, lalu:

sudo certbot --nginx -d pawangcuaca.space -d www.pawangcuaca.space

# Auto-renewal sudah di-handle oleh certbot timer
sudo certbot renew --dry-run
```

### 9. Perintah PM2 Berguna

```bash
pm2 status                    # Cek status semua proses
pm2 logs pawangcuaca-api      # Lihat logs
pm2 restart pawangcuaca-api   # Restart server
pm2 stop pawangcuaca-api      # Stop server
pm2 monit                     # Monitor CPU & memory
```

---

## Post-Push: Apa yang Dilakukan di VPS

Setiap kali kamu push perubahan ke repository, jalankan langkah-langkah berikut di VPS.

### Opsi 1: PM2 + Nginx (Production Saat Ini)

```bash
# 1. SSH ke VPS sebagai user pawangcuaca
ssh pawangcuaca@<vps-ip>

# 2. Pull perubahan terbaru
cd /home/pawangcuaca/pawangcuaca
git pull origin main

# 3. Update server dependencies & restart
cd /home/pawangcuaca/pawangcuaca/server
npm ci --omit=dev

# 4. Jalankan migration jika ada perubahan schema
node src/db/migrate.js

# 5. Rebuild client
cd /home/pawangcuaca/pawangcuaca/client
npm ci
npm run build

# 6. Restart PM2
pm2 restart pawangcuaca-api

# 7. Verify
pm2 status
pm2 logs pawangcuaca-api --lines 20
curl -s http://localhost:3004/api/health
```

> Jika ada perubahan di `nginx/pawangcuaca.conf`:
> ```bash
> sudo cp /home/pawangcuaca/pawangcuaca/nginx/pawangcuaca.conf /etc/nginx/sites-available/pawangcuaca
> sudo nginx -t && sudo systemctl reload nginx
> ```

### Opsi 2: Docker

```bash
# 1. SSH ke VPS
ssh pawangcuaca@<vps-ip>

# 2. Pull perubahan terbaru
cd /home/pawangcuaca/pawangcuaca
git pull origin main

# 3. Rebuild & restart semua container
docker compose up -d --build

# 4. Jalankan migration jika ada perubahan schema
docker compose exec server node src/db/migrate.js

# 5. Verify
docker compose ps
docker compose logs -f server --tail 20
curl -s http://localhost:8080/api/health
```

### Quick Reference: Apa yang Perlu Di-restart?

| Yang Berubah | PM2 | Docker | Nginx Reload? |
|---|---|---|---|
| Server code saja | `pm2 restart pawangcuaca-api` | `docker compose up -d --build server` | Tidak |
| Client code saja | `npm run build` (di client/) | `docker compose up -d --build client` | Tidak |
| Database migration | `node src/db/migrate.js` (di server/) | `docker compose exec server node src/db/migrate.js` | Tidak |
| Nginx config | — | — | Ya (`sudo systemctl reload nginx`) |
| `.env` server | `pm2 restart pawangcuaca-api` | `docker compose up -d server` | Tidak |
| `.env` client | `npm run build` (di client/) | `docker compose up -d --build client` | Tidak |
| Root `.env` | — | `docker compose up -d` | Tidak |

---

## Docker Deployment

Langkah-langkah menjalankan Docker sudah dijelaskan di [Quick Start — Opsi A](#opsi-a-docker-recommended) di atas. Bagian ini membahas arsitektur dan konfigurasi production.

### Docker di VPS

Jika ingin menjalankan full Docker stack di VPS, system nginx perlu diarahkan ke Docker nginx (port 8080):

```nginx
# /etc/nginx/sites-available/pawangcuaca (system nginx — SSL handler)
server {
    listen 80;
    server_name pawangcuaca.space www.pawangcuaca.space;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pawangcuaca.space www.pawangcuaca.space;

    ssl_certificate     /etc/letsencrypt/live/pawangcuaca.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pawangcuaca.space/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

### Konfigurasi Production Docker

Sebelum deploy ke VPS, edit file `.env` di root project:

```bash
cat > .env << 'EOF'
DB_PASSWORD=<password_kuat_unik>
JWT_SECRET=<random_string_minimal_64_karakter>
CLIENT_ORIGIN=https://pawangcuaca.space
EOF
```

### Container yang Dijalankan

```
docker compose up -d akan menjalankan:
1. pawangcuaca_db     → PostgreSQL 16 (port 5433 ke host, 5432 internal)
2. pawangcuaca_server → Express API (port 3004 ke host)
3. pawangcuaca_client → React build via Nginx (port 80 internal)
4. pawangcuaca_nginx  → Reverse proxy (port 8080 ke host → 80 internal)
```

### Cara Docker Membantu Deployment

1. **Konsistensi Environment** — Setiap container berjalan dengan dependensi yang identik, menghilangkan "works on my machine"
2. **Isolasi Layanan** — Database tidak terekspos ke internet (internal network), hanya server yang bisa akses
3. **Scalability** — Mudah menambah instance server atau worker
4. **Reproducibility** — `docker compose up -d` di manapun menghasilkan environment yang sama
5. **Volume Persistence** — Data database dan upload file tetap aman saat container di-restart

### Perintah Docker Berguna

```bash
# Lihat logs semua container
docker compose logs -f

# Lihat logs container tertentu
docker compose logs -f server
docker compose logs -f db

# Restart service tertentu
docker compose restart server

# Rebuild setelah code change
docker compose up -d --build server
docker compose up -d --build client

# Stop semua container
docker compose down

# Stop & hapus volumes (⚠️ semua data database & upload hilang!)
docker compose down -v

# Masuk ke shell container server
docker compose exec server sh

# Masuk ke database
docker compose exec db psql -U pawangcuaca_user -d pawangcuaca_db

# Cek resource usage
docker compose top
docker stats pawangcuaca_server pawangcuaca_db
```

### Troubleshooting Docker

| Masalah | Solusi |
|---|---|
| Container DB terus restart | Cek `docker compose logs db`, pastikan volume tidak korup. Coba `docker compose down -v && docker compose up -d --build` |
| Migration tidak jalan | Migration hanya berjalan saat volume `pgdata` baru. Jika sudah ada, jalankan manual: `docker compose exec server node src/db/migrate.js` |
| Port 8080 sudah dipakai | Stop service yang menggunakan port 8080, atau edit `docker-compose.yml` untuk menggunakan port lain |
| Upload file hilang setelah restart | Pastikan volume `uploads` tidak terhapus. Jangan gunakan `docker compose down -v` |
| Server tidak bisa konek ke DB | Cek `docker compose logs server`. Pastikan container DB sudah healthy: `docker compose ps` |
| Client build gagal | Cek `docker compose logs client`. Pastikan semua dependencies di `package.json` benar |

---

## User Flow

### Alur Registrasi & Login

```
User → Register (pilih role: Produsen/Konsumen) → Status: PENDING
                                                     ↓
SuperAdmin → Dashboard → Approve/Reject User
                                                     ↓
User → Login (jika approved) → JWT Token → Akses platform sesuai role
```

### Alur Produsen (Kontributor Laporan)

```
Produsen Login → Buat Laporan Cuaca (judul, deskripsi, media, lokasi)
               → Buat Cuaca Thread (storytelling cuaca berkelanjutan)
               → Tambah post ke thread (update cuaca real-time)
               → Lihat Pawang Level (gamifikasi reputasi)
```

### Alur Konsumen (Validator Laporan)

```
Konsumen Login → Browse Laporan Cuaca (feed, filter lokasi)
               → Lihat Detail Laporan (media, data cuaca)
               → Vote Akurasi (Akurat / Meleset)
               → Browse Cuaca Threads (ikuti cerita cuaca)
               → Lihat Cuaca Real-time + Peta Interaktif
```

### Alur SuperAdmin

```
SuperAdmin Login → Dashboard (statistik platform)
                → Manajemen User (approve/reject/delete)
                → Akses penuh ke semua fitur
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Registrasi user baru (pending approval) |
| POST | `/api/auth/login` | Public | Login, mendapat JWT token |
| GET | `/api/auth/me` | Bearer | Profil user yang sedang login |
| PUT | `/api/auth/me` | Bearer | Update profil (bio, avatar) |

### Admin (SuperAdmin only)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/users` | SuperAdmin | Daftar user (filter status/role) |
| GET | `/api/admin/stats` | SuperAdmin | Statistik platform |
| PUT | `/api/admin/users/:id/approve` | SuperAdmin | Approve user pending |
| PUT | `/api/admin/users/:id/reject` | SuperAdmin | Reject user pending |
| DELETE | `/api/admin/users/:id` | SuperAdmin | Hapus user |

### Reports

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/reports` | Produsen | Buat laporan + upload media |
| GET | `/api/reports` | Any Auth | Daftar laporan (paginasi) |
| GET | `/api/reports/:id` | Any Auth | Detail laporan |
| PUT | `/api/reports/:id` | Produsen (owner) | Update laporan |
| DELETE | `/api/reports/:id` | Produsen/Admin | Hapus laporan |
| POST | `/api/reports/:id/vote` | Konsumen | Vote akurasi laporan |

### Threads

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/threads` | Produsen | Buat thread baru |
| GET | `/api/threads` | Any Auth | Daftar thread |
| GET | `/api/threads/:id` | Any Auth | Detail thread + posts |
| POST | `/api/threads/:id/posts` | Produsen | Tambah post ke thread + media |
| DELETE | `/api/threads/:id` | Produsen/Admin | Hapus thread |

### Weather & Locations

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/weather` | Any Auth | Cuaca real-time + forecast |
| GET | `/api/weather/votes` | Any Auth | Vote agregat per lokasi |
| POST | `/api/votes` | Any Auth | Submit vote akurasi forecast |
| GET | `/api/votes/recent` | Any Auth | Vote terbaru |
| GET | `/api/locations/leaderboard` | Any Auth | Leaderboard lokasi |
| GET | `/api/health` | Public | Health check |

---

## Database Schema

### Tabel: `users`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | ID unik user |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Username |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| role | VARCHAR(20) | NOT NULL, CHECK | superadmin/produsen/konsumen |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending/approved/rejected |
| pawang_level | VARCHAR(20) | NOT NULL, DEFAULT 'pemula' | pemula/andal/elite/legenda |
| report_count | INTEGER | DEFAULT 0 | Jumlah laporan |
| accuracy_score | DECIMAL(5,2) | DEFAULT 0 | Skor akurasi rata-rata |
| avatar_url | VARCHAR(500) | — | URL foto profil |
| bio | TEXT | — | Bio singkat |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Waktu update terakhir |

### Tabel: `reports`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | ID unik laporan |
| user_id | INTEGER | FK → users, NOT NULL | Pemilik laporan |
| location_id | INTEGER | FK → locations | Lokasi laporan |
| thread_post_id | INTEGER | FK → thread_posts | Link ke thread post (opsional) |
| title | VARCHAR(255) | NOT NULL | Judul laporan |
| description | TEXT | — | Deskripsi detail |
| weather_condition | VARCHAR(100) | — | Kondisi cuaca |
| temperature | DECIMAL(5,2) | — | Suhu (°C) |
| media_url | VARCHAR(500) | — | URL media (foto/video/gif) |
| media_type | VARCHAR(20) | CHECK | image/video/gif |
| media_size | INTEGER | — | Ukuran file (bytes) |
| upvotes | INTEGER | DEFAULT 0 | Jumlah upvote |
| downvotes | INTEGER | DEFAULT 0 | Jumlah downvote |
| accuracy_pct | DECIMAL(5,2) | — | Persentase akurasi |
| status | VARCHAR(20) | DEFAULT 'active' | active/archived |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `report_votes`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | — |
| report_id | INTEGER | FK → reports, UNIQUE(user) | Laporan yang di-vote |
| user_id | INTEGER | FK → users, UNIQUE(report) | Voter |
| vote_type | VARCHAR(10) | CHECK | upvote/downvote |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `threads`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | — |
| user_id | INTEGER | FK → users | Pembuat thread |
| location_id | INTEGER | FK → locations | Lokasi thread |
| title | VARCHAR(255) | NOT NULL | Judul thread |
| status | VARCHAR(20) | DEFAULT 'active' | active/archived |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `thread_posts`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | — |
| thread_id | INTEGER | FK → threads | Thread induk |
| user_id | INTEGER | FK → users | Penulis post |
| content | TEXT | NOT NULL | Isi post |
| media_url | VARCHAR(500) | — | URL media |
| media_type | VARCHAR(20) | CHECK | image/video/gif |
| media_size | INTEGER | — | Ukuran file |
| weather_condition | VARCHAR(100) | — | Kondisi cuaca |
| temperature | DECIMAL(5,2) | — | Suhu |
| position | INTEGER | DEFAULT 0 | Urutan dalam thread |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `locations` (existing)

| Kolom | Tipe | Deskripsi |
|---|---|---|
| id | SERIAL PK | — |
| geohash | VARCHAR(12) UNIQUE | Geohash precision 5 |
| lat | DECIMAL(9,6) | Latitude |
| lon | DECIMAL(9,6) | Longitude |
| label | VARCHAR(255) | Nama lokasi (reverse geocode) |

---

## Role & Akses

| Fitur | SuperAdmin | Produsen | Konsumen |
|---|:---:|:---:|:---:|
| Login / Register | ✅ | ✅ | ✅ |
| Lihat cuaca real-time | ✅ | ✅ | ✅ |
| Browse laporan & threads | ✅ | ✅ | ✅ |
| Approve/Reject user | ✅ | ❌ | ❌ |
| Hapus user | ✅ | ❌ | ❌ |
| Buat laporan cuaca + media | ✅ | ✅ | ❌ |
| Buat Cuaca Thread | ✅ | ✅ | ❌ |
| Tambah post ke thread | ✅ | ✅ | ❌ |
| Vote akurasi laporan | ❌ | ❌ | ✅ |
| Lihat Pawang Level | ✅ | ✅ | ✅ |
| Edit profil sendiri | ✅ | ✅ | ✅ |
| Hapus laporan sendiri | ✅ | ✅ | ❌ |

---

## Fitur Keunikan

### Pawang Level (Gamifikasi Reputasi)

Produsen yang aktif melaporkan cuaca dengan akurasi tinggi mendapat level "Pawang" yang meningkat seiring kontribusi.

| Level | Min. Laporan | Min. Akurasi | Badge |
|---|---|---|---|
| Pemula | 0 | 0% | Abu-abu |
| Andal | 10 | 60% | Hijau |
| Elite | 30 | 75% | Biru |
| Legenda | 100 | 85% | Emas |

**Manfaat:** Produsen termotivasi melapor secara konsisten dan akurat. Konsumen dapat memprioritaskan laporan dari Pawang level tinggi.

**Data yang digunakan:** Jumlah laporan (`report_count`) dan rata-rata akurasi vote (`accuracy_score`) pada laporan produsen.

**Alasan keunikan:** Trust layer berbasis reputasi komunitas yang menciptakan insentif berkelanjutan untuk partisipasi aktif.

### Cuaca Threads (Social Storytelling)

Produsen membuat thread narasi cuaca berkelanjutan — mirip thread di X/Twitter — untuk menceritakan perubahan cuaca dari waktu ke waktu di satu lokasi.

**Manfaat:** Konsumen mengikuti cerita cuaca real-time. Produsen membangun narasi yang engaging. Format sosial yang familiar mendorong engagement berulang.

**Data yang digunakan:** Serangkaian post dalam satu thread, masing-masing dengan konten teks, media (foto/video), dan data cuaca (kondisi + suhu).

**Alasan keunikan:** Mengubah pelaporan cuaca dari aktivitas satu kali menjadi pengalaman sosial berkelanjutan, menciptakan "follow-worthy" content yang meningkatkan retensi pengguna.

---

## License

PawangCuaca © 2026 — Nafhan Shafy Aulia
