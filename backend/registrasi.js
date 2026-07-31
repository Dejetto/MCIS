import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

const SELECT_REGISTRASI = `
  SELECT r.id_registrasi, r.tanggal_kunjungan, r.pembayaran, r.keluhan_awal, r.status_registrasi,
         p.id_pasien, p.nama_pasien, p.nomor_rekammedis,
         d.id_dokter, d.nama_dokter,
         po.id_poli, po.nama_poli
  FROM Registrasi r
  JOIN Pasien p ON r.id_pasien = p.id_pasien
  JOIN Dokter d ON r.id_dokter = d.id_dokter
  JOIN Poli po ON r.id_poli = po.id_poli
`;

// -----------------------------------------------------------------------
// GET /api/registrasi?tanggal=&search=
// -----------------------------------------------------------------------
router.get("/", async (req, res) => {
  const { tanggal, search } = req.query;
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
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `${SELECT_REGISTRASI} ${where} ORDER BY r.id_registrasi DESC`,
      params
    );
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil data registrasi:", err);
    fail(res, "Gagal mengambil data registrasi.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// POST /api/registrasi
// Body: { id_pasien, id_dokter, id_poli, pembayaran, keluhanAwal }
// Mendaftarkan kunjungan pasien: buat Registrasi + Antrian (status "menunggu")
// dengan nomor antrian otomatis per poli, reset tiap hari (mis. A001, A002...).
// -----------------------------------------------------------------------
router.post("/", async (req, res) => {
  const { id_pasien, id_dokter, id_poli, pembayaran, keluhanAwal } = req.body;

  if (!id_pasien || !id_dokter || !id_poli || !pembayaran) {
    return fail(res, "Pasien, dokter, poli, dan jenis pembayaran wajib diisi.", {}, 400);
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [poliRows] = await conn.query(
      "SELECT kode_poli FROM Poli WHERE id_poli = ?",
      [id_poli]
    );
    if (poliRows.length === 0) {
      await conn.rollback();
      return fail(res, "Poli tidak ditemukan.", {}, 400);
    }
    const kodePoli = poliRows[0].kode_poli;

    const [registrasiResult] = await conn.query(
      `INSERT INTO Registrasi (id_pasien, id_dokter, id_poli, tanggal_kunjungan, pembayaran, keluhan_awal, status_registrasi)
       VALUES (?, ?, ?, CURDATE(), ?, ?, 'terdaftar')`,
      [id_pasien, id_dokter, id_poli, pembayaran, keluhanAwal || null]
    );
    const idRegistrasi = registrasiResult.insertId;

    await conn.query(
      `INSERT INTO AntrianCounter (id_poli, tanggal, last_number) VALUES (?, CURDATE(), 1)
       ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
      [id_poli]
    );
    const [counterRows] = await conn.query(
      "SELECT last_number FROM AntrianCounter WHERE id_poli = ? AND tanggal = CURDATE()",
      [id_poli]
    );
    const nomorAntrian = counterRows[0].last_number;

    await conn.query(
      `INSERT INTO Antrian (id_registrasi, status_antrian, nomor_antrian) VALUES (?, 'menunggu', ?)`,
      [idRegistrasi, nomorAntrian]
    );

    await conn.commit();

    ok(
      res,
      {
        id_registrasi: idRegistrasi,
        nomor_antrian: nomorAntrian,
        nomor_antrian_display: `${kodePoli}${String(nomorAntrian).padStart(3, "0")}`,
      },
      "Pendaftaran berhasil.",
      201
    );
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Gagal mendaftarkan kunjungan:", err);
    fail(res, "Gagal mendaftarkan kunjungan.", {}, 500);
  } finally {
    if (conn) conn.release();
  }
});

// -----------------------------------------------------------------------
// PUT /api/registrasi/:id
// Body: { id_dokter, id_poli, pembayaran, keluhanAwal }
// Mengubah detail kunjungan (dokter/poli/jenis pembayaran/keluhan awal).
// -----------------------------------------------------------------------
router.put("/:id", async (req, res) => {
  const { id_dokter, id_poli, pembayaran, keluhanAwal } = req.body;

  if (!id_dokter || !id_poli || !pembayaran) {
    return fail(res, "Dokter, poli, dan jenis pembayaran wajib diisi.", {}, 400);
  }

  try {
    const [result] = await pool.query(
      `UPDATE Registrasi SET id_dokter = ?, id_poli = ?, pembayaran = ?, keluhan_awal = ?
       WHERE id_registrasi = ?`,
      [id_dokter, id_poli, pembayaran, keluhanAwal || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return fail(res, "Data registrasi tidak ditemukan.", {}, 404);
    }
    ok(res, {}, "Data registrasi berhasil diubah.");
  } catch (err) {
    console.error("Gagal mengubah registrasi:", err);
    fail(res, "Gagal mengubah registrasi.", {}, 500);
  }
});

export default router;
