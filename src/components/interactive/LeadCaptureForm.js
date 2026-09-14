import React, { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User
} from "lucide-react";

const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : process.env.REACT_APP_API_URL ||
      "https://cafe-application-be-1.onrender.com/api";

export default function LeadCaptureForm({
  onSuccess,
  sourcePage = "GeneralLanding"
}) {
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phone: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        fullName: formData.contactName,
        contactName: formData.contactName,
        workEmail: formData.email,
        email: formData.email,
        phone: formData.phone,
        restaurantName: "Prospective Cafe",
        source: sourcePage
      };

      await axios.post(`${API}/leads`, payload);

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Lead submission error:", err);
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
          padding: "24px 16px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--color-emerald-light)",
            color: "var(--color-emerald)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CheckCircle2 style={{ width: 28, height: 28 }} />
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-main)", margin: 0 }}>
          Demo Walkthrough Reserved!
        </h3>

        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, maxWidth: 360, lineHeight: 1.5 }}>
          Thank you, <strong>{formData.contactName || "Partner"}</strong>. Our team will contact you at <strong>{formData.phone}</strong> shortly.
        </p>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              contactName: "",
              email: "",
              phone: ""
            });
          }}
          className="btn-white"
          style={{ fontSize: 12, padding: "8px 18px", marginTop: 6 }}
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)", marginBottom: 2 }}>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles style={{ width: 16, height: 16, color: "var(--color-primary)" }} /> Schedule Live Demo
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
          Enter your details and our team will get in touch.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: "8px 12px",
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

      {/* Name Input */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <User style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Full Name *
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Rajesh Kumar"
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 13 }}
        />
      </div>

      {/* Email Input */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <Mail style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Email Address *
        </label>
        <input
          type="email"
          required
          placeholder="e.g. rajesh@bistro.in"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 13 }}
        />
      </div>

      {/* Phone Input */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <Phone style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Mobile / WhatsApp Number *
        </label>
        <input
          type="tel"
          required
          placeholder="e.g. +91 98765 43210"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 13 }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-electric"
        style={{ width: "100%", padding: "12px", fontSize: 13, marginTop: 4 }}
      >
        <Sparkles style={{ width: 16, height: 16 }} />
        <span>{isSubmitting ? "Scheduling Session..." : "Book Demo Walkthrough"}</span>
      </button>
    </form>
  );
}
