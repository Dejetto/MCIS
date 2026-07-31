import express from "express";
import { pool } from "./db.js";
import { ok, fail } from "./utils/respond.js";

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/medical-records/:patientId
// Read-only: data pasien + riwayat kunjungan beserta rekam medis (SOAP),
// tindakan medis, dan resep (kalau sudah diisi dokter).
// -----------------------------------------------------------------------
router.get("/:patientId", async (req, res) => {
  const { patientId } = req.params;

  try {
    const [pasienRows] = await pool.query(
      `SELECT id_pasien, nomor_rekammedis, nama_pasien, tanggal_lahirpasien, nik_pasien,
              jenis_kelaminpasien, no_telponpasien, alamat_pasien
       FROM Pasien WHERE id_pasien = ?`,
      [patientId]
    );
    if (pasienRows.length === 0) {
      return fail(res, "Pasien tidak ditemukan.", {}, 404);
    }

    const [kunjungan] = await pool.query(
      `SELECT r.id_registrasi, r.tanggal_kunjungan, r.pembayaran, r.keluhan_awal,
              d.nama_dokter, po.nama_poli
       FROM Registrasi r
       JOIN Dokter d ON r.id_dokter = d.id_dokter
       JOIN Poli po ON r.id_poli = po.id_poli
       WHERE r.id_pasien = ?
       ORDER BY r.tanggal_kunjungan DESC, r.id_registrasi DESC`,
      [patientId]
    );

    if (kunjungan.length > 0) {
      const idRegistrasiList = kunjungan.map((k) => k.id_registrasi);

      const [rekamMedisRows] = await pool.query(
        `SELECT id_rekammedis, id_registrasi, keluhan_pasien, tekanan_darah, suhu_tubuh,
                berat_badan, tinggi_badan, diagnosa, rencana_terapi
         FROM rekam_medis WHERE id_registrasi IN (?)`,
        [idRegistrasiList]
      );

      const idRekamMedisList = rekamMedisRows.map((rm) => rm.id_rekammedis);
      let resepRows = [];
      let tindakanRows = [];
      if (idRekamMedisList.length > 0) {
        [resepRows] = await pool.query(
          `SELECT re.id_rekammedis, re.dosis_obat, re.instruksi_obat, o.nama_obat
           FROM Resep re
           JOIN Obat o ON re.id_obat = o.id_obat
           WHERE re.id_rekammedis IN (?)`,
          [idRekamMedisList]
        );
        [tindakanRows] = await pool.query(
          `SELECT id_rekammedis, nama_tindakan, catatan FROM TindakanMedis WHERE id_rekammedis IN (?)`,
          [idRekamMedisList]
        );
      }

      const rekamMedisByRegistrasi = new Map();
      for (const rm of rekamMedisRows) {
        rekamMedisByRegistrasi.set(rm.id_registrasi, {
          ...rm,
          resep: resepRows.filter((rs) => rs.id_rekammedis === rm.id_rekammedis),
          tindakan_medis: tindakanRows.filter((t) => t.id_rekammedis === rm.id_rekammedis),
        });
      }

      for (const k of kunjungan) {
        k.rekam_medis = rekamMedisByRegistrasi.get(k.id_registrasi) || null;
      }
    }

    ok(res, { pasien: pasienRows[0], kunjungan });
  } catch (err) {
    console.error("Gagal mengambil rekam medis pasien:", err);
    fail(res, "Gagal mengambil rekam medis pasien.", {}, 500);
  }
});

// -----------------------------------------------------------------------
// POST /api/medical-records (dokter/admin)
// Body: {
//   id_registrasi, keluhanPasien, tekananDarah, suhuTubuh, beratBadan, tinggiBadan,
//   diagnosa, rencanaTerapi,
//   tindakanMedis: [{ namaTindakan, catatan }],
//   resep: [{ id_obat, dosisObat, instruksiObat }]
// }
// Simpan hasil pemeriksaan SOAP + tindakan medis + resep dalam satu transaksi,
// lalu tandai antrian kunjungan tsb sebagai "selesai". Mensyaratkan antrian
// kunjungan sedang berstatus "pemeriksaan" (dokter harus "Mulai Periksa" dulu
// lewat PUT /api/antrian/:id/status).
// -----------------------------------------------------------------------
router.post("/", async (req, res) => {
  if (req.user?.role !== "dokter" && req.user?.role !== "admin") {
    return fail(res, "Hanya dokter yang dapat menyimpan hasil pemeriksaan.", {}, 403);
  }

  const {
    id_registrasi,
    keluhanPasien,
    tekananDarah,
    suhuTubuh,
    beratBadan,
    tinggiBadan,
    diagnosa,
    rencanaTerapi,
    tindakanMedis = [],
    resep = [],
  } = req.body;

  if (!id_registrasi || !diagnosa) {
    return fail(res, "id_registrasi dan diagnosa wajib diisi.", {}, 400);
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [antrianRows] = await conn.query(
      "SELECT id_antrian, status_antrian FROM Antrian WHERE id_registrasi = ?",
      [id_registrasi]
    );
    if (antrianRows.length === 0) {
      await conn.rollback();
      return fail(res, "Antrian untuk registrasi ini tidak ditemukan.", {}, 404);
    }
    if (antrianRows[0].status_antrian !== "pemeriksaan") {
      await conn.rollback();
      return fail(
        res,
        "Pemeriksaan hanya bisa disimpan saat status antrian 'pemeriksaan'. Mulai periksa dulu.",
        {},
        409
      );
    }

    const [rmResult] = await conn.query(
      `INSERT INTO rekam_medis
        (id_registrasi, keluhan_pasien, tekanan_darah, suhu_tubuh, berat_badan, tinggi_badan, diagnosa, rencana_terapi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_registrasi, keluhanPasien || null, tekananDarah || null, suhuTubuh || null, beratBadan || null, tinggiBadan || null, diagnosa, rencanaTerapi || null]
    );
    const idRekamMedis = rmResult.insertId;

    for (const t of tindakanMedis) {
      if (!t.namaTindakan) continue;
      await conn.query(
        "INSERT INTO TindakanMedis (id_rekammedis, nama_tindakan, catatan) VALUES (?, ?, ?)",
        [idRekamMedis, t.namaTindakan, t.catatan || null]
      );
    }

    for (const r of resep) {
      if (!r.id_obat) continue;
      await conn.query(
        "INSERT INTO Resep (id_rekammedis, id_obat, dosis_obat, instruksi_obat) VALUES (?, ?, ?, ?)",
        [idRekamMedis, r.id_obat, r.dosisObat || null, r.instruksiObat || null]
      );
    }

    await conn.query("UPDATE Antrian SET status_antrian = 'selesai' WHERE id_registrasi = ?", [id_registrasi]);

    await conn.commit();
    ok(res, { id_rekammedis: idRekamMedis }, "Hasil pemeriksaan berhasil disimpan.", 201);
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Gagal menyimpan rekam medis:", err);
    fail(res, "Gagal menyimpan rekam medis.", {}, 500);
  } finally {
    if (conn) conn.release();
  }
});

export default router;
