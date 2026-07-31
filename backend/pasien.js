import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

const NIK_REGEX = /^\d{16}$/;

function requirePetugasOrAdmin(req, res) {
  if (req.user?.role !== "petugas" && req.user?.role !== "admin") {
    fail(res, "Hanya petugas pendaftaran/admin yang dapat mengubah data pasien.", {}, 403);
    return false;
  }
  return true;
}

function validatePasienBody(body) {
  const { namaPasien, nik, jenisKelamin, tanggalLahir, noTelepon } = body;

  if (!namaPasien || !nik || !jenisKelamin || !tanggalLahir || !noTelepon) {
    return "Nama, NIK, jenis kelamin, tanggal lahir, dan nomor telepon wajib diisi.";
  }
  if (!NIK_REGEX.test(nik)) {
    return "NIK harus terdiri dari 16 digit angka.";
  }
  if (!["Laki-laki", "Perempuan"].includes(jenisKelamin)) {
    return "Jenis kelamin harus 'Laki-laki' atau 'Perempuan'.";
  }
  return null;
}

async function generateNomorRekamMedis(conn) {
  const tahun = new Date().getFullYear();
  await conn.query(
    "INSERT INTO RekamMedisCounter (tahun, last_number) VALUES (?, 1) ON DUPLICATE KEY UPDATE last_number = last_number + 1",
    [tahun]
  );
  const [rows] = await conn.query(
    "SELECT last_number FROM RekamMedisCounter WHERE tahun = ?",
    [tahun]
  );
  const urutan = String(rows[0].last_number).padStart(6, "0");
  return `RM-${tahun}-${urutan}`;
}

// -----------------------------------------------------------------------
// GET /api/pasien?search=&page=&limit=
// -----------------------------------------------------------------------
router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  try {
    const where = search
      ? "WHERE nama_pasien LIKE ? OR nik_pasien LIKE ? OR nomor_rekammedis LIKE ? OR no_telponpasien LIKE ?"
      : "";
    const searchParams = search ? Array(4).fill(`%${search}%`) : [];

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM Pasien ${where}`,
      searchParams
    );

    const [rows] = await pool.query(
      `SELECT id_pasien, nomor_rekammedis, nama_pasien, tanggal_lahirpasien, nik_pasien,
              jenis_kelaminpasien, no_telponpasien, alamat_pasien
       FROM Pasien ${where}
       ORDER BY id_pasien DESC
       LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    ok(res, {
      data: rows,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error("Gagal mengambil data pasien:", err);
    fail(res, "Gagal mengambil data pasien.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// GET /api/pasien/:id
// -----------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_pasien, nomor_rekammedis, nama_pasien, tanggal_lahirpasien, nik_pasien,
              jenis_kelaminpasien, no_telponpasien, alamat_pasien
       FROM Pasien WHERE id_pasien = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return fail(res, "Pasien tidak ditemukan.", {}, 404);
    }
    ok(res, rows[0]);
  } catch (err) {
    console.error("Gagal mengambil detail pasien:", err);
    fail(res, "Gagal mengambil detail pasien.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// POST /api/pasien
// -----------------------------------------------------------------------
router.post("/", async (req, res) => {
  if (!requirePetugasOrAdmin(req, res)) return;
  const errorMsg = validatePasienBody(req.body);
  if (errorMsg) return fail(res, errorMsg, {}, 400);

  const { namaPasien, nik, jenisKelamin, tanggalLahir, noTelepon, alamat } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const nomorRekamMedis = await generateNomorRekamMedis(conn);

    const [result] = await conn.query(
      `INSERT INTO Pasien
        (nomor_rekammedis, nama_pasien, tanggal_lahirpasien, nik_pasien, jenis_kelaminpasien, no_telponpasien, alamat_pasien)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nomorRekamMedis, namaPasien, tanggalLahir, nik, jenisKelamin, noTelepon, alamat || null]
    );

    await conn.commit();
    ok(res, { id_pasien: result.insertId, nomor_rekammedis: nomorRekamMedis }, "Pasien berhasil ditambahkan.", 201);
  } catch (err) {
    if (conn) await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return fail(res, "NIK sudah terdaftar.", { nik: "NIK sudah terdaftar." }, 409);
    }
    console.error("Gagal menambah data pasien:", err);
    fail(res, "Gagal menambah data pasien.", {}, 500);
  } finally {
    if (conn) conn.release();
  }
});

// -----------------------------------------------------------------------
// PUT /api/pasien/:id
// -----------------------------------------------------------------------
router.put("/:id", async (req, res) => {
  if (!requirePetugasOrAdmin(req, res)) return;
  const errorMsg = validatePasienBody(req.body);
  if (errorMsg) return fail(res, errorMsg, {}, 400);

  const { namaPasien, nik, jenisKelamin, tanggalLahir, noTelepon, alamat } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE Pasien SET
        nama_pasien = ?, tanggal_lahirpasien = ?, nik_pasien = ?,
        jenis_kelaminpasien = ?, no_telponpasien = ?, alamat_pasien = ?
       WHERE id_pasien = ?`,
      [namaPasien, tanggalLahir, nik, jenisKelamin, noTelepon, alamat || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return fail(res, "Pasien tidak ditemukan.", {}, 404);
    }
    ok(res, {}, "Data pasien berhasil diubah.");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return fail(res, "NIK sudah terdaftar.", { nik: "NIK sudah terdaftar." }, 409);
    }
    console.error("Gagal mengubah data pasien:", err);
    fail(res, "Gagal mengubah data pasien.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// DELETE /api/pasien/:id
// Catatan: FK Registrasi.id_pasien ON DELETE CASCADE — menghapus pasien akan
// ikut menghapus seluruh riwayat kunjungan/antrian/rekam medisnya.
// -----------------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  if (!requirePetugasOrAdmin(req, res)) return;
  try {
    const [result] = await pool.query("DELETE FROM Pasien WHERE id_pasien = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return fail(res, "Pasien tidak ditemukan.", {}, 404);
    }
    ok(res, {}, "Data pasien berhasil dihapus.");
  } catch (err) {
    console.error("Gagal menghapus data pasien:", err);
    fail(res, "Gagal menghapus data pasien.", {}, 500);
  }
});

export default router;
