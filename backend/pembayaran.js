import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/pembayaran?search=&tanggal=&status=
// Daftar kunjungan beserta status pembayarannya (default "belum_bayar" kalau
// belum pernah dicatat).
// -----------------------------------------------------------------------
router.get("/", async (req, res) => {
  const { search, tanggal, status } = req.query;

  const conditions = [];
  const params = [];

  if (tanggal) {
    conditions.push("r.tanggal_kunjungan = ?");
    params.push(tanggal);
  }
  if (search) {
    conditions.push("(p.nama_pasien LIKE ? OR p.nomor_rekammedis LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push("COALESCE(pb.status_pembayaran, 'belum_bayar') = ?");
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `SELECT
        r.id_registrasi, r.tanggal_kunjungan, r.pembayaran AS jenis_pembayaran,
        p.id_pasien, p.nama_pasien, p.nomor_rekammedis,
        d.nama_dokter, po.nama_poli,
        pb.nominal, pb.metode_pembayaran, pb.tanggal_bayar,
        COALESCE(pb.status_pembayaran, 'belum_bayar') AS status_pembayaran
       FROM Registrasi r
       JOIN Pasien p ON r.id_pasien = p.id_pasien
       JOIN Dokter d ON r.id_dokter = d.id_dokter
       JOIN Poli po ON r.id_poli = po.id_poli
       LEFT JOIN Pembayaran pb ON pb.id_registrasi = r.id_registrasi
       ${where}
       ORDER BY r.id_registrasi DESC`,
      params
    );
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil data pembayaran:", err);
    fail(res, "Gagal mengambil data pembayaran.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// PUT /api/pembayaran/:id_registrasi
// Body: { nominal, metodePembayaran }
// Mencatat pembayaran dan menandai lunas.
// -----------------------------------------------------------------------
router.put("/:id_registrasi", async (req, res) => {
  const { nominal, metodePembayaran } = req.body;

  if (nominal === undefined || nominal === null || !metodePembayaran) {
    return fail(res, "Nominal dan metode pembayaran wajib diisi.", {}, 400);
  }
  if (isNaN(nominal) || Number(nominal) < 0) {
    return fail(res, "Nominal harus berupa angka yang valid.", {}, 400);
  }

  try {
    const [registrasiRows] = await pool.query(
      "SELECT id_registrasi FROM Registrasi WHERE id_registrasi = ?",
      [req.params.id_registrasi]
    );
    if (registrasiRows.length === 0) {
      return fail(res, "Data kunjungan tidak ditemukan.", {}, 404);
    }

    await pool.query(
      `INSERT INTO Pembayaran (id_registrasi, nominal, metode_pembayaran, status_pembayaran, tanggal_bayar)
       VALUES (?, ?, ?, 'lunas', NOW())
       ON DUPLICATE KEY UPDATE
        nominal = VALUES(nominal),
        metode_pembayaran = VALUES(metode_pembayaran),
        status_pembayaran = 'lunas',
        tanggal_bayar = NOW()`,
      [req.params.id_registrasi, nominal, metodePembayaran]
    );

    ok(res, {}, "Pembayaran berhasil dicatat.");
  } catch (err) {
    console.error("Gagal mencatat pembayaran:", err);
    fail(res, "Gagal mencatat pembayaran.", {}, 500);
  }
});

export default router;
