import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// -----------------------------------------------------------------------
// POST /api/auth/login
// Body: { noHp, password }
// Mengembalikan JWT token jika kredensial valid. Tidak ada self-registrasi —
// akun admin/dokter/petugas dibuat lewat seed database (lihat schema_mcis.sql).
// -----------------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { noHp, password } = req.body;

  if (!noHp || !password) {
    return fail(res, "Nomor HP dan kata sandi wajib diisi.", {}, 400);
  }

  try {
    const [rows] = await pool.query(
      "SELECT id_akun, id_dokter, no_hp, password_hash, role FROM Akun WHERE no_hp = ?",
      [noHp]
    );

    // Pesan error digeneralisasi (tidak bilang "no HP tidak ditemukan" vs "password salah")
    // supaya tidak membocorkan nomor HP mana saja yang sudah terdaftar.
    const invalidMsg = "Nomor HP atau kata sandi salah.";
    if (rows.length === 0) return fail(res, invalidMsg, {}, 401);

    const akun = rows[0];
    const passwordCocok = await bcrypt.compare(password, akun.password_hash);
    if (!passwordCocok) return fail(res, invalidMsg, {}, 401);

    const token = jwt.sign(
      { id_akun: akun.id_akun, id_dokter: akun.id_dokter, role: akun.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    ok(
      res,
      {
        token,
        user: { id_akun: akun.id_akun, id_dokter: akun.id_dokter, role: akun.role },
      },
      "Login berhasil."
    );
  } catch (err) {
    console.error("Gagal login:", err);
    fail(res, "Gagal memproses login.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// POST /api/auth/logout
// JWT bersifat stateless (tidak ada session di server), jadi endpoint ini
// hanya memverifikasi token lalu membalas sukses — client yang bertanggung
// jawab menghapus token dari storage-nya. Token lama tetap valid sampai
// expired (7 hari) kalau tidak dihapus di sisi client.
// -----------------------------------------------------------------------
router.post("/logout", verifyToken, async (req, res) => {
  ok(res, {}, "Logout berhasil.");
});

// -----------------------------------------------------------------------
// Middleware: verifikasi JWT
// -----------------------------------------------------------------------
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return fail(res, "Token tidak ditemukan.", {}, 401);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return fail(res, "Token tidak valid atau sudah kedaluwarsa.", {}, 401);
  }
}

// -----------------------------------------------------------------------
// Middleware: batasi akses endpoint berdasarkan role akun.
// Dipakai setelah verifyToken, contoh: [verifyToken, requireRole("petugas", "admin")]
// -----------------------------------------------------------------------
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return fail(res, "Kamu tidak punya akses ke fitur ini.", {}, 403);
    }
    next();
  };
}

export default router;
