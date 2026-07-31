import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

const SELECT_ANTRIAN = `
  SELECT
    a.id_antrian, a.status_antrian, a.nomor_antrian,
    r.id_registrasi, r.tanggal_kunjungan, r.pembayaran, r.keluhan_awal,
    p.id_pasien, p.nama_pasien, p.nomor_rekammedis,
    d.id_dokter, d.nama_dokter,
    po.id_poli, po.nama_poli, po.kode_poli,
    CONCAT(po.kode_poli, LPAD(a.nomor_antrian, 3, '0')) AS nomor_antrian_display
  FROM Antrian a
  JOIN Registrasi r ON a.id_registrasi = r.id_registrasi
  JOIN Pasien p ON r.id_pasien = p.id_pasien
  JOIN Dokter d ON r.id_dokter = d.id_dokter
  JOIN Poli po ON r.id_poli = po.id_poli
`;

const STATUS_URUTAN = ["menunggu", "check_in", "pemeriksaan", "selesai"];

// -----------------------------------------------------------------------
// GET /api/antrian?tanggal=&id_poli=&id_dokter=&status=
// Dipakai untuk halaman "Panggil Antrian", "Cek Status Antrian", dan
// "Antrian Pemeriksaan" (dokter, difilter id_dokter miliknya sendiri).
// -----------------------------------------------------------------------
router.get("/", async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().slice(0, 10);
  const { id_poli, id_dokter, status } = req.query;

  const conditions = ["r.tanggal_kunjungan = ?"];
  const params = [tanggal];

  if (id_poli) {
    conditions.push("po.id_poli = ?");
    params.push(id_poli);
  }
  if (id_dokter) {
    conditions.push("d.id_dokter = ?");
    params.push(id_dokter);
  }
  if (status) {
    conditions.push("a.status_antrian = ?");
    params.push(status);
  }

  try {
    const [rows] = await pool.query(
      `${SELECT_ANTRIAN} WHERE ${conditions.join(" AND ")} ORDER BY po.kode_poli, a.nomor_antrian`,
      params
    );
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil data antrian:", err);
    fail(res, "Gagal mengambil data antrian.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// POST /api/antrian
// Body: { id_registrasi }
// Membuat entri antrian untuk registrasi yang sudah ada tapi belum kebagian
// nomor antrian (kasus tepi — alur normal membuat antrian otomatis lewat
// POST /api/registrasi).
// -----------------------------------------------------------------------
router.post("/", async (req, res) => {
  const { id_registrasi } = req.body;
  if (!id_registrasi) return fail(res, "id_registrasi wajib diisi.", {}, 400);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [regRows] = await conn.query(
      "SELECT id_poli FROM Registrasi WHERE id_registrasi = ?",
      [id_registrasi]
    );
    if (regRows.length === 0) {
      await conn.rollback();
      return fail(res, "Registrasi tidak ditemukan.", {}, 404);
    }

    const [existing] = await conn.query(
      "SELECT id_antrian FROM Antrian WHERE id_registrasi = ?",
      [id_registrasi]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return fail(res, "Registrasi ini sudah punya nomor antrian.", {}, 409);
    }

    const idPoli = regRows[0].id_poli;
    await conn.query(
      `INSERT INTO AntrianCounter (id_poli, tanggal, last_number) VALUES (?, CURDATE(), 1)
       ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
      [idPoli]
    );
    const [counterRows] = await conn.query(
      "SELECT last_number FROM AntrianCounter WHERE id_poli = ? AND tanggal = CURDATE()",
      [idPoli]
    );
    const nomorAntrian = counterRows[0].last_number;

    const [result] = await conn.query(
      "INSERT INTO Antrian (id_registrasi, status_antrian, nomor_antrian) VALUES (?, 'menunggu', ?)",
      [id_registrasi, nomorAntrian]
    );

    await conn.commit();
    ok(res, { id_antrian: result.insertId, nomor_antrian: nomorAntrian }, "Antrian berhasil dibuat.", 201);
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Gagal membuat antrian:", err);
    fail(res, "Gagal membuat antrian.", {}, 500);
  } finally {
    if (conn) conn.release();
  }
});

// -----------------------------------------------------------------------
// PATCH /api/antrian/:id/panggil
// Alias ringkas untuk transisi status "menunggu" -> "check_in" (dipakai di
// halaman "Panggil Antrian" petugas).
// -----------------------------------------------------------------------
router.patch("/:id/panggil", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE Antrian SET status_antrian = 'check_in' WHERE id_antrian = ? AND status_antrian = 'menunggu'",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return fail(res, "Antrian tidak ditemukan atau statusnya bukan 'menunggu'.", {}, 409);
    }
    ok(res, {}, "Pasien berhasil dipanggil.");
  } catch (err) {
    console.error("Gagal memanggil antrian:", err);
    fail(res, "Gagal memanggil antrian.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// PUT /api/antrian/:id/status
// Body: { status }
// Transisi status antrian secara umum. Petugas pendaftaran hanya boleh
// mengubah ke "check_in"; dokter hanya boleh mengubah ke "pemeriksaan" atau
// "selesai". Admin boleh semuanya. Transisi harus mengikuti urutan
// menunggu -> check_in -> pemeriksaan -> selesai (tidak boleh loncat).
// -----------------------------------------------------------------------
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!STATUS_URUTAN.includes(status)) {
    return fail(res, `Status harus salah satu dari: ${STATUS_URUTAN.join(", ")}.`, {}, 400);
  }

  const role = req.user?.role;
  const bolehPetugas = role === "petugas" && status === "check_in";
  const bolehDokter = role === "dokter" && (status === "pemeriksaan" || status === "selesai");
  const bolehAdmin = role === "admin";
  if (!bolehPetugas && !bolehDokter && !bolehAdmin) {
    return fail(res, "Kamu tidak punya akses untuk mengubah antrian ke status ini.", {}, 403);
  }

  try {
    const [rows] = await pool.query("SELECT status_antrian FROM Antrian WHERE id_antrian = ?", [req.params.id]);
    if (rows.length === 0) return fail(res, "Antrian tidak ditemukan.", {}, 404);

    const statusSekarang = rows[0].status_antrian;
    const idxSekarang = STATUS_URUTAN.indexOf(statusSekarang);
    const idxBaru = STATUS_URUTAN.indexOf(status);
    if (idxBaru !== idxSekarang + 1) {
      return fail(
        res,
        `Tidak bisa mengubah status dari '${statusSekarang}' langsung ke '${status}'.`,
        {},
        409
      );
    }

    await pool.query("UPDATE Antrian SET status_antrian = ? WHERE id_antrian = ?", [status, req.params.id]);
    ok(res, {}, "Status antrian berhasil diubah.");
  } catch (err) {
    console.error("Gagal mengubah status antrian:", err);
    fail(res, "Gagal mengubah status antrian.", {}, 500);
  }
});

export default router;
