import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "./api";
import Modal from "./components/Modal";
import ConfirmDialog from "./components/ConfirmDialog";

function PoliForm({ formId, initialValues, onSubmit }) {
  const [namaPoli, setNamaPoli] = useState(initialValues?.nama_poli || "");
  const [kodePoli, setKodePoli] = useState(initialValues?.kode_poli || "");

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ namaPoli, kodePoli });
      }}
    >
      <div className="pt-form-field">
        <label className="pt-label">Nama Poli</label>
        <input className="pt-input" value={namaPoli} onChange={(e) => setNamaPoli(e.target.value)} required />
      </div>
      <div className="pt-form-field">
        <label className="pt-label">Kode Poli (dipakai untuk nomor antrian, mis. "A")</label>
        <input className="pt-input" value={kodePoli} maxLength={5} onChange={(e) => setKodePoli(e.target.value.toUpperCase())} required />
      </div>
    </form>
  );
}

export default function MasterPoli() {
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
      setRows(await apiFetch("/api/poli"));
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
        await apiFetch("/api/poli", { method: "POST", body: JSON.stringify(values) });
      } else {
        await apiFetch(`/api/poli/${editingRow.id_poli}`, { method: "PUT", body: JSON.stringify(values) });
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
      await apiFetch(`/api/poli/${deleteRow.id_poli}`, { method: "DELETE" });
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
      <h1 className="pt-page-title">Master Data Poli</h1>
      <p className="pt-page-subtitle">Kelola daftar poli klinik.</p>

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
                <th>Nama Poli</th>
                <th>Kode Poli</th>
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
                  <td colSpan={3} className="pt-empty-state">Belum ada data poli.</td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id_poli}>
                    <td>{r.nama_poli}</td>
                    <td>{r.kode_poli}</td>
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
          title={formMode === "add" ? "Tambah Poli" : "Ubah Poli"}
          onClose={() => setFormMode(null)}
          footer={
            <>
              <button className="pt-btn pt-btn-secondary" onClick={() => setFormMode(null)} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="poli-form" className="pt-btn pt-btn-primary" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          }
        >
          <PoliForm key={editingRow?.id_poli || "new"} formId="poli-form" initialValues={editingRow} onSubmit={handleSubmit} />
        </Modal>
      )}

      {deleteRow && (
        <ConfirmDialog
          title="Hapus Poli"
          message={`Yakin ingin menghapus poli "${deleteRow.nama_poli}"?`}
          loading={submitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRow(null)}
        />
      )}
    </div>
  );
}
