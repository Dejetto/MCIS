import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "./api";
import Modal from "./components/Modal";
import ConfirmDialog from "./components/ConfirmDialog";

function DokterForm({ formId, initialValues, onSubmit }) {
  const [namaDokter, setNamaDokter] = useState(initialValues?.nama_dokter || "");
  const [spesialisDokter, setSpesialisDokter] = useState(initialValues?.spesialis_dokter || "");

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ namaDokter, spesialisDokter });
      }}
    >
      <div className="pt-form-field">
        <label className="pt-label">Nama Dokter</label>
        <input className="pt-input" value={namaDokter} onChange={(e) => setNamaDokter(e.target.value)} required />
      </div>
      <div className="pt-form-field">
        <label className="pt-label">Spesialis</label>
        <input className="pt-input" value={spesialisDokter} onChange={(e) => setSpesialisDokter(e.target.value)} />
      </div>
    </form>
  );
}

export default function MasterDokter() {
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
      setRows(await apiFetch("/api/dokter"));
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
        await apiFetch("/api/dokter", { method: "POST", body: JSON.stringify(values) });
      } else {
        await apiFetch(`/api/dokter/${editingRow.id_dokter}`, { method: "PUT", body: JSON.stringify(values) });
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
      await apiFetch(`/api/dokter/${deleteRow.id_dokter}`, { method: "DELETE" });
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
      <h1 className="pt-page-title">Master Data Dokter</h1>
      <p className="pt-page-subtitle">Kelola daftar dokter klinik.</p>

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
                <th>Nama Dokter</th>
                <th>Spesialis</th>
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
                  <td colSpan={3} className="pt-empty-state">Belum ada data dokter.</td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id_dokter}>
                    <td>{r.nama_dokter}</td>
                    <td>{r.spesialis_dokter || "-"}</td>
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
          title={formMode === "add" ? "Tambah Dokter" : "Ubah Dokter"}
          onClose={() => setFormMode(null)}
          footer={
            <>
              <button className="pt-btn pt-btn-secondary" onClick={() => setFormMode(null)} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="dokter-form" className="pt-btn pt-btn-primary" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          }
        >
          <DokterForm key={editingRow?.id_dokter || "new"} formId="dokter-form" initialValues={editingRow} onSubmit={handleSubmit} />
        </Modal>
      )}

      {deleteRow && (
        <ConfirmDialog
          title="Hapus Dokter"
          message={`Yakin ingin menghapus dokter "${deleteRow.nama_dokter}"?`}
          loading={submitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRow(null)}
        />
      )}
    </div>
  );
}
