import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../petugas/api";

const sectionTitleStyle = { fontFamily: "'Sora', sans-serif", fontSize: "1rem", margin: "0 0 1rem", color: "#0F172A" };

export default function PemeriksaanForm() {
  const { idRegistrasi } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [context, setContext] = useState(location.state || null);
  const [obatList, setObatList] = useState([]);
  const [keluhanPasien, setKeluhanPasien] = useState(location.state?.keluhan_awal || "");
  const [tekananDarah, setTekananDarah] = useState("");
  const [suhuTubuh, setSuhuTubuh] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [diagnosa, setDiagnosa] = useState("");
  const [rencanaTerapi, setRencanaTerapi] = useState("");
  const [tindakanMedis, setTindakanMedis] = useState([]);
  const [resep, setResep] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/obat")
      .then(setObatList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (context) return;
    apiFetch("/api/registrasi")
      .then((list) => {
        const found = list.find((r) => String(r.id_registrasi) === String(idRegistrasi));
        if (found) setContext(found);
      })
      .catch(() => {});
  }, [context, idRegistrasi]);

  const addTindakan = () => setTindakanMedis((t) => [...t, { namaTindakan: "", catatan: "" }]);
  const updateTindakan = (i, field, value) =>
    setTindakanMedis((t) => t.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  const removeTindakan = (i) => setTindakanMedis((t) => t.filter((_, idx) => idx !== i));

  const addResep = () => setResep((r) => [...r, { id_obat: obatList[0]?.id_obat || "", dosisObat: "", instruksiObat: "" }]);
  const updateResep = (i, field, value) => setResep((r) => r.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  const removeResep = (i) => setResep((r) => r.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!diagnosa) {
      setError("Diagnosa wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/medical-records", {
        method: "POST",
        body: JSON.stringify({
          id_registrasi: Number(idRegistrasi),
          keluhanPasien,
          tekananDarah,
          suhuTubuh: suhuTubuh || null,
          beratBadan: beratBadan || null,
          tinggiBadan: tinggiBadan || null,
          diagnosa,
          rencanaTerapi,
          tindakanMedis: tindakanMedis.filter((t) => t.namaTindakan),
          resep: resep.filter((r) => r.id_obat),
        }),
      });
      navigate("/dokter/antrian-pemeriksaan");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="pt-page-title">Pemeriksaan Pasien</h1>
      <p className="pt-page-subtitle">
        {context ? `${context.nama_pasien} — ${context.nomor_antrian_display || ""}` : `Registrasi #${idRegistrasi}`}
      </p>

      {error && <div className="pt-error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={sectionTitleStyle}>Subjective</h3>
          <div className="pt-form-field">
            <label className="pt-label">Keluhan Pasien</label>
            <textarea className="pt-textarea" value={keluhanPasien} onChange={(e) => setKeluhanPasien(e.target.value)} />
          </div>
        </div>

        <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={sectionTitleStyle}>Objective</h3>
          <div className="pt-form-grid">
            <div className="pt-form-field">
              <label className="pt-label">Tekanan Darah</label>
              <input className="pt-input" placeholder="120/80" value={tekananDarah} onChange={(e) => setTekananDarah(e.target.value)} />
            </div>
            <div className="pt-form-field">
              <label className="pt-label">Suhu Tubuh (&deg;C)</label>
              <input type="number" step="0.1" className="pt-input" value={suhuTubuh} onChange={(e) => setSuhuTubuh(e.target.value)} />
            </div>
            <div className="pt-form-field">
              <label className="pt-label">Berat Badan (kg)</label>
              <input type="number" step="0.1" className="pt-input" value={beratBadan} onChange={(e) => setBeratBadan(e.target.value)} />
            </div>
            <div className="pt-form-field">
              <label className="pt-label">Tinggi Badan (cm)</label>
              <input type="number" step="0.1" className="pt-input" value={tinggiBadan} onChange={(e) => setTinggiBadan(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={sectionTitleStyle}>Assessment</h3>
          <div className="pt-form-field">
            <label className="pt-label">Diagnosa</label>
            <textarea className="pt-textarea" value={diagnosa} onChange={(e) => setDiagnosa(e.target.value)} required />
          </div>
        </div>

        <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={sectionTitleStyle}>Plan</h3>
          <div className="pt-form-field">
            <label className="pt-label">Rencana Terapi</label>
            <textarea className="pt-textarea" value={rencanaTerapi} onChange={(e) => setRencanaTerapi(e.target.value)} />
          </div>
        </div>

        <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Tindakan Medis</h3>
            <button type="button" className="pt-btn pt-btn-secondary pt-btn-sm" onClick={addTindakan}>
              <Plus size={14} /> Tambah
            </button>
          </div>
          {tindakanMedis.length === 0 && (
            <p style={{ fontSize: "0.85rem", color: "#94A3B8", margin: 0 }}>Belum ada tindakan.</p>
          )}
          {tindakanMedis.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.6rem" }}>
              <input
                className="pt-input"
                placeholder="Nama tindakan"
                value={t.namaTindakan}
                onChange={(e) => updateTindakan(i, "namaTindakan", e.target.value)}
              />
              <input
                className="pt-input"
                placeholder="Catatan"
                value={t.catatan}
                onChange={(e) => updateTindakan(i, "catatan", e.target.value)}
              />
              <button type="button" className="pt-btn pt-btn-danger pt-btn-sm" onClick={() => removeTindakan(i)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Resep Obat</h3>
            <button type="button" className="pt-btn pt-btn-secondary pt-btn-sm" onClick={addResep}>
              <Plus size={14} /> Tambah
            </button>
          </div>
          {resep.length === 0 && <p style={{ fontSize: "0.85rem", color: "#94A3B8", margin: 0 }}>Belum ada resep.</p>}
          {resep.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.6rem" }}>
              <select className="pt-select" value={r.id_obat} onChange={(e) => updateResep(i, "id_obat", e.target.value)}>
                {obatList.map((o) => (
                  <option key={o.id_obat} value={o.id_obat}>
                    {o.nama_obat}
                  </option>
                ))}
              </select>
              <input
                className="pt-input"
                placeholder="Dosis"
                value={r.dosisObat}
                onChange={(e) => updateResep(i, "dosisObat", e.target.value)}
              />
              <input
                className="pt-input"
                placeholder="Instruksi"
                value={r.instruksiObat}
                onChange={(e) => updateResep(i, "instruksiObat", e.target.value)}
              />
              <button type="button" className="pt-btn pt-btn-danger pt-btn-sm" onClick={() => removeResep(i)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="pt-btn pt-btn-primary" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan & Selesaikan Pemeriksaan"}
        </button>
      </form>
    </div>
  );
}
