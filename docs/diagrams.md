# PawangCuaca — Diagram & Dokumentasi Teknis

---

## 1. Use Case Diagram per Role

### SuperAdmin

```mermaid
graph LR
    SA((SuperAdmin))
    SA --> UC1[Login ke Platform]
    SA --> UC2[Melihat Dashboard Statistik]
    SA --> UC3[Melihat Daftar User]
    SA --> UC4[Approve User Pending]
    SA --> UC5[Reject User Pending]
    SA --> UC6[Hapus User]
    SA --> UC7[Lihat Cuaca Real-time]
    SA --> UC8[Browse Laporan & Threads]
    SA --> UC9[Buat Laporan Cuaca]
    SA --> UC10[Buat Cuaca Thread]
    SA --> UC11[Edit Profil]
```

### Produsen

```mermaid
graph LR
    P((Produsen))
    P --> UC1[Register]
    P --> UC2[Login setelah Approved]
    P --> UC3[Buat Laporan Cuaca + Media]
    P --> UC4[Edit Laporan Sendiri]
    P --> UC5[Hapus Laporan Sendiri]
    P --> UC6[Buat Cuaca Thread]
    P --> UC7[Tambah Post ke Thread + Media]
    P --> UC8[Hapus Thread Sendiri]
    P --> UC9[Lihat Cuaca Real-time]
    P --> UC10[Browse Laporan & Threads]
    P --> UC11[Lihat Pawang Level]
    P --> UC12[Edit Profil]
```

### Konsumen

```mermaid
graph LR
    K((Konsumen))
    K --> UC1[Register]
    K --> UC2[Login setelah Approved]
    K --> UC3[Browse Laporan Cuaca]
    K --> UC4[Lihat Detail Laporan]
    K --> UC5[Vote Akurasi Laporan]
    K --> UC6[Browse Cuaca Threads]
    K --> UC7[Lihat Detail Thread]
    K --> UC8[Lihat Cuaca Real-time]
    K --> UC9[Lihat Peta Interaktif]
    K --> UC10[Lihat Leaderboard]
    K --> UC11[Edit Profil]
```

---

## 2. Sequence Diagrams

### 2.1 Sequence: Produsen Membuat Laporan Cuaca

```mermaid
sequenceDiagram
    actor Produsen
    participant Frontend as React Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant Service as Report Service
    participant DB as PostgreSQL
    participant FS as Filesystem

    Produsen->>Frontend: Isi form laporan + pilih media
    Frontend->>API: POST /api/reports (multipart/form-data)
    API->>Auth: Verify JWT + Check role=produsen
    Auth-->>API: User verified (produsen)
    API->>Service: createReport(userId, data, mediaInfo)
    
    alt Media diunggah
        Service->>FS: Simpan file ke /uploads/
        FS-->>Service: URL file: /uploads/uuid.ext
    end
    
    Service->>DB: INSERT INTO reports
    DB-->>Service: Report created
    Service->>DB: UPDATE users SET report_count + 1
    Service->>Service: updatePawangLevel(userId)
    Service-->>API: Report data
    API-->>Frontend: 201 Created { report }
    Frontend-->>Produsen: Laporan berhasil dipublikasikan
    
    Note over Produsen,DB: Validasi: role=produsen, status=approved, media format valid
    Note over Produsen,DB: Keluaran: Laporan tersimpan, Pawang Level terupdate
```

### 2.2 Sequence: Konsumen Vote Akurasi Laporan

```mermaid
sequenceDiagram
    actor Konsumen
    participant Frontend as React Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant Service as Report Service
    participant DB as PostgreSQL

    Konsumen->>Frontend: Klik "Akurat" atau "Meleset"
    Frontend->>API: POST /api/reports/:id/vote { vote_type }
    API->>Auth: Verify JWT + Check role=konsumen
    Auth-->>API: User verified (konsumen)
    API->>Service: voteOnReport(reportId, userId, voteType)
    
    Service->>DB: SELECT report WHERE id = reportId
    DB-->>Service: Report data
    
    alt Belum pernah vote
        Service->>DB: INSERT INTO report_votes
        Service->>DB: UPDATE reports SET upvotes/downvotes + 1
    else Sudah vote sebelumnya (berbeda tipe)
        Service->>DB: UPDATE report_votes SET vote_type
        Service->>DB: UPDATE reports SET upvotes/downvotes (adjust)
    else Sudah vote tipe yang sama
        Service-->>API: ConflictError "Sudah vote"
        API-->>Frontend: 409 Conflict
        Frontend-->>Konsumen: "Kamu sudah memberikan vote ini"
    end
    
    Service->>DB: Calculate & UPDATE accuracy_pct
    Service->>Service: updatePawangLevel(reportOwnerId)
    Service-->>API: Vote result + updated stats
    API-->>Frontend: 200 OK { vote stats }
    Frontend-->>Konsumen: Skor akurasi terupdate
    
    Note over Konsumen,DB: Validasi: role=konsumen, status=approved, belum vote laporan ini
    Note over Konsumen,DB: Keluaran: Skor akurasi laporan terupdate, Pawang Level produsen terupdate
```

### 2.3 Sequence: SuperAdmin Approve User

```mermaid
sequenceDiagram
    actor User as User Baru
    actor SA as SuperAdmin
    participant Frontend as React Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant Service as Admin Controller
    participant DB as PostgreSQL

    User->>Frontend: Register (pilih role)
    Frontend->>API: POST /api/auth/register
    API->>DB: INSERT users (status=pending)
    DB-->>API: User created
    API-->>Frontend: 201 "Menunggu persetujuan admin"
    Frontend-->>User: "Registrasi berhasil, tunggu approval"

    SA->>Frontend: Buka Admin Dashboard
    Frontend->>API: GET /api/admin/users?status=pending
    API->>Auth: Verify JWT + role=superadmin
    Auth-->>API: Verified
    API->>DB: SELECT users WHERE status=pending
    DB-->>API: List of pending users
    API-->>Frontend: Pending users list
    
    SA->>Frontend: Klik "Approve"
    Frontend->>API: PUT /api/admin/users/:id/approve
    API->>Auth: Verify JWT + role=superadmin
    Auth-->>API: Verified
    API->>DB: UPDATE users SET status=approved
    DB-->>API: User updated
    API-->>Frontend: 200 OK { user: approved }
    Frontend-->>SA: User berhasil diapprove
    
    Note over User,SA: User sekarang bisa login
    User->>Frontend: Login
    Frontend->>API: POST /api/auth/login
    API->>DB: SELECT user, check status=approved
    API-->>Frontend: 200 { token, user }
    Frontend-->>User: Login berhasil, redirect sesuai role
    
    Note over User,SA: Validasi: role=superadmin, user exists
    Note over User,SA: Keluaran: User status berubah, user bisa login
```

---

## 3. System Flowchart — Alur Interaksi Fungsi Platform

### 3.1 Flowchart Utama

```mermaid
flowchart TD
    START([User membuka platform]) --> AUTH{Sudah login?}
    
    AUTH -->|Tidak| REGISTER[Halaman Register]
    AUTH -->|Tidak| LOGIN[Halaman Login]
    AUTH -->|Ya| ROLE_CHECK{Role user?}
    
    REGISTER --> REG_FORM[Isi form: username, email, password, role]
    REG_FORM --> REG_SUBMIT[Submit registrasi]
    REG_SUBMIT --> REG_WAIT[Status: PENDING]
    REG_WAIT --> WAIT_ADMIN[Menunggu approval SuperAdmin]
    
    LOGIN --> LOGIN_FORM[Isi email & password]
    LOGIN_FORM --> LOGIN_CHECK{Status akun?}
    LOGIN_CHECK -->|Pending| LOGIN_PENDING[Akun belum disetujui]
    LOGIN_CHECK -->|Rejected| LOGIN_REJECTED[Akun ditolak]
    LOGIN_CHECK -->|Approved| ROLE_CHECK
    
    ROLE_CHECK -->|SuperAdmin| ADMIN_DASH[Admin Dashboard]
    ROLE_CHECK -->|Produsen| PRODUSER_HOME[Home Produsen]
    ROLE_CHECK -->|Konsumen| KONSUMEN_HOME[Home Konsumen]
    
    ADMIN_DASH --> ADMIN_USERS[Kelola User]
    ADMIN_USERS --> ADMIN_APPROVE[Approve/Reject User]
    ADMIN_USERS --> ADMIN_DELETE[Hapus User]
    ADMIN_DASH --> ADMIN_STATS[Lihat Statistik]
    
    PRODUSER_HOME --> CREATE_REPORT[Buat Laporan Cuaca]
    CREATE_REPORT --> UPLOAD_MEDIA[Upload Media foto/video/gif]
    UPLOAD_MEDIA --> SUBMIT_REPORT[Submit Laporan]
    SUBMIT_REPORT --> PAWANG_UPDATE[Pawang Level Update]
    
    PRODUSER_HOME --> CREATE_THREAD[Buat Cuaca Thread]
    CREATE_THREAD --> ADD_POST[Tambah Post ke Thread]
    ADD_POST --> UPLOAD_MEDIA2[Upload Media ke Post]
    
    PRODUSER_HOME --> VIEW_REPORTS2[Browse Laporan]
    PRODUSER_HOME --> VIEW_WEATHER[Lihat Cuaca Real-time]
    
    KONSUMEN_HOME --> BROWSE_REPORTS[Browse Laporan Cuaca]
    BROWSE_REPORTS --> VIEW_DETAIL[Lihat Detail Laporan]
    VIEW_DETAIL --> VOTE{Vote Akurasi}
    VOTE -->|Akurat| UPVOTE[Upvote Laporan]
    VOTE -->|Meleset| DOWNVOTE[Downvote Laporan]
    UPVOTE --> ACCURACY_UPDATE[Skor Akurasi Update]
    DOWNVOTE --> ACCURACY_UPDATE
    ACCURACY_UPDATE --> PAWANG_UPDATE2[Pawang Level Produsen Update]
    
    KONSUMEN_HOME --> BROWSE_THREADS[Browse Cuaca Threads]
    BROWSE_THREADS --> READ_THREAD[Baca Thread & Posts]
    
    KONSUMEN_HOME --> VIEW_WEATHER2[Lihat Cuaca Real-time]
    KONSUMEN_HOME --> VIEW_MAP[Lihat Peta Interaktif]
```

### 3.2 Rasionalisasi Pemisahan Fungsi

Pemisahan fungsi pada platform ini didasarkan pada prinsip **separation of concerns** dan **principle of least privilege**:

1. **Autentikasi & Otorisasi** dipisahkan dari logika bisnis — middleware menangani verifikasi JWT dan role check sebelum request mencapai controller
2. **CRUD Laporan** vs **CRUD Thread** dipisahkan karena keduanya memiliki siklus hidup dan relasi data yang berbeda — Laporan bersifat standalone, Thread bersifat serial/naratif
3. **Voting** dipisahkan dari pembuatan konten karena melibatkan aktor berbeda (Konsumen vs Produsen) dan memiliki validasi berbeda (cek duplikasi vote)
4. **Admin Management** diisolasi karena hanya relevan untuk SuperAdmin dan menyangkut keamanan (pengelolaan akses)
5. **Pawang Level** sebagai service terpisah karena melibatkan kalkulasi yang dipanggil dari berbagai tempat (saat buat laporan, saat di-vote, dll)

---

## 4. Tabel Penjelasan Fungsi Sistem

| Nama Fungsi | Role Pengguna | Masukan | Penjelasan | Validasi | Keluaran |
|---|---|---|---|---|---|
| Register | Public | username, email, password, role | Mendaftarkan user baru dengan status pending | Email unik, username unik, role = produsen/konsumen, password ≥ 6 char | User terdaftar (status: pending) |
| Login | Public | email, password | Autentikasi user dan mengeluarkan JWT | Email terdaftar, password cocok, status = approved | JWT token + data user |
| Approve User | SuperAdmin | user_id | Mengubah status user menjadi approved | Role = superadmin, user exists, user status = pending/rejected | User status = approved |
| Reject User | SuperAdmin | user_id | Mengubah status user menjadi rejected | Role = superadmin, user exists | User status = rejected |
| Delete User | SuperAdmin | user_id | Menghapus user dari sistem | Role = superadmin, user ≠ diri sendiri | User terhapus |
| Buat Laporan | Produsen | title, description, weather_condition, temperature, lat, lon, media file | Membuat laporan cuaca baru dengan media | Role = produsen, status = approved, media format valid (jpg/png/gif/mp4/webm), image ≤ 10MB, video ≤ 50MB | Laporan terpublikasi, Pawang Level terupdate |
| Edit Laporan | Produsen | report_id, fields to update | Mengedit laporan milik sendiri | Role = produsen, user = pemilik laporan | Laporan terupdate |
| Hapus Laporan | Produsen, SuperAdmin | report_id | Menghapus laporan | Role = produsen (pemilik) atau superadmin | Laporan terhapus, report_count terupdate |
| Vote Akurasi | Konsumen | report_id, vote_type | Memberikan vote akurasi pada laporan | Role = konsumen, status = approved, belum vote laporan ini (unique constraint) | Skor akurasi terupdate, Pawang Level produsen terupdate |
| Buat Thread | Produsen | title, lat, lon | Membuat thread cuaca baru | Role = produsen, status = approved | Thread terbuat |
| Tambah Post | Produsen | thread_id, content, weather_condition, temperature, media file | Menambah post ke thread yang ada | Role = produsen, status = approved, thread exists | Post terbuat, report_count terupdate, Pawang Level terupdate |
| Hapus Thread | Produsen, SuperAdmin | thread_id | Menghapus/archived thread | Role = produsen (pemilik) atau superadmin | Thread status = archived |
| Lihat Cuaca | Semua Auth | lat, lon | Mengambil data cuaca real-time dari Open-Meteo API | lat/lon valid, user authenticated | Data cuaca current + forecast 12 jam |
| Lihat Profil | Semua Auth | — | Melihat dan mengedit profil sendiri | User authenticated | Data profil user + Pawang Level |
| Lihat Pawang Level | Semua Auth | user_id | Melihat level reputasi produsen | User authenticated | Level, report_count, accuracy_score, next level info |

---

## 5. Diagram Arsitektur Sistem Docker

```mermaid
graph TB
    subgraph Internet
        USER[Pengguna / Browser]
    end

    subgraph Docker Host
        subgraph External Network
            NGINX[pawangcuaca_nginx<br/>Nginx Reverse Proxy<br/>:80 → :443]
            CLIENT[pawangcuaca_client<br/>React SPA<br/>Nginx :80 internal]
            SERVER[pawangcuaca_server<br/>Express API<br/>:3001 internal]
        end

        subgraph Internal Network
            SERVER
            DB[pawangcuaca_db<br/>PostgreSQL 16<br/>:5432 internal]
        end

        subgraph Volumes
            PGDATA[(pgdata<br/>Database<br/>Persistence)]
            UPLOADS[(uploads<br/>Media Files<br/>Persistence)]
        end
    end

    USER -->|HTTPS| NGINX
    NGINX -->|/ | CLIENT
    NGINX -->|/api/*| SERVER
    NGINX -->|/uploads/*| SERVER
    SERVER -->|SQL Queries| DB
    SERVER -->|Read/Write| UPLOADS
    DB --> PGDATA

    style NGINX fill:#38BDF8,color:#000
    style CLIENT fill:#161B22,color:#E6EDF3
    style SERVER fill:#22C55E,color:#000
    style DB fill:#6366F1,color:#FFF
    style PGDATA fill:#21262D,color:#E6EDF3
    style UPLOADS fill:#21262D,color:#E6EDF3
```

### Penjelasan Arsitektur

1. **Nginx (Reverse Proxy)** — Satu-satunya container yang expose port ke host. Menerima semua traffic dari internet dan me-route ke container yang tepat.
2. **Client Container** — Berisi React build yang di-serve oleh Nginx internal. Hanya bisa diakses melalui reverse proxy.
3. **Server Container** — Express API yang menangani semua logika bisnis. Terhubung ke dua network: external (untuk menerima request dari Nginx) dan internal (untuk akses database).
4. **DB Container** — PostgreSQL yang hanya bisa diakses dari internal network. Tidak pernah terekspos ke internet.
5. **Volumes** — Data persisten untuk database (`pgdata`) dan file upload (`uploads`) agar tidak hilang saat container di-restart.
