# MCIS — Mini Clinic Information System

Aplikasi web untuk membantu administrasi & pelayanan pasien di klinik pratama: pengelolaan data pasien, pendaftaran kunjungan, antrean, dan pemeriksaan dokter (SOAP).

Dibangun untuk memenuhi *Technical Assignment Programmer* (take home test) — lihat bagian [Asumsi & Penyederhanaan](#asumsi--penyederhanaan) untuk keputusan desain yang diambil.

## Teknologi

| Komponen       | Teknologi                     |
| -------------- | ------------------------------ |
| Frontend       | React 19 + Vite + react-router-dom |
| Backend        | Node.js + Express.js            |
| Database       | MySQL                           |
| Authentication | JSON Web Token (JWT)            |

## Struktur Project

```
mcis/
├── backend/                  # REST API (Express)
│   ├── auth.js                # login, logout, middleware verifyToken/requireRole
│   ├── pasien.js              # Master Data Pasien (CRUD)
│   ├── masterData.js          # Master Data Dokter/Poli/Obat (CRUD, mutasi khusus admin)
│   ├── registrasi.js          # Pendaftaran kunjungan pasien
│   ├── antrian.js             # Antrean: generate nomor, panggil, ubah status
│   ├── pembayaran.js          # Pencatatan pembayaran kunjungan
│   ├── medicalRecords.js      # Rekam medis (SOAP) + riwayat pemeriksaan
│   ├── prescriptions.js       # Resep obat
│   ├── db.js                  # koneksi pool MySQL
│   ├── utils/respond.js       # helper response envelope {success,message,data}
│   ├── schema_mcis.sql        # skema database + seed data
│   └── .env.example
├── src/                       # Frontend (React)
│   ├── LoginPage.jsx           # halaman login (semua role)
│   ├── App.jsx                 # routing berbasis role
│   ├── petugas/                # modul Petugas Pendaftaran & Administrator
│   │   ├── Dashboard.jsx, DaftarkanPasien.jsx, PanggilAntrian.jsx,
│   │   │   StatusAntrian.jsx, Pembayaran.jsx, RekamMedisPasien.jsx,
│   │   │   MasterPasien.jsx, MasterDokter.jsx, MasterPoli.jsx, MasterObat.jsx
│   │   ├── components/          # Modal, ConfirmDialog, Pagination, StatusBadge, PasienForm, PasienPicker
│   │   └── api.js               # fetch wrapper (attach token, unwrap envelope)
│   └── dokter/                 # modul Dokter
│       ├── DokterLayout.jsx, AntrianPemeriksaan.jsx, PemeriksaanForm.jsx
│       └── (Riwayat Pemeriksaan Pasien memakai ulang petugas/RekamMedisPasien.jsx)
├── docs/ERD.md                 # Entity Relationship Diagram (Mermaid)
├── postman_collection.json     # koleksi Postman seluruh endpoint
└── README.md
```

## Instalasi

Prasyarat: Node.js 18+, MySQL 8+.

1. Clone repository, lalu masuk ke folder project.
2. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env   # sesuaikan DB_USER/DB_PASSWORD dengan MySQL lokal kamu
   ```
3. **Frontend** (dari root project)
   ```bash
   npm install
   ```

## Migrasi Database

Belum memakai tool migrasi — cukup jalankan file schema SQL (idempotent lewat `CREATE DATABASE IF NOT EXISTS`, tapi tabel dibuat dengan `CREATE TABLE` biasa jadi kalau mau reset harus di-drop dulu):

```bash
mysql -u root -p < backend/schema_mcis.sql
```

Schema ini otomatis membuat database `mcis_db`, seluruh tabel, dan **seed data** (2 dokter, 2 poli, 5 obat, dan 3 akun login — lihat [Akun Login](#akun-login)).

Kalau perlu reset total (hapus semua data & mulai dari awal):
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS mcis_db;"
mysql -u root -p < backend/schema_mcis.sql
```

## Cara Menjalankan Aplikasi

**Backend** (port 4000):
```bash
cd backend
npm run dev      # atau: npm start
```

**Frontend** (port 5173, proxy `/api/*` ke backend lewat `vite.config.js`):
```bash
npm run dev
```

Buka `http://localhost:5173` dan login memakai salah satu akun di bawah.

## Akun Login

Diseed lewat `schema_mcis.sql` — tidak ada halaman registrasi publik (lihat [Asumsi](#asumsi--penyederhanaan)).

| Role          | No. HP         | Password    |
| ------------- | -------------- | ----------- |
| Administrator | 081200000001   | admin123    |
| Dokter        | 081200000002   | dokter123   |
| Petugas Pendaftaran | 081200000000 | petugas123 |

## Konfigurasi `.env`

Lihat `backend/.env.example`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mcis_db
PORT=4000
JWT_SECRET=ganti_dengan_string_acak_yang_panjang_dan_rahasia
```

`JWT_SECRET` wajib diganti dengan string acak yang panjang sebelum dipakai di lingkungan manapun selain lokal. File `.env` asli **tidak** disertakan di repository (lihat `.gitignore`) — hanya `.env.example`.

## Alur Bisnis Singkat

1. **Petugas Pendaftaran** mengelola Master Data Pasien, lalu mendaftarkan kunjungan (pilih pasien/dokter/poli/jenis pembayaran/keluhan awal) → sistem membuat nomor antrean otomatis per poli (mis. `A001`, `A002`, reset tiap hari).
2. Petugas memanggil antrean (status `menunggu` → `check_in`).
3. **Dokter** melihat antrian pasien yang sudah check-in miliknya, klik "Mulai Periksa" (status → `pemeriksaan`), lalu mengisi rekam medis metode **SOAP** (Subjective/Objective/Assessment/Plan) + Tindakan Medis + Resep Obat. Submit menandai status kunjungan `selesai`.
4. Petugas mencatat **Pembayaran** (nominal + metode).
5. Riwayat kunjungan & rekam medis bisa dilihat lagi lewat menu Rekam Medis Pasien (petugas) / Riwayat Pemeriksaan Pasien (dokter) — read-only.
6. **Administrator** punya semua akses Petugas ditambah CRUD Master Data Dokter/Poli/Obat.

## REST API

Format response konsisten di semua endpoint:

```json
// sukses
{ "success": true, "message": "...", "data": {} }
// gagal
{ "success": false, "message": "...", "errors": {} }
```

Endpoint diproteksi JWT (`Authorization: Bearer <token>`) kecuali `POST /api/auth/login`. Daftar lengkap ada di `postman_collection.json`; ringkasannya:

- **Auth**: `POST /api/auth/login`, `POST /api/auth/logout`
- **Pasien** (petugas/admin tulis, semua staff baca): `GET/POST /api/pasien`, `GET/PUT/DELETE /api/pasien/:id`
- **Master Data** (semua staff baca, admin tulis): `GET/POST/PUT/DELETE /api/dokter[/:id]`, `/api/poli[/:id]`, `/api/obat[/:id]`
- **Registrasi** (petugas/admin): `GET/POST /api/registrasi`, `PUT /api/registrasi/:id`
- **Antrian** (petugas/dokter/admin): `GET/POST /api/antrian`, `PATCH /api/antrian/:id/panggil`, `PUT /api/antrian/:id/status`
- **Pembayaran** (petugas/admin): `GET /api/pembayaran`, `PUT /api/pembayaran/:id_registrasi`
- **Medical Records** (dokter menulis, semua staff baca): `GET /api/medical-records/:patientId`, `POST /api/medical-records`
- **Prescriptions** (dokter menulis): `GET/POST /api/prescriptions[/:id]`
- **Dashboard** (semua role login): `GET /api/dashboard/stats`

## Asumsi & Penyederhanaan

- **Tidak ada portal/self-registrasi pasien.** Brief hanya meminta 3 role (Administrator, Dokter, Petugas Pendaftaran); pasien bukan pengguna sistem, datanya dikelola staf lewat Master Data Pasien.
- **Tidak ada UI manajemen akun staf.** Akun admin/dokter/petugas dibuat lewat seed SQL (`schema_mcis.sql`), bukan lewat endpoint/halaman tersendiri — di luar scope brief.
- **Logout stateless.** JWT tidak disimpan sesi di server (tidak ada blacklist), jadi `POST /api/auth/logout` hanya memverifikasi token lalu membalas sukses; client menghapus token dari storage-nya. Token lama tetap valid secara teknis sampai kedaluwarsa (7 hari) kalau dicuri sebelum dihapus.
- **Transisi status antrean dijaga urutan & role**: `menunggu → check_in` (petugas) → `pemeriksaan` (dokter mulai periksa) → `selesai` (otomatis saat dokter submit rekam medis). Tidak bisa loncat status.
- **Dokter hanya melihat antrian miliknya sendiri** di menu "Antrian Pemeriksaan" (difilter dari `id_dokter` yang terhubung ke akun login).
- **Administrator** = akses penuh Petugas Pendaftaran + CRUD Master Data Dokter/Poli/Obat (brief tidak merinci fitur khusus admin di luar RBAC).
- **Nomor Rekam Medis** format `RM-{tahun}-{6 digit urut}`, **nomor antrean** format `{kode_poli}{3 digit urut, reset harian}` — di-generate lewat tabel counter (`RekamMedisCounter`, `AntrianCounter`) dengan `INSERT ... ON DUPLICATE KEY UPDATE` supaya atomik dan aman dari race condition tanpa row-locking manual.
- Belum ada sistem migrasi database (mis. Knex/Prisma Migrate) — schema dikelola lewat satu file `schema_mcis.sql` yang di-apply manual.
