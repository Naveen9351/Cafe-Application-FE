import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Building2,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Check,
  Mail
} from "lucide-react";
import { PRODUCT_INTEREST_OPTIONS } from "../../data/leadOptions";
import { submitLeadRequest } from "../../lib/leadService";

export default function LeadCaptureForm({
  initialInterests = ["qr-ordering", "kds"],
  onSuccess,
  className = ""
}) {
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phone: "",
    city: "",
    restaurantName: "",
    outletType: "Cafe / Coffee Shop",
    interests: initialInterests,
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleInterest = (id) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(id);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((item) => item !== id) };
      } else {
        return { ...prev, interests: [...prev.interests, id] };
      }
    });
  };

  const selectAllInterests = () => {
    setFormData((prev) => ({
      ...prev,
      interests: PRODUCT_INTEREST_OPTIONS.map((o) => o.id)
    }));
  };

  const clearInterests = () => {
    setFormData((prev) => ({
      ...prev,
      interests: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.interests.length === 0) {
      setErrorMessage("Please select at least one module you are interested in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitLeadRequest(formData);
      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage("Failed to submit. Please try again or reach out to support@serviq.in");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-emerald-500 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Thank You, {formData.contactName}!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium m-0">
            We have received your demo request{formData.restaurantName ? ` for ${formData.restaurantName}` : ""}. A dedicated restaurant specialist will connect with you via WhatsApp & Call within 15 minutes.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5 font-medium">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" /> What to expect:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 m-0 p-0">
            <li>A quick 20-minute tailored walkthrough of SERVIQ.</li>
            <li>Customized sample menu configured for your cafe / dining room.</li>
            <li>Live demonstration of QR Table Ordering & Kitchen KDS dispatch.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              contactName: "",
              email: "",
              phone: "",
              city: "",
              restaurantName: "",
              outletType: "Cafe / Coffee Shop",
              interests: ["qr-ordering", "kds"],
              notes: ""
            });
          }}
          className="text-xs text-orange-600 hover:text-orange-700 underline font-bold cursor-pointer bg-transparent border-0"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xl bg-white space-y-4 ${className}`}
    >
      {/* Form Header */}
      <div className="space-y-1 pb-1 border-b border-slate-100">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <Sparkles className="w-3 h-3 text-orange-600" /> Free 20-Minute Live Walkthrough
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">
          Request a Free Restaurant Demo
        </h3>
        <p className="text-xs text-slate-500 font-medium m-0">
          See how SERVIQ streamlines table ordering, speeds up kitchen prep, and boosts check size.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Row 1: Contact Person Name & Phone Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-orange-600" /> Your Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rahul Sharma"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-orange-600" /> Phone / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. +91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Row 2: Work Email & City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Mail className="w-3 h-3 text-orange-600" /> Work Email
          </label>
          <input
            type="email"
            placeholder="e.g. rahul@cafe.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-orange-600" /> City / Location *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Bangalore, Mumbai, Delhi NCR"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Row 3: Restaurant / Brand Name */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-orange-600" /> Restaurant / Cafe / Brand Name
        </label>
        <input
          type="text"
          placeholder="e.g. Urban Artisan Cafe & Roasters"
          value={formData.restaurantName || ""}
          onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Module Interests Checkbox Pills */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-slate-700">
            What modules do you want to explore? *{" "}
            <span className="text-orange-600 font-mono text-[10px]">
              ({formData.interests.length} selected)
            </span>
          </label>
          <div className="flex items-center gap-2 text-[10px]">
            <button
              type="button"
              onClick={selectAllInterests}
              className="text-orange-600 hover:text-orange-700 font-bold cursor-pointer bg-transparent border-0 p-0"
            >
              Select All
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={clearInterests}
              className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer bg-transparent border-0 p-0"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRODUCT_INTEREST_OPTIONS.map((opt) => {
            const isSelected = formData.interests.includes(opt.id);
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => toggleInterest(opt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? "bg-orange-50 border-orange-400 ring-1 ring-orange-200 text-orange-950 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                }`}
              >
                <span className="text-[11px] leading-tight truncate">{opt.name}</span>
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? "bg-orange-600 border-orange-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes / Specific Goals */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Tell us about your restaurant requirements{" "}
          <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="e.g. We want live QR table ordering + Kitchen display screens for our 18-table cafe in Indiranagar."
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none"
        />
      </div>

      {/* Submit CTA Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-lg shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-0"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Scheduling Demo...</span>
          </>
        ) : (
          <>
            <span>Submit Demo Request</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Privacy Guarantee */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>100% Privacy Guaranteed • Direct WhatsApp or Google Meet Walkthrough</span>
      </div>
    </form>
  );
}
