import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  BookOpen,
  Grid,
  ListOrdered,
  BarChart3,
  Boxes,
  HeartHandshake,
  Banknote,
  Building,
  Layers,
  ArrowRight,
  CheckCircle2,
  Utensils,
  ChefHat,
  TrendingUp,
  Sparkles
} from "lucide-react";

export default function EcosystemSection() {
  const [activeCategory, setActiveCategory] = useState("foh");

  const pillars = {
    foh: {
      id: "foh",
      title: "Front-of-House & Guest Experience",
      badge: "Dine-In Operations",
      icon: Utensils,
      color: "text-orange-600",
      bg: "bg-orange-100",
      border: "border-orange-200",
      modules: [
        {
          name: "Point of Sale (POS)",
          tagline: "Speedy Counter & Table Billing",
          desc: "Touchscreen terminal with table bill splitting, interactive floorplan maps, and smooth shift handoffs in ₹.",
          icon: CreditCard,
          features: ["Table & Seat Splitting", "Staff PIN Access", "Cash Drawer & Terminal Sync"]
        },
        {
          name: "Digital Menu Management",
          tagline: "Instant Catalog Control",
          desc: "Update prices, add seasonal dishes, upload photos, and manage dietary badges across all dining room tables in seconds.",
          icon: BookOpen,
          features: ["1-Tap 86 Item Sold-Out", "Scheduled Dayparts (Lunch/Dinner)", "Dietary & Allergen Tags"]
        },
        {
          name: "Table & Floorplan Management",
          tagline: "Live Seating & Section Map",
          desc: "Keep hosts and servers in sync with live table occupancy, seated duration timers, and balanced server section assignments.",
          icon: Grid,
          features: ["Visual Floorplan Map", "Seated Duration Timers", "Section Staff Assignment"]
        },
        {
          name: "Contactless Payments & Tabs",
          tagline: "Instant Mobile Checkout",
          desc: "Let guests settle their check smoothly at the table via UPI, Cards, or digital tabs without waiting.",
          icon: Banknote,
          features: ["Instant Pay-at-Table", "Digital WhatsApp/SMS Receipts", "Split Check by Dish"]
        }
      ]
    },
    boh: {
      id: "boh",
      title: "Back-of-House & Kitchen Line",
      badge: "Culinary Orchestration",
      icon: ChefHat,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
      modules: [
        {
          name: "Live Order Hub",
          tagline: "Central Multi-Channel Dispatch",
          desc: "Bring dine-in, takeaway, and direct online orders into one unified live screen. Zero juggling separate tablets.",
          icon: ListOrdered,
          features: ["Single Screen for All Channels", "Clear Order Timeline", "Customer SMS Pickup Alerts"]
        },
        {
          name: "Inventory & Recipe Depletion",
          tagline: "Live Ingredient Depletion",
          desc: "Connect menu sales directly to ingredient usage. Get low-stock alerts before key ingredients run out during peak rushes.",
          icon: Boxes,
          features: ["Automated Recipe Depletion", "Low-Stock Reorder Alerts", "Ingredient Margin Visibility in ₹"]
        }
      ]
    },
    growth: {
      id: "growth",
      title: "Growth, Analytics & Multi-Unit",
      badge: "Business Intelligence",
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      border: "border-indigo-200",
      modules: [
        {
          name: "Sales & Speed Intelligence",
          tagline: "Actionable Revenue Reports",
          desc: "Intuitive dashboards showing top-grossing dishes, busiest peak dining hours, average check size trends in ₹, and kitchen prep times.",
          icon: BarChart3,
          features: ["Daily Net Sales & Trends (₹)", "Dish Profitability Matrix", "Kitchen Prep SLA Benchmarks"]
        },
        {
          name: "Guest Loyalty & CRM Engine",
          tagline: "Automated Diner Retention",
          desc: "Turn first-time guests into regular diners with visit frequency tracking, points per ₹100 spent, and birthday treats.",
          icon: HeartHandshake,
          features: ["Visit Frequency Tracking", "Automated Retention Perks", "Zero-Spam Guest Privacy"]
        },
        {
          name: "Multi-Outlet Cloud Console",
          tagline: "Franchise & Chain Command",
          desc: "Centralize master menus, compare branch performance, and push regional seasonal promotions across 2 to 50+ locations in 1 click.",
          icon: Building,
          features: ["Central Master Menu Push", "Multi-Branch Benchmarking", "Role-Based Regional Permissions"]
        }
      ]
    }
  };

  const currentPillar = pillars[activeCategory];

  return (
    <section id="ecosystem" className="py-16 relative bg-white border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Layers className="w-3 h-3 text-indigo-600" /> One Unified Platform
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight m-0">
            The Complete SERVIQ Restaurant Operating System
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0">
            Beyond QR table ordering and kitchen display screens, SERVIQ connects your entire front-of-house, kitchen line, and multi-unit cloud into one cohesive ecosystem.
          </p>
        </div>

        {/* 3 Master Operational Category Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setActiveCategory("foh")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCategory === "foh"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>1. Front-of-House (Guests & POS)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("boh")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCategory === "boh"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>2. Back-of-House (Kitchen & Orders)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("growth")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCategory === "growth"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>3. Growth & Multi-Unit (Chain Cloud)</span>
            </button>
          </div>
        </div>

        {/* Active Category Header Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${currentPillar.bg} ${currentPillar.color} flex items-center justify-center font-bold`}>
              <currentPillar.icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 m-0">
                {currentPillar.title}
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">{currentPillar.badge}</span>
            </div>
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-slate-700 hover:text-orange-600 flex items-center gap-1 no-underline"
          >
            <span>View All Modules</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Cards Grid for Active Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
          {currentPillar.modules.map((mod, idx) => {
            const Icon = mod.icon;

            return (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-bold">
                      Connected Module
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors m-0">
                      {mod.name}
                    </h4>
                    <p className="text-[11px] font-bold text-orange-600 m-0">{mod.tagline}</p>
                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px] font-medium pt-1 m-0">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {mod.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Native Cloud Sync</span>
                  <Link
                    to="/products"
                    className="text-xs font-bold text-slate-800 hover:text-orange-600 flex items-center gap-1 no-underline"
                  >
                    <span>Specs</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
