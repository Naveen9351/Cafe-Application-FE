export const RESTAURANT_TYPES = [
  "Full-Service Restaurant",
  "Casual Dining / Bistro",
  "Cafe / Coffee Bar / Bakery",
  "Quick-Service (QSR) / Fast Casual",
  "Cloud / Ghost Kitchen",
  "Bar / Pub / Brewery",
  "Rooftop Lounge & Nightclub",
  "Multi-Outlet Restaurant Chain",
  "Hotel & Resort F&B",
  "Other Hospitality Venue"
];

export const TABLE_COUNT_OPTIONS = [
  "1 - 10 tables",
  "11 - 25 tables",
  "26 - 50 tables",
  "51 - 100 tables",
  "100+ tables",
  "Counter / Takeaway only (0 tables)"
];

export const OUTLET_COUNT_OPTIONS = [
  "1 location (Single outlet)",
  "2 - 5 locations",
  "6 - 15 locations",
  "16 - 50 locations",
  "50+ locations (Franchise / Chain)"
];

export const PRODUCT_INTEREST_OPTIONS = [
  { id: "qr-ordering", name: "QR Table Ordering", category: "Flagship", recommended: true },
  { id: "kds", name: "Kitchen Display (KDS)", category: "Flagship", recommended: true },
  { id: "pos", name: "Point of Sale (POS)", category: "Operations" },
  { id: "online-ordering", name: "Online Web Storefront", category: "Operations" },
  { id: "table-management", name: "Floor & Table Map", category: "Operations" },
  { id: "inventory", name: "Inventory Depletion", category: "Operations" },
  { id: "analytics", name: "Sales & Speed Analytics", category: "Growth" },
  { id: "multi-outlet", name: "Multi-Outlet Cloud", category: "Platform" }
];
