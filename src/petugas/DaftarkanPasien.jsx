import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { apiFetch } from "./api";
import PasienPicker from "./components/PasienPicker";

const JENIS_PEMBAYARAN = ["Tunai", "BPJS", "Asuransi", "Perusahaan"];

function todayLabel() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DaftarkanPasien() {
  const [pasien, setPasien] = useState(null);
  const [dokterList, setDokterList] = useState([]);
  const [poliList, setPoliList] = useState([]);
  const [idDokter, setIdDokter] = useState("");
  const [idPoli, setIdPoli] = useState("");
  const [jenisPembayaran, setJenisPembayaran] = useState(JENIS_PEMBAYARAN[0]);
  const [keluhanAwal, setKeluhanAwal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    apiFetch("/api/dokter")
      .then((data) => {
        setDokterList(data);
        if (data.length > 0) setIdDokter(String(data[0].id_dokter));
      })
      .catch(() => setError("Gagal memuat daftar dokter."));

    apiFetch("/api/poli")
      .then((data) => {
        setPoliList(data);
        if (data.length > 0) setIdPoli(String(data[0].id_poli));
      })
      .catch(() => setError("Gagal memuat daftar poli."));
  }, []);

  const resetForm = () => {
    setPasien(null);
    setKeluhanAwal("");
    setJenisPembayaran(JENIS_PEMBAYARAN[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setHasil(null);

    if (!pasien) {
      setError("Pilih pasien terlebih dahulu.");
      return;
    }
    if (!idDokter || !idPoli) {
      setError("Dokter dan poli wajib dipilih.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch("/api/registrasi", {
        method: "POST",
        body: JSON.stringify({
          id_pasien: pasien.id_pasien,
          id_dokter: Number(idDokter),
          id_poli: Number(idPoli),
          pembayaran: jenisPembayaran,
          keluhanAwal,
        }),
      });
      setHasil(data);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Daftarkan Pasien</h1>
      <p className="pt-page-subtitle">Buat pendaftaran kunjungan baru untuk pasien.</p>

      {error && <div className="pt-error-banner">{error}</div>}
      {hasil && (
        <div className="pt-success-banner" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <CheckCircle2 size={18} />
          Pendaftaran berhasil. Nomor antrian: <strong>{hasil.nomor_antrian_display}</strong>
        </div>
      )}

      <div className="pt-card">
        <form onSubmit={handleSubmit}>
          <div className="pt-form-grid">
            <div className="pt-form-field full">
              <label className="pt-label">Pasien</label>
              <PasienPicker value={pasien} onSelect={setPasien} />
              <p className="pt-hint">
                Pasien belum terdaftar?{" "}
                <Link to="/petugas/master-pasien" style={{ color: "#4F8FE8", fontWeight: 500 }}>
                  Tambahkan di Master Data Pasien
                </Link>
                .
              </p>
            </div>

            <div className="pt-form-field">
              <label className="pt-label">Dokter</label>
              <select className="pt-select" value={idDokter} onChange={(e) => setIdDokter(e.target.value)}>
                {dokterList.map((d) => (
                  <option key={d.id_dokter} value={d.id_dokter}>
                    {d.nama_dokter} {d.spesialis_dokter ? `(${d.spesialis_dokter})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-form-field">
              <label className="pt-label">Poli</label>
              <select className="pt-select" value={idPoli} onChange={(e) => setIdPoli(e.target.value)}>
                {poliList.map((p) => (
                  <option key={p.id_poli} value={p.id_poli}>
                    {p.nama_poli}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-form-field">
              <label className="pt-label">Tanggal Kunjungan</label>
              <input className="pt-input" value={todayLabel()} disabled />
            </div>

            <div className="pt-form-field">
              <label className="pt-label">Jenis Pembayaran</label>
              <select
                className="pt-select"
                value={jenisPembayaran}
                onChange={(e) => setJenisPembayaran(e.target.value)}
              >
                {JENIS_PEMBAYARAN.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-form-field full">
              <label className="pt-label">Keluhan Awal</label>
              <textarea
                className="pt-textarea"
                value={keluhanAwal}
                onChange={(e) => setKeluhanAwal(e.target.value)}
                placeholder="Tuliskan keluhan awal pasien..."
              />
            </div>
          </div>

          <button type="submit" className="pt-btn pt-btn-primary" disabled={submitting}>
            {submitting ? "Memproses..." : "Daftarkan Pasien"}
          </button>
        </form>
      </div>
    </div>
  );
}
