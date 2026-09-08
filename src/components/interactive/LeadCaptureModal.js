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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl my-8 z-10 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-slate-900 text-white hover:bg-orange-600 flex items-center justify-center shadow-xl border-2 border-white transition-colors z-20 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <LeadCaptureForm
          initialInterests={initialInterests}
          onSuccess={() => {
            setTimeout(() => {
              onClose();
            }, 3000);
          }}
          className="shadow-2xl max-h-[90vh] overflow-y-auto"
        />
      </div>
    </div>
  );
}
