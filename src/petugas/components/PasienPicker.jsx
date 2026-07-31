import { useEffect, useRef, useState } from "react";
import { Search, X, UserRound } from "lucide-react";
import { apiFetch } from "../api";

export default function PasienPicker({
  value,
  onSelect,
  placeholder = "Cari nama, NIK, atau nomor rekam medis...",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await apiFetch(`/api/pasien?search=${encodeURIComponent(query)}&limit=8`);
        setResults(data.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="pt-picker-selected">
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0F172A" }}>{value.nama_pasien}</div>
          <div style={{ fontSize: "0.78rem", color: "#64748B" }}>
            {value.nomor_rekammedis} &middot; NIK {value.nik_pasien}
          </div>
        </div>
        <button type="button" className="pt-btn pt-btn-secondary pt-btn-sm" onClick={() => onSelect(null)}>
          <X size={14} /> Ganti
        </button>
      </div>
    );
  }

  return (
    <div className="pt-search-wrap" ref={containerRef} style={{ maxWidth: "none" }}>
      <Search size={16} />
      <input
        className="pt-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && query.trim() && (
        <div className="pt-picker-dropdown">
          {loading && <div className="pt-loading-row">Mencari...</div>}
          {!loading && results.length === 0 && (
            <div className="pt-empty-state" style={{ padding: "1rem" }}>
              Pasien tidak ditemukan.
            </div>
          )}
          {!loading &&
            results.map((p) => (
              <button
                type="button"
                key={p.id_pasien}
                className="pt-picker-option"
                onClick={() => {
                  onSelect(p);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <UserRound size={16} />
                <div>
                  <div style={{ fontWeight: 600 }}>{p.nama_pasien}</div>
                  <div style={{ fontSize: "0.76rem", color: "#64748B" }}>
                    {p.nomor_rekammedis} &middot; NIK {p.nik_pasien}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
