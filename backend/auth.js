import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// -----------------------------------------------------------------------
// POST /api/auth/register
// Body: { noHp, password, namaPasien }
// Membuat baris baru di tabel Pasien (data dasar) + Akun (kredensial login).
// -----------------------------------------------------------------------
router.post("/register", async (req, res) => {
  const { noHp, password, namaPasien } = req.body;

  if (!noHp || !password || !namaPasien) {
    return res.status(400).json({ message: "Nomor HP, nama, dan kata sandi wajib diisi." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Kata sandi minimal 6 karakter." });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.query(
      "SELECT id_akun FROM Akun WHERE no_hp = ?",
      [noHp]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: "Nomor HP sudah terdaftar." });
    }

    const [pasienResult] = await conn.query(
      "INSERT INTO Pasien (nama_pasien, no_telponpasien) VALUES (?, ?)",
      [namaPasien, noHp]
    );

    const passwordHash = await bcrypt.hash(password, 10);
    await conn.query(
      "INSERT INTO Akun (id_pasien, no_hp, password_hash, role) VALUES (?, ?, ?, 'pasien')",
      [pasienResult.insertId, noHp, passwordHash]
    );

    await conn.commit();
    res.status(201).json({ message: "Registrasi berhasil. Silakan login." });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Gagal registrasi:", err);
    res.status(500).json({ message: "Gagal memproses registrasi." });
  } finally {
    if (conn) conn.release();
  }
});

// -----------------------------------------------------------------------
// POST /api/auth/login
// Body: { noHp, password }
// Mengembalikan JWT token jika kredensial valid.
// -----------------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { noHp, password } = req.body;

  if (!noHp || !password) {
    return res.status(400).json({ message: "Nomor HP dan kata sandi wajib diisi." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id_akun, id_pasien, no_hp, password_hash, role FROM Akun WHERE no_hp = ?",
      [noHp]
    );

    // Pesan error digeneralisasi (tidak bilang "no HP tidak ditemukan" vs "password salah")
    // supaya tidak membocorkan nomor HP mana saja yang sudah terdaftar.
    const invalidMsg = { message: "Nomor HP atau kata sandi salah." };
    if (rows.length === 0) return res.status(401).json(invalidMsg);

    const akun = rows[0];
    const passwordCocok = await bcrypt.compare(password, akun.password_hash);
    if (!passwordCocok) return res.status(401).json(invalidMsg);

    const token = jwt.sign(
      { id_akun: akun.id_akun, id_pasien: akun.id_pasien, role: akun.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login berhasil.",
      token,
      user: { id_akun: akun.id_akun, id_pasien: akun.id_pasien, role: akun.role },
    });
  } catch (err) {
    console.error("Gagal login:", err);
    res.status(500).json({ message: "Gagal memproses login." });
  }
});

// -----------------------------------------------------------------------
// Middleware: verifikasi JWT — dipakai untuk melindungi route lain nantinya
// Contoh pemakaian: app.get("/api/dashboard/stats", verifyToken, handler)
// -----------------------------------------------------------------------
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Token tidak ditemukan." });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

export default router;
