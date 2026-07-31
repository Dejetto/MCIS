import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------
// GET /api/dashboard/stats
// Mengembalikan 5 angka yang dipakai di halaman dashboard.
// Ganti bagian di dalam try{} ini dengan query ke database kamu
// (MySQL/PostgreSQL/MongoDB/dsb). Contoh query SQL diberikan sebagai
// komentar supaya tinggal disesuaikan dengan skema tabel kamu.
// -----------------------------------------------------------------------
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    // Contoh jika pakai MySQL/PostgreSQL (pseudo-code, sesuaikan nama tabel/kolom):
    //
    // const totalPasien = await db.query("SELECT COUNT(*) FROM pasien");
    // const pasienHariIni = await db.query(
    //   "SELECT COUNT(*) FROM pasien WHERE DATE(created_at) = CURDATE()"
    // );
    // const antreanHariIni = await db.query(
    //   "SELECT COUNT(*) FROM antrean WHERE DATE(created_at) = CURDATE()"
    // );
    // const pasienMenunggu = await db.query(
    //   "SELECT COUNT(*) FROM antrean WHERE status = 'menunggu' AND DATE(created_at) = CURDATE()"
    // );
    // const pasienSelesai = await db.query(
    //   "SELECT COUNT(*) FROM antrean WHERE status = 'selesai' AND DATE(created_at) = CURDATE()"
    // );

    // Data contoh (mock) — hapus setelah query asli terpasang
    const stats = {
      totalPasien: 4820,
      pasienHariIni: 63,
      antreanHariIni: 41,
      pasienMenunggu: 12,
      pasienSelesai: 29,
    };

    res.json(stats);
  } catch (err) {
    console.error("Gagal mengambil statistik dashboard:", err);
    res.status(500).json({ message: "Gagal mengambil data statistik." });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
