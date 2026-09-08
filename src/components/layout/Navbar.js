import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  QrCode,
  LayoutGrid,
  ChevronDown,
  Menu as MenuIcon,
  X,
  ArrowRight,
  Layers,
  Sparkles,
  LogIn,
  Store,
  Compass
} from "lucide-react";
import { ECOSYSTEM_PRODUCTS } from "../../data/productsData";
import ServiqLogo from "../brand/ServiqLogo";

export default function Navbar({ onOpenDemoModal }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeDropdowns = () => {
    setProductsDropdownOpen(false);
    setSolutionsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-md shadow-slate-200/50 py-3"
          : "bg-white/80 backdrop-blur-md py-4 sm:py-5 border-b border-slate-100/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={closeDropdowns}
            className="group focus:outline-none hover:opacity-90 transition-opacity"
          >
            <ServiqLogo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Products Mega Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  pathname?.startsWith("/products")
                    ? "text-orange-600 bg-orange-50"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <span>Products</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    productsDropdownOpen ? "rotate-180 text-orange-600" : "text-slate-500"
                  }`}
                />
              </button>

              {/* Products Dropdown Menu */}
              {productsDropdownOpen && (
                <div className="absolute top-full left-0 w-[580px] pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="rounded-2xl p-5 border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <span className="text-xs uppercase tracking-wider font-bold text-orange-600">
                        Primary Flagship Products
                      </span>
                      <Link
                        to="/products"
                        onClick={closeDropdowns}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 group"
                      >
                        All Capabilities <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Primary 2-Card Row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Link
                        to="/products#qr-ordering"
                        onClick={closeDropdowns}
                        className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/80 hover:border-orange-400 hover:bg-orange-100/60 transition-all group block text-left no-underline"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                              QR Table Ordering
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-200 text-orange-800 font-bold">
                              Front-of-House
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed m-0">
                          Photo-rich menus, item customizations, and contactless table checkout.
                        </p>
                      </Link>

                      <Link
                        to="/products#kds"
                        onClick={closeDropdowns}
                        className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-100/60 transition-all group block text-left no-underline"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <LayoutGrid className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              Kitchen Display (KDS)
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 font-bold">
                              Back-of-House
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed m-0">
                          Live station routing, color prep timers, and expo quality control.
                        </p>
                      </Link>
                    </div>

                    {/* Ecosystem Mini Grid */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Complete Restaurant Platform
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {ECOSYSTEM_PRODUCTS.slice(0, 6).map((item) => (
                          <Link
                            key={item.id}
                            to={`/products#${item.id}`}
                            onClick={closeDropdowns}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-colors no-underline"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span className="text-xs font-medium truncate">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsDropdownOpen(true)}
              onMouseLeave={() => setSolutionsDropdownOpen(false)}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  pathname === "/solutions"
                    ? "text-orange-600 bg-orange-50"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    solutionsDropdownOpen ? "rotate-180 text-orange-600" : "text-slate-500"
                  }`}
                />
              </button>

              {solutionsDropdownOpen && (
                <div className="absolute top-full left-0 w-64 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="rounded-2xl p-3 border border-slate-200 shadow-2xl bg-white space-y-1">
                    <Link
                      to="/solutions#restaurants"
                      onClick={closeDropdowns}
                      className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors no-underline"
                    >
                      Full-Service & Dining
                    </Link>
                    <Link
                      to="/solutions#cafes"
                      onClick={closeDropdowns}
                      className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors no-underline"
                    >
                      Cafes & Bakeries
                    </Link>
                    <Link
                      to="/solutions#qsrs"
                      onClick={closeDropdowns}
                      className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors no-underline"
                    >
                      Quick-Service (QSRs)
                    </Link>
                    <Link
                      to="/solutions#cloud-kitchens"
                      onClick={closeDropdowns}
                      className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors no-underline"
                    >
                      Cloud & Ghost Kitchens
                    </Link>
                    <Link
                      to="/solutions#multi-outlet"
                      onClick={closeDropdowns}
                      className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors no-underline"
                    >
                      Multi-Outlet Chains
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Standard Links */}
            <Link
              to="/pricing"
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors no-underline ${
                pathname === "/pricing"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              Pricing
            </Link>

            <Link
              to="/about"
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors no-underline ${
                pathname === "/about"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors no-underline ${
                pathname === "/contact"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              Contact
            </Link>

            <Link
              to="/menu"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 rounded-lg transition-colors no-underline"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Live QR Menu</span>
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all no-underline"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 px-3.5 py-2 rounded-lg bg-orange-50 border border-orange-200/80 hover:bg-orange-100 transition-all no-underline"
            >
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span>Sign Up Free</span>
            </Link>

            {onOpenDemoModal ? (
              <button
                onClick={onOpenDemoModal}
                className="relative group px-4 py-2 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                <span className="flex items-center gap-1.5">
                  Book a Demo
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ) : (
              <Link
                to="/demo"
                className="relative group px-4 py-2 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all no-underline"
              >
                <span className="flex items-center gap-1.5">
                  Book a Demo
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/login"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 no-underline"
            >
              Login
            </Link>
            {onOpenDemoModal ? (
              <button
                onClick={onOpenDemoModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white border-0 cursor-pointer"
              >
                Demo
              </button>
            ) : (
              <Link
                to="/demo"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white no-underline"
              >
                Demo
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-white/98 backdrop-blur-2xl border-b border-slate-200 px-6 py-6 space-y-4 max-h-[calc(100vh-70px)] overflow-y-auto animate-in slide-in-from-top-4 duration-200 shadow-2xl">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600 px-3 py-1">
              Primary Products
            </div>
            <Link
              to="/products#qr-ordering"
              onClick={closeDropdowns}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-50 text-slate-900 font-bold text-sm no-underline"
            >
              <QrCode className="w-4 h-4 text-orange-600" />
              <span>QR Table Ordering</span>
            </Link>
            <Link
              to="/products#kds"
              onClick={closeDropdowns}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 text-slate-900 font-bold text-sm no-underline"
            >
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
              <span>Kitchen Display System (KDS)</span>
            </Link>
            <Link
              to="/menu"
              onClick={closeDropdowns}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-700 bg-emerald-50 text-sm font-semibold no-underline"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Customer QR Menu Demo</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
              Navigation
            </div>
            <Link
              to="/solutions"
              onClick={closeDropdowns}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 font-semibold no-underline"
            >
              Solutions
            </Link>
            <Link
              to="/pricing"
              onClick={closeDropdowns}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 font-semibold no-underline"
            >
              Pricing
            </Link>
            <Link
              to="/about"
              onClick={closeDropdowns}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 font-semibold no-underline"
            >
              About SERVIQ
            </Link>
            <Link
              to="/contact"
              onClick={closeDropdowns}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 font-semibold no-underline"
            >
              Contact & Support
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={closeDropdowns}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-800 border border-slate-200 no-underline"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
            <Link
              to="/register"
              onClick={closeDropdowns}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-orange-500 text-white shadow-md shadow-orange-500/25 no-underline"
            >
              <Store className="w-4 h-4" /> Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
