export const PRODUCTS = [
  // ==========================================
  // FLAGSHIP PRODUCTS
  // ==========================================
  {
    id: "qr-ordering",
    slug: "qr-ordering",
    name: "QR Table Ordering",
    shortTagline: "Frictionless Dine-in Ordering Direct from Every Table",
    tier: "flagship",
    category: "Ordering",
    description:
      "Allow guests to scan a custom QR code at their table, explore a photo-rich digital menu with full customization, and order instantly without waiting for busy servers or downloading an app.",
    detailedDescription:
      "SERVIQ QR Table Ordering creates a relaxed, modern dining experience for your guests while taking pressure off your floor staff. Diners can easily browse high-resolution dish photos, select cooking temperatures, add sides, specify allergy notes, and send orders directly to the kitchen in seconds.",
    highlights: [
      "No app download or account signup required for diners",
      "Table-specific QR stands with automatic table assignment",
      "Visual modifier engine that naturally lifts average check sizes by 18%",
      "Dietary filters, ingredient highlights, and allergy alerts",
      "Guests can re-order drinks and desserts throughout the meal",
      "Instant pay-at-table options to eliminate bill-waiting delays"
    ],
    stats: [
      { value: "0 sec", label: "Guest Download Wait" },
      { value: "+18%", label: "Average Check Lift" },
      { value: "3.2x", label: "Faster Table Turnover" }
    ],
    accentColor: "from-amber-500 to-orange-600",
    icon: "QrCode",
    features: [
      {
        title: "Table-Specific QR Codes",
        description: "Custom acrylic stands, wooden blocks, or sticker decals assigned uniquely to each table or booth.",
        iconName: "Maximize2"
      },
      {
        title: "Visual Dish Showcase",
        description: "High-resolution dish photos, ingredients, pairing recommendations, and chef specials that drive appetites.",
        iconName: "BookOpen"
      },
      {
        title: "Custom Modifiers & Add-ons",
        description: "Effortlessly configure steak temperatures, choice of sides, extra toppings, and beverage upgrades.",
        iconName: "Sliders"
      },
      {
        title: "Flexible Seated Cart",
        description: "Diners can place an initial round of appetizers, then add main courses and second drinks seamlessly.",
        iconName: "ShoppingBag"
      },
      {
        title: "Instant 86 Item Toggle",
        description: "Sold-out items can be toggled off in one tap from any phone or manager terminal to avoid disappointed guests.",
        iconName: "RefreshCw"
      },
      {
        title: "Contactless Bill Settlement",
        description: "Guests can view their itemized tab, split the bill, add tips, and pay right from their phone.",
        iconName: "CreditCard"
      }
    ]
  },
  {
    id: "kds",
    slug: "kds",
    name: "Kitchen Display System (KDS)",
    shortTagline: "Real-Time Station Routing, Prep Timers & Line Orchestration",
    tier: "flagship",
    category: "Kitchen Operations",
    description:
      "Replace lost paper tickets and greasy printers with bright, clear digital kitchen displays. Route items to dedicated prep stations, track color-coded timers, and keep the kitchen line in perfect rhythm.",
    detailedDescription:
      "Designed specifically for the intense heat and speed of restaurant kitchens, SERVIQ KDS organizes incoming orders from QR tables, counter staff, and online channels. Orders automatically split across Grill, Fryer, Salad, Dessert, and Bar expo screens so every cook sees exactly what they need to make.",
    highlights: [
      "Automatic station routing (Grill, Fryer, Bar, Cold Prep, Expo)",
      "Color-coded prep timers (Green, Amber, Red) to maintain service pace",
      "One-tap ticket bump and recall with touchscreen or physical bump bars",
      "Course pacing to hold entrees until appetizers are served",
      "Expo pass screen for complete table quality control",
      "Works on durable commercial Android tablets, iPads, or touchscreen monitors"
    ],
    stats: [
      { value: "-45%", label: "Kitchen Ticket Delays" },
      { value: "100%", label: "Elimination of Lost Paper Slips" },
      { value: "4.8 min", label: "Saved Per Table on Average" }
    ],
    accentColor: "from-emerald-500 to-teal-600",
    icon: "LayoutGrid",
    features: [
      {
        title: "Intelligent Station Splitting",
        description: "A single table order divides automatically: drinks to the bar, steaks to the grill, and sides to the fryer.",
        iconName: "GitFork"
      },
      {
        title: "Visual SLA Countdown Timers",
        description: "Tickets progress from On Track to Approaching SLA and Rush Warning so cooks prioritize urgent tickets.",
        iconName: "Timer"
      },
      {
        title: "Order Flow Stages",
        description: "Clear order states: New Order → In Preparation → Ready to Plate → Served to Table.",
        iconName: "CheckCircle2"
      },
      {
        title: "Course Timing & Hold Controls",
        description: "Hold second courses and fire them automatically or on server prompt for perfectly timed meals.",
        iconName: "Layers"
      },
      {
        title: "Expo Master Pass Screen",
        description: "Consolidate all station items onto one screen so the expeditor can inspect and dispatch complete tables together.",
        iconName: "Eye"
      },
      {
        title: "Hardware Versatility",
        description: "Mount any durable tablet or commercial display with bracket and bump bar support.",
        iconName: "Monitor"
      }
    ]
  },

  // ==========================================
  // ECOSYSTEM CAPABILITIES
  // ==========================================
  {
    id: "pos",
    slug: "pos",
    name: "Point of Sale (POS)",
    shortTagline: "Fast, Reliable Register for Front-of-House Staff",
    tier: "ecosystem",
    category: "Restaurant Operations",
    description: "Speedy counter ordering, table bill splitting, interactive floorplan maps, and smooth shift handoffs for servers and bartenders.",
    highlights: ["Visual floorplan table status", "Item & seat bill splitting", "Staff PIN security & quick cash drawer"],
    features: [
      { title: "Floorplan Table Layouts", description: "Visual seating map with real-time occupied, dining, and paid status.", iconName: "MapPin" },
      { title: "Rapid Checkout", description: "Intuitive tap-and-go order entry built for fast-paced dining rooms.", iconName: "Zap" }
    ],
    accentColor: "from-blue-500 to-indigo-600",
    icon: "CreditCard"
  },
  {
    id: "digital-menu",
    slug: "digital-menu",
    name: "Digital Menu Management",
    shortTagline: "One Central Catalog for Menus, Prices & Daily Specials",
    tier: "ecosystem",
    category: "Ordering",
    description: "Update prices, add seasonal dishes, upload photos, and manage dietary badges across all dining room tables in seconds.",
    highlights: ["Instant updates across all tables", "Scheduled lunch & dinner menus", "Allergen & dietary badges"],
    features: [
      { title: "Scheduled Menus", description: "Automatically switch menus from Breakfast to Lunch, Happy Hour, and Dinner.", iconName: "Clock" },
      { title: "Dietary & Allergen Tags", description: "Clearly highlight Vegan, Gluten-Free, Nut-Free, and Halal dishes.", iconName: "ShieldCheck" }
    ],
    accentColor: "from-violet-500 to-purple-600",
    icon: "BookOpen"
  },
  {
    id: "table-management",
    slug: "table-management",
    name: "Table & Floor Management",
    shortTagline: "Optimize Dining Room Seating, Waitlists & Turns",
    tier: "ecosystem",
    category: "Restaurant Operations",
    description: "Keep hosts, servers, and managers in sync with live floor occupancy, seated duration timers, and balanced server section assignments.",
    highlights: ["Real-time table occupancy maps", "Seated duration tracking", "Balanced server section coverage"],
    features: [
      { title: "Server Section Balancing", description: "Distribute seated tables evenly across active waitstaff to avoid overwhelmed servers.", iconName: "Users" },
      { title: "Table State Radar", description: "Instantly see which tables are Seated, Ordered, Eating, or Ready to Bus.", iconName: "PieChart" }
    ],
    accentColor: "from-sky-500 to-blue-600",
    icon: "Grid"
  },
  {
    id: "order-management",
    slug: "order-management",
    name: "Live Order Hub",
    shortTagline: "Unified Feed for Dine-In, Takeout & Delivery",
    tier: "ecosystem",
    category: "Restaurant Operations",
    description: "Bring all order channels into one unified screen. No more juggling separate counter tablets or missing takeout slips.",
    highlights: ["Single screen for all order channels", "Clear order timeline & receipts", "Customer SMS pickup notifications"],
    features: [
      { title: "Centralized Order Stream", description: "View and manage dine-in QR orders, counter orders, and pickup orders in one clear feed.", iconName: "Inbox" },
      { title: "Order History & Receipts", description: "Quickly look up past orders, customer requests, and item modifications.", iconName: "FileText" }
    ],
    accentColor: "from-teal-500 to-emerald-600",
    icon: "ListOrdered"
  },
  {
    id: "analytics",
    slug: "analytics",
    name: "Restaurant Reporting & Insights",
    shortTagline: "Actionable Visibility on Sales, Speed & Margins",
    tier: "ecosystem",
    category: "Growth & Insights",
    description: "Clear, intuitive reports showing your top-selling dishes, busiest peak hours, average check size trends, and kitchen prep times.",
    highlights: ["Daily revenue & check size trends", "Top-selling dish rankings", "Kitchen speed & prep benchmarks"],
    features: [
      { title: "Daily Sales & AOV Overview", description: "Understand how much you sell, average spend per guest, and payment breakdowns.", iconName: "TrendingUp" },
      { title: "Kitchen Speed Reporting", description: "Identify average prep times across lunch and dinner shifts to resolve bottlenecks.", iconName: "Activity" }
    ],
    accentColor: "from-amber-500 to-yellow-600",
    icon: "BarChart3"
  },
  {
    id: "inventory",
    slug: "inventory",
    name: "Inventory & Recipe Tracking",
    shortTagline: "Monitor Ingredients, Stock Levels & Prevent Food Waste",
    tier: "ecosystem",
    category: "Restaurant Operations",
    description: "Connect menu sales directly to ingredient usage. Get low-stock reminders before key ingredients run out during a busy weekend rush.",
    highlights: ["Ingredient depletion as dishes sell", "Low-stock reorder reminders", "Food cost & margin visibility"],
    features: [
      { title: "Recipe-Linked Stock Counts", description: "Automatically deduct buns, cheese, and steaks every time a meal is ordered.", iconName: "PackageCheck" },
      { title: "Low-Stock Alerts", description: "Receive proactive notifications when essential ingredients drop below your reorder threshold.", iconName: "Truck" }
    ],
    accentColor: "from-rose-500 to-pink-600",
    icon: "Boxes"
  },
  {
    id: "crm-loyalty",
    slug: "crm-loyalty",
    name: "Guest Loyalty & CRM",
    shortTagline: "Turn First-Time Diners into Lifelong Regulars",
    tier: "ecosystem",
    category: "Growth & Insights",
    description: "Build regular customer relationships effortlessly through digital receipts, personalized birthday rewards, and repeat visit perks.",
    highlights: ["Frictionless phone-based rewards", "Automatic guest visit logs", "Special occasion & regular guest perks"],
    features: [
      { title: "Simple Guest Profiles", description: "Capture guest preferences and favorite dishes naturally through digital ordering.", iconName: "UserCheck" },
      { title: "Repeat Guest Rewards", description: "Delight your regular diners with surprise perks on their 5th or 10th dining visit.", iconName: "Sparkles" }
    ],
    accentColor: "from-fuchsia-500 to-pink-600",
    icon: "HeartHandshake"
  },
  {
    id: "payments",
    slug: "payments",
    name: "Contactless Payments & Digital Tabs",
    shortTagline: "Fast, Secure Checkout with UPI, Cards & Digital Tabs",
    tier: "ecosystem",
    category: "Platform",
    description: "Let guests settle their check smoothly at the table or counter with digital receipts sent straight to their phone via SMS or WhatsApp.",
    highlights: ["Pay directly at the table", "Split-the-bill capability", "Transparent instant settlements"],
    features: [
      { title: "Pay at Table", description: "Guests can review their bill, add a tip, and pay immediately without waiting for a card machine.", iconName: "Smartphone" },
      { title: "Transparent Settlements", description: "Clear daily payout summaries with no hidden fees or surprise processing markups.", iconName: "CheckCircle" }
    ],
    accentColor: "from-emerald-500 to-cyan-600",
    icon: "Banknote"
  },
  {
    id: "online-ordering",
    slug: "online-ordering",
    name: "Direct Online Ordering",
    shortTagline: "Commission-Free Takeout & Delivery Storefront",
    tier: "ecosystem",
    category: "Ordering",
    description: "A branded web ordering page for your restaurant with zero commissions. Keep 100% of your food sales on pickup and delivery orders.",
    highlights: ["0% commission direct ordering", "Custom colors & logo", "Scheduled pickup times"],
    features: [
      { title: "Custom Branded Web Store", description: "Showcase your full menu on your own website with a smooth mobile checkout.", iconName: "Globe" },
      { title: "Pickup & Delivery Windows", description: "Set prep time estimates and delivery zones to manage takeout capacity during rushes.", iconName: "Navigation" }
    ],
    accentColor: "from-orange-500 to-red-600",
    icon: "ShoppingBag"
  },
  {
    id: "multi-outlet",
    slug: "multi-outlet",
    name: "Multi-Location Management",
    shortTagline: "Central Control for Restaurant Groups & Multi-Branch Brands",
    tier: "ecosystem",
    category: "Platform",
    description: "Update menus across all locations with one click, manage regional pricing differences, and compare sales performance across outlets.",
    highlights: ["Centralized master menu rollouts", "Cross-location sales comparison", "Outlet manager role permissions"],
    features: [
      { title: "Global Menu Publishing", description: "Push new seasonal menus across 3 or 30 locations simultaneously with regional price adjustments.", iconName: "Layers" },
      { title: "Group-Wide Performance", description: "Compare sales, guest counts, and kitchen speeds across all your restaurant branches.", iconName: "Building2" }
    ],
    accentColor: "from-indigo-500 to-purple-600",
    icon: "Building"
  },
  {
    id: "staff-management",
    slug: "staff-management",
    name: "Staff Roles & Shift Permissions",
    shortTagline: "Keep Your Team Accountable & Permissions Secure",
    tier: "ecosystem",
    category: "Restaurant Operations",
    description: "Role-based PIN access for Cashiers, Servers, Bartenders, Chefs, and Managers. Maintain security around discounts, voids, and cash drawers.",
    highlights: ["Fast PIN login for staff", "Manager override approvals", "Server sales & tip summaries"],
    features: [
      { title: "Role Permissions", description: "Easily decide who can apply custom discounts, void items, or view daily revenue totals.", iconName: "Lock" },
      { title: "Server Sales Tracking", description: "See individual server check averages and side/dessert upselling achievements.", iconName: "Award" }
    ],
    accentColor: "from-cyan-500 to-blue-600",
    icon: "UserCheck"
  },
  {
    id: "integrations",
    slug: "integrations",
    name: "POS & Hardware Compatibility",
    shortTagline: "Works Alongside Your Existing Hardware & Thermal Printers",
    tier: "ecosystem",
    category: "Platform",
    description: "Designed to fit into your existing setup. Connect with standard thermal receipt printers, commercial kitchen tablets, and payment hardware.",
    highlights: ["Compatible with thermal ESC/POS printers", "Runs on standard iPads & Android tablets", "Flexible export to accounting"],
    features: [
      { title: "Thermal Printer Support", description: "Print physical kitchen chits or customer receipts on standard thermal printers when desired.", iconName: "Link2" },
      { title: "Flexible Setup", description: "Use SERVIQ as a standalone all-in-one system or alongside your existing front counter setup.", iconName: "Cpu" }
    ],
    accentColor: "from-slate-400 to-zinc-600",
    icon: "Cpu"
  }
];

export const FLAGSHIP_PRODUCTS = PRODUCTS.filter((p) => p.tier === "flagship");
export const ECOSYSTEM_PRODUCTS = PRODUCTS.filter((p) => p.tier === "ecosystem");
