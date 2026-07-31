# Entity Relationship Diagram — MCIS

Sesuai skema di `backend/schema_mcis.sql`.

```mermaid
erDiagram
    Dokter ||--o{ Registrasi : menangani
    Dokter ||--o{ Akun : "login sebagai (opsional, role=dokter)"
    Pasien ||--o{ Registrasi : melakukan
    Poli ||--o{ Registrasi : dituju
    Poli ||--o{ AntrianCounter : "counter nomor per hari"
    Registrasi ||--|| Antrian : menghasilkan
    Registrasi ||--o{ rekam_medis : menghasilkan
    Registrasi ||--o| Pembayaran : dibayar
    rekam_medis ||--o{ TindakanMedis : mencatat
    rekam_medis ||--o{ Resep : meresepkan
    Obat ||--o{ Resep : diresepkan

    Dokter {
        int id_dokter PK
        varchar nama_dokter
        varchar spesialis_dokter
    }

    Pasien {
        int id_pasien PK
        varchar nomor_rekammedis UK "auto-generate RM-tahun-000001"
        varchar nama_pasien
        date tanggal_lahirpasien
        varchar nik_pasien UK "16 digit, tidak boleh duplikat"
        enum jenis_kelaminpasien
        varchar no_telponpasien
        text alamat_pasien
    }

    Poli {
        int id_poli PK
        varchar nama_poli
        varchar kode_poli UK "prefix nomor antrean, mis. A"
    }

    Obat {
        int id_obat PK
        varchar nama_obat
        int stok_obat
    }

    Akun {
        int id_akun PK
        int id_dokter FK "hanya diisi utk role=dokter"
        varchar no_hp UK
        varchar password_hash
        enum role "admin | dokter | petugas"
        timestamp created_at
    }

    Registrasi {
        int id_registrasi PK
        int id_pasien FK
        int id_dokter FK
        int id_poli FK
        date tanggal_kunjungan
        varchar pembayaran "jenis pembayaran: BPJS/Tunai/dll"
        text keluhan_awal
        varchar status_registrasi
    }

    Antrian {
        int id_antrian PK
        int id_registrasi FK
        enum status_antrian "menunggu|check_in|pemeriksaan|selesai"
        int nomor_antrian "urut per poli per hari"
    }

    AntrianCounter {
        int id_poli PK_FK
        date tanggal PK
        int last_number
    }

    RekamMedisCounter {
        int tahun PK
        int last_number
    }

    rekam_medis {
        int id_rekammedis PK
        int id_registrasi FK
        text keluhan_pasien "Subjective"
        varchar tekanan_darah "Objective"
        decimal suhu_tubuh "Objective"
        decimal berat_badan "Objective"
        decimal tinggi_badan "Objective"
        text diagnosa "Assessment"
        text rencana_terapi "Plan"
    }

    TindakanMedis {
        int id_tindakan PK
        int id_rekammedis FK
        varchar nama_tindakan
        text catatan
    }

    Resep {
        int id_resep PK
        int id_rekammedis FK
        int id_obat FK
        varchar dosis_obat
        text instruksi_obat
    }

    Pembayaran {
        int id_pembayaran PK
        int id_registrasi FK UK
        decimal nominal
        varchar metode_pembayaran
        enum status_pembayaran "belum_bayar|lunas"
        timestamp tanggal_bayar
    }
```

## Catatan Relasi

- **Akun ↔ Dokter**: `id_dokter` di `Akun` hanya diisi untuk akun ber-role `dokter`, dipakai sistem untuk tahu antrian pemeriksaan siapa yang ditampilkan.
- **Registrasi → Antrian**: relasi 1-ke-1 (satu kunjungan = satu entri antrean). `nomor_antrian` di-generate atomik lewat `AntrianCounter` (per `id_poli` + `tanggal`).
- **Registrasi → rekam_medis**: 1-ke-1 secara alur bisnis (satu kunjungan diperiksa sekali oleh dokter), meski secara skema tidak dibatasi UNIQUE (fleksibel kalau nanti perlu pemeriksaan ulang).
- **rekam_medis → TindakanMedis / Resep**: 1-ke-banyak — satu pemeriksaan bisa punya banyak tindakan dan banyak item resep.
- **Registrasi → Pembayaran**: 1-ke-1 (`id_registrasi` UNIQUE di `Pembayaran`).
- Semua FK transaksional (`Registrasi`, `Antrian`, `rekam_medis`, `Resep`, `Pembayaran`, `TindakanMedis`) pakai `ON DELETE CASCADE` — menghapus data induk (mis. Pasien) akan menghapus seluruh riwayat turunannya.
