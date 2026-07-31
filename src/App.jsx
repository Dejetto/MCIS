import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import PetugasLayout from "./petugas/PetugasLayout";
import Dashboard from "./petugas/Dashboard";
import DaftarkanPasien from "./petugas/DaftarkanPasien";
import PanggilAntrian from "./petugas/PanggilAntrian";
import StatusAntrian from "./petugas/StatusAntrian";
import Pembayaran from "./petugas/Pembayaran";
import RekamMedisPasien from "./petugas/RekamMedisPasien";
import MasterPasien from "./petugas/MasterPasien";
import MasterDokter from "./petugas/MasterDokter";
import MasterPoli from "./petugas/MasterPoli";
import MasterObat from "./petugas/MasterObat";
import DokterLayout from "./dokter/DokterLayout";
import AntrianPemeriksaan from "./dokter/AntrianPemeriksaan";
import PemeriksaanForm from "./dokter/PemeriksaanForm";

function getStoredUser() {
  const raw =
    window.localStorage.getItem("mcis_user") ||
    window.sessionStorage.getItem("mcis_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function homePathFor(user) {
  return user?.role === "dokter" ? "/dokter" : "/petugas";
}

function App() {
  const [user, setUser] = useState(getStoredUser);
  const navigate = useNavigate();

  const handleLoginSuccess = (token, loggedInUser) => {
    setUser(loggedInUser);
    navigate(homePathFor(loggedInUser), { replace: true });
  };

  const handleLogout = () => {
    const token =
      window.localStorage.getItem("mcis_token") || window.sessionStorage.getItem("mcis_token");
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    window.localStorage.removeItem("mcis_token");
    window.localStorage.removeItem("mcis_user");
    window.sessionStorage.removeItem("mcis_token");
    window.sessionStorage.removeItem("mcis_user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={homePathFor(user)} replace />
          ) : (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/petugas"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === "dokter" ? (
            <Navigate to="/dokter" replace />
          ) : (
            <PetugasLayout user={user} onLogout={handleLogout} />
          )
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="daftar-pasien" element={<DaftarkanPasien />} />
        <Route path="panggil-antrian" element={<PanggilAntrian />} />
        <Route path="status-antrian" element={<StatusAntrian />} />
        <Route path="pembayaran" element={<Pembayaran />} />
        <Route path="rekam-medis" element={<RekamMedisPasien />} />
        <Route path="master-pasien" element={<MasterPasien />} />
        <Route
          path="master-dokter"
          element={user?.role === "admin" ? <MasterDokter /> : <Navigate to="/petugas/dashboard" replace />}
        />
        <Route
          path="master-poli"
          element={user?.role === "admin" ? <MasterPoli /> : <Navigate to="/petugas/dashboard" replace />}
        />
        <Route
          path="master-obat"
          element={user?.role === "admin" ? <MasterObat /> : <Navigate to="/petugas/dashboard" replace />}
        />
      </Route>

      <Route
        path="/dokter"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role !== "dokter" ? (
            <Navigate to="/petugas" replace />
          ) : (
            <DokterLayout onLogout={handleLogout} />
          )
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="antrian-pemeriksaan" element={<AntrianPemeriksaan />} />
        <Route path="riwayat-pemeriksaan" element={<RekamMedisPasien />} />
        <Route path="periksa/:idRegistrasi" element={<PemeriksaanForm />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? homePathFor(user) : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? homePathFor(user) : "/login"} replace />} />
    </Routes>
  );
}

export default App;
