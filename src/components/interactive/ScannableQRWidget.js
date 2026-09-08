import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Camera,
  ArrowRight
} from "lucide-react";

export default function ScannableQRWidget() {
  const [demoUrl, setDemoUrl] = useState("http://localhost:3000/menu");
  const [qrCodeSrc, setQrCodeSrc] = useState(
    "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=https://serviq.in/menu&color=0f172a&bgcolor=ffffff&margin=1"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/menu`;
      setDemoUrl(url);
      setQrCodeSrc(
        `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
          url
        )}&color=0f172a&bgcolor=ffffff&margin=1`
      );
    }
  }, []);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Value & Guidance */}
        <div className="md:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <Sparkles className="w-3 h-3 text-orange-600" /> Live Interactive Mobile Experience
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight m-0">
            Test the Guest QR Menu on Your Own Smartphone Right Now
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0">
            Open your smartphone camera, point it at the QR code on the right, and experience the photo menu, modifiers, and 1-tap table checkout live in your hand.
          </p>

          <div className="space-y-2.5 text-xs text-slate-700 font-semibold pt-1">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero app download required (loads instantly in mobile Safari & Chrome)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>High-resolution dish photos with customizable modifier sides in Indian Rupees (₹)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Table #14 automatically tied to orders</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to="/menu"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold transition-colors no-underline"
            >
              <span>Open Mobile Web Menu Directly</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Side: High-Definition Scannable QR Card */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-56 p-4 rounded-3xl bg-white text-slate-900 text-center shadow-xl shadow-slate-300/40 space-y-3 border-2 border-slate-900 ring-4 ring-orange-500/10">
            <div className="space-y-0.5">
              <div className="text-[9px] font-black tracking-widest uppercase text-orange-600">
                SERVIQ CAFE & BISTRO
              </div>
              <div className="text-sm font-black text-slate-950">TABLE #14</div>
            </div>

            {/* 100% Camera Decodable Real QR Image */}
            <div className="relative w-36 h-36 mx-auto bg-white p-1.5 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden group shadow-inner">
              <img
                src={qrCodeSrc}
                alt="Scan to test live SERVIQ guest menu"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
                <Camera className="w-3.5 h-3.5 text-orange-600" />
                <span>Scan with Camera</span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium m-0">Opens live guest menu on your phone</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
