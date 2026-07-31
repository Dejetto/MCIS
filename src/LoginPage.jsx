import { useState } from "react";

// Ganti dengan URL backend kamu jika tidak memakai proxy Vite
const LOGIN_URL = "/api/auth/login";

export default function LoginPage({ onLoginSuccess }) {
  const [noHp, setnumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!noHp || !password) {
      setError("Isi nomor handphone dan kata sandi terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noHp, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Nomor HP atau kata sandi salah.");
        return;
      }

      const { token, user } = json.data;

      // Simpan token: localStorage kalau "Ingat saya" dicentang, sessionStorage kalau tidak
      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem("mcis_token", token);
      storage.setItem("mcis_user", JSON.stringify(user));

      onLoginSuccess?.(token, user);
    } catch (err) {
      console.error("Gagal login:", err);
      setError("Tidak dapat terhubung ke server. Periksa koneksi kamu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=Inter:wght@400;500;600&display=swap');

        .lp-root {
          min-height: 100vh;
          display: flex;
          background: #F7F8FA;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }

        .lp-panel-brand {
          position: relative;
          flex: 0 0 42%;
          background: #0B1120;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
        }

        .lp-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(79,143,232,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,143,232,0.08) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse at 30% 40%, black 10%, transparent 70%);
        }

        .lp-brand-mark {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1.1rem;
          color: #EAF0FB;
          letter-spacing: 0.01em;
        }

        .lp-brand-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22D3B6;
          box-shadow: 0 0 0 4px rgba(34,211,182,0.15);
        }

        .lp-pulse-wrap {
          position: relative;
          z-index: 1;
        }

        .lp-eyebrow {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4F8FE8;
          margin: 0 0 0.9rem;
        }

        .lp-headline {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1.9rem;
          line-height: 1.3;
          color: #F3F6FB;
          margin: 0 0 1rem;
          max-width: 22ch;
        }

        .lp-subtext {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #8FA1BE;
          max-width: 34ch;
          margin: 0 0 2rem;
        }

        .lp-trace {
          width: 100%;
          height: auto;
          display: block;
        }

        .lp-trace-line {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: lp-draw 2.6s ease-out forwards, lp-glow 3s ease-in-out 2.6s infinite;
        }

        @keyframes lp-draw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes lp-glow {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        .lp-foot-note {
          position: relative;
          z-index: 1;
          font-size: 0.78rem;
          color: #5A6B87;
        }

        .lp-panel-form {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
        }

        .lp-form-card {
          width: 100%;
          max-width: 380px;
        }

        .lp-form-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1.5rem;
          color: #16202B;
          margin: 0 0 0.4rem;
        }

        .lp-form-sub {
          font-size: 0.9rem;
          color: #6B7684;
          margin: 0 0 2rem;
        }

        .lp-field {
          margin-bottom: 1.1rem;
        }

        .lp-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: #3B4656;
          margin-bottom: 0.4rem;
        }

        .lp-input-wrap {
          position: relative;
        }

        .lp-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.7rem 0.85rem;
          font-size: 0.92rem;
          font-family: inherit;
          color: #16202B;
          background: #FFFFFF;
          border: 1.5px solid #E1E5EB;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .lp-input::placeholder {
          color: #A6AFBB;
        }

        .lp-input:focus {
          border-color: #4F8FE8;
          box-shadow: 0 0 0 3px rgba(79,143,232,0.15);
        }

        .lp-toggle-pass {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 0.78rem;
          font-weight: 500;
          color: #4F8FE8;
          cursor: pointer;
          padding: 4px 6px;
        }

        .lp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.3rem 0 1.4rem;
        }

        .lp-remember {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #4B5566;
        }

        .lp-remember input {
          accent-color: #4F8FE8;
          width: 14px;
          height: 14px;
        }

        .lp-forgot {
          font-size: 0.85rem;
          color: #4F8FE8;
          text-decoration: none;
          font-weight: 500;
        }

        .lp-forgot:hover {
          text-decoration: underline;
        }

        .lp-error {
          font-size: 0.83rem;
          color: #C0392B;
          background: #FCEBEB;
          border-radius: 8px;
          padding: 0.55rem 0.75rem;
          margin: -0.3rem 0 1rem;
        }

        .lp-submit {
          width: 100%;
          padding: 0.75rem;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 600;
          color: #FFFFFF;
          background: #0B1120;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.05s ease;
        }

        .lp-submit:hover {
          background: #182238;
        }

        .lp-submit:active {
          transform: scale(0.99);
        }

        .lp-submit:disabled {
          opacity: 0.7;
          cursor: default;
        }

        @media (max-width: 860px) {
          .lp-panel-brand {
            display: none;
          }
          .lp-panel-form {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="lp-panel-brand">
        <div className="lp-grid-bg" />

        <div className="lp-brand-mark">
          <span className="lp-brand-dot" />
          MCIS
        </div>

        <div className="lp-pulse-wrap">
          <p className="lp-eyebrow">Akses aman</p>
          <h1 className="lp-headline">Satu akun untuk semua alur kerjamu</h1>
          <p className="lp-subtext">
            Masuk untuk melanjutkan ke ruang kerja, proyek, dan data yang sudah kamu atur.
          </p>
          <svg className="lp-trace" viewBox="0 0 360 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className="lp-trace-line"
              d="M0 45 L60 45 L75 15 L95 75 L115 45 L160 45 L175 30 L190 60 L205 45 L360 45"
              stroke="#22D3B6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="lp-foot-note">© {new Date().getFullYear()} Sinergi Platform</p>
      </div>

      <div className="lp-panel-form">
        <div className="lp-form-card">
          <h2 className="lp-form-title">Masuk ke akun</h2>
          <p className="lp-form-sub">Masukkan kredensialmu untuk melanjutkan.</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="lp-error">{error}</div>}

            <div className="lp-field">
              <label className="lp-label" htmlFor="noHp">Nomor Handphone</label>
              <div className="lp-input-wrap">
                <input
                  id="noHp"
                  type="tel"
                  className="lp-input"
                  placeholder="masukkan nomor handphone"
                  value={noHp}
                  onChange={(e) => setnumber(e.target.value)}
                  autoComplete="noHp"
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="password">Kata sandi</label>
              <div className="lp-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="lp-input"
                  style={{ paddingRight: "3.2rem" }}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-toggle-pass"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="lp-row">
              <label className="lp-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ingat saya
              </label>
              <a href="#" className="lp-forgot">Lupa kata sandi?</a>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
