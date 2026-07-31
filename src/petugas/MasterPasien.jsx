import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { apiFetch } from "./api";
import Modal from "./components/Modal";
import ConfirmDialog from "./components/ConfirmDialog";
import Pagination from "./components/Pagination";
import PasienForm from "./components/PasienForm";

const LIMIT = 10;

function toFormValues(row) {
  return {
    namaPasien: row.nama_pasien,
    nik: row.nik_pasien,
    jenisKelamin: row.jenis_kelaminpasien,
    tanggalLahir: row.tanggal_lahirpasien,
    noTelepon: row.no_telponpasien,
    alamat: row.alamat_pasien || "",
  };
}

export default function MasterPasien() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formMode, setFormMode] = useState(null); // "add" | "edit" | null
  const [editingRow, setEditingRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [detailRow, setDetailRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.trim()) params.set("search", search.trim());
      const data = await apiFetch(`/api/pasien?${params.toString()}`);
      setRows(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchList, 300);
    return () => clearTimeout(timeout);
  }, [fetchList]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openAdd = () => {
    setFormMode("add");
    setEditingRow(null);
    setFormError("");
  };

  const openEdit = (row) => {
    setFormMode("edit");
    setEditingRow(row);
    setFormError("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingRow(null);
  };

  const handleFormSubmit = async (values) => {
    setFormError("");
    setSubmitting(true);
    try {
      if (formMode === "add") {
        await apiFetch("/api/pasien", { method: "POST", body: JSON.stringify(values) });
        setSuccess("Pasien baru berhasil ditambahkan.");
      } else {
        await apiFetch(`/api/pasien/${editingRow.id_pasien}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        setSuccess("Data pasien berhasil diubah.");
      }
      closeForm();
      fetchList();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/pasien/${deleteRow.id_pasien}`, { method: "DELETE" });
      setDeleteRow(null);
      setSuccess("Data pasien berhasil dihapus.");
      fetchList();
    } catch (err) {
      setError(err.message);
      setDeleteRow(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Master Data Pasien</h1>
      <p className="pt-page-subtitle">Kelola data induk pasien: tambah, ubah, hapus, dan lihat detail.</p>

      {error && <div className="pt-error-banner">{error}</div>}
      {success && <div className="pt-success-banner">{success}</div>}

      <div className="pt-card">
        <div className="pt-toolbar">
          <div className="pt-search-wrap">
            <Search size={16} />
            <input
              className="pt-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, no. RM, atau no. telepon..."
            />
          </div>
          <button className="pt-btn pt-btn-primary" onClick={openAdd}>
            <Plus size={15} /> Tambah Data
          </button>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>No. RM</th>
                <th>Nama Pasien</th>
                <th>NIK</th>
                <th>Jenis Kelamin</th>
                <th>Tanggal Lahir</th>
                <th>No. Telepon</th>
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
                    Tidak ada data pasien.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id_pasien}>
                    <td>{r.nomor_rekammedis}</td>
                    <td>{r.nama_pasien}</td>
                    <td>{r.nik_pasien}</td>
                    <td>{r.jenis_kelaminpasien}</td>
                    <td>{r.tanggal_lahirpasien}</td>
                    <td>{r.no_telponpasien}</td>
                    <td>
                      <div className="pt-row-actions">
                        <button className="pt-btn pt-btn-secondary pt-btn-sm" onClick={() => setDetailRow(r)} title="Detail">
                          <Eye size={14} />
                        </button>
                        <button className="pt-btn pt-btn-secondary pt-btn-sm" onClick={() => openEdit(r)} title="Ubah">
                          <Pencil size={14} />
                        </button>
                        <button className="pt-btn pt-btn-danger pt-btn-sm" onClick={() => setDeleteRow(r)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>{total} total data</span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {formMode && (
        <Modal
          title={formMode === "add" ? "Tambah Data Pasien" : "Ubah Data Pasien"}
          onClose={closeForm}
          footer={
            <>
              <button className="pt-btn pt-btn-secondary" onClick={closeForm} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="pasien-form" className="pt-btn pt-btn-primary" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          }
        >
          {formError && <div className="pt-error-banner">{formError}</div>}
          <PasienForm
            key={editingRow?.id_pasien || "new"}
            formId="pasien-form"
            initialValues={editingRow ? toFormValues(editingRow) : undefined}
            onSubmit={handleFormSubmit}
          />
        </Modal>
      )}

      {detailRow && (
        <Modal title="Detail Pasien" onClose={() => setDetailRow(null)}>
          <div className="pt-detail-grid">
            <div className="pt-detail-item">
              <span className="pt-detail-label">No. Rekam Medis</span>
              <span className="pt-detail-value">{detailRow.nomor_rekammedis}</span>
            </div>
            <div className="pt-detail-item">
              <span className="pt-detail-label">NIK</span>
              <span className="pt-detail-value">{detailRow.nik_pasien}</span>
            </div>
            <div className="pt-detail-item full">
              <span className="pt-detail-label">Nama Pasien</span>
              <span className="pt-detail-value">{detailRow.nama_pasien}</span>
            </div>
            <div className="pt-detail-item">
              <span className="pt-detail-label">Jenis Kelamin</span>
              <span className="pt-detail-value">{detailRow.jenis_kelaminpasien}</span>
            </div>
            <div className="pt-detail-item">
              <span className="pt-detail-label">Tanggal Lahir</span>
              <span className="pt-detail-value">{detailRow.tanggal_lahirpasien}</span>
            </div>
            <div className="pt-detail-item">
              <span className="pt-detail-label">Nomor Telepon</span>
              <span className="pt-detail-value">{detailRow.no_telponpasien}</span>
            </div>
            <div className="pt-detail-item full">
              <span className="pt-detail-label">Alamat</span>
              <span className="pt-detail-value">{detailRow.alamat_pasien || "-"}</span>
            </div>
          </div>
        </Modal>
      )}

      {deleteRow && (
        <ConfirmDialog
          title="Hapus Data Pasien"
          message={`Yakin ingin menghapus data pasien "${deleteRow.nama_pasien}"? Seluruh riwayat kunjungan, antrian, dan rekam medis pasien ini akan ikut terhapus dan tidak bisa dikembalikan.`}
          confirmLabel="Hapus"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRow(null)}
        />
      )}
    </div>
  );
}
