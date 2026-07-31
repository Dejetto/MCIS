import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, ListOrdered, Clock, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";

const toneStyles = {
  hero: { bg: "#0F172A", fg: "#FFFFFF", chipBg: "rgba(255,255,255,0.1)", chipFg: "#93C5FD" },
  blue: { bg: "#FFFFFF", fg: "#1E3A8A", chipBg: "#EFF6FF", chipFg: "#2563EB" },
  teal: { bg: "#FFFFFF", fg: "#134E4A", chipBg: "#F0FDFA", chipFg: "#0D9488" },
  amber: { bg: "#FFFFFF", fg: "#78350F", chipBg: "#FFFBEB", chipFg: "#D97706" },
  green: { bg: "#FFFFFF", fg: "#14532D", chipBg: "#F0FDF4", chipFg: "#16A34A" },
};

// Ganti dengan URL backend kamu jika tidak memakai proxy Vite
const API_URL = "/api/dashboard/stats";
// Interval auto-refresh (ms). Set ke 0 untuk mematikan auto-refresh.
const REFRESH_INTERVAL = 15000;

function StatBubble({ icon, label, value, tone = "blue", hero = false, loading }) {
  const t = toneStyles[tone];
  return (
    <div
      className={`db-card${hero ? " db-card-hero" : ""}`}
      style={{ background: t.bg, color: t.fg }}
    >
      <div className="db-card-top">
        <span className="db-icon-chip" style={{ background: t.chipBg, color: t.chipFg }}>
          {icon}
        </span>
      </div>
      <div className="db-card-value">
        {loading ? <span className="db-skeleton" /> : value}
      </div>
      <div className="db-card-label" style={hero ? { color: "#94A3B8" } : undefined}>
        {label}
      </div>
    </div>
  );
}

export default function DashboardPasien() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tanggal] = useState(() =>
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  const fetchStats = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Gagal memuat statistik dashboard:", err);
      setError("Tidak dapat memuat data. Periksa koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (REFRESH_INTERVAL > 0) {
      const id = setInterval(() => fetchStats({ silent: true }), REFRESH_INTERVAL);
      return () => clearInterval(id);
    }
  }, [fetchStats]);

  const isLoading = loading && !stats;

  const flow = [
    {
      icon: <UserPlus size={20} />,
      label: "Total Pasien Hari Ini",
      value: stats?.pasienHariIni,
      tone: "blue",
    },
    {
      icon: <ListOrdered size={20} />,
      label: "Total Antrean Hari Ini",
      value: stats?.antreanHariIni,
      tone: "teal",
    },
    {
      icon: <Clock size={20} />,
      label: "Total Pasien Menunggu",
      value: stats?.pasienMenunggu,
      tone: "amber",
    },
    {
      icon: <CheckCircle2 size={20} />,
      label: "Total Pasien Selesai Dilayani",
      value: stats?.pasienSelesai,
      tone: "green",
    },
  ];

  return (
    <div className="db-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .db-root {
          min-height: 100vh;
          background: #F4F6F8;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          padding: 2.5rem 3rem;
          box-sizing: border-box;
        }

        .db-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .db-title {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.6rem;
          color: #0F172A;
          margin: 0 0 0.3rem;
        }

        .db-subtitle {
          font-size: 0.92rem;
          color: #64748B;
          margin: 0;
        }

        .db-header-right {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .db-date-chip {
          font-size: 0.82rem;
          font-weight: 500;
          color: #334155;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 999px;
          padding: 0.45rem 1rem;
          text-transform: capitalize;
        }

        .db-refresh-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
        }

        .db-refresh-btn:hover {
          background: #F1F5F9;
        }

        .db-refresh-btn.spinning svg {
          animation: db-spin 0.8s linear infinite;
        }

        @keyframes db-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .db-error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #B91C1C;
          border-radius: 12px;
          padding: 0.8rem 1.1rem;
          font-size: 0.88rem;
          margin-bottom: 1.5rem;
        }

        .db-error-banner button {
          background: none;
          border: none;
          color: #B91C1C;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .db-hero-row {
          margin-bottom: 1.75rem;
        }

        .db-flow-row {
          display: flex;
          align-items: stretch;
          gap: 0.5rem;
        }

        .db-flow-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #CBD5E1;
          flex: 0 0 auto;
        }

        .db-card {
          flex: 1;
          border-radius: 16px;
          border: 1px solid #E7EBF0;
          padding: 1.4rem 1.5rem;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
          min-width: 0;
        }

        .db-card-hero {
          border: none;
          padding: 1.8rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .db-card-top {
          margin-bottom: 0.9rem;
        }

        .db-icon-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
        }

        .db-card-value {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 2rem;
          line-height: 1.1;
          min-height: 2.2rem;
          display: flex;
          align-items: center;
        }

        .db-card-hero .db-card-value {
          font-size: 2.75rem;
        }

        .db-skeleton {
          display: inline-block;
          width: 70px;
          height: 1.6rem;
          border-radius: 6px;
          background: linear-gradient(90deg, rgba(148,163,184,0.25) 25%, rgba(148,163,184,0.4) 37%, rgba(148,163,184,0.25) 63%);
          background-size: 400% 100%;
          animation: db-shimmer 1.4s ease infinite;
        }

        @keyframes db-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }

        .db-card-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 0.35rem;
        }

        @media (max-width: 960px) {
          .db-root {
            padding: 1.75rem;
          }
          .db-flow-row {
            flex-direction: column;
          }
          .db-flow-arrow {
            transform: rotate(90deg);
            padding: 0.1rem 0;
          }
        }
      `}</style>

      <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard pasien</h1>
          <p className="db-subtitle">Ringkasan aktivitas layanan pasien</p>
        </div>
        <div className="db-header-right">
          <span className="db-date-chip">{tanggal}</span>
          <button
            className={`db-refresh-btn${loading ? " spinning" : ""}`}
            onClick={() => fetchStats()}
            aria-label="Muat ulang data"
            title="Muat ulang data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="db-error-banner">
          <span>{error}</span>
          <button onClick={() => fetchStats()}>Coba lagi</button>
        </div>
      )}

      <div className="db-hero-row">
        <StatBubble
          icon={<Users size={22} />}
          label="Total pasien terdaftar (keseluruhan)"
          value={stats?.totalPasien?.toLocaleString("id-ID")}
          tone="hero"
          hero
          loading={isLoading}
        />
      </div>

      <div className="db-flow-row">
        {flow.map((item, i) => (
          <>
            <StatBubble
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              tone={item.tone}
              loading={isLoading}
            />
            {i < flow.length - 1 && (
              <div className="db-flow-arrow" key={`arrow-${i}`}>
                <ChevronRight size={18} />
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}
