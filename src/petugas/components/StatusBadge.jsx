const STATUS_STYLES = {
  menunggu: { label: "Menunggu", bg: "#FFFBEB", fg: "#D97706" },
  check_in: { label: "Check In", bg: "#EFF6FF", fg: "#2563EB" },
  pemeriksaan: { label: "Pemeriksaan", bg: "#F5F3FF", fg: "#7C3AED" },
  selesai: { label: "Selesai", bg: "#F0FDF4", fg: "#16A34A" },
  belum_bayar: { label: "Belum Bayar", bg: "#FEF2F2", fg: "#B91C1C" },
  lunas: { label: "Lunas", bg: "#F0FDF4", fg: "#16A34A" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { label: status, bg: "#F1F5F9", fg: "#475569" };
  return (
    <span className="pt-badge" style={{ background: style.bg, color: style.fg }}>
      {style.label}
    </span>
  );
}
