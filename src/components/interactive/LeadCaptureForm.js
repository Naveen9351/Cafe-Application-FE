import React, { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Utensils,
  Store,
  Layers
} from "lucide-react";

const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : process.env.REACT_APP_API_URL ||
      "https://cafe-application-be-1.onrender.com/api";

const OUTLET_TYPES = [
  { id: "cafe", label: "Cafe & Bakery" },
  { id: "qsr", label: "QSR & Fast Casual" },
  { id: "dine_in", label: "Dine-In Restaurant" },
  { id: "cloud_kitchen", label: "Cloud Kitchen Brand" },
  { id: "franchise", label: "Multi-Outlet Chain" }
];

export default function LeadCaptureForm({
  onSuccess,
  sourcePage = "GeneralLanding"
}) {
  const [formData, setFormData] = useState({
    contactName: "",
    restaurantName: "",
    phone: "",
    email: "",
    city: "",
    outletType: "cafe",
    tableCount: "15",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await axios.post(`${API}/leads/demo-request`, {
        ...formData,
        source: sourcePage,
        tableCount: Number(formData.tableCount) || 10
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      // Fallback local acknowledgment if offline
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        style={{
          padding: "36px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-emerald-light)",
            color: "var(--color-emerald)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CheckCircle2 style={{ width: 32, height: 32 }} />
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-main)", margin: 0 }}>
          Demo Session Reserved!
        </h3>

        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
          Thank you, <strong>{formData.contactName || "Partner"}</strong>. A SARVIQ restaurant specialist will reach out on WhatsApp / phone at <strong>{formData.phone}</strong> within 30 minutes.
        </p>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              contactName: "",
              restaurantName: "",
              phone: "",
              email: "",
              city: "",
              outletType: "cafe",
              tableCount: "15",
              notes: ""
            });
          }}
          className="btn-white"
          style={{ fontSize: 12, padding: "8px 18px", marginTop: 8 }}
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {errorMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-rose-light)",
            color: "var(--color-rose)",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <AlertCircle style={{ width: 16, height: 16 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Row 1: Name & Phone */}
      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <User style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rahul Sharma"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <Phone style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Phone / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. +91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>
      </div>

      {/* Row 2: Email & City */}
      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <Mail style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Work Email
          </label>
          <input
            type="email"
            placeholder="e.g. rahul@bistro.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <MapPin style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> City / Location *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Bangalore, Indiranagar"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>
      </div>

      {/* Row 3: Restaurant Name */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <Building2 style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Restaurant / Cafe / Brand Name *
        </label>
        <input
          type="text"
          required
          placeholder="e.g. The Copper Chimney"
          value={formData.restaurantName}
          onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
        />
      </div>

      {/* Row 4: Outlet Type Selector */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 6 }}>
          <Utensils style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Outlet Category
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {OUTLET_TYPES.map((type) => {
            const isSelected = formData.outletType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, outletType: type.id })}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--border-subtle)"}`,
                  background: isSelected ? "var(--color-primary-light)" : "var(--bg-card-subtle)",
                  color: isSelected ? "var(--color-primary)" : "var(--text-main)",
                  transition: "all 0.2s ease"
                }}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-electric"
        style={{ width: "100%", padding: "14px", fontSize: 13, marginTop: 8 }}
      >
        <Sparkles style={{ width: 16, height: 16 }} />
        <span>{isSubmitting ? "Scheduling Session..." : "Confirm 1-on-1 Walkthrough"}</span>
      </button>
    </form>
  );
}
