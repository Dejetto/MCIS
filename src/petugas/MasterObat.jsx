import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "./api";
import Modal from "./components/Modal";
import ConfirmDialog from "./components/ConfirmDialog";

function ObatForm({ formId, initialValues, onSubmit }) {
  const [namaObat, setNamaObat] = useState(initialValues?.nama_obat || "");
  const [stokObat, setStokObat] = useState(initialValues?.stok_obat ?? 0);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ namaObat, stokObat });
      }}
    >
      <div className="pt-form-field">
        <label className="pt-label">Nama Obat</label>
        <input className="pt-input" value={namaObat} onChange={(e) => setNamaObat(e.target.value)} required />
      </div>
      <div className="pt-form-field">
        <label className="pt-label">Stok</label>
        <input type="number" min="0" className="pt-input" value={stokObat} onChange={(e) => setStokObat(e.target.value)} />
      </div>
    </form>
  );
}

export default function MasterObat() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await apiFetch("/api/obat"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError("");
    try {
      if (formMode === "add") {
        await apiFetch("/api/obat", { method: "POST", body: JSON.stringify(values) });
      } else {
        await apiFetch(`/api/obat/${editingRow.id_obat}`, { method: "PUT", body: JSON.stringify(values) });
      }
      setFormMode(null);
      setEditingRow(null);
      fetchList();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/obat/${deleteRow.id_obat}`, { method: "DELETE" });
      setDeleteRow(null);
      fetchList();
    } catch (err) {
      setError(err.message);
      setDeleteRow(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Master Data Obat</h1>
      <p className="pt-page-subtitle">Kelola daftar obat & stok untuk resep.</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div className="pt-card">
        <div className="pt-toolbar">
          <div />
          <button
            className="pt-btn pt-btn-primary"
            onClick={() => {
              setFormMode("add");
              setEditingRow(null);
            }}
          >
            <Plus size={15} /> Tambah Data
          </button>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Nama Obat</th>
                <th>Stok</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="pt-loading-row">Memuat data...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="pt-empty-state">Belum ada data obat.</td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id_obat}>
                    <td>{r.nama_obat}</td>
                    <td>{r.stok_obat}</td>
                    <td>
                      <div className="pt-row-actions">
                        <button
                          className="pt-btn pt-btn-secondary pt-btn-sm"
                          onClick={() => {
                            setFormMode("edit");
                            setEditingRow(r);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button className="pt-btn pt-btn-danger pt-btn-sm" onClick={() => setDeleteRow(r)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {formMode && (
        <Modal
          title={formMode === "add" ? "Tambah Obat" : "Ubah Obat"}
          onClose={() => setFormMode(null)}
          footer={
            <>
              <button className="pt-btn pt-btn-secondary" onClick={() => setFormMode(null)} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="obat-form" className="pt-btn pt-btn-primary" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          }
        >
          <ObatForm key={editingRow?.id_obat || "new"} formId="obat-form" initialValues={editingRow} onSubmit={handleSubmit} />
        </Modal>
      )}

      {deleteRow && (
        <ConfirmDialog
          title="Hapus Obat"
          message={`Yakin ingin menghapus obat "${deleteRow.nama_obat}"?`}
          loading={submitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRow(null)}
        />
      )}
    </div>
  );
}
