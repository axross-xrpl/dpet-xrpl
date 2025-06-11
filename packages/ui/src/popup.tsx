import React from "react";

interface PopupProps {
  open: boolean;
  title?: React.ReactNode;
  message?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export const Popup: React.FC<PopupProps> = ({ open, title, message, onClose, children }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fffbe8",
          borderRadius: 18,
          padding: 32,
          minWidth: 320,
          maxWidth: 420,
          boxShadow: "0 4px 24px rgba(80, 60, 180, 0.18)",
          border: "2px solid #a084e8",
          position: "relative",
          textAlign: "center",
          overflow: "auto",
          maxHeight: "80vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#f3f0ff",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
          aria-label="Close"
        >
          ×
        </button>
        {title && <h2 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: 24 }}>{title}</h2>}
        {message && <p style={{ margin: "0 0 16px 0", fontSize: 16 }}>{message}</p>}
        <div style={{ marginTop: 8 }}>{children}</div>
      </div>
    </div>
  );
};