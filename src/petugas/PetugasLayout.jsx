import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Volume2,
  ClipboardList,
  Wallet,
  FileText,
  Users,
  Stethoscope,
  Pill,
  LogOut,
} from "lucide-react";
import "./petugas.css";

const MENU_ITEMS = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "daftar-pasien", label: "Daftarkan Pasien", icon: UserPlus },
  { to: "panggil-antrian", label: "Panggil Antrian", icon: Volume2 },
  { to: "status-antrian", label: "Cek Status Antrian", icon: ClipboardList },
  { to: "pembayaran", label: "Pembayaran", icon: Wallet },
  { to: "rekam-medis", label: "Rekam Medis Pasien", icon: FileText },
  { to: "master-pasien", label: "Master Data Pasien", icon: Users },
];

const ADMIN_MENU_ITEMS = [
  { to: "master-dokter", label: "Master Data Dokter", icon: Stethoscope },
  { to: "master-poli", label: "Master Data Poli", icon: ClipboardList },
  { to: "master-obat", label: "Master Data Obat", icon: Pill },
];

export default function PetugasLayout({ user, onLogout }) {
  const items = user?.role === "admin" ? [...MENU_ITEMS, ...ADMIN_MENU_ITEMS] : MENU_ITEMS;

  return (
    <div className="pt-shell">
      <aside className="pt-sidebar">
        <div className="pt-brand">
          <span className="pt-brand-dot" />
          MCIS &middot; {user?.role === "admin" ? "Administrator" : "Pendaftaran"}
        </div>
        <nav className="pt-nav">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `pt-nav-item${isActive ? " active" : ""}`}
            >
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
