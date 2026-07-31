import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Stethoscope, FileText, LogOut } from "lucide-react";
import "../petugas/petugas.css";

const MENU_ITEMS = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "antrian-pemeriksaan", label: "Antrian Pemeriksaan", icon: Stethoscope },
  { to: "riwayat-pemeriksaan", label: "Riwayat Pemeriksaan Pasien", icon: FileText },
];

export default function DokterLayout({ onLogout }) {
  return (
    <div className="pt-shell">
      <aside className="pt-sidebar">
        <div className="pt-brand">
          <span className="pt-brand-dot" />
          MCIS &middot; Dokter
        </div>
        <nav className="pt-nav">
          {MENU_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `pt-nav-item${isActive ? " active" : ""}`}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="pt-logout" onClick={onLogout}>
          <LogOut size={17} />
          Keluar
        </button>
      </aside>
      <main className="pt-main">
        <Outlet />
      </main>
    </div>
  );
}
