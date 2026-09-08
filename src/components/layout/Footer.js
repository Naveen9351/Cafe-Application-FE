import React from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  LayoutGrid,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  Lock,
  Compass
} from "lucide-react";
import ServiqLogo from "../brand/ServiqLogo";

export default function Footer({ onOpenDemoModal }) {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group focus:outline-none no-underline">
              <ServiqLogo size="lg" theme="dark" />
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed m-0">
              SERVIQ is the modern restaurant technology platform uniting guest QR Table Ordering, real-time Kitchen Display Systems (KDS), POS billing, live inventory, and AI forecasting into one connected console.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>support@serviq.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>+91 96801 32562 (Direct / WhatsApp Support)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>Bangalore • Mumbai • Delhi NCR • Global Cloud</span>
              </div>
            </div>
          </div>

          {/* Col 2: Core Products */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Core Products
            </h4>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link
                  to="/products#qr-ordering"
                  className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1.5 no-underline"
                >
                  <QrCode className="w-3 h-3 text-orange-400" />
                  <span>QR Table Ordering</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/products#kds"
                  className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 no-underline"
                >
                  <LayoutGrid className="w-3 h-3 text-emerald-400" />
                  <span>Kitchen Display (KDS)</span>
                </Link>
              </li>
              <li>
                <Link to="/products#pos" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Point of Sale (POS)
                </Link>
              </li>
              <li>
                <Link to="/products#digital-menu" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Digital Menu Management
                </Link>
              </li>
              <li>
                <Link to="/products#table-management" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Table & Floor Tracking
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1.5 no-underline">
                  <Compass className="w-3 h-3" />
                  <span>Customer QR Menu Demo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Restaurant Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/solutions#restaurants" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Full-Service & Casual Dining
                </Link>
              </li>
              <li>
                <Link to="/solutions#cafes" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Cafes & Bakeries
                </Link>
              </li>
              <li>
                <Link to="/solutions#qsrs" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Quick-Service (QSRs)
                </Link>
              </li>
              <li>
                <Link to="/solutions#cloud-kitchens" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Cloud & Ghost Kitchens
                </Link>
              </li>
              <li>
                <Link to="/solutions#multi-outlet" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Multi-Outlet Restaurant Groups
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Transparent INR Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Portals & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Access & Portals
            </h4>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/login" className="text-slate-300 hover:text-orange-400 font-bold transition-colors no-underline">
                  → Restaurant Admin Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-300 hover:text-orange-400 font-bold transition-colors no-underline">
                  → Start 14-Day Free Trial
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors no-underline">
                  About SERVIQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors no-underline">
                  Contact Hospitality Team
                </Link>
              </li>
              <li>
                {onOpenDemoModal ? (
                  <button
                    onClick={onOpenDemoModal}
                    className="text-orange-400 hover:text-orange-300 font-bold bg-transparent border-0 p-0 text-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>Request a Demo Walkthrough</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <Link to="/demo" className="text-orange-400 hover:text-orange-300 font-bold transition-colors no-underline">
                    Request a Demo Walkthrough
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} SERVIQ Restaurant OS. All rights reserved.
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <span>Engineered for Indian Hospitality</span>
            <span>•</span>
            <Link to="/login" className="text-slate-500 hover:text-slate-400 no-underline">
              Portal Access
            </Link>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
