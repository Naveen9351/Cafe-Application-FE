export const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Essential digital ordering for cafes & single-location dining spots",
    priceMonthly: 1999,
    priceAnnual: 1499,
    billingPeriod: "per month, billed annually",
    description: "Launch frictionless table QR ordering and upgrade from paper menus in under 24 hours.",
    highlights: [
      "Dynamic Table QR Code Generator",
      "Photo-Rich Digital Menu with Modifiers",
      "Unlimited Menu Items & Categories",
      "Order Management Dashboard",
      "Pay-at-Table & Digital Receipts",
      "Dedicated Onboarding & Live Chat Support"
    ],
    features: [
      "Table QR Ordering (Unlimited scans)",
      "Instant 86 Item Availability Toggle",
      "Modifiers, Add-ons & Allergen Badges",
      "Daily Sales & Order Volume Reports",
      "Single Terminal / Tablet Access",
      "Thermal Receipt & Order Printing"
    ],
    ctaText: "Get Started Free",
    ctaVariant: "outline"
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Connected QR ordering + Kitchen Display System for busy dining rooms",
    badge: "MOST POPULAR",
    popular: true,
    priceMonthly: 3999,
    priceAnnual: 2999,
    billingPeriod: "per month, billed annually",
    description: "Connect front-of-house guest ordering directly with real-time back-of-house kitchen display stations.",
    highlights: [
      "Everything in Starter, plus:",
      "Full Kitchen Display System (KDS)",
      "Multi-Station Routing (Grill, Bar, Expo)",
      "Visual SLA Timers & Sound Alerts",
      "Floorplan & Table Occupancy Map",
      "Direct Online Ordering Web Storefront (0% fee)",
      "Priority 24/7 Phone & WhatsApp Support"
    ],
    features: [
      "Up to 4 Concurrent KDS Station Screens",
      "Course Pacing & Hold Firing Control",
      "Automated SMS Customer Pickup Notifications",
      "Item-Level Margin & Hourly Sales Reports",
      "Staff Role Permissions & PIN Access",
      "Front Counter POS Compatibility"
    ],
    ctaText: "Book a Free Demo",
    ctaVariant: "primary"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Full-scale platform for high-volume venues, franchises & multi-unit chains",
    priceMonthly: 7999,
    priceAnnual: 5999,
    billingPeriod: "per location/month, billed annually",
    description: "Complete connected restaurant operating system with multi-outlet cloud, inventory, CRM, and custom integrations.",
    highlights: [
      "Everything in Growth, plus:",
      "Multi-Location Central Management Console",
      "Unlimited KDS Screens & Kitchen Stations",
      "Live Inventory & Recipe Tracking",
      "Automated Guest Loyalty & Rewards",
      "Custom Hardware & POS Integration Support",
      "Dedicated Hospitality Specialist & Onboarding"
    ],
    features: [
      "Centralized Master Menu Publishing",
      "Chain-wide Benchmarking & Consolidated Reports",
      "Seamless Existing POS Compatibility",
      "Custom Hardware & Bump Bar Configuration",
      "99.99% Cloud Reliability Guarantee",
      "Staff Training & On-Site Setup Assistance"
    ],
    ctaText: "Talk to Restaurant Sales",
    ctaVariant: "default"
  }
];

export const PRICING_COMPARISON_CATEGORIES = [
  {
    category: "Ordering & Front-of-House",
    items: [
      { name: "Table-Specific QR Stand Generator", starter: true, growth: true, enterprise: true },
      { name: "Photo-Rich Digital Menu with Modifiers", starter: true, growth: true, enterprise: true },
      { name: "Instant 86-Item Sold Out Toggle", starter: true, growth: true, enterprise: true },
      { name: "Pay-at-Table & Digital Receipts", starter: true, growth: true, enterprise: true },
      { name: "Direct Online Ordering Storefront (0% fee)", starter: false, growth: true, enterprise: true }
    ]
  },
  {
    category: "Kitchen & Back-of-House (KDS)",
    items: [
      { name: "Digital Kitchen Display System (KDS)", starter: false, growth: true, enterprise: true },
      { name: "Multi-Station Splitting (Grill, Bar, Fryer)", starter: false, growth: true, enterprise: true },
      { name: "Color-Coded SLA Countdown Timers", starter: false, growth: true, enterprise: true },
      { name: "Expo Pass Screen (Quality Control)", starter: false, growth: true, enterprise: true },
      { name: "Concurrent KDS Stations", starter: "1 Station", growth: "Up to 4 Screens", enterprise: "Unlimited" }
    ]
  },
  {
    category: "Management & Growth",
    items: [
      { name: "Floorplan & Seating Management", starter: false, growth: true, enterprise: true },
      { name: "Sales & Hourly Velocity Reporting", starter: true, growth: true, enterprise: true },
      { name: "Ingredient & Recipe Depletion", starter: false, growth: false, enterprise: true },
      { name: "Guest Loyalty & CRM Engine", starter: false, growth: false, enterprise: true },
      { name: "Multi-Outlet Central Management", starter: false, growth: false, enterprise: true },
      { name: "24/7 Dedicated Support", starter: "Live Chat", growth: "Priority Phone", enterprise: "Dedicated Specialist" }
    ]
  }
];
