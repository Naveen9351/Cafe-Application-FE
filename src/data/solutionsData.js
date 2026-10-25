export const SOLUTIONS = [
  {
    id: "cafe",
    slug: "cafes-coffee-bars",
    name: "Cafes & Coffee Bars",
    tagline: "High-Concurrency Barista Queues & Zero Friction Table Ordering",
    badge: "Specialty & Artisan",
    heroImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { value: "0 mins", label: "Queue Abandonment" },
      { value: "+24%", label: "Bakery & Food Upsells" },
      { value: "< 90s", label: "Barista Ticket Speed" },
    ],
    summary:
      "Transform cramped morning counter queues into relaxed seated experiences. Diners order custom brews and pastries directly from their table QR with instant UPI checkout.",
    challenges: [
      "Long morning counter lines causing rushed customers to abandon and walk away",
      "Complex dairy, milk alternative (Oat/Almond), syrup, and roast modifications confusing counter cashiers",
      "Paper tickets getting stained or lost next to high-steam espresso machines",
      "Lack of simple loyalty tools to recognize and reward daily coffee regulars",
    ],
    solutions: [
      "Table and counter QR codes allow guests to seat themselves and customize complex coffee orders in seconds",
      "High-contrast Barista Station KDS highlights milk types (Oat, Soy, Almond) with color-coded badges",
      "Instant order-ready pickup screen and WhatsApp chime when drinks are finished on the counter",
      "Automated phone-number loyalty accrues points seamlessly with zero physical punch cards",
    ],
    features: [
      "Visual custom milk, roast & syrup modifier selectors",
      "Dedicated barista station KDS with rush SLA countdowns",
      "Recipe-level bean, dairy, and syrup stock depletion",
      "Takeaway token calling screen with WhatsApp pickup alerts",
    ],
    bestFor: "Specialty coffee roasters, artisanal bakeries, tea salons, and high-frequency breakfast cafes."
  },
  {
    id: "qsr",
    slug: "quick-service-fast-food",
    name: "QSR & Quick-Service Food",
    tagline: "Ultra-Fast Ordering Velocity, 45-Second Kitchen Throughput & Zero Lines",
    badge: "High Throughput",
    heroImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { value: "-45%", label: "Kitchen Ticket Delays" },
      { value: "+22%", label: "Combo Upgrades" },
      { value: "100%", label: "Paperless Slips" },
    ],
    summary:
      "Turn counter bottlenecks into an autonomous high-speed pipeline. Customers scan table or counter QRs, orders dispatch to kitchen lines in under 50ms, and tickets route to dedicated stations.",
    challenges: [
      "Lunch-hour counter rushes that overwhelm cashiers and lead to slow order input",
      "Kitchen communication breakdowns resulting in missing sides, cold fries, or wrong toppings",
      "High front-of-house cashier labor costs cutting into slim fast-food margins",
      "Manual order status shouting creating noise and guest pickup anxiety",
    ],
    solutions: [
      "Self-service table QRs and counter pickup kiosks empower guests to order and pay via UPI instantly",
      "Sub-50ms KDS line routing directs burgers to the Grill, nuggets to the Fryer, and drinks to the Dispenser",
      "Visual SLA timers flash alert colors (Green ➔ Amber ➔ Red) to enforce sub-3-minute prep standards",
      "Large-format customer order-ready display boards and automated SMS/WhatsApp alerts for pickup",
    ],
    features: [
      "Sub-50ms instant KOT arrival to kitchen lines",
      "Automated combo & beverage upselling on mobile menu",
      "Customer pickup status display board with ticket tokens",
      "Unified Swiggy & Zomato aggregator order consolidation",
    ],
    bestFor: "Burger joints, taco spots, pizza slice counters, roll centers, and fast-casual food court outlets."
  },
  {
    id: "dine-in",
    slug: "casual-fine-dining",
    name: "Casual & Fine Dining",
    tagline: "Multi-Course Pacing, Captain POS & Table-Side UPI Settle",
    badge: "Full Service",
    heroImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { value: "3.2x", label: "Faster Table Turn Rate" },
      { value: "-14 mins", label: "Check Drop Delay Saved" },
      { value: "99.8%", label: "Kitchen Accuracy" },
    ],
    summary:
      "Empower captains and dining room guests with interactive visual menus, multi-course meal pacing, and instant table-side bill splitting without waving down busy servers.",
    challenges: [
      "Slow table turns during dinner service because guests wait 15 minutes just to get their check folder",
      "Misheard guest preferences on steak cooking temperatures or wine pairings causing costly remakes",
      "Frustrated large parties trying to split checks manually among several credit cards",
      "Waiters spending 60% of their time running handwritten slips back to the POS terminal",
    ],
    solutions: [
      "Dine-in guests scan table QRs to explore photo-rich menus with pairing recommendations and tasting notes",
      "Captains use handheld mobile POS terminals with course firing controls (Appetizers ➔ Mains ➔ Desserts)",
      "Guests review itemized seated tabs, split the bill by seat, and settle via GPay/PhonePe anytime",
      "Interactive floorplan displays live table status (Seated, Ordered, Eating, Bill Dropped, Dirty)",
    ],
    features: [
      "Multi-course hold & fire kitchen coordination",
      "Interactive dining room table floorplan with duration timers",
      "Direct table-side split payment via UPI, Cards, or Cash",
      "Allergen alerts, wine pairings, and chef recommendation tags",
    ],
    bestFor: "Full-service dining rooms, bistros, rooftop lounges, brewpubs, and luxury fine-dining venues."
  },
  {
    id: "cloud-kitchen",
    slug: "cloud-kitchens-virtual-brands",
    name: "Cloud Kitchens & Dark Brands",
    tagline: "Centralized Multi-Brand Hub, Shared Commissary & 0% Commission Direct Orders",
    badge: "Delivery Hub",
    heroImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { value: "1 Screen", label: "All Virtual Brands" },
      { value: "0%", label: "Direct Order Commission" },
      { value: "-22%", label: "Packaging Misfires" },
    ],
    summary:
      "Orchestrate 5+ virtual delivery brands from a single kitchen control screen. Consolidate delivery aggregator orders, manage shared raw ingredient inventory, and dispatch branded packaging flawlessly.",
    challenges: [
      "Managing 6 separate tablets for Swiggy, Zomato, and direct channels creates delivery room pandemonium",
      "Packaging mix-ups placing Brand A food into Brand B bags during peak rush hours",
      "High 25–35% aggregator commissions eroding restaurant food margins",
      "Shared ingredient stock tracking between separate virtual brands causing frequent cancellations",
    ],
    solutions: [
      "Unified Omnichannel Order Hub aggregates all delivery platforms onto a single live KDS screen",
      "Brand-specific packaging slip printing with distinct branding, color indicators, and driver tags",
      "Direct commission-free web ordering portals with UPI payments and automated delivery partner integration",
      "Centralized commissary stock depletion: deducting chicken and sauces across all 5 virtual menus accurately",
    ],
    features: [
      "Single-screen multi-brand aggregator order inbox",
      "Automated packaging label printing with driver verification",
      "Shared commissary ingredient stock depletion and variance alerts",
      "Direct delivery ordering storefronts with 0% platform commissions",
    ],
    bestFor: "Cloud kitchens, ghost brands, multi-concept virtual food halls, and delivery-first food operators."
  },
  {
    id: "multi-outlet",
    slug: "franchise-enterprise-chains",
    name: "Multi-Outlet & Franchise Chains",
    tagline: "Central Menu Governance, Franchise Royalties & Unified Executive BI",
    badge: "Enterprise Scale",
    heroImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { value: "1-Click", label: "Global Menu Sync" },
      { value: "100%", label: "Franchise Audit Accuracy" },
      { value: "Real-Time", label: "Multi-Store Telemetry" },
    ],
    summary:
      "Govern 5 to 500+ outlets with enterprise precision. Push central menu updates with localized pricing, automate franchise royalty calculations, and monitor performance in a unified executive control room.",
    challenges: [
      "Inconsistent pricing, rogue items, and outdated menus across different regional franchise outlets",
      "Opaque franchise revenue reporting leading to royalty audit disputes and revenue leakage",
      "Lack of centralized supplier procurement resulting in inconsistent food quality and higher vendor costs",
      "Slow, manual consolidation of sales and inventory data across multiple restaurant branches",
    ],
    solutions: [
      "Centralized Master Catalog pushes menu items, recipe changes, and tax rules to all outlets in 1 click",
      "Franchise revenue audit ledgers automatically compute daily/monthly royalty fees with zero tampering",
      "Consolidated raw material purchasing lets corporate negotiate bulk vendor pricing and automate reorder POs",
      "Executive BI dashboard delivers real-time sales, speed of service, and food wastage across all stores",
    ],
    features: [
      "1-click global menu push with localized tax and pricing tiers",
      "Automated franchise royalty ledger and sales audit reports",
      "Centralized raw material supplier procurement and PO contracts",
      "Role-based corporate, regional manager, and store cashier access",
    ],
    bestFor: "Multi-unit restaurant chains, regional food franchises, corporate food courts, and hospitality groups."
  }
];
