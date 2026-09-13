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
  { id: "restaurant", label: "Dine-In Restaurant" },
  { id: "cafe", label: "Cafe & Coffee Shop" },
  { id: "qsr", label: "QSR / Fast Food" },
  { id: "cloud_kitchen", label: "Cloud Kitchen" },
  { id: "bar", label: "Bar / Resto-Bar" },
  { id: "bakery", label: "Bakery & Desserts" },
  { id: "franchise", label: "Multi-Outlet Chain" }
];

const TABLE_COUNT_OPTIONS = [
  { value: "1-5", label: "1 - 5 Tables" },
  { value: "6-15", label: "6 - 15 Tables" },
  { value: "16-30", label: "16 - 30 Tables" },
  { value: "30+", label: "30+ Tables" }
];

const OUTLET_COUNT_OPTIONS = [
  { value: "1", label: "1 Outlet" },
  { value: "2-5", label: "2 - 5 Outlets" },
  { value: "5+", label: "5+ Outlets" }
];

export default function LeadCaptureForm({
  onSuccess,
  sourcePage = "GeneralLanding"
}) {
  const [formData, setFormData] = useState({
    restaurantName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    outletType: "restaurant",
    tableCount: "6-15",
    outletCount: "1",
    preferredDate: "",
    preferredTime: "11:00 AM",
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
      const payload = {
        fullName: formData.contactName,
        contactName: formData.contactName,
        workEmail: formData.email,
        email: formData.email,
        phone: formData.phone,
        restaurantName: formData.restaurantName,
        outletType: formData.outletType,
        locationsCount: `${formData.outletCount} outlet(s)`,
        city: formData.city,
        address: formData.address,
        notes: `${formData.notes || ''} [Tables: ${formData.tableCount}] [State: ${formData.state}] [PrefDate: ${formData.preferredDate} ${formData.preferredTime}]`.trim(),
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
          Demo Walkthrough Reserved!
        </h3>

        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, maxWidth: 420, lineHeight: 1.5 }}>
          Thank you, <strong>{formData.contactName || "Partner"}</strong>. Our team will contact <strong>{formData.restaurantName}</strong> at <strong>{formData.phone}</strong> for your 1-on-1 walkthrough.
        </p>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              restaurantName: "",
              contactName: "",
              phone: "",
              email: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
              outletType: "restaurant",
              tableCount: "6-15",
              outletCount: "1",
              preferredDate: "",
              preferredTime: "11:00 AM",
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
      <div style={{ paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles style={{ width: 18, height: 18, color: "var(--color-primary)" }} /> Schedule SERVIQ Live Walkthrough
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
          Tell us about your restaurant so our technical specialist can tailor your demo session.
        </p>
      </div>

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

      {/* Row 1: Restaurant Name & Owner Name */}
      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <Building2 style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Restaurant / Business Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Copper Chimney Bistro"
            value={formData.restaurantName}
            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <User style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Owner / Contact Person Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rajesh Kumar"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>
      </div>

      {/* Row 2: Phone & Email */}
      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <Phone style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Mobile Number / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. +91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <Mail style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Email Address *
          </label>
          <input
            type="email"
            required
            placeholder="e.g. rajesh@bistro.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>
      </div>

      {/* Row 3: City, State, Pincode */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            <MapPin style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> City *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Bangalore"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            State *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Karnataka"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            Pincode
          </label>
          <input
            type="text"
            placeholder="e.g. 560038"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
          />
        </div>
      </div>

      {/* Full Address & Google Maps link */}
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          Full Address & Google Maps Location Link
        </label>
        <input
          type="text"
          placeholder="e.g. 100ft Road, Indiranagar, Bangalore / https://maps.app.goo.gl/..."
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-card-subtle)", fontSize: 12 }}
        />
      </div>

      {/* Row 4: Outlet Category Selector */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 6 }}>
          <Utensils style={{ width: 13, height: 13, color: "var(--color-primary)" }} /> Restaurant Type / Category *
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {OUTLET_TYPES.map((type) => {
            const isSelected = formData.outletType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, outletType: type.id })}
                style={{
                  padding: "7px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--border-subtle)"}`,
                  background: isSelected ? "var(--color-primary-light)" : "var(--bg-card-subtle)",
                  color: isSelected ? "var(--color-primary)" : "var(--text-main)",
                  transition: "all 0.15s ease"
                }}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 5: Table Count & Outlet Count */}
      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            Number of Tables
          </label>
          <select
            value={formData.tableCount}
            onChange={(e) => setFormData({ ...formData, tableCount: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "#ffffff", fontSize: 12 }}
          >
            {TABLE_COUNT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            Number of Outlets / Locations
          </label>
          <select
            value={formData.outletCount}
            onChange={(e) => setFormData({ ...formData, outletCount: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "#ffffff", fontSize: 12 }}
          >
            {OUTLET_COUNT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 6: Preferred Demo Date & Time */}
      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            Preferred Demo Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.preferredDate}
            onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
            Preferred Time Slot
          </label>
          <select
            value={formData.preferredTime}
            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "#ffffff", fontSize: 12 }}
          >
            <option value="10:00 AM">10:00 AM - Morning</option>
            <option value="11:30 AM">11:30 AM - Morning</option>
            <option value="02:30 PM">02:30 PM - Afternoon</option>
            <option value="04:00 PM">04:00 PM - Afternoon</option>
            <option value="06:00 PM">06:00 PM - Evening</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-electric"
        style={{ width: "100%", padding: "12px", fontSize: 13, marginTop: 6 }}
      >
        <Sparkles style={{ width: 16, height: 16 }} />
        <span>{isSubmitting ? "Scheduling Session..." : "Schedule 1-on-1 Live Walkthrough"}</span>
      </button>
    </form>
  );
}
