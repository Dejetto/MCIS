import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { apiFetch } from "./api";
import StatusBadge from "./components/StatusBadge";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "menunggu", label: "Menunggu" },
  { value: "check_in", label: "Check In" },
  { value: "pemeriksaan", label: "Pemeriksaan" },
  { value: "selesai", label: "Selesai" },
];

export default function StatusAntrian() {
  const [poliList, setPoliList] = useState([]);
  const [idPoli, setIdPoli] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [antrianList, setAntrianList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/poli")
      .then(setPoliList)
      .catch(() => {});
  }, []);

  const fetchAntrian = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (idPoli) params.set("id_poli", idPoli);
      if (status) params.set("status", status);
      const data = await apiFetch(`/api/antrian?${params.toString()}`);
      setAntrianList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [idPoli, status]);

  useEffect(() => {
    fetchAntrian();
  }, [fetchAntrian]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return antrianList;
    return antrianList.filter(
      (a) =>
        a.nama_pasien.toLowerCase().includes(q) ||
        a.nomor_antrian_display.toLowerCase().includes(q)
    );
  }, [antrianList, search]);

  return (
    <div>
      <h1 className="pt-page-title">Cek Status Antrian</h1>
      <p className="pt-page-subtitle">Pantau status seluruh antrian hari ini.</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div className="pt-card">
        <div className="pt-toolbar">
          <div className="pt-search-wrap">
            <Search size={16} />
            <input
              className="pt-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor antrian..."
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <select className="pt-select" style={{ maxWidth: 180 }} value={idPoli} onChange={(e) => setIdPoli(e.target.value)}>
              <option value="">Semua Poli</option>
              {poliList.map((p) => (
                <option key={p.id_poli} value={p.id_poli}>
                  {p.nama_poli}
                </option>
              ))}
            </select>
            <select className="pt-select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="pt-btn pt-btn-secondary" onClick={fetchAntrian}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>No. Antrian</th>
                <th>Nama Pasien</th>
                <th>Dokter</th>
                <th>Poli</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="pt-loading-row">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="pt-empty-state">
                    Tidak ada data antrian.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((a) => (
                  <tr key={a.id_antrian}>
                    <td>
                      <strong>{a.nomor_antrian_display}</strong>
                    </td>
                    <td>{a.nama_pasien}</td>
                    <td>{a.nama_dokter}</td>
                    <td>{a.nama_poli}</td>
                    <td>
                      <StatusBadge status={a.status_antrian} />
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
