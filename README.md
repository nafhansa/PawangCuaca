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
- [Quick Start (Local Development)](#quick-start-local-development)
- [Production Deployment (VPS)](#production-deployment-vps)
- [Post-Push: Apa yang Dilakukan di VPS](#post-push-apa-yang-dilakukan-di-vps)
- [Perintah Docker Berguna](#perintah-docker-berguna)
- [Troubleshooting](#troubleshooting)
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
- **Full Docker** — Semua layanan (DB, Server, Client, Nginx) berjalan di Docker

---

## Arsitektur Sistem

### Production (VPS)

```
Internet → Cloudflare (DNS + SSL + Tunnel)
  → http://localhost:8081 (VPS)
    → Docker Nginx (:8081 → container :80)
        ├── /           → Client Container (React SPA)
        ├── /api/*      → Server Container (:3004 Express)
        └── /uploads/*  → Server Container (:3004 Express Static)
                                ↓
                        DB Container (PostgreSQL :5432, host :5433)
```

### Port Allocation (VPS)

| Port | User | Service |
|---|---|---|
| 3000 | nafhan | jobtracker-prod (Next.js) |
| 3001 | nafhan | jobtracker-staging (Next.js) |
| 3002 | it-gdgoc | gdgoc-fe-prod (Vite preview) |
| 3003 | it-gdgoc | gdgoc-be-prod (Bun) |
| 3004 | pawangcuaca | pawangcuaca server (Docker internal) |
| 3006 | faris | faris app (Node) |
| 5433 | pawangcuaca | PostgreSQL (Docker host access) |
| 8081 | pawangcuaca | Docker Nginx (Cloudflare Tunnel target) |

### Docker Container Architecture

| Container | Image | Port (host->container) | Fungsi |
|---|---|---|---|
| `pawangcuaca_nginx` | nginx:alpine | 8081->80 | Reverse proxy, routing /, /api/, /uploads |
| `pawangcuaca_client` | Custom (node->nginx) | 80 (internal) | React SPA |
| `pawangcuaca_server` | Custom (node:20-alpine) | 3004 (internal) | Express REST API |
| `pawangcuaca_db` | postgres:16-alpine | 5433->5432 | PostgreSQL database |

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
| Infra | Docker Compose, Nginx (Docker), Cloudflare Tunnel |
| Weather API | Open-Meteo (gratis, tanpa API key) |

---

## Struktur Project

```
pawangcuaca/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── contexts/            # AuthContext (JWT auth state)
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API service (axios)
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # Utilities
│   ├── Dockerfile               # Multi-stage: node build -> nginx serve
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
│   ├── Dockerfile               # Multi-stage: node build -> node run
│   └── package.json
├── nginx/                       # Nginx configs
│   ├── pawangcuaca.conf         # System nginx — reverse proxy ke Docker :8081
│   └── pawangcuaca-docker.conf  # Docker nginx — upstream server:3004, client:80
├── docker-compose.yml           # Docker Compose orchestration
├── .env                         # Root env (Docker Compose variables, gitignored)
└── docs/
    └── diagrams.md              # UML & Flowchart diagrams
```

---

## Environment Variables

### Root `.env` (Docker Compose)

File ini yang dipake sama `docker compose` buat substitusi variabel. **Tidak di-commit ke git** (sudah di `.gitignore`).

```bash
DB_PASSWORD=pawangcuaca_secure_2026
JWT_SECRET=change_this_to_a_very_long_random_string_in_production
CLIENT_ORIGIN=https://pawangcuaca.space
CLIENT_API_URL=https://pawangcuaca.space/api
```

| Variabel | Dipake oleh | Deskripsi |
|---|---|---|
| `DB_PASSWORD` | db, server | Password PostgreSQL |
| `JWT_SECRET` | server | Secret untuk JWT signing |
| `CLIENT_ORIGIN` | server | CORS origin (frontend URL) |
| `CLIENT_API_URL` | client | **Build-time** — `VITE_API_BASE_URL` di-bake ke React build |

> `CLIENT_API_URL` diteruskan ke client Dockerfile sebagai build arg (`VITE_API_BASE_URL`). Karena Vite bake env saat build, ini **harus** di-set sebelum `docker compose build`.

### Server `.env` (hanya untuk development manual)

Di production (Docker), server env sudah di-set langsung di `docker-compose.yml` bagian `environment`. File ini cuma dipake untuk `npm run dev` lokal.

```bash
NODE_ENV=development
PORT=3004
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://pawangcuaca_user:pawangcuaca_secure_2026@localhost:5433/pawangcuaca_db
DB_POOL_MIN=2
DB_POOL_MAX=10
JWT_SECRET=dev_secret_change_in_production_abc123
JWT_EXPIRES_IN=24h
CACHE_TTL_SECONDS=600
TRUSTED_PROXIES=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
UPLOAD_DIR=uploads
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=50
```

---

## Quick Start (Local Development)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/username/pawangcuaca.git
cd pawangcuaca

# 2. Buat file .env
cat > .env << 'EOF'
DB_PASSWORD=pawangcuaca_secure_2026
JWT_SECRET=ganti_ini_dengan_string_random_yang_panjang
CLIENT_ORIGIN=http://localhost:8081
CLIENT_API_URL=http://localhost:8081/api
EOF

# 3. Build & jalankan semua container
docker compose up -d --build

# 4. Tunggu database ready (±10 detik)
docker compose logs -f db
# Tunggu muncul "database system is ready to accept connections", lalu Ctrl+C

# 5. Seed SuperAdmin (hanya sekali)
docker compose exec server node seed.js

# 6. Buka browser -> http://localhost:8081
```

**Selesai.** Database, backend, frontend, dan reverse proxy semuanya berjalan di Docker.

> Jika migration tidak berjalan otomatis (volume `pgdata` sudah ada dari sebelumnya), jalankan manual:
> ```bash
> docker compose exec server node src/db/migrate.js
> ```

### Akses Platform

| URL | Deskripsi |
|---|---|
| http://localhost:8081 | Halaman Utama |
| http://localhost:8081/api/health | API Health Check |
| http://localhost:8081/login | Halaman Login |
| http://localhost:8081/register | Halaman Registrasi |

### Default SuperAdmin

| Field | Value |
|---|---|
| Email | admin@pawangcuaca.space |
| Password | admin123 |

> Ganti password setelah login pertama!

---

## Production Deployment (VPS)

### Arsitektur

```
Internet → Cloudflare (DNS + SSL + Tunnel)
  → http://localhost:8081 (VPS via cloudflared)
    → Docker Nginx (:8081 -> container :80)
        ├── /           -> Client Container (React SPA)
        ├── /api/*      -> Server Container (:3004 Express)
        └── /uploads/*  -> Server Container (:3004 Express Static)
                                |
                        DB Container (PostgreSQL :5432, host :5433)
```

### Cloudflare Tunnel Setup

Domain `pawangcuaca.space` menggunakan **Cloudflare Tunnel** (bukan system nginx) untuk routing traffic ke VPS. Pastikan tunnel config point ke `http://localhost:8081`.

### Setup Awal (hanya sekali)

#### 1. Install Docker di VPS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker pawangcuaca
# Logout & login ulang biar group docker aktif
```

#### 2. Clone repository

```bash
cd /home/pawangcuaca
git clone https://github.com/username/pawangcuaca.git
cd pawangcuaca
```

#### 3. Buat `.env` production

```bash
cat > .env << 'EOF'
DB_PASSWORD=<password_kuat_unik>
JWT_SECRET=<random_string_minimal_64_karakter>
CLIENT_ORIGIN=https://pawangcuaca.space
CLIENT_API_URL=https://pawangcuaca.space/api
EOF
```

#### 4. Build & start semua container

```bash
docker compose up -d --build
```

#### 5. Seed SuperAdmin

```bash
docker compose exec server node seed.js
```

#### 6. Setup Cloudflare Tunnel

Di Cloudflare Dashboard -> Zero Trust -> Networks -> Tunnels:
- Buat tunnel baru (atau edit yang sudah ada)
- Add public hostname: `pawangcuaca.space` -> Service: `http://localhost:8081`
- Optional: `www.pawangcuaca.space` -> Service: `http://localhost:8081`

#### 7. Verify

```bash
docker compose ps
curl -s http://localhost:8081/api/health
```

Buka https://pawangcuaca.space di browser.

---

## Post-Push: Apa yang Dilakukan di VPS

Setiap kali kamu push perubahan ke repository, jalankan ini di VPS:

### Ubah Backend Saja

```bash
cd /home/pawangcuaca/pawangcuaca
git pull origin main
docker compose up -d --build server
```

### Ubah Frontend Saja

```bash
cd /home/pawangcuaca/pawangcuaca
git pull origin main
docker compose up -d --build client nginx
```

> Client rebuild diperlukan karena Vite bake `VITE_API_BASE_URL` saat build time. Nginx perlu restart biar reconnect ke client container baru.

### Ubah Backend + Frontend

```bash
cd /home/pawangcuaca/pawangcuaca
git pull origin main
docker compose up -d --build
```

### Ada Database Migration Baru

```bash
cd /home/pawangcuaca/pawangcuaca
git pull origin main
docker compose up -d --build server
docker compose exec server node src/db/migrate.js
```

### Ubah Root `.env` (DB password, JWT secret, API URL)

```bash
cd /home/pawangcuaca/pawangcuaca
# Edit .env lalu:
docker compose up -d --build
```

> Jika `CLIENT_API_URL` berubah, client **wajib** di-rebuild karena env di-bake saat build time.

### Quick Reference

| Yang Berubah | Command |
|---|---|
| Backend code saja | `git pull && docker compose up -d --build server` |
| Frontend code saja | `git pull && docker compose up -d --build client nginx` |
| Backend + Frontend | `git pull && docker compose up -d --build` |
| Database migration | `docker compose exec server node src/db/migrate.js` |
| Root `.env` berubah | `docker compose up -d --build` |
| Docker nginx config | `git pull && docker compose up -d --build nginx` |
| Semua berubah sekaligus | `git pull && docker compose up -d --build` |

---

## Perintah Docker Berguna

```bash
# Lihat logs semua container
docker compose logs -f

# Lihat logs container tertentu
docker compose logs -f server
docker compose logs -f db
docker compose logs -f nginx

# Restart service tertentu
docker compose restart server

# Rebuild setelah code change
docker compose up -d --build server
docker compose up -d --build client

# Stop semua container
docker compose down

# Stop & hapus volumes (SEMUA data database & upload hilang!)
docker compose down -v

# Masuk ke shell container server
docker compose exec server sh

# Masuk ke database
docker compose exec db psql -U pawangcuaca_user -d pawangcuaca_db

# Cek resource usage
docker stats pawangcuaca_server pawangcuaca_db
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Container DB terus restart | `docker compose logs db` — cek volume korup? Coba `docker compose down -v && docker compose up -d --build` |
| Migration tidak jalan | Hanya jalan saat volume `pgdata` baru. Jalankan manual: `docker compose exec server node src/db/migrate.js` |
| Port 8081 sudah dipakai | Cek `sudo lsof -i :8081`, stop service-nya, atau ganti port di `docker-compose.yml` |
| Upload file hilang setelah restart | Jangan `docker compose down -v`. Volume `uploads` harus tetap ada |
| Server tidak bisa konek ke DB | `docker compose ps` — pastikan DB healthy. `docker compose logs server` |
| Client build gagal | `docker compose logs client` — cek dependencies & `CLIENT_API_URL` di root `.env` |
| 502 Bad Gateway (Cloudflare) | Pastikan container jalan: `docker compose ps`. Cek tunnel point ke `http://localhost:8081` |
| Container otomatis jalan setelah reboot | `docker compose` sudah set `restart: unless-stopped`, pastikan Docker service juga auto-start: `sudo systemctl enable docker` |

---

## User Flow

### Alur Registrasi & Login

```
User -> Register (pilih role: Produsen/Konsumen) -> Status: PENDING
                                                      |
SuperAdmin -> Dashboard -> Approve/Reject User
                                                      |
User -> Login (jika approved) -> JWT Token -> Akses platform sesuai role
```

### Alur Produsen (Kontributor Laporan)

```
Produsen Login -> Buat Laporan Cuaca (judul, deskripsi, media, lokasi)
               -> Buat Cuaca Thread (storytelling cuaca berkelanjutan)
               -> Tambah post ke thread (update cuaca real-time)
               -> Lihat Pawang Level (gamifikasi reputasi)
```

### Alur Konsumen (Validator Laporan)

```
Konsumen Login -> Browse Laporan Cuaca (feed, filter lokasi)
               -> Lihat Detail Laporan (media, data cuaca)
               -> Vote Akurasi (Akurat / Meleset)
               -> Browse Cuaca Threads (ikuti cerita cuaca)
               -> Lihat Cuaca Real-time + Peta Interaktif
```

### Alur SuperAdmin

```
SuperAdmin Login -> Dashboard (statistik platform)
                -> Manajemen User (approve/reject/delete)
                -> Akses penuh ke semua fitur
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
| user_id | INTEGER | FK -> users, NOT NULL | Pemilik laporan |
| location_id | INTEGER | FK -> locations | Lokasi laporan |
| thread_post_id | INTEGER | FK -> thread_posts | Link ke thread post (opsional) |
| title | VARCHAR(255) | NOT NULL | Judul laporan |
| description | TEXT | — | Deskripsi detail |
| weather_condition | VARCHAR(100) | — | Kondisi cuaca |
| temperature | DECIMAL(5,2) | — | Suhu (C) |
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
| report_id | INTEGER | FK -> reports, UNIQUE(user) | Laporan yang di-vote |
| user_id | INTEGER | FK -> users, UNIQUE(report) | Voter |
| vote_type | VARCHAR(10) | CHECK | upvote/downvote |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `threads`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | — |
| user_id | INTEGER | FK -> users | Pembuat thread |
| location_id | INTEGER | FK -> locations | Lokasi thread |
| title | VARCHAR(255) | NOT NULL | Judul thread |
| status | VARCHAR(20) | DEFAULT 'active' | active/archived |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `thread_posts`

| Kolom | Tipe | Constraint | Deskripsi |
|---|---|---|---|
| id | SERIAL | PK | — |
| thread_id | INTEGER | FK -> threads | Thread induk |
| user_id | INTEGER | FK -> users | Penulis post |
| content | TEXT | NOT NULL | Isi post |
| media_url | VARCHAR(500) | — | URL media |
| media_type | VARCHAR(20) | CHECK | image/video/gif |
| media_size | INTEGER | — | Ukuran file |
| weather_condition | VARCHAR(100) | — | Kondisi cuaca |
| temperature | DECIMAL(5,2) | — | Suhu |
| position | INTEGER | DEFAULT 0 | Urutan dalam thread |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | — |

### Tabel: `locations`

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
| Login / Register | Y | Y | Y |
| Lihat cuaca real-time | Y | Y | Y |
| Browse laporan & threads | Y | Y | Y |
| Approve/Reject user | Y | - | - |
| Hapus user | Y | - | - |
| Buat laporan cuaca + media | Y | Y | - |
| Buat Cuaca Thread | Y | Y | - |
| Tambah post ke thread | Y | Y | - |
| Vote akurasi laporan | - | - | Y |
| Lihat Pawang Level | Y | Y | Y |
| Edit profil sendiri | Y | Y | Y |
| Hapus laporan sendiri | Y | Y | - |

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
