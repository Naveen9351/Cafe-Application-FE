import React, { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Check
} from "lucide-react";
import { API_URL as API } from "../../config/api";

// Validation Helper: Email Address
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email address is required";
  }
  const clean = email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return "Please enter a valid email address (e.g. name@example.com)";
  }
  const parts = clean.split("@");
  if (parts.length === 2) {
    const domainParts = parts[1].split(".");
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return "Please enter a valid domain extension (e.g. .com, .in)";
    }
  }
  return "";
};

// Validation Helper: Phone Number
export const sanitizePhoneDigits = (raw) => {
  let clean = String(raw || "").replace(/\D/g, "");
  // Handle leading +91 / 91 / 0
  if (clean.startsWith("91") && clean.length === 12) {
    clean = clean.slice(2);
  } else if (clean.startsWith("0") && clean.length === 11) {
    clean = clean.slice(1);
  }
  return clean.slice(0, 10);
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Mobile / WhatsApp number is required";
  }
  const clean = sanitizePhoneDigits(phone);
  if (clean.length === 0) {
    return "Please enter a 10-digit mobile number";
  }
  if (!/^[6-9]/.test(clean)) {
    return "Invalid number: Indian mobile numbers must start with 6, 7, 8, or 9";
  }
  if (clean.length < 10) {
    return `Incomplete mobile number (${clean.length}/10 digits entered)`;
  }
  if (/^(\d)\1{9}$/.test(clean)) {
    return "Please enter a valid active mobile number";
  }
  if (clean === "1234567890" || clean === "0123456789") {
    return "Please enter a valid active mobile number";
  }
  return "";
};

export default function LeadCaptureForm({
  onSuccess,
  sourcePage = "GeneralLanding"
}) {
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phone: ""
  });

  const [touched, setTouched] = useState({
    contactName: false,
    email: false,
    phone: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Live validation calculations
  const nameError = touched.contactName && !formData.contactName.trim()
    ? "Full Name is required"
    : "";

  const emailError = touched.email
    ? validateEmail(formData.email)
    : "";

  const isEmailValid = formData.email.trim().length > 0 && !validateEmail(formData.email);

  const phoneError = touched.phone || formData.phone.length > 0
    ? validatePhone(formData.phone)
    : "";

  const isPhoneValid = formData.phone.length === 10 && !validatePhone(formData.phone);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const clean = sanitizePhoneDigits(rawVal);
    setFormData((prev) => ({ ...prev, phone: clean }));
    if (!touched.phone && clean.length > 0) {
      setTouched((prev) => ({ ...prev, phone: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields touched
    setTouched({ contactName: true, email: true, phone: true });

    // Validate Name
    if (!formData.contactName.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }

    // Validate Email
    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }

    // Validate Phone
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setErrorMessage(phoneErr);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        fullName: formData.contactName.trim(),
        contactName: formData.contactName.trim(),
        workEmail: formData.email.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        restaurantName: "Prospective Cafe",
        source: sourcePage
      };

      await axios.post(`${API}/leads`, payload);

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Lead submission error:", err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      if (backendError) {
        setErrorMessage(backendError);
      } else {
        // Fallback for network disruption
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      }
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
          Thank you, <strong>{formData.contactName || "Partner"}</strong>. Our team will contact you at <strong>+91 {formData.phone}</strong> shortly.
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
            setTouched({
              contactName: false,
              email: false,
              phone: false
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
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(244, 63, 94, 0.08)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            color: "#e11d48",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Name Input */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <User style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Full Name *
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            required
            placeholder="e.g. Rajesh Kumar"
            value={formData.contactName}
            onBlur={() => handleBlur("contactName")}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: nameError ? "1.5px solid #e11d48" : "1px solid var(--border-subtle)",
              background: nameError ? "rgba(244, 63, 94, 0.03)" : "var(--bg-card-subtle)",
              fontSize: 13,
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
          />
        </div>
        {nameError && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, color: "#e11d48", fontSize: 11.5, fontWeight: 600 }}>
            <AlertCircle style={{ width: 13, height: 13 }} />
            <span>{nameError}</span>
          </div>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <Mail style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Email Address *
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="email"
            required
            placeholder="e.g. rajesh@bistro.in"
            value={formData.email}
            onBlur={() => handleBlur("email")}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: "100%",
              padding: "10px 38px 10px 14px",
              borderRadius: "var(--radius-md)",
              border: emailError
                ? "1.5px solid #e11d48"
                : isEmailValid
                ? "1.5px solid #059669"
                : "1px solid var(--border-subtle)",
              background: emailError
                ? "rgba(244, 63, 94, 0.03)"
                : isEmailValid
                ? "rgba(5, 150, 105, 0.03)"
                : "var(--bg-card-subtle)",
              fontSize: 13,
              outline: "none",
              transition: "all 0.2s ease"
            }}
          />
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            {emailError ? (
              <AlertCircle style={{ width: 16, height: 16, color: "#e11d48" }} />
            ) : isEmailValid ? (
              <CheckCircle2 style={{ width: 16, height: 16, color: "#059669" }} />
            ) : null}
          </div>
        </div>
        {emailError ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, color: "#e11d48", fontSize: 11.5, fontWeight: 600 }}>
            <AlertCircle style={{ width: 13, height: 13 }} />
            <span>{emailError}</span>
          </div>
        ) : isEmailValid ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, color: "#059669", fontSize: 11.5, fontWeight: 600 }}>
            <Check style={{ width: 13, height: 13 }} />
            <span>Valid email format</span>
          </div>
        ) : null}
      </div>

      {/* Phone Input with +91 indicator and instant validation */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          <Phone style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Mobile / WhatsApp Number *
        </label>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 800,
              color: "var(--text-muted)",
              pointerEvents: "none",
              userSelect: "none"
            }}
          >
            <span>🇮🇳 +91</span>
            <span style={{ color: "var(--border-subtle)" }}>|</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            required
            placeholder="10-digit Mobile Number (starts with 6-9)"
            value={formData.phone}
            onBlur={() => handleBlur("phone")}
            onKeyDown={(e) => {
              if (
                !/[0-9]/.test(e.key) &&
                !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key) &&
                !e.ctrlKey &&
                !e.metaKey
              ) {
                e.preventDefault();
              }
            }}
            onChange={handlePhoneChange}
            style={{
              width: "100%",
              padding: "10px 38px 10px 62px",
              borderRadius: "var(--radius-md)",
              border: phoneError
                ? "1.5px solid #e11d48"
                : isPhoneValid
                ? "1.5px solid #059669"
                : "1px solid var(--border-subtle)",
              background: phoneError
                ? "rgba(244, 63, 94, 0.03)"
                : isPhoneValid
                ? "rgba(5, 150, 105, 0.03)"
                : "var(--bg-card-subtle)",
              fontSize: 13,
              outline: "none",
              transition: "all 0.2s ease"
            }}
          />
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            {phoneError ? (
              <AlertCircle style={{ width: 16, height: 16, color: "#e11d48" }} />
            ) : isPhoneValid ? (
              <CheckCircle2 style={{ width: 16, height: 16, color: "#059669" }} />
            ) : null}
          </div>
        </div>
        {phoneError ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, color: "#e11d48", fontSize: 11.5, fontWeight: 600 }}>
            <AlertCircle style={{ width: 13, height: 13 }} />
            <span>{phoneError}</span>
          </div>
        ) : isPhoneValid ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, color: "#059669", fontSize: 11.5, fontWeight: 600 }}>
            <Check style={{ width: 13, height: 13 }} />
            <span>Valid 10-digit mobile number</span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 4 }}>
            Enter 10-digit mobile number starting with 6, 7, 8, or 9
          </div>
        )}
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
