export const FLAGSHIP_PRODUCTS = [
  {
    id: "qr-ordering",
    slug: "qr-table-ordering",
    name: "DINEVIQ QR Table Dining",
    tagline: "Autonomous Dining Room Engine",
    badge: "Flagship FOH",
    category: "Ordering & Dining",
    description:
      "Eliminate wait times and order friction with instantaneous, photo-rich visual menus in Indian Rupees (₹). Diners scan table-specific QRs, customize dishes with zero app downloads, and pay via direct UPI.",
    metrics: [
      { label: "Check Size Uplift", value: "+24%", subtext: "via AI modifiers" },
      { label: "Order Concurrency", value: "< 50ms", subtext: "Zero-latency dispatch" },
      { label: "Table Turn Time", value: "-14 mins", subtext: "per seated party" },
    ],
    highlights: [
      "Dynamic high-res visual digital menu with instant dietary filtering (Veg/Non-Veg/Jain)",
      "Automated UPI Pay (GooglePay, PhonePe, Paytm) with instant receipt dispatch to WhatsApp",
      "Real-time table bill splitting with multi-guest bill addition",
      "Zero hardware lock-in — runs seamlessly on any iOS or Android mobile browser",
      "1-tap instant 86 item out-of-stock toggle across all active tables",
    ],
    features: [
      { title: "Table-Specific QR Encryptions", desc: "Tamper-proof dynamic QR codes tied uniquely to physical table numbers." },
      { title: "Visual AI Modifier Upsells", desc: "Automated sauce pairings, beverage add-ons, and steak temperature selectors." },
      { title: "Seamless Split Tab", desc: "Guests can split by seat or pay for individual dishes directly." },
      { title: "Zero App Download", desc: "Native fast-rendering Safari and Chrome progressive web experience." },
    ]
  },
  {
    id: "kds-kitchen",
    slug: "kitchen-display-system",
    name: "DINEVIQ Kitchen Display (KDS)",
    tagline: "Zero-Latency Kitchen Queue OS",
    badge: "Flagship BOH",
    category: "Kitchen Operations",
    description:
      "Paperless, multi-station kitchen coordination with intelligent order routing, color-coded SLA timers, and automated station load balancing across Grill, Bar, Fryer, Cold Prep, and Expo stations.",
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
      "Multi-course pacing controls to hold entrees until appetizers are cleared",
    ],
    features: [
      { title: "Smart Line Routing", desc: "Automatically splits drinks to Bar and entrees to Grill stations." },
      { title: "Color-Coded SLA Timers", desc: "Green (On Track), Amber (Approaching), and Red (Late Alert) timers." },
      { title: "Expo Pass Screen", desc: "Table-level pass consolidation ensures entire parties are served together." },
      { title: "Hardware Universal", desc: "Works on commercial kitchen touchscreens, Android tablets, or iPads." },
    ]
  },
];

export const ECOSYSTEM_PRODUCTS = [
  {
    id: "pos-billing",
    slug: "pos-billing",
    title: "DINEVIQ Cloud POS & Billing",
    desc: "Lightning-fast billing terminal built for peak weekend volume. Split bills, table floorplan maps, thermal printer sync & 1-click settlements in ₹.",
    category: "Front-of-House",
    badge: "FOH Engine",
    icon: "CreditCard",
    metrics: { label: "Checkout Speed", value: "2.4 sec" },
    features: [
      "Visual floorplan layout with live occupied, dining, and busing states",
      "Staff PIN access with role-based cashier, manager, and captain permissions",
      "EDC credit card machine integration and 2-inch / 3-inch thermal printer ESC/POS sync",
      "Automatic CGST, SGST, VAT, and service charge computations",
    ]
  },
  {
    id: "inventory-raw",
    slug: "inventory",
    title: "Real-Time Recipe Inventory & Wastage",
    desc: "Live Bill of Materials (BOM) recipe-level ingredient depletion, low-stock reorder alerts, and 1-click vendor Purchase Order dispatch.",
    category: "Back-of-House",
    badge: "BOH Control",
    icon: "Boxes",
    metrics: { label: "Food Waste Reduction", value: "-18%" },
    features: [
      "Automatic deduction of buns, cheese, meat, and dairy every time an order is fired",
      "Real-time low-stock SMS and WhatsApp alerts to kitchen managers",
      "Daily wastage logging with reason categorization and financial variance audits",
      "Automated vendor Purchase Orders based on dynamic PAR level thresholds",
    ]
  },
  {
    id: "crm-loyalty",
    slug: "crm-loyalty",
    title: "Guest CRM & WhatsApp Retention",
    desc: "Automated guest profiles, lifetime visit ledgers, digital bills on WhatsApp, and targeted re-engagement campaigns that turn diners into regulars.",
    category: "Growth & Retention",
    badge: "Retention Engine",
    icon: "HeartHandshake",
    metrics: { label: "Repeat Dine-In Lift", value: "+34%" },
    features: [
      "Zero-friction phone-number capture via UPI checkout or digital bill request",
      "Automatic guest visit logs, favourite dishes, and average ticket spending",
      "Automated birthday, anniversary, and win-back WhatsApp marketing sequences",
      "Customizable cash-back and point-based loyalty rewards with 0 app installs",
    ]
  },
  {
    id: "ai-copilot",
    slug: "ai-copilot",
    title: "Autonomous AI Intelligence & Telemetry",
    desc: "Predictive hourly dining velocity forecasting, weather-based prep recommendations, automated menu digitizer, and profit margin optimizations.",
    category: "Autonomous AI",
    badge: "AI Native",
    icon: "Sparkles",
    metrics: { label: "Forecast Accuracy", value: "94.2%" },
    features: [
      "Real-time dining room velocity telemetry monitoring peak rush hours",
      "Automated menu digitizer: photograph any paper menu and generate a full visual catalog in 3 minutes",
      "Dish profitability matrix ranking high-margin stars vs low-margin items",
      "AI-driven modifier upselling engine automatically testing highest-converting pairings",
    ]
  },
  {
    id: "floorplan-management",
    slug: "table-management",
    title: "Table & Floorplan Engine",
    desc: "Interactive visual dining room layout with seated duration timers, server section assignments, and live table occupancy radar.",
    category: "Front-of-House",
    badge: "FOH Coordination",
    icon: "Grid",
    metrics: { label: "Table Idle Lag", value: "0 mins" },
    features: [
      "Drag-and-drop floorplan designer for indoor, patio, rooftop, and bar zones",
      "Seated duration stopwatches alerting staff to lingering check settlements",
      "Even server section load balancing preventing waitstaff overload",
      "Instant table merge, split, and transfer with zero phantom orders",
    ]
  },
  {
    id: "multi-outlet",
    slug: "solutions",
    title: "Multi-Outlet & Franchise Menu Hub",
    desc: "Centralized multi-location control room with global menu updates, localized tax/pricing tiers, and unified executive business intelligence.",
    category: "Enterprise Scale",
    badge: "Franchise Scale",
    icon: "Building",
    metrics: { label: "Menu Sync Speed", value: "Instant" },
    features: [
      "1-click global menu updates across 5 to 500+ franchise stores",
      "Franchise revenue audit ledgers and automated royalty fee computations",
      "Centralized raw material supplier procurement contracts and PO dispatch",
      "Role-based corporate, regional, and store-level security permissions",
    ]
  }
];

export const ALL_PRODUCTS = [...FLAGSHIP_PRODUCTS, ...ECOSYSTEM_PRODUCTS];
