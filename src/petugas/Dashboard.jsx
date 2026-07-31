import { useEffect, useState } from "react";
import { Users, UserCheck, ListOrdered, Clock, CheckCircle2 } from "lucide-react";
import { apiFetch } from "./api";

const CARDS = [
  { key: "totalPasien", label: "Total Pasien", icon: Users, tone: "#2563EB" },
  { key: "totalPasienHariIni", label: "Total Pasien Hari Ini", icon: UserCheck, tone: "#0D9488" },
  { key: "totalAntreanHariIni", label: "Total Antrean Hari Ini", icon: ListOrdered, tone: "#7C3AED" },
  { key: "totalPasienMenunggu", label: "Total Pasien Menunggu", icon: Clock, tone: "#D97706" },
  { key: "totalPasienSelesaiDilayani", label: "Total Pasien Selesai Dilayani", icon: CheckCircle2, tone: "#16A34A" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/dashboard/stats")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="pt-page-title">Dashboard</h1>
      <p className="pt-page-subtitle">Ringkasan aktivitas klinik hari ini.</p>

      {error && <div className="pt-error-banner">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {CARDS.map(({ key, label, icon: Icon, tone }) => (
          <div className="pt-card" key={key}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `${tone}1A`,
                color: tone,
                marginBottom: "0.9rem",
              }}
            >
              <Icon size={19} />
            </span>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "#0F172A" }}>
              {stats ? stats[key] : <span className="pt-skeleton" />}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "0.35rem" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
