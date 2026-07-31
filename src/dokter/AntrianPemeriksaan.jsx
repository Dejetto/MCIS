import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, RefreshCw } from "lucide-react";
import { apiFetch } from "../petugas/api";

function getStoredUser() {
  const raw = window.localStorage.getItem("mcis_user") || window.sessionStorage.getItem("mcis_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function AntrianPemeriksaan() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status: "check_in" });
      if (user?.id_dokter) params.set("id_dokter", user.id_dokter);
      setRows(await apiFetch(`/api/antrian?${params.toString()}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id_dokter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleMulai = async (row) => {
    setStartingId(row.id_antrian);
    setError("");
    try {
      await apiFetch(`/api/antrian/${row.id_antrian}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "pemeriksaan" }),
      });
      navigate(`/dokter/periksa/${row.id_registrasi}`, { state: row });
    } catch (err) {
      setError(err.message);
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Antrian Pemeriksaan</h1>
      <p className="pt-page-subtitle">Pasien yang sudah check-in dan menunggu diperiksa.</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div className="pt-card">
        <div className="pt-toolbar">
          <div />
          <button className="pt-btn pt-btn-secondary" onClick={fetchRows}>
            <RefreshCw size={15} /> Muat Ulang
          </button>
        </div>
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>No. Antrian</th>
                <th>Nama Pasien</th>
                <th>Poli</th>
                <th>Keluhan Awal</th>
                <th></th>
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="pt-empty-state">
                    Tidak ada pasien menunggu diperiksa.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id_antrian}>
                    <td>
                      <strong>{r.nomor_antrian_display}</strong>
                    </td>
                    <td>{r.nama_pasien}</td>
                    <td>{r.nama_poli}</td>
                    <td>{r.keluhan_awal || "-"}</td>
                    <td>
                      <button
                        className="pt-btn pt-btn-primary pt-btn-sm"
                        onClick={() => handleMulai(r)}
                        disabled={startingId === r.id_antrian}
                      >
                        <Stethoscope size={14} />
                        {startingId === r.id_antrian ? "Memulai..." : "Mulai Periksa"}
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
