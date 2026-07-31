import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = Math.max(1, start); i <= end; i++) pages.push(i);

  return (
    <div className="pt-pagination">
      <button
        className="pt-page-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pt-page-btn${p === page ? " active" : ""}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="pt-page-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Halaman berikutnya"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
