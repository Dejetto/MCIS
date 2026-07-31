import express from "express";
import cors from "cors";
import "dotenv/config";
import authRouter, { verifyToken, requireRole } from "./auth.js";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";
import pasienRouter from "./pasien.js";
import masterDataRouter from "./masterData.js";
import registrasiRouter from "./registrasi.js";
import antrianRouter from "./antrian.js";
import pembayaranRouter from "./pembayaran.js";
import medicalRecordsRouter from "./medicalRecords.js";
import prescriptionsRouter from "./prescriptions.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);

// -----------------------------------------------------------------------
// GET /api/dashboard/stats
// Bisa diakses oleh semua role yang sudah login. Mengembalikan 5 angka
// sesuai brief: total pasien, total pasien hari ini, total antrean hari ini,
// total pasien menunggu, total pasien selesai dilayani.
// -----------------------------------------------------------------------
app.get("/api/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const [[{ totalPasien }]] = await pool.query("SELECT COUNT(*) AS totalPasien FROM Pasien");

    const [[{ totalPasienHariIni }]] = await pool.query(
      `SELECT COUNT(DISTINCT r.id_pasien) AS totalPasienHariIni
       FROM Registrasi r WHERE r.tanggal_kunjungan = CURDATE()`
    );

    const [statusRows] = await pool.query(
      `SELECT a.status_antrian, COUNT(*) AS jumlah
       FROM Antrian a
       JOIN Registrasi r ON a.id_registrasi = r.id_registrasi
       WHERE r.tanggal_kunjungan = CURDATE()
       GROUP BY a.status_antrian`
    );

    const jumlahPerStatus = { menunggu: 0, check_in: 0, pemeriksaan: 0, selesai: 0 };
    let totalAntreanHariIni = 0;
    for (const row of statusRows) {
      jumlahPerStatus[row.status_antrian] = row.jumlah;
      totalAntreanHariIni += row.jumlah;
    }

    ok(res, {
      totalPasien,
      totalPasienHariIni,
      totalAntreanHariIni,
      totalPasienMenunggu: jumlahPerStatus.menunggu,
      totalPasienSelesaiDilayani: jumlahPerStatus.selesai,
    });
  } catch (err) {
    console.error("Gagal mengambil statistik dashboard:", err);
    fail(res, "Gagal mengambil data statistik.", {}, 500);
  }
});

const petugasOnly = [verifyToken, requireRole("petugas", "admin")];
const staffAny = [verifyToken, requireRole("petugas", "dokter", "admin")];

app.use("/api/pasien", staffAny, pasienRouter);
app.use("/api", staffAny, masterDataRouter);
app.use("/api/registrasi", petugasOnly, registrasiRouter);
app.use("/api/antrian", staffAny, antrianRouter);
app.use("/api/pembayaran", petugasOnly, pembayaranRouter);
app.use("/api/medical-records", staffAny, medicalRecordsRouter);
app.use("/api/prescriptions", staffAny, prescriptionsRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
