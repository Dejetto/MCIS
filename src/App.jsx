import { useState } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import DashboardPasien from "./DashboardPasien";

// Catatan: project ini masih beberapa halaman saja, jadi belum pakai react-router.
// Kalau nanti halamannya bertambah (misal: Registrasi, Antrian, Rekam Medis),
// pertimbangkan pindah ke react-router-dom untuk routing berbasis URL.

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

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [view, setView] = useState("login"); // "login" | "register" (dipakai saat belum login)

  const handleLoginSuccess = (token, loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("mcis_token");
    window.localStorage.removeItem("mcis_user");
    window.sessionStorage.removeItem("mcis_token");
    window.sessionStorage.removeItem("mcis_user");
    setUser(null);
    setView("login");
  };

  if (!user) {
    if (view === "register") {
      return (
        <RegisterPage
          onRegisterSuccess={() => setView("login")}
          onSwitchToLogin={() => setView("login")}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setView("register")}
      />
    );
  }

  return <DashboardPasien onLogout={handleLogout} />;
}

export default App;
