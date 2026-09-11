export const PRICING_TIERS = [
  {
    id: "starter",
    name: "SERVIQ Starter",
    badge: "For Single Outlets",
    description: "Essential AI digital ordering and kitchen queue for fast-paced cafes and QSR counters.",
    priceMonthly: 1499,
    priceAnnual: 1199,
    popular: false,
    features: [
      "Dynamic Digital QR Table Menus in ₹",
      "Real-Time 4-Stage Kitchen Display (KDS)",
      "Instant UPI Payments (PhonePe, GPay, Paytm)",
      "Up to 10 Active Dine-In Tables",
      "Basic Sales & Orders Telemetry",
      "Standard WhatsApp Support",
    ],
    ctaText: "Launch Free Trial",
  },
  {
    id: "growth",
    name: "SERVIQ Growth Pro",
    badge: "Most Popular",
    description: "Complete autonomous restaurant OS with multi-station line splitting and recipe inventory.",
    priceMonthly: 2999,
    priceAnnual: 2399,
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "Unlimited Tables & QR Generation",
      "Multi-Station KDS Routing (Grill, Bar, Fryer, Expo)",
      "Recipe-Level Raw Ingredient Stock Depletion",
      "Automated PO Generation & Vendor WhatsApp Alerts",
      "Split Billing & Custom Course Pacing",
      "Priority 24/7 Phone & WhatsApp Support",
    ],
    ctaText: "Start 14-Day Free Trial",
  },
  {
    id: "enterprise",
    name: "SERVIQ Enterprise Multi-Chain",
    badge: "For Franchises & Chains",
    description: "Global franchise governance, central menu deployment, and multi-location BI analytics.",
    priceMonthly: 5999,
    priceAnnual: 4799,
    popular: false,
    features: [
      "Everything in Growth Pro, plus:",
      "Multi-Outlet Centralized Menu Hub",
      "Aggregator Bridge (Zomato & Swiggy Sync)",
      "Franchise Royalty & Audit Ledgers",
      "Predictive AI Demand Forecasting",
      "Custom Hardware Integrations & SSO",
      "Dedicated Technical Account Manager",
    ],
    ctaText: "Contact Enterprise Sales",
  },
];

export const PRICING_COMPARISON_CATEGORIES = [
  {
    category: "Ordering & Dining Front-End",
    items: [
      { name: "Dynamic QR Table Ordering in ₹", starter: true, growth: true, enterprise: true },
      { name: "Instant UPI Payments (PhonePe, GPay, Paytm)", starter: true, growth: true, enterprise: true },
      { name: "Split Billing & Course Ordering", starter: false, growth: true, enterprise: true },
      { name: "Table Capacities & Active QR Limits", starter: "Up to 10 Tables", growth: "Unlimited", enterprise: "Unlimited" },
      { name: "Custom Brand Watermark & Domain", starter: false, growth: true, enterprise: true },
    ]
  },
  {
    category: "Kitchen Display System (KDS)",
    items: [
      { name: "Real-time Order State Transition (4-Stage)", starter: true, growth: true, enterprise: true },
      { name: "Audio Alerts & Chime Notifications", starter: true, growth: true, enterprise: true },
      { name: "Multi-Station Kitchen Routing (Grill, Bar, Fryer)", starter: false, growth: true, enterprise: true },
      { name: "Kitchen SLA Telemetry & Prep Delay Alarms", starter: false, growth: true, enterprise: true },
    ]
  },
  {
    category: "Inventory & Recipe Automation",
    items: [
      { name: "Item-level Stock Count Tracking", starter: true, growth: true, enterprise: true },
      { name: "Recipe BOM (Bill of Materials) Depletion", starter: false, growth: true, enterprise: true },
      { name: "Automated Reorder Alerts via WhatsApp", starter: false, growth: true, enterprise: true },
      { name: "Vendor Purchase Order (PO) Management", starter: false, growth: true, enterprise: true },
    ]
  },
  {
    category: "Intelligence, Scale & Governance",
    items: [
      { name: "Real-Time Revenue & KOT Analytics", starter: "Standard", growth: "Advanced Real-Time", enterprise: "Predictive BI" },
      { name: "Multi-Outlet Centralized Menu Hub", starter: false, growth: false, enterprise: true },
      { name: "Zomato & Swiggy Aggregator Bridge", starter: false, growth: false, enterprise: true },
      { name: "Dedicated 24/7 SLA & Tech Support", starter: "Community/Email", growth: "Priority WhatsApp", enterprise: "Dedicated TAM + Phone" },
    ]
  }
];
