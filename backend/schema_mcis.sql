-- Database Schema: MCIS (Berdasarkan ERD)
-- Catatan: Pada gambar ERD, semua tipe data ditulis 'int'.
-- Agar database ini bisa digunakan di dunia nyata, tipe data telah disesuaikan
-- (menggunakan VARCHAR, DATE, TEXT, dll) agar relevan dengan nama kolomnya.

CREATE DATABASE IF NOT EXISTS mcis_db;
USE mcis_db;

-- 1. Tabel Master
CREATE TABLE Dokter (
    id_dokter INT PRIMARY KEY AUTO_INCREMENT,
    nama_dokter VARCHAR(150) NOT NULL,
    spesialis_dokter VARCHAR(100)
);

INSERT INTO Dokter (nama_dokter, spesialis_dokter) VALUES
    ('dr. Andi Saputra', 'Dokter Umum'),
    ('dr. Ratna Wijaya', 'Spesialis Anak');

CREATE TABLE Pasien (
    id_pasien INT PRIMARY KEY AUTO_INCREMENT,
    nomor_rekammedis VARCHAR(50) UNIQUE,
    nama_pasien VARCHAR(150) NOT NULL,
    tanggal_lahirpasien DATE,
    nik_pasien VARCHAR(16) UNIQUE,
    jenis_kelaminpasien ENUM('Laki-laki', 'Perempuan'),
    no_telponpasien VARCHAR(20),
    alamat_pasien TEXT
);

CREATE TABLE Poli (
    id_poli INT PRIMARY KEY AUTO_INCREMENT,
    nama_poli VARCHAR(100) NOT NULL,
    kode_poli VARCHAR(5) NOT NULL UNIQUE
);

INSERT INTO Poli (nama_poli, kode_poli) VALUES
    ('Poli Umum', 'A'),
    ('Poli Khusus', 'B');

CREATE TABLE Obat (
    id_obat INT PRIMARY KEY AUTO_INCREMENT,
    nama_obat VARCHAR(150) NOT NULL,
    stok_obat INT DEFAULT 0
);

INSERT INTO Obat (nama_obat, stok_obat) VALUES
    ('Paracetamol 500mg', 200),
    ('Amoxicillin 500mg', 150),
    ('Antasida Tablet', 100),
    ('Cetirizine 10mg', 120),
    ('Vitamin C 500mg', 300);

-- 1b. Tabel Akun (dipakai untuk login)
-- Role minimal sesuai brief: administrator, dokter, petugas pendaftaran.
-- id_dokter dipakai untuk akun ber-role 'dokter' supaya sistem tahu dokter
-- mana yang sedang login (dipakai untuk memfilter antrian pemeriksaannya).
CREATE TABLE Akun (
    id_akun INT PRIMARY KEY AUTO_INCREMENT,
    id_dokter INT NULL,
    no_hp VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'dokter', 'petugas') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dokter) REFERENCES Dokter(id_dokter) ON DELETE SET NULL
);

-- Akun contoh untuk testing tiap role:
-- Administrator : 081200000001 / admin123
-- Dokter        : 081200000002 / dokter123 (terhubung ke dr. Andi Saputra, id_dokter=1)
-- Petugas       : 081200000000 / petugas123
INSERT INTO Akun (no_hp, password_hash, role) VALUES
    ('081200000001', '$2b$10$1vyRVnraT0ryVNomMn9ZJetjp84kILzHKVqwdMFnV0cw/nBB1BqtO', 'admin'),
    ('081200000000', '$2b$10$JiySMqdZjZrUE5URETFXCuuR25cXKZ2.GOk2JzOiKDaj49JX8AtS2', 'petugas');

INSERT INTO Akun (no_hp, password_hash, role, id_dokter) VALUES
    ('081200000002', '$2b$10$9Tjo9ZcecyqSm7P/QM6spe9PAAF2rDpnyugqK3O76gSIAGWDzytki', 'dokter', 1);

-- 2. Tabel Transaksi Utama
CREATE TABLE Registrasi (
    id_registrasi INT PRIMARY KEY AUTO_INCREMENT,
    id_pasien INT NOT NULL,
    id_dokter INT NOT NULL,
    id_poli INT NOT NULL,
    tanggal_kunjungan DATE NOT NULL,
    pembayaran VARCHAR(50),
    keluhan_awal TEXT,
    status_registrasi VARCHAR(50),
    FOREIGN KEY (id_pasien) REFERENCES Pasien(id_pasien) ON DELETE CASCADE,
    FOREIGN KEY (id_dokter) REFERENCES Dokter(id_dokter) ON DELETE CASCADE,
    FOREIGN KEY (id_poli) REFERENCES Poli(id_poli) ON DELETE CASCADE
);

-- 3. Tabel Turunan dari Registrasi
CREATE TABLE Antrian (
    id_antrian INT PRIMARY KEY AUTO_INCREMENT,
    id_registrasi INT NOT NULL,
    -- menunggu -> check_in (petugas memanggil) -> pemeriksaan (dokter mulai periksa) -> selesai (rekam medis disimpan)
    status_antrian ENUM('menunggu', 'check_in', 'pemeriksaan', 'selesai') NOT NULL DEFAULT 'menunggu',
    nomor_antrian INT NOT NULL,
    FOREIGN KEY (id_registrasi) REFERENCES Registrasi(id_registrasi) ON DELETE CASCADE
);

-- Counter untuk generate nomor antrian per poli per hari secara atomik
-- (INSERT ... ON DUPLICATE KEY UPDATE last_number = last_number + 1)
CREATE TABLE AntrianCounter (
    id_poli INT NOT NULL,
    tanggal DATE NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_poli, tanggal),
    FOREIGN KEY (id_poli) REFERENCES Poli(id_poli) ON DELETE CASCADE
);

-- Counter untuk generate nomor rekam medis per tahun secara atomik
CREATE TABLE RekamMedisCounter (
    tahun INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);

-- Rekam medis pemeriksaan dokter, mengikuti metode SOAP:
-- Subjective = keluhan_pasien, Objective = tekanan_darah/suhu_tubuh/berat_badan/tinggi_badan,
-- Assessment = diagnosa, Plan = rencana_terapi.
CREATE TABLE rekam_medis (
    id_rekammedis INT PRIMARY KEY AUTO_INCREMENT,
    id_registrasi INT NOT NULL,
    keluhan_pasien TEXT,
    tekanan_darah VARCHAR(20),
    suhu_tubuh DECIMAL(4,1),
    berat_badan DECIMAL(5,2),
    tinggi_badan DECIMAL(5,2),
    diagnosa TEXT,
    rencana_terapi TEXT,
    FOREIGN KEY (id_registrasi) REFERENCES Registrasi(id_registrasi) ON DELETE CASCADE
);

-- Tindakan medis yang dilakukan dokter saat pemeriksaan (mis. "Nebulizer", "Jahit luka")
CREATE TABLE TindakanMedis (
    id_tindakan INT PRIMARY KEY AUTO_INCREMENT,
    id_rekammedis INT NOT NULL,
    nama_tindakan VARCHAR(150) NOT NULL,
    catatan TEXT,
    FOREIGN KEY (id_rekammedis) REFERENCES rekam_medis(id_rekammedis) ON DELETE CASCADE
);

-- 4. Tabel Transaksi Resep Obat
CREATE TABLE Resep (
    id_resep INT PRIMARY KEY AUTO_INCREMENT,
    id_rekammedis INT NOT NULL,
    id_obat INT NOT NULL,
    dosis_obat VARCHAR(100),
    instruksi_obat TEXT,
    FOREIGN KEY (id_rekammedis) REFERENCES rekam_medis(id_rekammedis) ON DELETE CASCADE,
    FOREIGN KEY (id_obat) REFERENCES Obat(id_obat) ON DELETE CASCADE
);

-- 5. Tabel Pembayaran (dicatat oleh petugas pendaftaran)
CREATE TABLE Pembayaran (
    id_pembayaran INT PRIMARY KEY AUTO_INCREMENT,
    id_registrasi INT NOT NULL UNIQUE,
    nominal DECIMAL(12,2),
    metode_pembayaran VARCHAR(50),
    status_pembayaran ENUM('belum_bayar', 'lunas') NOT NULL DEFAULT 'belum_bayar',
    tanggal_bayar TIMESTAMP NULL,
    FOREIGN KEY (id_registrasi) REFERENCES Registrasi(id_registrasi) ON DELETE CASCADE
);
