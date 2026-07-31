import { useCallback, useEffect, useState } from "react";
import { Volume2, RefreshCw } from "lucide-react";
import { apiFetch } from "./api";

export default function PanggilAntrian() {
  const [poliList, setPoliList] = useState([]);
  const [idPoli, setIdPoli] = useState("");
  const [antrianList, setAntrianList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callingId, setCallingId] = useState(null);

  useEffect(() => {
    apiFetch("/api/poli")
      .then(setPoliList)
      .catch(() => {});
  }, []);

  const fetchAntrian = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status: "menunggu" });
      if (idPoli) params.set("id_poli", idPoli);
      const data = await apiFetch(`/api/antrian?${params.toString()}`);
      setAntrianList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [idPoli]);

  useEffect(() => {
    fetchAntrian();
  }, [fetchAntrian]);

  const handlePanggil = async (idAntrian) => {
    setCallingId(idAntrian);
    setError("");
    try {
      await apiFetch(`/api/antrian/${idAntrian}/panggil`, { method: "PATCH" });
      setAntrianList((list) => list.filter((a) => a.id_antrian !== idAntrian));
    } catch (err) {
      setError(err.message);
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Panggil Antrian</h1>
      <p className="pt-page-subtitle">Daftar pasien yang sedang menunggu hari ini.</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div className="pt-card">
        <div className="pt-toolbar">
          <select className="pt-select" style={{ maxWidth: 220 }} value={idPoli} onChange={(e) => setIdPoli(e.target.value)}>
            <option value="">Semua Poli</option>
            {poliList.map((p) => (
              <option key={p.id_poli} value={p.id_poli}>
                {p.nama_poli}
              </option>
            ))}
          </select>
          <button className="pt-btn pt-btn-secondary" onClick={fetchAntrian}>
            <RefreshCw size={15} /> Muat Ulang
          </button>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>No. Antrian</th>
                <th>Nama Pasien</th>
                <th>Dokter</th>
                <th>Poli</th>
                <th>Keluhan Awal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="pt-loading-row">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && antrianList.length === 0 && (
                <tr>
                  <td colSpan={6} className="pt-empty-state">
                    Tidak ada pasien yang menunggu.
                  </td>
                </tr>
              )}
              {!loading &&
                antrianList.map((a) => (
                  <tr key={a.id_antrian}>
                    <td>
                      <strong>{a.nomor_antrian_display}</strong>
                    </td>
                    <td>{a.nama_pasien}</td>
                    <td>{a.nama_dokter}</td>
                    <td>{a.nama_poli}</td>
                    <td>{a.keluhan_awal || "-"}</td>
                    <td>
                      <button
                        className="pt-btn pt-btn-primary pt-btn-sm"
                        onClick={() => handlePanggil(a.id_antrian)}
                        disabled={callingId === a.id_antrian}
                      >
                        <Volume2 size={14} />
                        {callingId === a.id_antrian ? "Memanggil..." : "Panggil"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
