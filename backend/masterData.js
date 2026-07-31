import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    fail(res, "Hanya administrator yang dapat mengubah data ini.", {}, 403);
    return false;
  }
  return true;
}

// ================================= Dokter =================================
router.get("/dokter", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_dokter, nama_dokter, spesialis_dokter FROM Dokter ORDER BY nama_dokter"
    );
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil data dokter:", err);
    fail(res, "Gagal mengambil data dokter.", {}, 500);
  }
});

router.post("/dokter", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { namaDokter, spesialisDokter } = req.body;
  if (!namaDokter) return fail(res, "Nama dokter wajib diisi.", {}, 400);

  try {
    const [result] = await pool.query(
      "INSERT INTO Dokter (nama_dokter, spesialis_dokter) VALUES (?, ?)",
      [namaDokter, spesialisDokter || null]
    );
    ok(res, { id_dokter: result.insertId }, "Dokter berhasil ditambahkan.", 201);
  } catch (err) {
    console.error("Gagal menambah dokter:", err);
    fail(res, "Gagal menambah dokter.", {}, 500);
  }
});

router.put("/dokter/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { namaDokter, spesialisDokter } = req.body;
  if (!namaDokter) return fail(res, "Nama dokter wajib diisi.", {}, 400);

  try {
    const [result] = await pool.query(
      "UPDATE Dokter SET nama_dokter = ?, spesialis_dokter = ? WHERE id_dokter = ?",
      [namaDokter, spesialisDokter || null, req.params.id]
    );
    if (result.affectedRows === 0) return fail(res, "Dokter tidak ditemukan.", {}, 404);
    ok(res, {}, "Data dokter berhasil diubah.");
  } catch (err) {
    console.error("Gagal mengubah dokter:", err);
    fail(res, "Gagal mengubah dokter.", {}, 500);
  }
});

router.delete("/dokter/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [result] = await pool.query("DELETE FROM Dokter WHERE id_dokter = ?", [req.params.id]);
    if (result.affectedRows === 0) return fail(res, "Dokter tidak ditemukan.", {}, 404);
    ok(res, {}, "Data dokter berhasil dihapus.");
  } catch (err) {
    console.error("Gagal menghapus dokter:", err);
    fail(res, "Gagal menghapus dokter. Pastikan dokter tidak punya riwayat kunjungan.", {}, 500);
  }
});

// ================================== Poli ===================================
router.get("/poli", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_poli, nama_poli, kode_poli FROM Poli ORDER BY nama_poli");
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil data poli:", err);
    fail(res, "Gagal mengambil data poli.", {}, 500);
  }
});

router.post("/poli", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { namaPoli, kodePoli } = req.body;
  if (!namaPoli || !kodePoli) return fail(res, "Nama poli dan kode poli wajib diisi.", {}, 400);

  try {
    const [result] = await pool.query(
      "INSERT INTO Poli (nama_poli, kode_poli) VALUES (?, ?)",
      [namaPoli, kodePoli.toUpperCase()]
    );
    ok(res, { id_poli: result.insertId }, "Poli berhasil ditambahkan.", 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return fail(res, "Kode poli sudah dipakai.", { kodePoli: "Kode poli sudah dipakai." }, 409);
    console.error("Gagal menambah poli:", err);
    fail(res, "Gagal menambah poli.", {}, 500);
  }
});

router.put("/poli/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { namaPoli, kodePoli } = req.body;
  if (!namaPoli || !kodePoli) return fail(res, "Nama poli dan kode poli wajib diisi.", {}, 400);

  try {
    const [result] = await pool.query(
      "UPDATE Poli SET nama_poli = ?, kode_poli = ? WHERE id_poli = ?",
      [namaPoli, kodePoli.toUpperCase(), req.params.id]
    );
    if (result.affectedRows === 0) return fail(res, "Poli tidak ditemukan.", {}, 404);
    ok(res, {}, "Data poli berhasil diubah.");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return fail(res, "Kode poli sudah dipakai.", { kodePoli: "Kode poli sudah dipakai." }, 409);
    console.error("Gagal mengubah poli:", err);
    fail(res, "Gagal mengubah poli.", {}, 500);
  }
});

router.delete("/poli/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [result] = await pool.query("DELETE FROM Poli WHERE id_poli = ?", [req.params.id]);
    if (result.affectedRows === 0) return fail(res, "Poli tidak ditemukan.", {}, 404);
    ok(res, {}, "Data poli berhasil dihapus.");
  } catch (err) {
    console.error("Gagal menghapus poli:", err);
    fail(res, "Gagal menghapus poli. Pastikan poli tidak punya riwayat kunjungan.", {}, 500);
  }
});

// ================================== Obat ===================================
router.get("/obat", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_obat, nama_obat, stok_obat FROM Obat ORDER BY nama_obat");
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil data obat:", err);
    fail(res, "Gagal mengambil data obat.", {}, 500);
  }
});

router.post("/obat", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { namaObat, stokObat } = req.body;
  if (!namaObat) return fail(res, "Nama obat wajib diisi.", {}, 400);

  try {
    const [result] = await pool.query(
      "INSERT INTO Obat (nama_obat, stok_obat) VALUES (?, ?)",
      [namaObat, Number(stokObat) || 0]
    );
    ok(res, { id_obat: result.insertId }, "Obat berhasil ditambahkan.", 201);
  } catch (err) {
    console.error("Gagal menambah obat:", err);
    fail(res, "Gagal menambah obat.", {}, 500);
  }
});

router.put("/obat/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { namaObat, stokObat } = req.body;
  if (!namaObat) return fail(res, "Nama obat wajib diisi.", {}, 400);

  try {
    const [result] = await pool.query(
      "UPDATE Obat SET nama_obat = ?, stok_obat = ? WHERE id_obat = ?",
      [namaObat, Number(stokObat) || 0, req.params.id]
    );
    if (result.affectedRows === 0) return fail(res, "Obat tidak ditemukan.", {}, 404);
    ok(res, {}, "Data obat berhasil diubah.");
  } catch (err) {
    console.error("Gagal mengubah obat:", err);
    fail(res, "Gagal mengubah obat.", {}, 500);
  }
});

router.delete("/obat/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [result] = await pool.query("DELETE FROM Obat WHERE id_obat = ?", [req.params.id]);
    if (result.affectedRows === 0) return fail(res, "Obat tidak ditemukan.", {}, 404);
    ok(res, {}, "Data obat berhasil dihapus.");
  } catch (err) {
    console.error("Gagal menghapus obat:", err);
    fail(res, "Gagal menghapus obat. Obat mungkin masih dipakai di suatu resep.", {}, 500);
  }
});

export default router;
