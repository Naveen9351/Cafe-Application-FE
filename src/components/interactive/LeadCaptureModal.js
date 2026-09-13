import React, { useEffect } from "react";
import { X } from "lucide-react";
import LeadCaptureForm from "./LeadCaptureForm";

export default function LeadCaptureModal({
  isOpen,
  onClose,
  initialInterests = ["qr-ordering", "kds"]
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div style={{ position: "relative", width: "100%", maxWidth: "680px", margin: "auto", zIndex: 100001, background: "#ffffff", borderRadius: "20px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 100002
          }}
          aria-label="Close modal"
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        <LeadCaptureForm
          initialInterests={initialInterests}
          onSuccess={() => {
            setTimeout(() => {
              onClose();
            }, 3000);
          }}
        />
      </div>
    </div>
  );
}
