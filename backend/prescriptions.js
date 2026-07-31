import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/prescriptions/:id
// :id = id_rekammedis. Mengembalikan daftar resep obat untuk satu rekam medis.
// -----------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT re.id_resep, re.id_rekammedis, re.dosis_obat, re.instruksi_obat, o.id_obat, o.nama_obat
       FROM Resep re
       JOIN Obat o ON re.id_obat = o.id_obat
       WHERE re.id_rekammedis = ?`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (err) {
    console.error("Gagal mengambil resep:", err);
    fail(res, "Gagal mengambil resep.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// POST /api/prescriptions (dokter/admin)
// Body: { id_rekammedis, id_obat, dosisObat, instruksiObat }
// Menambahkan satu resep obat ke rekam medis yang sudah ada (mis. dokter
// lupa menambahkan resep saat submit pemeriksaan awal).
// -----------------------------------------------------------------------
router.post("/", async (req, res) => {
  if (req.user?.role !== "dokter" && req.user?.role !== "admin") {
    return fail(res, "Hanya dokter yang dapat menambahkan resep.", {}, 403);
  }

  const { id_rekammedis, id_obat, dosisObat, instruksiObat } = req.body;
  if (!id_rekammedis || !id_obat) {
    return fail(res, "id_rekammedis dan id_obat wajib diisi.", {}, 400);
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Resep (id_rekammedis, id_obat, dosis_obat, instruksi_obat) VALUES (?, ?, ?, ?)",
      [id_rekammedis, id_obat, dosisObat || null, instruksiObat || null]
    );
    ok(res, { id_resep: result.insertId }, "Resep berhasil ditambahkan.", 201);
  } catch (err) {
    console.error("Gagal menambah resep:", err);
    fail(res, "Gagal menambah resep.", {}, 500);
  }
});

export default router;
