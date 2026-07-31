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
    nama_poli VARCHAR(100) NOT NULL
);

CREATE TABLE Obat (
    id_obat INT PRIMARY KEY AUTO_INCREMENT,
    nama_obat VARCHAR(150) NOT NULL,
    stok_obat INT DEFAULT 0
);

-- 2. Tabel Transaksi Utama
CREATE TABLE Registrasi (
    id_registrasi INT PRIMARY KEY AUTO_INCREMENT,
    id_pasien INT NOT NULL,
    id_dokter INT NOT NULL,
    id_poli INT NOT NULL,
    tanggal_kunjungan DATE NOT NULL,
    pembayaran VARCHAR(50),
    status_registrasi VARCHAR(50),
    FOREIGN KEY (id_pasien) REFERENCES Pasien(id_pasien) ON DELETE CASCADE,
    FOREIGN KEY (id_dokter) REFERENCES Dokter(id_dokter) ON DELETE CASCADE,
    FOREIGN KEY (id_poli) REFERENCES Poli(id_poli) ON DELETE CASCADE
);

-- 3. Tabel Turunan dari Registrasi
CREATE TABLE Antrian (
    id_antrian INT PRIMARY KEY AUTO_INCREMENT,
    id_registrasi INT NOT NULL,
    status_antrian VARCHAR(50),
    nomor_antrian INT NOT NULL,
    FOREIGN KEY (id_registrasi) REFERENCES Registrasi(id_registrasi) ON DELETE CASCADE
);

CREATE TABLE rekam_medis (
    id_rekammedis INT PRIMARY KEY AUTO_INCREMENT,
    id_registrasi INT NOT NULL,
    berat_badan DECIMAL(5,2),
    tinggi_badan DECIMAL(5,2),
    tekanan_darah VARCHAR(20),
    riwayat_sakit TEXT,
    FOREIGN KEY (id_registrasi) REFERENCES Registrasi(id_registrasi) ON DELETE CASCADE
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
