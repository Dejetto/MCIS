import { X } from "lucide-react";

export default function Modal({ title, onClose, children, footer, maxWidth }) {
  return (
    <div className="pt-modal-overlay" onClick={onClose}>
      <div
        className="pt-modal"
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-modal-header">
          <h3 className="pt-modal-title">{title}</h3>
          <button className="pt-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="pt-modal-body">{children}</div>
        {footer && <div className="pt-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
