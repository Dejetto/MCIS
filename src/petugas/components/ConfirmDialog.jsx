import Modal from "./Modal";

export default function ConfirmDialog({
  title = "Konfirmasi",
  message,
  confirmLabel = "Hapus",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      maxWidth="420px"
      footer={
        <>
          <button className="pt-btn pt-btn-secondary" onClick={onCancel} disabled={loading}>
            Batal
          </button>
          <button
            className={`pt-btn ${danger ? "pt-btn-danger" : "pt-btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}
