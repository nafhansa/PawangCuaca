# PawangCuaca

> *"Cuaca dari warga, untuk warga."*

Platform citizen science berbasis web untuk memvalidasi akurasi prediksi cuaca dengan laporan ground-truth dari lapangan.

## Struktur Project

```
pawangcuaca/
├── client/          # React Frontend (Vite)
├── server/          # Node.js + Express Backend
├── nginx/           # Nginx reverse proxy config
└── ecosystem.config.js  # PM2 configuration
```

## Quick Start

### Server

```bash
cd server
cp .env.example .env
# Edit .env dengan konfigurasi kamu
npm install
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

## Deployment

1. Setup database PostgreSQL dan jalankan migrations
2. Install dependencies dan build client
3. Configure Nginx dan SSL
4. Start dengan PM2

Lihat `spec.md` untuk detail deployment steps.

## Tech Stack

- **Frontend:** React, Vite, Framer Motion, Leaflet
- **Backend:** Node.js, Express, PostgreSQL
- **Weather API:** OpenWeatherMap One Call API 3.0

## License

PawangCuaca © 2026 — Nafhan Shafy Aulia
