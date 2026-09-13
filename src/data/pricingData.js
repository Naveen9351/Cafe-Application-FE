export const PRICING_TIERS = [
  {
    id: "1month",
    name: "1 Month Starter",
    duration: "1 Month Plan",
    badge: "Flexible Monthly",
    description: "Essential AI digital QR ordering, KDS, POS, and inventory features billed monthly.",
    price: 199,
    originalPrice: 199,
    effectiveMonthly: 199,
    savings: 0,
    savingsText: "Standard Rate",
    periodText: "/ month",
    billingNote: "Billed monthly • Cancel anytime",
    popular: false,
    features: [
      "Dynamic Digital QR Table Menus in ₹",
      "Real-Time 4-Stage Kitchen Display (KDS)",
      "Instant UPI Payments (PhonePe, GPay, Paytm)",
      "Unlimited Dine-In Tables & QR Codes",
      "Live Sales & KOT Order Telemetry",
      "Standard WhatsApp Tech Support",
    ],
    ctaText: "Choose 1 Month @ ₹199",
  },
  {
    id: "6months",
    name: "6 Months Saver",
    duration: "6 Months Plan",
    badge: "Most Popular • Save 16%",
    description: "Great value for growing cafes & QSRs with ~1 Month Free equivalent savings.",
    price: 999,
    originalPrice: 1194,
    effectiveMonthly: 166.5,
    savings: 195,
    savingsText: "Save ₹195 (16% OFF)",
    periodText: "for 6 months",
    billingNote: "₹166/mo effective rate • Free onboarding",
    popular: true,
    features: [
      "Everything in 1-Month Plan, plus:",
      "Effective Rate: ₹166/month only",
      "Save ₹195 compared to monthly plan",
      "Multi-Station KDS Routing (Grill, Bar, Fryer)",
      "Recipe-Level Raw Ingredient Stock Depletion",
      "Automated Vendor PO & Reorder Alerts",
      "Priority 24/7 Phone & WhatsApp Support",
    ],
    ctaText: "Choose 6 Months @ ₹999",
  },
  {
    id: "1year",
    name: "1 Year Ultimate Pro",
    duration: "12 Months (1 Year)",
    badge: "Best Value • 2 Months FREE",
    description: "Maximum savings for serious restaurant operators wanting 1-year price lock.",
    price: 1999,
    originalPrice: 2388,
    effectiveMonthly: 166.5,
    savings: 389,
    savingsText: "Save ₹389 (2 Months FREE)",
    periodText: "for 1 year",
    billingNote: "₹166/mo effective rate • 2 Months FREE",
    popular: false,
    features: [
      "Everything in 6-Month Plan, plus:",
      "Effective Rate: ₹166/month locked for 1 Year",
      "2 Months Entirely FREE vs Monthly",
      "Save ₹389 total annually",
      "Zomato & Swiggy Aggregator Bridge",
      "Multi-Outlet Centralized Menu Hub",
      "Dedicated Technical Account Manager",
    ],
    ctaText: "Choose 1 Year @ ₹1,999",
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
