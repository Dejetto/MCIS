import { useState } from "react";

const EMPTY_VALUES = {
  namaPasien: "",
  nik: "",
  jenisKelamin: "Laki-laki",
  tanggalLahir: "",
  noTelepon: "",
  alamat: "",
};

// Catatan: parent harus memberi `key` yang berubah tiap kali target edit
// berganti (mis. key={pasien?.id_pasien || "new"}) supaya state form ini
// ter-reset, karena initialValues hanya dipakai sekali saat mount.
export default function PasienForm({ formId, initialValues, onSubmit }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues });

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="pt-form-grid">
        <div className="pt-form-field full">
          <label className="pt-label">Nama Pasien</label>
          <input
            className="pt-input"
            value={values.namaPasien}
            onChange={handleChange("namaPasien")}
            required
          />
        </div>
        <div className="pt-form-field">
          <label className="pt-label">NIK</label>
          <input
            className="pt-input"
            value={values.nik}
            onChange={handleChange("nik")}
            maxLength={16}
            placeholder="16 digit"
            required
          />
        </div>
        <div className="pt-form-field">
          <label className="pt-label">Jenis Kelamin</label>
          <select className="pt-select" value={values.jenisKelamin} onChange={handleChange("jenisKelamin")}>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <div className="pt-form-field">
          <label className="pt-label">Tanggal Lahir</label>
          <input
            type="date"
            className="pt-input"
            value={values.tanggalLahir}
            onChange={handleChange("tanggalLahir")}
            required
          />
        </div>
        <div className="pt-form-field">
          <label className="pt-label">Nomor Telepon</label>
          <input
            className="pt-input"
            value={values.noTelepon}
            onChange={handleChange("noTelepon")}
            required
          />
        </div>
        <div className="pt-form-field full">
          <label className="pt-label">Alamat</label>
          <textarea className="pt-textarea" value={values.alamat} onChange={handleChange("alamat")} />
        </div>
      </div>
    </form>
  );
}
