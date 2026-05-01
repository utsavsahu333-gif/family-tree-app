"use client";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", fontSize: 24, cursor: "pointer",
                color: "var(--muted)", lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
