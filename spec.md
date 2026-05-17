# PawangCuaca — Full Product Specification
**Version:** 1.0.0  
**Author:** Nafhan Shafy Aulia (18224027)  
**Last Updated:** 2026-05-17  
**Status:** Ready for Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Database Schema](#5-database-schema)
6. [API Contract](#6-api-contract)
7. [Frontend Specification](#7-frontend-specification)
8. [UI/UX Design System](#8-uiux-design-system)
9. [Security Specification](#9-security-specification)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Environment Variables](#11-environment-variables)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Testing Strategy](#13-testing-strategy)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Project Overview

### 1.1 Latar Belakang

**PawangCuaca** adalah platform citizen science berbasis web yang memungkinkan masyarakat untuk memvalidasi akurasi prediksi cuaca makro (berbasis satelit/API publik) dengan laporan ground-truth dari lapangan. Masalah yang diselesaikan: prediksi cuaca dari provider besar seperti OpenWeatherMap sering meleset di tingkat kecamatan/mikro, menyebabkan inefisiensi mobilitas warga kota.

### 1.2 Tagline
> *"Cuaca dari warga, untuk warga."*

### 1.3 Scope MVP

| In Scope | Out of Scope |
|---|---|
| Tampilkan cuaca real-time & hourly berdasarkan geolokasi | Push notification / PWA |
| Voting system (Upvote/Downvote per jam) | Machine learning model kalibrasi |
| Riwayat voting & akurasi per lokasi | Monetisasi / iklan |
| Peta sebaran laporan warga (sederhana) | Mobile native app |
| Rate limiting & basic security | Multi-language support |

---

## 2. Goals & Success Metrics

### 2.1 Product Goals
- Pengguna dapat melihat cuaca real-time di lokasi mereka dalam < 3 detik
- Pengguna dapat memberikan vote validasi dalam 1 klik tanpa login
- Data agregasi vote tersimpan dan bisa dikonsumsi ulang oleh komunitas

### 2.2 Key Metrics

| Metric | Target (30 hari) |
|---|---|
| Page Load Time (LCP) | < 2.5 detik |
| Time to Interactive | < 3.5 detik |
| Vote submission success rate | > 99% |
| API uptime | > 99.5% |
| Core Web Vitals score | ≥ 90 (Lighthouse) |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│              React SPA (Browser / CDN)                      │
│         Geolocation API → Fetch cuaca & vote                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (VPS)                        │
│              Node.js + Express (REST API)                   │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│   │ /api/weather │  │  /api/votes  │  │  /api/locations │  │
│   └──────────────┘  └──────────────┘  └─────────────────┘  │
│              Rate Limiter | CORS | Helmet                   │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────┐       ┌───────────────────────────┐
│ OpenWeatherMap  │       │   PostgreSQL Database      │
│   External API  │       │   (Managed via pgAdmin /   │
│  (HTTP/REST)    │       │    aaPanel on VPS)         │
└─────────────────┘       └───────────────────────────┘
```

### 3.2 Request Flow — Melihat Cuaca

```
User buka halaman
    → Browser minta izin geolokasi
    → Dapat lat/lon
    → GET /api/weather?lat=X&lon=Y
    → Express cek Redis cache (TTL 10 menit)
        → Cache hit: return data
        → Cache miss: fetch OpenWeatherMap API
            → Simpan ke cache
            → Return ke client
    → React render cuaca + voting interface
```

### 3.3 Request Flow — Submit Vote

```
User klik Upvote / Downvote
    → Baca fingerprint (localStorage + IP hash)
    → POST /api/votes
        → Rate limit check (max 1 vote / lokasi / jam / fingerprint)
        → Simpan ke tabel `votes`
        → Update tabel `vote_aggregates`
    → Return updated score ke client
    → Animasi feedback (bounce / confetti ringan)
```

### 3.4 Folder Structure

```
pawangcuaca/
├── client/                         # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── WeatherCard/
│   │   │   │   ├── WeatherCard.jsx
│   │   │   │   ├── WeatherCard.css
│   │   │   │   └── index.js
│   │   │   ├── VotingPanel/
│   │   │   │   ├── VotingPanel.jsx
│   │   │   │   ├── VotingPanel.css
│   │   │   │   └── index.js
│   │   │   ├── HourlyForecast/
│   │   │   │   ├── HourlyForecast.jsx
│   │   │   │   └── index.js
│   │   │   ├── AccuracyBadge/
│   │   │   │   └── AccuracyBadge.jsx
│   │   │   ├── LocationMap/
│   │   │   │   └── LocationMap.jsx
│   │   │   └── LoadingSkeleton/
│   │   │       └── LoadingSkeleton.jsx
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js
│   │   │   ├── useWeather.js
│   │   │   ├── useVoting.js
│   │   │   └── useFingerprint.js
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + endpoints
│   │   ├── utils/
│   │   │   ├── fingerprint.js      # Device fingerprinting
│   │   │   ├── formatWeather.js    # Data formatting helpers
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── .env
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── weatherController.js
│   │   │   ├── voteController.js
│   │   │   └── locationController.js
│   │   ├── routes/
│   │   │   ├── weather.js
│   │   │   ├── votes.js
│   │   │   └── locations.js
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js
│   │   │   ├── cors.js
│   │   │   ├── errorHandler.js
│   │   │   └── validateRequest.js
│   │   ├── services/
│   │   │   ├── openWeatherService.js
│   │   │   ├── cacheService.js       # node-cache atau Redis
│   │   │   └── voteService.js
│   │   ├── db/
│   │   │   ├── pool.js               # pg Pool config
│   │   │   └── migrations/
│   │   │       ├── 001_create_locations.sql
│   │   │       ├── 002_create_votes.sql
│   │   │       └── 003_create_vote_aggregates.sql
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── geoHash.js            # Quantize lat/lon
│   │   │   └── ipHasher.js
│   │   └── app.js
│   ├── server.js                     # Entry point
│   ├── .env
│   └── package.json
│
├── nginx/
│   └── pawangcuaca.conf              # Reverse proxy config
├── .gitignore
└── README.md
```

---

## 4. Tech Stack

### 4.1 Frontend

| Teknologi | Versi | Kegunaan |
|---|---|---|
| React | ^18.3 | UI Framework |
| Vite | ^5.x | Build tool & dev server |
| React Router DOM | ^6.x | Client-side routing |
| Axios | ^1.x | HTTP client |
| Framer Motion | ^11.x | Animasi & micro-interactions |
| Leaflet.js | ^1.9 | Peta interaktif (ringan) |
| React Leaflet | ^4.x | Wrapper React untuk Leaflet |
| date-fns | ^3.x | Formatting waktu/tanggal |

### 4.2 Backend

| Teknologi | Versi | Kegunaan |
|---|---|---|
| Node.js | ^20 LTS | Runtime |
| Express | ^4.x | Web framework |
| pg (node-postgres) | ^8.x | PostgreSQL client |
| node-cache | ^5.x | In-memory caching |
| express-rate-limit | ^7.x | Rate limiting |
| helmet | ^7.x | HTTP security headers |
| cors | ^2.x | CORS middleware |
| axios | ^1.x | Fetch ke OpenWeatherMap |
| joi | ^17.x | Request validation |
| winston | ^3.x | Structured logging |
| dotenv | ^16.x | Environment variables |

### 4.3 Database

| Teknologi | Versi | Kegunaan |
|---|---|---|
| PostgreSQL | ^16 | Primary database |
| pgAdmin / aaPanel DB | — | GUI management di VPS |

### 4.4 Infrastructure

| Komponen | Tools |
|---|---|
| VPS | Hostinger / DigitalOcean / Contabo |
| Panel | aaPanel |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| DNS & Tunnel | Cloudflare |
| Process Manager | PM2 |
| Domain | pawangcuaca.space |

---

## 5. Database Schema

### 5.1 Overview Tabel

```
locations ──< votes >── vote_aggregates
```

### 5.2 Tabel: `locations`

Menyimpan lokasi unik yang di-hash dari koordinat (geohash precision 5 ≈ radius ~4.9km).

```sql
CREATE TABLE locations (
    id            SERIAL PRIMARY KEY,
    geohash       VARCHAR(12) NOT NULL UNIQUE,    -- "qqguw" dsb
    lat           DECIMAL(9,6) NOT NULL,           -- representatif center
    lon           DECIMAL(9,6) NOT NULL,
    label         VARCHAR(255),                    -- "Bandung, Jawa Barat" (dari reverse geocode)
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_geohash ON locations(geohash);
```

### 5.3 Tabel: `votes`

Setiap baris adalah satu vote dari satu pengguna untuk satu slot jam cuaca.

```sql
CREATE TABLE votes (
    id              SERIAL PRIMARY KEY,
    location_id     INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    forecast_hour   TIMESTAMPTZ NOT NULL,          -- jam yang di-vote (dibulatkan ke jam)
    vote_type       VARCHAR(10) NOT NULL           -- 'upvote' | 'downvote'
                        CHECK (vote_type IN ('upvote', 'downvote')),
    voter_hash      VARCHAR(64) NOT NULL,          -- SHA-256(IP + fingerprint + date)
    ip_hash         VARCHAR(64) NOT NULL,          -- SHA-256(IP)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: satu hash hanya bisa vote sekali per lokasi per jam
CREATE UNIQUE INDEX idx_votes_unique_voter
    ON votes(location_id, forecast_hour, voter_hash);

CREATE INDEX idx_votes_location_hour ON votes(location_id, forecast_hour);
CREATE INDEX idx_votes_created_at    ON votes(created_at);
```

### 5.4 Tabel: `vote_aggregates`

Pre-computed aggregat untuk performa read yang cepat (update on write).

```sql
CREATE TABLE vote_aggregates (
    id              SERIAL PRIMARY KEY,
    location_id     INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    forecast_hour   TIMESTAMPTZ NOT NULL,
    upvotes         INTEGER DEFAULT 0,
    downvotes       INTEGER DEFAULT 0,
    accuracy_pct    DECIMAL(5,2) GENERATED ALWAYS AS (
                        CASE
                            WHEN (upvotes + downvotes) = 0 THEN NULL
                            ELSE ROUND((upvotes::DECIMAL / (upvotes + downvotes)) * 100, 2)
                        END
                    ) STORED,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(location_id, forecast_hour)
);

CREATE INDEX idx_agg_location_hour ON vote_aggregates(location_id, forecast_hour);
```

### 5.5 Migration Files

**`001_create_locations.sql`** — jalankan pertama  
**`002_create_votes.sql`** — jalankan kedua  
**`003_create_vote_aggregates.sql`** — jalankan ketiga  

Jalankan dengan:
```bash
psql -U pawangcuaca_user -d pawangcuaca_db -f server/src/db/migrations/001_create_locations.sql
```

---

## 6. API Contract

**Base URL:** `https://pawangcuaca.space/api`  
**Content-Type:** `application/json`  
**Versi:** `v1` (prefix opsional: `/api/v1/...`)

---

### 6.1 `GET /api/weather`

Mengambil cuaca real-time + forecast 12 jam ke depan berdasarkan koordinat.

**Query Parameters:**

| Param | Type | Required | Deskripsi |
|---|---|---|---|
| `lat` | float | ✅ | Latitude (-90 s/d 90) |
| `lon` | float | ✅ | Longitude (-180 s/d 180) |

**Request Example:**
```http
GET /api/weather?lat=-6.9175&lon=107.6191
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "location": {
      "geohash": "qqguw",
      "label": "Bandung, Jawa Barat",
      "lat": -6.9175,
      "lon": 107.6191
    },
    "current": {
      "dt": 1747400000,
      "temp_c": 22.4,
      "feels_like_c": 21.8,
      "humidity": 78,
      "wind_speed_kmh": 12.6,
      "weather_code": 500,
      "weather_main": "Rain",
      "weather_description": "light rain",
      "weather_icon": "10d",
      "icon_url": "https://openweathermap.org/img/wn/10d@2x.png",
      "uvi": 3.2,
      "visibility_m": 8000,
      "cloud_pct": 85
    },
    "hourly": [
      {
        "dt": 1747400000,
        "hour_label": "14:00",
        "temp_c": 22.4,
        "pop": 0.85,
        "weather_icon": "10d",
        "weather_description": "light rain"
      }
      // ... 11 item berikutnya (total 12 jam)
    ],
    "cached": false,
    "fetched_at": "2026-05-17T14:00:00.000Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "Parameter lat dan lon wajib diisi dan bernilai valid."
  }
}
```

**Response 503 Service Unavailable:**
```json
{
  "success": false,
  "error": {
    "code": "WEATHER_API_UNAVAILABLE",
    "message": "Layanan cuaca eksternal sedang tidak tersedia. Coba lagi nanti."
  }
}
```

---

### 6.2 `GET /api/weather/votes`

Mengambil data vote agregat untuk suatu lokasi dan rentang waktu.

**Query Parameters:**

| Param | Type | Required | Deskripsi |
|---|---|---|---|
| `lat` | float | ✅ | Latitude |
| `lon` | float | ✅ | Longitude |
| `hours` | integer | ❌ | Jumlah jam ke depan (default: 12, max: 48) |

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "geohash": "qqguw",
    "votes_by_hour": [
      {
        "forecast_hour": "2026-05-17T14:00:00.000Z",
        "hour_label": "14:00",
        "upvotes": 14,
        "downvotes": 3,
        "total": 17,
        "accuracy_pct": 82.35,
        "user_voted": null
      }
    ]
  }
}
```

> `user_voted` diisi `"upvote"` atau `"downvote"` jika header `X-Voter-Hash` dikirim dan cocok.

---

### 6.3 `POST /api/votes`

Submit satu vote (upvote/downvote) untuk satu slot jam cuaca.

**Request Headers:**

| Header | Deskripsi |
|---|---|
| `Content-Type` | `application/json` |
| `X-Forwarded-For` | Diisi otomatis oleh Nginx/Cloudflare |

**Request Body:**
```json
{
  "lat": -6.9175,
  "lon": 107.6191,
  "forecast_hour": "2026-05-17T14:00:00.000Z",
  "vote_type": "upvote",
  "voter_fingerprint": "abc123def456..."
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `lat` | float | ✅ | -90 ≤ lat ≤ 90 |
| `lon` | float | ✅ | -180 ≤ lon ≤ 180 |
| `forecast_hour` | ISO 8601 | ✅ | Tidak boleh > 48 jam ke depan |
| `vote_type` | string | ✅ | `"upvote"` atau `"downvote"` |
| `voter_fingerprint` | string | ✅ | Min 16 char, hex/alphanum |

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "vote_id": 1042,
    "forecast_hour": "2026-05-17T14:00:00.000Z",
    "vote_type": "upvote",
    "updated_aggregate": {
      "upvotes": 15,
      "downvotes": 3,
      "total": 18,
      "accuracy_pct": 83.33
    }
  }
}
```

**Response 409 Conflict (sudah pernah vote):**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_VOTED",
    "message": "Kamu sudah memberikan vote untuk jam ini di lokasi ini."
  }
}
```

**Response 429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Terlalu banyak permintaan. Silakan tunggu beberapa saat."
  }
}
```

---

### 6.4 `GET /api/locations/leaderboard`

Daftar 10 lokasi dengan aktivitas vote terbanyak (opsional, untuk halaman komunitas).

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "geohash": "qqguw",
      "label": "Bandung, Jawa Barat",
      "lat": -6.9175,
      "lon": 107.6191,
      "total_votes": 1234,
      "avg_accuracy_pct": 76.5
    }
  ]
}
```

---

### 6.5 `GET /api/health`

Health check endpoint untuk monitoring.

**Response 200 OK:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T14:00:00.000Z",
  "db": "connected",
  "cache": "active",
  "uptime_seconds": 86400
}
```

---

## 7. Frontend Specification

### 7.1 Pages & Routes

| Route | Komponen Utama | Deskripsi |
|---|---|---|
| `/` | `HomePage` | Halaman utama, cuaca + voting |
| `/komunitas` | `CommunityPage` | Peta sebaran laporan & leaderboard |
| `/tentang` | `AboutPage` | Penjelasan proyek & metodologi |

### 7.2 Halaman Utama (`/`)

#### Alur UX:
```
1. Splash / loading skeleton tampil
2. Browser minta izin geolokasi
   ├── IZIN DIBERIKAN → fetch cuaca otomatis
   └── DITOLAK → tampil input manual "Cari kota..."
3. WeatherCard tampil dengan data cuaca saat ini
4. HourlyForecast strip tampil di bawah
5. VotingPanel untuk jam aktif tampil
6. AccuracyBadge (% akurasi historis) tampil
```

#### Komponen Hierarchy:
```
App
└── HomePage
    ├── Navbar
    ├── LocationBar          ← nama lokasi + tombol refresh lokasi
    ├── WeatherCard          ← cuaca sekarang (ikon besar, suhu, deskripsi)
    │   ├── TempDisplay
    │   ├── WeatherIcon
    │   ├── WeatherMeta      ← kelembapan, angin, UV
    │   └── AccuracyBadge
    ├── HourlyForecast       ← scroll horizontal, 12 jam
    │   └── HourlyItem[]
    ├── VotingPanel          ← untuk jam yang sedang aktif
    │   ├── VoteButton (Upvote)
    │   ├── VoteButton (Downvote)
    │   └── VoteScoreDisplay
    └── Footer
```

### 7.3 State Management

Gunakan **React Context + useReducer** (tanpa Redux, cukup untuk scope ini).

```javascript
// WeatherContext.js
const initialState = {
  location: null,          // { lat, lon, geohash, label }
  weather: null,           // current weather data
  hourly: [],              // 12-hour forecast
  votes: {},               // keyed by forecast_hour ISO string
  userVotes: {},           // fingerprint-based, keyed by forecast_hour
  status: 'idle',          // 'idle' | 'loading' | 'success' | 'error'
  error: null,
};
```

### 7.4 Custom Hooks

#### `useGeolocation()`
```javascript
// Returns: { coords, error, loading, retry }
// Behaviour:
// - Auto-request on mount
// - Fallback ke IP geolocation jika browser geoloc gagal
// - Simpan last known location ke localStorage
```

#### `useWeather(lat, lon)`
```javascript
// Returns: { weather, hourly, loading, error, refetch }
// Behaviour:
// - Fetch ke /api/weather saat lat/lon tersedia
// - Re-fetch tiap 10 menit (interval)
// - Cancel request saat komponen unmount
```

#### `useVoting(geohash, forecastHour)`
```javascript
// Returns: { votes, userVote, submitVote, loading }
// Behaviour:
// - Cek localStorage untuk user vote sebelumnya
// - POST ke /api/votes
// - Optimistic update UI sebelum server confirm
```

#### `useFingerprint()`
```javascript
// Returns: { fingerprint }
// Behaviour:
// - Generate hash dari: userAgent + language + timezone + screen + canvas
// - Simpan ke localStorage dengan key 'pwc_fp'
// - Tidak pernah kirim data PII
```

### 7.5 Fitur Voting — Detail Behavior

| Kondisi | UI Behavior |
|---|---|
| Belum vote | Dua tombol aktif dengan hover animation |
| Sedang loading | Tombol disable + spinner kecil |
| Vote berhasil | Tombol terpilih highlight + animasi bounce + score update |
| Sudah vote sebelumnya | Tombol terpilih highlight, tombol lain disable |
| Error ALREADY_VOTED | Toast "Kamu sudah vote jam ini!" |
| Error RATE_LIMIT | Toast "Tunggu sebentar..." dengan countdown |

---

## 8. UI/UX Design System

### 8.1 Prinsip Desain

- **Langsung ke inti:** Cuaca & tombol vote harus visible tanpa scroll di mobile
- **Feedback instan:** Setiap interaksi punya visual response < 100ms
- **Bisa dipakai satu tangan:** Touch target minimum 44×44px
- **Dark-first:** Desain dimulai dari dark mode (lebih nyaman di siang hari outdoor)

### 8.2 Palet Warna

```css
:root {
  /* === PRIMARY === */
  --color-sky-clear:    #38BDF8;   /* cerah / upvote */
  --color-rain:         #6366F1;   /* hujan */
  --color-storm:        #7C3AED;   /* badai */
  --color-sunny-warm:   #FB923C;   /* panas terik */

  /* === NEUTRAL === */
  --color-bg-base:      #0D1117;   /* background utama */
  --color-bg-card:      #161B22;   /* card/panel */
  --color-bg-elevated:  #21262D;   /* elevated element */
  --color-border:       #30363D;   /* divider */

  /* === TEXT === */
  --color-text-primary:   #E6EDF3;
  --color-text-secondary: #8B949E;
  --color-text-muted:     #484F58;

  /* === SEMANTIC === */
  --color-upvote:   #22C55E;   /* hijau */
  --color-downvote: #EF4444;   /* merah */
  --color-neutral:  #6B7280;

  /* === STATUS === */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error:   #EF4444;
  --color-info:    #38BDF8;
}
```

### 8.3 Tipografi

```css
/* Display / Heading — angka suhu besar */
font-family: 'DM Serif Display', serif;

/* Body / UI — label, deskripsi */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Mono — geohash, timestamp teknis */
font-family: 'JetBrains Mono', monospace;
```

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?
  family=DM+Serif+Display&
  family=Plus+Jakarta+Sans:wght@400;500;600;700&
  family=JetBrains+Mono:wght@400;500&
  display=swap" rel="stylesheet">
```

### 8.4 Spacing & Sizing Scale (8px base)

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-6:  24px;
--space-8:  32px;
--space-12: 48px;
--space-16: 64px;

--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 20px;
--radius-xl: 32px;
--radius-full: 9999px;
```

### 8.5 Breakpoints

```css
/* Mobile first */
--bp-sm:  480px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1280px;
```

### 8.6 Animasi (Framer Motion)

```javascript
// Weather card entrance
const weatherCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

// Vote button bounce on success
const voteSuccessVariants = {
  tap: { scale: 0.92 },
  success: {
    scale: [1, 1.2, 0.95, 1.05, 1],
    transition: { duration: 0.5, times: [0, 0.3, 0.6, 0.8, 1] }
  }
};

// Hourly scroll item stagger
const hourlyItemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};
```

---

## 9. Security Specification

### 9.1 HTTP Security Headers (Helmet.js)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openweathermap.org"],
      imgSrc:     ["'self'", "https://openweathermap.org", "data:"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));
```

### 9.2 CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,  // "https://pawangcuaca.space"
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Voter-Hash'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 9.3 Rate Limiting

```javascript
// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 menit
  max: 100,                    // 100 request per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Vote endpoint limiter (lebih ketat)
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 menit
  max: 5,                      // 5 vote attempts per menit per IP
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } }
});

// Weather endpoint limiter
const weatherLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,                     // 30 request cuaca per menit per IP
});
```

### 9.4 Input Validation (Joi)

```javascript
// Vote schema
const voteSchema = Joi.object({
  lat:                Joi.number().min(-90).max(90).required(),
  lon:                Joi.number().min(-180).max(180).required(),
  forecast_hour:      Joi.string().isoDate().required(),
  vote_type:          Joi.string().valid('upvote', 'downvote').required(),
  voter_fingerprint:  Joi.string().alphanum().min(16).max(128).required(),
});
```

### 9.5 Anti-Abuse: Voter Identity

Identitas voter **tidak menyimpan data PII**. Hash dibentuk dari:
```javascript
const voterHash = crypto
  .createHash('sha256')
  .update(`${ipAddress}:${fingerprint}:${dateString}`)
  .digest('hex');
```

- `ipAddress` → diambil dari `X-Forwarded-For` (di-trust dari Cloudflare)
- `fingerprint` → dikirim client, dibentuk dari browser properties
- `dateString` → `YYYY-MM-DD` → hash rotate tiap hari (privacy by design)

### 9.6 Database Security

```sql
-- Buat user khusus dengan privilege minimal
CREATE USER pawangcuaca_user WITH PASSWORD 'strong_random_password';
GRANT CONNECT ON DATABASE pawangcuaca_db TO pawangcuaca_user;
GRANT USAGE ON SCHEMA public TO pawangcuaca_user;
GRANT SELECT, INSERT, UPDATE ON locations, votes, vote_aggregates TO pawangcuaca_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pawangcuaca_user;
```

### 9.7 API Key Protection

- OpenWeatherMap API key **hanya** ada di environment variable server-side
- Client **tidak pernah** menerima API key eksternal dalam response
- Key dirotasi jika terdeteksi di logs atau git history

---

## 10. Deployment & Infrastructure

### 10.1 Overview

```
Internet → Cloudflare (DNS + WAF + DDoS protection)
    → VPS (Nginx sebagai reverse proxy)
        → PM2 (process manager)
            → Node.js Express API (port 3001)
        → Static files React build (served by Nginx)
        → PostgreSQL (port 5432, local only)
```

### 10.2 Nginx Configuration

```nginx
# /etc/nginx/sites-available/pawangcuaca.conf

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

    # Serve React build
    root /var/www/pawangcuaca/client/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy ke Express API
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # Security headers tambahan
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

### 10.3 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name:         'pawangcuaca-api',
    script:       './server/server.js',
    instances:    2,                    // cluster mode
    exec_mode:    'cluster',
    watch:        false,
    max_memory_restart: '300M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file:   '/var/log/pm2/pawangcuaca-error.log',
    out_file:     '/var/log/pm2/pawangcuaca-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### 10.4 Deployment Steps

```bash
# === 1. Di VPS: Setup Database ===
sudo -u postgres psql
CREATE DATABASE pawangcuaca_db;
CREATE USER pawangcuaca_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE pawangcuaca_db TO pawangcuaca_user;
\q

# Jalankan migrations
psql -U pawangcuaca_user -d pawangcuaca_db -f server/src/db/migrations/001_create_locations.sql
psql -U pawangcuaca_user -d pawangcuaca_db -f server/src/db/migrations/002_create_votes.sql
psql -U pawangcuaca_user -d pawangcuaca_db -f server/src/db/migrations/003_create_vote_aggregates.sql

# === 2. Clone & Install ===
git clone https://github.com/username/pawangcuaca.git /var/www/pawangcuaca
cd /var/www/pawangcuaca

# Install server deps
cd server && npm install --production && cd ..

# Install & build client
cd client && npm install && npm run build && cd ..

# === 3. Environment ===
cp server/.env.example server/.env
nano server/.env   # isi semua variable

# === 4. Start dengan PM2 ===
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # agar jalan saat VPS restart

# === 5. Nginx ===
sudo cp nginx/pawangcuaca.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/pawangcuaca.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# === 6. SSL dengan Certbot ===
sudo certbot --nginx -d pawangcuaca.space -d www.pawangcuaca.space
```

### 10.5 CI/CD Sederhana (Git Hook)

```bash
# Di VPS: /var/www/pawangcuaca/.git/hooks/post-receive
#!/bin/bash
cd /var/www/pawangcuaca
git pull origin main
cd server && npm install --production
cd ../client && npm install && npm run build
pm2 reload pawangcuaca-api
echo "✅ Deploy selesai!"
```

---

## 11. Environment Variables

### 11.1 Server (`server/.env`)

```env
# App
NODE_ENV=production
PORT=3001
CLIENT_ORIGIN=https://pawangcuaca.space

# Database
DATABASE_URL=postgresql://pawangcuaca_user:your_strong_password@localhost:5432/pawangcuaca_db
DB_POOL_MIN=2
DB_POOL_MAX=10

# External API
OPENWEATHERMAP_API_KEY=your_owm_api_key_here
OPENWEATHERMAP_BASE_URL=https://api.openweathermap.org/data/3.0

# Cache
CACHE_TTL_SECONDS=600

# Security
TRUSTED_PROXIES=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 11.2 Client (`client/.env`)

```env
VITE_API_BASE_URL=https://pawangcuaca.space/api
VITE_APP_VERSION=1.0.0
```

> ⚠️ Jangan pernah taruh API key OpenWeatherMap di `.env` client.

---

## 12. Error Handling Strategy

### 12.1 Backend Error Classes

```javascript
// utils/errors.js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource tidak ditemukan') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class ExternalServiceError extends AppError {
  constructor(message) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
  }
}
```

### 12.2 Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code       = err.code || 'INTERNAL_SERVER_ERROR';
  const message    = err.isOperational
    ? err.message
    : 'Terjadi kesalahan internal. Silakan coba lagi.';

  logger.error({ code, message, stack: err.stack, path: req.path });

  return res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
};
```

### 12.3 Frontend Error Boundary

```jsx
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <p>Waduh, ada yang salah 🌧️</p>
          <button onClick={() => window.location.reload()}>
            Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 13. Testing Strategy

### 13.1 Backend Unit Tests (Jest)

```
server/
└── __tests__/
    ├── unit/
    │   ├── geoHash.test.js           ← geohash generation
    │   ├── ipHasher.test.js          ← IP hashing
    │   └── voteService.test.js       ← business logic votes
    └── integration/
        ├── weather.routes.test.js    ← GET /api/weather
        └── votes.routes.test.js     ← POST /api/votes
```

### 13.2 Contoh Test

```javascript
// votes.routes.test.js
describe('POST /api/votes', () => {
  it('should return 201 on valid vote', async () => {
    const res = await request(app)
      .post('/api/votes')
      .send({
        lat: -6.9175, lon: 107.6191,
        forecast_hour: new Date().toISOString(),
        vote_type: 'upvote',
        voter_fingerprint: 'validfingerprint123456'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should return 400 on invalid vote_type', async () => {
    const res = await request(app)
      .post('/api/votes')
      .send({ ..., vote_type: 'maybe' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 409 on duplicate vote', async () => {
    // Submit dua kali dengan fingerprint yang sama
    await request(app).post('/api/votes').send(validPayload);
    const res = await request(app).post('/api/votes').send(validPayload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_VOTED');
  });
});
```

### 13.3 Frontend Tests

Gunakan **Vitest** + **React Testing Library** (sudah built-in dengan Vite):

```
client/src/__tests__/
├── components/
│   ├── WeatherCard.test.jsx
│   └── VotingPanel.test.jsx
└── hooks/
    └── useVoting.test.js
```

---

## 14. Future Roadmap

### Phase 2 (Bulan 2–3)
- [ ] **Push notification** saat cuaca berubah drastis di lokasi favorit
- [ ] **Halaman profil ringan** — riwayat vote user (berbasis localStorage)
- [ ] **Export CSV** data vote agregat untuk research
- [ ] **Embed widget** — bisa di-embed di website lain (iframe)

### Phase 3 (Bulan 4–6)
- [ ] **Model kalibrasi sederhana** — weight API forecast berdasarkan akurasi historis per geohash
- [ ] **WebSocket** — live update vote count tanpa polling
- [ ] **Multiple weather provider** — BMKG API sebagai sumber lokal Indonesia
- [ ] **Heatmap** aktivitas voting seluruh Indonesia

### Phase 4 (Long-term)
- [ ] **PWA + offline support**
- [ ] **ML pipeline** — prediksi accuracy score sebelum vote datang
- [ ] **Open API** — buka data agregat untuk researcher lain

---

## Appendix

### A. OpenWeatherMap API Reference

- Endpoint yang dipakai: `One Call API 3.0`
- URL: `https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={key}&units=metric&lang=id&exclude=minutely,daily,alerts`
- Biaya: Free tier = 1000 calls/hari, berbayar setelah itu

### B. Geohash Precision Reference

| Precision | Ukuran Area |
|---|---|
| 4 | ~39km × 19.5km |
| **5** | **~4.9km × 4.9km** ← yang dipakai |
| 6 | ~1.2km × 0.6km |
| 7 | ~153m × 152m |

Precision 5 dipilih untuk mengelompokkan vote dari area kecamatan yang sama tanpa terlalu spesifik.

### C. Voter Fingerprint Algorithm (Client-side)

```javascript
async function generateFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];

  const raw = components.join('|');
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw)
  );

  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

---

*Dokumen ini bersifat living document — update seiring perkembangan proyek.*  
*PawangCuaca © 2026 — Nafhan Shafy Aulia*
