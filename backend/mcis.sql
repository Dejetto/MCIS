-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 31, 2026 at 07:40 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mcis`
--

-- --------------------------------------------------------

--
-- Table structure for table `antrian`
--

CREATE TABLE `antrian` (
  `id_antrian` int NOT NULL,
  `id_registrasi` int NOT NULL,
  `status_antrian` varchar(50) DEFAULT NULL,
  `nomor_antrian` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dokter`
--

CREATE TABLE `dokter` (
  `id_dokter` int NOT NULL,
  `nama_dokter` varchar(150) NOT NULL,
  `spesialis_dokter` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `obat`
--

CREATE TABLE `obat` (
  `id_obat` int NOT NULL,
  `nama_obat` varchar(150) NOT NULL,
  `stok_obat` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasien`
--

CREATE TABLE `pasien` (
  `id_pasien` int NOT NULL,
  `nomor_rekammedis` varchar(50) DEFAULT NULL,
  `nama_pasien` varchar(150) NOT NULL,
  `tanggal_lahirpasien` date DEFAULT NULL,
  `nik_pasien` varchar(16) DEFAULT NULL,
  `jenis_kelaminpasien` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `no_telponpasien` varchar(20) DEFAULT NULL,
  `alamat_pasien` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pasien`
--

INSERT INTO `pasien` (`id_pasien`, `nomor_rekammedis`, `nama_pasien`, `tanggal_lahirpasien`, `nik_pasien`, `jenis_kelaminpasien`, `no_telponpasien`, `alamat_pasien`) VALUES
(1, '1', 'Dejet', '2001-12-26', '1231112112110001', 'Laki-laki', '08123456789', 'jalan kedepan no.1, rt/rw 001/001, padalarang'),
(2, '2', 'Daji', '2001-12-25', '1231112112110002', 'Perempuan', '08123456781', 'jalan kekiri no.1, rt/rw 001/001, padalarang');

-- --------------------------------------------------------

--
-- Table structure for table `poli`
--

CREATE TABLE `poli` (
  `id_poli` int NOT NULL,
  `nama_poli` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registrasi`
--

CREATE TABLE `registrasi` (
  `id_registrasi` int NOT NULL,
  `id_pasien` int NOT NULL,
  `id_dokter` int NOT NULL,
  `id_poli` int NOT NULL,
  `tanggal_kunjungan` date NOT NULL,
  `pembayaran` varchar(50) DEFAULT NULL,
  `status_registrasi` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rekam_medis`
--

CREATE TABLE `rekam_medis` (
  `id_rekammedis` int NOT NULL,
  `id_registrasi` int NOT NULL,
  `berat_badan` decimal(5,2) DEFAULT NULL,
  `tinggi_badan` decimal(5,2) DEFAULT NULL,
  `tekanan_darah` varchar(20) DEFAULT NULL,
  `riwayat_sakit` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `resep`
--

CREATE TABLE `resep` (
  `id_resep` int NOT NULL,
  `id_rekammedis` int NOT NULL,
  `id_obat` int NOT NULL,
  `dosis_obat` varchar(100) DEFAULT NULL,
  `instruksi_obat` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `antrian`
--
ALTER TABLE `antrian`
  ADD PRIMARY KEY (`id_antrian`),
  ADD KEY `id_registrasi` (`id_registrasi`);

--
-- Indexes for table `dokter`
--
ALTER TABLE `dokter`
  ADD PRIMARY KEY (`id_dokter`);

--
-- Indexes for table `obat`
--
ALTER TABLE `obat`
  ADD PRIMARY KEY (`id_obat`);

--
-- Indexes for table `pasien`
--
ALTER TABLE `pasien`
  ADD PRIMARY KEY (`id_pasien`),
  ADD UNIQUE KEY `nomor_rekammedis` (`nomor_rekammedis`),
  ADD UNIQUE KEY `nik_pasien` (`nik_pasien`);

--
-- Indexes for table `poli`
--
ALTER TABLE `poli`
  ADD PRIMARY KEY (`id_poli`);

--
-- Indexes for table `registrasi`
--
ALTER TABLE `registrasi`
  ADD PRIMARY KEY (`id_registrasi`),
  ADD KEY `id_pasien` (`id_pasien`),
  ADD KEY `id_dokter` (`id_dokter`),
  ADD KEY `id_poli` (`id_poli`);

--
-- Indexes for table `rekam_medis`
--
ALTER TABLE `rekam_medis`
  ADD PRIMARY KEY (`id_rekammedis`),
  ADD KEY `id_registrasi` (`id_registrasi`);

--
-- Indexes for table `resep`
--
ALTER TABLE `resep`
  ADD PRIMARY KEY (`id_resep`),
  ADD KEY `id_rekammedis` (`id_rekammedis`),
  ADD KEY `id_obat` (`id_obat`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antrian`
--
ALTER TABLE `antrian`
  MODIFY `id_antrian` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dokter`
--
ALTER TABLE `dokter`
  MODIFY `id_dokter` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `obat`
--
ALTER TABLE `obat`
  MODIFY `id_obat` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pasien`
--
ALTER TABLE `pasien`
  MODIFY `id_pasien` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `poli`
--
ALTER TABLE `poli`
  MODIFY `id_poli` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `registrasi`
--
ALTER TABLE `registrasi`
  MODIFY `id_registrasi` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rekam_medis`
--
ALTER TABLE `rekam_medis`
  MODIFY `id_rekammedis` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resep`
--
ALTER TABLE `resep`
  MODIFY `id_resep` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antrian`
--
ALTER TABLE `antrian`
  ADD CONSTRAINT `antrian_ibfk_1` FOREIGN KEY (`id_registrasi`) REFERENCES `registrasi` (`id_registrasi`) ON DELETE CASCADE;

--
-- Constraints for table `registrasi`
--
ALTER TABLE `registrasi`
  ADD CONSTRAINT `registrasi_ibfk_1` FOREIGN KEY (`id_pasien`) REFERENCES `pasien` (`id_pasien`) ON DELETE CASCADE,
  ADD CONSTRAINT `registrasi_ibfk_2` FOREIGN KEY (`id_dokter`) REFERENCES `dokter` (`id_dokter`) ON DELETE CASCADE,
  ADD CONSTRAINT `registrasi_ibfk_3` FOREIGN KEY (`id_poli`) REFERENCES `poli` (`id_poli`) ON DELETE CASCADE;

--
-- Constraints for table `rekam_medis`
--
ALTER TABLE `rekam_medis`
  ADD CONSTRAINT `rekam_medis_ibfk_1` FOREIGN KEY (`id_registrasi`) REFERENCES `registrasi` (`id_registrasi`) ON DELETE CASCADE;

--
-- Constraints for table `resep`
--
ALTER TABLE `resep`
  ADD CONSTRAINT `resep_ibfk_1` FOREIGN KEY (`id_rekammedis`) REFERENCES `rekam_medis` (`id_rekammedis`) ON DELETE CASCADE,
  ADD CONSTRAINT `resep_ibfk_2` FOREIGN KEY (`id_obat`) REFERENCES `obat` (`id_obat`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
