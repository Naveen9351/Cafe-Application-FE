/**
 * DINEVIQ CAFE OS — Module & Feature Allocation Matrix Pricing Data
 * Based on Dineviq_Subscription_Plans_and_Modules.pdf
 * Starter (₹499) • Growth (₹799) • Pro (₹999) • Custom
 */

export const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter Plan",
    duration: "Monthly",
    badge: "Essential Counter Billing",
    description: "Fast counter billing, walk-in orders, complete dish catalog and essential revenue tracking.",
    price: 499,
    originalPrice: 499,
    effectiveMonthly: 499,
    savings: 0,
    savingsText: "Standard Rate",
    periodText: "/ month",
    billingNote: "Billed monthly • Cancel anytime",
    popular: false,
    features: [
      "1. POS Terminal (Counter walk-in & Cash/UPI)",
      "2. Menu Management (Dishes, categories, in-stock)",
      "3. Orders Management (History, filters, reprints)",
      "4. Basic Dashboard (Daily sales & bill count)",
      "5. Settings & Branding (Logo, GST %, sound chime)",
      "Instant Direct UPI & Cash Settlements",
      "Standard Technical Support",
    ],
    ctaText: "Choose Starter @ ₹499/mo",
  },
  {
    id: "growth",
    name: "Growth Plan",
    duration: "Monthly",
    badge: "★ Most Popular for Cafes",
    description: "Full table-to-kitchen dining lifecycle, customer udhari khata ledger, and sales velocity analysis.",
    price: 799,
    originalPrice: 999,
    effectiveMonthly: 799,
    savings: 200,
    savingsText: "Save ₹200/mo",
    periodText: "/ month",
    billingNote: "Everything in Starter + Table Suite & Khata",
    popular: true,
    features: [
      "Everything in Starter Plan, plus:",
      "6. Dynamic Table QR Codes (Self-ordering mobile cart)",
      "7. Live Orders & Kitchen Display Screen (KDS)",
      "8. Temporary Tables & Floating Open Tabs (e.g. Deepak)",
      "9. Multi-Floor & Seating Layout Manager",
      "10. Khata Ledger (Customer udhari & credit limits)",
      "11. Item Summary Reports (Dish sales velocity)",
    ],
    ctaText: "Choose Growth @ ₹799/mo",
  },
  {
    id: "pro",
    name: "Pro Plan",
    duration: "Monthly",
    badge: "■ Ultimate All-Inclusive Suite",
    description: "Complete Dineviq OS with WhatsApp automation, CRM loyalty, Excel exports, staff RBAC & AI Copilot.",
    price: 999,
    originalPrice: 1299,
    effectiveMonthly: 999,
    savings: 300,
    savingsText: "Save ₹300/mo",
    periodText: "/ month",
    billingNote: "All 16 Modules Unlocked • Full Access",
    popular: false,
    features: [
      "Everything in Growth Plan, plus:",
      "12. Automated WhatsApp Suite (E-Bills & marketing)",
      "13. Customer CRM & Loyalty (Lifetime spend & visits)",
      "14. Comprehensive Reports Suite (.xlsx Excel export)",
      "15. Staff Management & Roles (PIN security, RBAC)",
      "16. AI Copilot & Insights (Predictions & AI assistant)",
      "Priority 24/7 Phone & WhatsApp VIP Support",
    ],
    ctaText: "Choose Pro @ ₹999/mo",
  },
];

export const PRICING_COMPARISON_CATEGORIES = [
  {
    category: "1. Core POS & Operations (Base Modules)",
    items: [
      { name: "1. POS Terminal (Counter billing, Cash/UPI settlement)", starter: true, growth: true, enterprise: true, custom: "Base" },
      { name: "2. Menu Management (Dishes, categories, in-stock toggle)", starter: true, growth: true, enterprise: true, custom: "Base" },
      { name: "3. Orders Management (History, filters, reprints)", starter: true, growth: true, enterprise: true, custom: "Base" },
      { name: "4. Basic Dashboard (Daily sales & bill telemetry)", starter: true, growth: true, enterprise: true, custom: "Base" },
      { name: "5. Settings & Branding (Name, logo, GST %, UPI QR)", starter: true, growth: true, enterprise: true, custom: "Base" },
    ]
  },
  {
    category: "2. Dining & Table Suite (Coupled Lifecycle)",
    items: [
      { name: "6. Table QR Codes (Dynamic self-ordering cart)", starter: false, growth: true, enterprise: true, custom: "+Table Suite" },
      { name: "7. Live Orders / KDS (Prep timer, kitchen status)", starter: false, growth: true, enterprise: true, custom: "+Table Suite" },
      { name: "8. Temporary Tables (Floating open tabs e.g. Deepak)", starter: false, growth: true, enterprise: true, custom: "+Table Suite" },
      { name: "9. Floor & Seating Layout (Indoor, Rooftop, Garden)", starter: false, growth: true, enterprise: true, custom: "+Table Suite" },
    ]
  },
  {
    category: "3. Credit Ledger & Item Velocity Reports",
    items: [
      { name: "10. Khata Ledger (Customer udhari & credit limits)", starter: false, growth: true, enterprise: true, custom: "+₹149/mo" },
      { name: "11. Item Summary Reports (Dish sales velocity analysis)", starter: false, growth: true, enterprise: true, custom: "+₹149/mo" },
    ]
  },
  {
    category: "4. Advanced Automation, Staff & AI Copilot",
    items: [
      { name: "12. Automated WhatsApp Suite (E-Bills & broadcasts)", starter: false, growth: false, enterprise: true, custom: "+₹249/mo" },
      { name: "13. Customer CRM & Loyalty (Lifetime metrics, AOV)", starter: false, growth: false, enterprise: true, custom: "+₹199/mo" },
      { name: "14. Reports Suite (.xlsx Excel export & deep splits)", starter: false, growth: false, enterprise: true, custom: "+₹149/mo" },
      { name: "15. Staff Management & Roles (PIN security, RBAC)", starter: false, growth: false, enterprise: true, custom: "+₹149/mo" },
      { name: "16. AI Copilot & Insights (Predictions & smart advice)", starter: false, growth: false, enterprise: true, custom: "+₹199/mo" },
    ]
  }
];
