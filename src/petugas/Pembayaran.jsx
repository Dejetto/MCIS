import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, Wallet } from "lucide-react";
import { apiFetch } from "./api";
import StatusBadge from "./components/StatusBadge";
import Modal from "./components/Modal";

const METODE_PEMBAYARAN = ["Tunai", "Transfer Bank", "QRIS", "Kartu Debit", "Kartu Kredit"];

function formatRupiah(nominal) {
  if (nominal === null || nominal === undefined) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    nominal
  );
}

export default function Pembayaran() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [target, setTarget] = useState(null);
  const [nominal, setNominal] = useState("");
  const [metode, setMetode] = useState(METODE_PEMBAYARAN[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const data = await apiFetch(`/api/pembayaran?${params.toString()}`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchRows, 300);
    return () => clearTimeout(timeout);
  }, [fetchRows]);

  const openModal = (row) => {
    setTarget(row);
    setNominal(row.nominal ?? "");
    setMetode(row.metode_pembayaran || METODE_PEMBAYARAN[0]);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await apiFetch(`/api/pembayaran/${target.id_registrasi}`, {
        method: "PUT",
        body: JSON.stringify({ nominal: Number(nominal), metodePembayaran: metode }),
      });
      setTarget(null);
      fetchRows();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Pembayaran</h1>
      <p className="pt-page-subtitle">Catat nominal dan metode pembayaran kunjungan pasien.</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div className="pt-card">
        <div className="pt-toolbar">
          <div className="pt-search-wrap">
            <Search size={16} />
            <input
              className="pt-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pasien atau no. rekam medis..."
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <select className="pt-select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="belum_bayar">Belum Bayar</option>
              <option value="lunas">Lunas</option>
            </select>
            <button className="pt-btn pt-btn-secondary" onClick={fetchRows}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Pasien</th>
                <th>No. RM</th>
                <th>Dokter / Poli</th>
                <th>Nominal</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="pt-loading-row">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="pt-empty-state">
                    Tidak ada data kunjungan.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id_registrasi}>
                    <td>{r.tanggal_kunjungan}</td>
                    <td>{r.nama_pasien}</td>
                    <td>{r.nomor_rekammedis}</td>
                    <td>
                      {r.nama_dokter} &middot; {r.nama_poli}
                    </td>
                    <td>{formatRupiah(r.nominal)}</td>
                    <td>
                      <StatusBadge status={r.status_pembayaran} />
                    </td>
                    <td>
                      <button className="pt-btn pt-btn-primary pt-btn-sm" onClick={() => openModal(r)}>
                        <Wallet size={14} />
                        {r.status_pembayaran === "lunas" ? "Ubah" : "Bayar"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {target && (
        <Modal
          title={`Pembayaran - ${target.nama_pasien}`}
          onClose={() => setTarget(null)}
          footer={
            <>
              <button className="pt-btn pt-btn-secondary" onClick={() => setTarget(null)} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="form-pembayaran" className="pt-btn pt-btn-primary" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan & Tandai Lunas"}
              </button>
            </>
          }
        >
          {formError && <div className="pt-error-banner">{formError}</div>}
          <form id="form-pembayaran" onSubmit={handleSubmit}>
            <div className="pt-form-field">
              <label className="pt-label">Nominal (Rp)</label>
              <input
                type="number"
                min="0"
                className="pt-input"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                required
              />
            </div>
            <div className="pt-form-field">
              <label className="pt-label">Metode Pembayaran</label>
              <select className="pt-select" value={metode} onChange={(e) => setMetode(e.target.value)}>
                {METODE_PEMBAYARAN.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
