import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { apiFetch } from "./api";
import PasienPicker from "./components/PasienPicker";

export default function RekamMedisPasien() {
  const [pasien, setPasien] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pasien) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch(`/api/medical-records/${pasien.id_pasien}`)
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pasien]);

  return (
    <div>
      <h1 className="pt-page-title">Rekam Medis Pasien</h1>
      <p className="pt-page-subtitle">Cari pasien untuk melihat riwayat kunjungan dan rekam medisnya (read-only).</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
        <label className="pt-label">Cari Pasien</label>
        <PasienPicker value={pasien} onSelect={setPasien} />
      </div>

      {loading && <div className="pt-card pt-loading-row">Memuat riwayat...</div>}

      {!loading && detail && (
        <>
          <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
            <div className="pt-detail-grid">
              <div className="pt-detail-item">
                <span className="pt-detail-label">Nama Pasien</span>
                <span className="pt-detail-value">{detail.pasien.nama_pasien}</span>
              </div>
              <div className="pt-detail-item">
                <span className="pt-detail-label">No. Rekam Medis</span>
                <span className="pt-detail-value">{detail.pasien.nomor_rekammedis}</span>
              </div>
              <div className="pt-detail-item">
                <span className="pt-detail-label">NIK</span>
                <span className="pt-detail-value">{detail.pasien.nik_pasien}</span>
              </div>
              <div className="pt-detail-item">
                <span className="pt-detail-label">Tanggal Lahir</span>
                <span className="pt-detail-value">{detail.pasien.tanggal_lahirpasien}</span>
              </div>
            </div>
          </div>

          <div className="pt-card">
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1rem", margin: "0 0 1rem" }}>
              Riwayat Kunjungan
            </h3>
            {detail.kunjungan.length === 0 && <div className="pt-empty-state">Belum ada riwayat kunjungan.</div>}
            {detail.kunjungan.map((k) => (
              <div
                key={k.id_registrasi}
                style={{ padding: "1rem 0", borderBottom: "1px solid #F1F5F9" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <strong>{k.tanggal_kunjungan}</strong>
                  <span style={{ color: "#64748B", fontSize: "0.85rem" }}>
                    {k.nama_dokter} &middot; {k.nama_poli}
                  </span>
                </div>
                <p style={{ margin: "0.5rem 0", fontSize: "0.85rem", color: "#334155" }}>
                  <strong>Keluhan awal:</strong> {k.keluhan_awal || "-"}
                </p>
                {k.rekam_medis ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.6rem",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <Stethoscope size={16} style={{ marginTop: "0.15rem", color: "#4F8FE8" }} />
                    <div>
                      <div>
                        Berat: {k.rekam_medis.berat_badan ?? "-"} kg &middot; Tinggi:{" "}
                        {k.rekam_medis.tinggi_badan ?? "-"} cm &middot; Tekanan darah:{" "}
                        {k.rekam_medis.tekanan_darah || "-"} &middot; Suhu:{" "}
                        {k.rekam_medis.suhu_tubuh ?? "-"}&deg;C
                      </div>
                      <div>Keluhan (S): {k.rekam_medis.keluhan_pasien || "-"}</div>
                      <div>Diagnosa (A): {k.rekam_medis.diagnosa || "-"}</div>
                      <div>Rencana Terapi (P): {k.rekam_medis.rencana_terapi || "-"}</div>
                      {k.rekam_medis.tindakan_medis.length > 0 && (
                        <div style={{ marginTop: "0.4rem" }}>
                          Tindakan: {k.rekam_medis.tindakan_medis.map((t) => t.nama_tindakan).join(", ")}
                        </div>
                      )}
                      {k.rekam_medis.resep.length > 0 && (
                        <div style={{ marginTop: "0.4rem" }}>
                          Resep:{" "}
                          {k.rekam_medis.resep
                            .map((r) => `${r.nama_obat} (${r.dosis_obat || "-"})`)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#94A3B8" }}>
                    Rekam medis belum diisi dokter.
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
