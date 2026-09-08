export const FLAGSHIP_PRODUCTS = [
  {
    id: "qr-ordering",
    slug: "qr-table-ordering",
    name: "SARVIQ QR Table Dining",
    tagline: "Autonomous Dining Room Engine",
    badge: "Flagship FOH",
    description:
      "Eliminate wait times and order friction with instantaneous, high-resolution visual menus in Indian Rupees (₹). Diners scan table-specific QRs, customize items with zero app downloads, and pay via direct UPI.",
    metrics: [
      { label: "Check Size Uplift", value: "+24%", subtext: "via AI modifiers" },
      { label: "Order Concurrency", value: "< 50ms", subtext: "Zero-latency dispatch" },
      { label: "Table Turn Time", value: "-14 mins", subtext: "per seated party" },
    ],
    highlights: [
      "Dynamic high-res visual digital menu with instant dietary filtering (Veg/Non-Veg)",
      "Automated UPI Pay (GooglePay, PhonePe, Paytm) with instant receipt dispatch",
      "Real-time table bill splitting with multi-guest bill addition",
      "Zero hardware lock-in — runs seamlessly on any iOS or Android browser",
    ],
  },
  {
    id: "kds-kitchen",
    slug: "kitchen-display-system",
    name: "SARVIQ Kitchen Display (KDS)",
    tagline: "Zero-Latency Kitchen Queue OS",
    badge: "Flagship BOH",
    description:
      "Paperless, multi-station kitchen coordination with intelligent order routing, color-coded SLA timers, and automated station load balancing across Grill, Bar, Fryer, and Expo stations.",
    metrics: [
      { label: "Paper Ticket Waste", value: "0%", subtext: "100% digital flow" },
      { label: "Prep Time Reduction", value: "32%", subtext: "streamlined queue" },
      { label: "Kitchen Accuracy", value: "99.8%", subtext: "eliminated misfires" },
    ],
    highlights: [
      "Sub-50ms instant ticket arrival from table QR directly to kitchen lines",
      "Dynamic multi-station line splitting (Grill, Bar, Fryer, Dessert, Expo)",
      "Urgency-coded visual SLA timers alert chefs before tickets become late",
      "1-tap bump bar notifying waitstaff and diners the instant dishes are plated",
    ],
  },
];

export const ECOSYSTEM_PRODUCTS = [
  {
    id: "pos-billing",
    title: "SARVIQ Cloud POS Billing",
    desc: "Lightning-fast billing terminal built for high weekend volume. Split bills, custom modifiers & 1-click settlements in ₹.",
    category: "Operations",
    badge: "FOH Engine",
  },
  {
    id: "inventory-raw",
    title: "Real-Time Recipe Inventory",
    desc: "Live recipe-level raw ingredient depletion, low-stock alerts, and 1-click vendor Purchase Order dispatch.",
    category: "Back Office",
    badge: "BOH Control",
  },
  {
    id: "crm-loyalty",
    title: "Guest CRM & WhatsApp Retention",
    desc: "Automated guest profiles, lifetime visit ledgers, and targeted WhatsApp re-engagement campaigns.",
    category: "Growth",
    badge: "Retention Engine",
  },
  {
    id: "ai-copilot",
    title: "SARVIQ Autonomous AI Intelligence",
    desc: "Predictive demand forecasting, dynamic weather-based combo recommendations, and automated menu digitizer.",
    category: "Intelligence",
    badge: "AI Native",
  },
];
