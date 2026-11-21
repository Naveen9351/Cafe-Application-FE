/**
 * DINEVIQ CAFE OS — Module & Feature Allocation Configuration (Frontend)
 * Matrix based on Dineviq_Subscription_Plans_and_Modules.pdf
 * Dependency-Proof Plan Architecture: Starter (₹499) • Growth (₹799) • Pro (₹999) • Custom
 */

export const MODULE_KEYS = {
  // Base Modules (Starter)
  POS_TERMINAL: 'pos_terminal',
  MENU_MANAGEMENT: 'menu_management',
  ORDERS_MANAGEMENT: 'orders_management',
  BASIC_DASHBOARD: 'basic_dashboard',
  SETTINGS_BRANDING: 'settings_branding',

  // Table Suite (Growth & Pro, or Custom +Table Suite)
  // Architecture Rule: #6, #7, #8, #9 are strictly grouped together in Table Suite
  TABLE_QR: 'table_qr',
  LIVE_ORDERS_KDS: 'live_orders_kds',
  TEMPORARY_TABLES: 'temporary_tables',
  FLOOR_LAYOUT: 'floor_layout',

  // Growth & Pro Addons
  KHATA_LEDGER: 'khata_ledger',
  ITEM_SUMMARY: 'item_summary',

  // Pro Only (or Custom Addon)
  WHATSAPP_SUITE: 'whatsapp_suite',
  CUSTOMER_CRM: 'customer_crm',
  REPORTS_EXCEL: 'reports_excel',
  STAFF_MANAGEMENT: 'staff_management',
  AI_COPILOT: 'ai_copilot'
};

export const MODULE_DEFINITIONS = [
  {
    id: MODULE_KEYS.POS_TERMINAL,
    number: 1,
    name: 'POS Terminal (Counter)',
    scope: 'Fast counter billing, walk-in orders & Cash/UPI settlement',
    minPlan: 'Starter',
    minPrice: 499,
    category: 'base'
  },
  {
    id: MODULE_KEYS.MENU_MANAGEMENT,
    number: 2,
    name: 'Menu Management',
    scope: 'Dish add/edit, categories, pricing, variants, in-stock toggle',
    minPlan: 'Starter',
    minPrice: 499,
    category: 'base'
  },
  {
    id: MODULE_KEYS.ORDERS_MANAGEMENT,
    number: 3,
    name: 'Orders Management',
    scope: 'Complete order history, bill re-print & payment mode filters',
    minPlan: 'Starter',
    minPrice: 499,
    category: 'base'
  },
  {
    id: MODULE_KEYS.BASIC_DASHBOARD,
    number: 4,
    name: 'Basic Dashboard',
    scope: "Today's revenue, total bills count & daily sales metrics",
    minPlan: 'Starter',
    minPrice: 499,
    category: 'base'
  },
  {
    id: MODULE_KEYS.SETTINGS_BRANDING,
    number: 5,
    name: 'Settings & Branding',
    scope: 'Cafe name, logo, GST %, UPI QR setup & sound chime',
    minPlan: 'Starter',
    minPrice: 499,
    category: 'base'
  },
  {
    id: MODULE_KEYS.TABLE_QR,
    number: 6,
    name: 'Table QR Codes',
    scope: 'Dynamic table QR, customer self-ordering mobile cart',
    minPlan: 'Growth',
    minPrice: 799,
    suite: 'table_suite',
    category: 'table_suite'
  },
  {
    id: MODULE_KEYS.LIVE_ORDERS_KDS,
    number: 7,
    name: 'Live Orders / KDS',
    scope: 'Kitchen display screen, cooking prep timer, order ready status',
    minPlan: 'Growth',
    minPrice: 799,
    suite: 'table_suite',
    category: 'table_suite'
  },
  {
    id: MODULE_KEYS.TEMPORARY_TABLES,
    number: 8,
    name: 'Temporary Tables',
    scope: 'Floating open tabs (e.g. Deepak) & auto-removal on settlement',
    minPlan: 'Growth',
    minPrice: 799,
    suite: 'table_suite',
    category: 'table_suite'
  },
  {
    id: MODULE_KEYS.FLOOR_LAYOUT,
    number: 9,
    name: 'Floor & Seating Layout',
    scope: 'Multi-floor view (Indoor, Rooftop, Garden) & table states',
    minPlan: 'Growth',
    minPrice: 799,
    suite: 'table_suite',
    category: 'table_suite'
  },
  {
    id: MODULE_KEYS.KHATA_LEDGER,
    number: 10,
    name: 'Khata Ledger',
    scope: 'Customer udhari tracking, credit limits, repayment ledger',
    minPlan: 'Growth',
    minPrice: 799,
    addonPrice: 149,
    category: 'growth'
  },
  {
    id: MODULE_KEYS.ITEM_SUMMARY,
    number: 11,
    name: 'Item Summary Reports',
    scope: 'Dish-wise sales velocity & item quantity sold analysis',
    minPlan: 'Growth',
    minPrice: 799,
    addonPrice: 149,
    category: 'growth'
  },
  {
    id: MODULE_KEYS.WHATSAPP_SUITE,
    number: 12,
    name: 'Automated WhatsApp Suite',
    scope: 'Direct WhatsApp E-Bills & marketing discount broadcasts',
    minPlan: 'Pro',
    minPrice: 999,
    addonPrice: 249,
    category: 'pro'
  },
  {
    id: MODULE_KEYS.CUSTOMER_CRM,
    number: 13,
    name: 'Customer CRM & Loyalty',
    scope: 'Customer directory, lifetime spend metrics, visit count, AOV',
    minPlan: 'Pro',
    minPrice: 999,
    addonPrice: 199,
    category: 'pro'
  },
  {
    id: MODULE_KEYS.REPORTS_EXCEL,
    number: 14,
    name: 'Reports Suite (Excel)',
    scope: 'Detailed sales summary, payment mode splits, .xlsx export',
    minPlan: 'Pro',
    minPrice: 999,
    addonPrice: 149,
    category: 'pro'
  },
  {
    id: MODULE_KEYS.STAFF_MANAGEMENT,
    number: 15,
    name: 'Staff Management & Roles',
    scope: 'Cashier, Waiter, Kitchen roles, PIN security & permissions',
    minPlan: 'Pro',
    minPrice: 999,
    addonPrice: 149,
    category: 'pro'
  },
  {
    id: MODULE_KEYS.AI_COPILOT,
    number: 16,
    name: 'AI Copilot & Insights',
    scope: 'Sales predictions, smart recommendations & Dineviq AI Assistant',
    minPlan: 'Pro',
    minPrice: 999,
    addonPrice: 199,
    category: 'pro'
  }
];

export const BASE_MODULES = [
  MODULE_KEYS.POS_TERMINAL,
  MODULE_KEYS.MENU_MANAGEMENT,
  MODULE_KEYS.ORDERS_MANAGEMENT,
  MODULE_KEYS.BASIC_DASHBOARD,
  MODULE_KEYS.SETTINGS_BRANDING
];

export const TABLE_SUITE_MODULES = [
  MODULE_KEYS.TABLE_QR,
  MODULE_KEYS.LIVE_ORDERS_KDS,
  MODULE_KEYS.TEMPORARY_TABLES,
  MODULE_KEYS.FLOOR_LAYOUT
];

export const PLAN_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    price: 499,
    period: '/ month',
    badge: 'Essential Counter Billing',
    description: 'Fast counter billing, walk-in orders & complete dish menu management.',
    modules: [...BASE_MODULES]
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan',
    price: 799,
    period: '/ month',
    badge: '★ Best for Cafes & QSRs',
    popular: true,
    description: 'Starter + Table Suite (QR Codes, KDS, Temp Tables, Layout) + Khata + Item Summary.',
    modules: [
      ...BASE_MODULES,
      ...TABLE_SUITE_MODULES,
      MODULE_KEYS.KHATA_LEDGER,
      MODULE_KEYS.ITEM_SUMMARY
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    period: '/ month',
    badge: '■ Ultimate Flagship',
    description: 'All 16 Modules Unlocked: WhatsApp Suite, CRM, Excel Reports, Staff Management & AI Copilot.',
    modules: MODULE_DEFINITIONS.map(m => m.id)
  },
  custom: {
    id: 'custom',
    name: 'Custom Plan',
    basePrice: 499,
    period: '/ month',
    badge: 'Tailored Add-ons',
    description: 'Starter Base (₹499) + build your own custom stack of operational add-ons.'
  }
};

export const CUSTOM_ADDONS = [
  {
    id: 'table_suite',
    name: 'Table Suite (QR Codes, KDS, Temp Tables, Floor Layout)',
    price: 249,
    description: 'Coupled order-kitchen-table lifecycle (#6, #7, #8, #9)',
    modules: [...TABLE_SUITE_MODULES]
  },
  {
    id: 'khata_ledger',
    name: 'Khata Ledger',
    price: 149,
    description: 'Customer udhari tracking, credit limits & ledger (#10)',
    modules: [MODULE_KEYS.KHATA_LEDGER]
  },
  {
    id: 'item_summary',
    name: 'Item Summary Reports',
    price: 149,
    description: 'Dish-wise sales velocity & item quantity sold (#11)',
    modules: [MODULE_KEYS.ITEM_SUMMARY]
  },
  {
    id: 'whatsapp_suite',
    name: 'Automated WhatsApp Suite',
    price: 249,
    description: 'Direct WhatsApp E-Bills & marketing broadcasts (#12)',
    modules: [MODULE_KEYS.WHATSAPP_SUITE]
  },
  {
    id: 'customer_crm',
    name: 'Customer CRM & Loyalty',
    price: 199,
    description: 'Customer directory, lifetime metrics & visit count (#13)',
    modules: [MODULE_KEYS.CUSTOMER_CRM]
  },
  {
    id: 'reports_excel',
    name: 'Reports Suite (Excel)',
    price: 149,
    description: 'Comprehensive financial summaries with .xlsx export (#14)',
    modules: [MODULE_KEYS.REPORTS_EXCEL]
  },
  {
    id: 'staff_management',
    name: 'Staff Management & Roles',
    price: 149,
    description: 'Cashier, Waiter, Kitchen roles, PIN security (#15)',
    modules: [MODULE_KEYS.STAFF_MANAGEMENT]
  },
  {
    id: 'ai_copilot',
    name: 'AI Copilot & Insights',
    price: 199,
    description: 'Sales predictions & Dineviq AI Assistant (#16)',
    modules: [MODULE_KEYS.AI_COPILOT]
  }
];

/**
 * Returns array of active module IDs for a given tenant subscription
 */
export function getEffectiveTenantModules(subscription = {}) {
  if (!subscription) return PLAN_TIERS.starter.modules;
  const planKey = (subscription.plan || '').toLowerCase();

  // If already computed by backend
  if (Array.isArray(subscription.effectiveModules) && subscription.effectiveModules.length > 0) {
    return subscription.effectiveModules;
  }

  // If explicit modules array is set
  if (Array.isArray(subscription.modules) && subscription.modules.length > 0) {
    return Array.from(new Set([...BASE_MODULES, ...subscription.modules]));
  }

  // Legacy plans map to Pro
  if (['1_month', '6_months', '1_year', 'pro', 'yearly', 'annual'].includes(planKey)) {
    return PLAN_TIERS.pro.modules;
  }
  if (planKey === 'growth') {
    return PLAN_TIERS.growth.modules;
  }
  if (planKey === 'starter') {
    return PLAN_TIERS.starter.modules;
  }
  if (planKey === 'custom') {
    const modulesSet = new Set([...BASE_MODULES]);
    const addons = subscription.customAddons || [];
    addons.forEach(addonKey => {
      const addon = CUSTOM_ADDONS.find(a => a.id === addonKey);
      if (addon && Array.isArray(addon.modules)) {
        addon.modules.forEach(m => modulesSet.add(m));
      } else if (Object.values(MODULE_KEYS).includes(addonKey)) {
        modulesSet.add(addonKey);
      }
    });
    return Array.from(modulesSet);
  }
  if (planKey === 'free_trial') {
    if (Array.isArray(subscription.customAddons) && subscription.customAddons.length > 0) {
      const modulesSet = new Set([...BASE_MODULES]);
      subscription.customAddons.forEach(addonKey => {
        const addon = CUSTOM_ADDONS.find(a => a.id === addonKey);
        if (addon && Array.isArray(addon.modules)) {
          addon.modules.forEach(m => modulesSet.add(m));
        } else if (Object.values(MODULE_KEYS).includes(addonKey)) {
          modulesSet.add(addonKey);
        }
      });
      return Array.from(modulesSet);
    }
    return MODULE_DEFINITIONS.map(m => m.id);
  }

  return PLAN_TIERS.starter.modules;
}

/**
 * Check if the tenant subscription has access to a specific module
 */
export function hasModuleAccess(subscription = {}, moduleId) {
  if (!moduleId) return true;
  const activeModules = getEffectiveTenantModules(subscription);
  return activeModules.includes(moduleId);
}

/**
 * Get module definition metadata by ID
 */
export function getModuleDef(moduleId) {
  return MODULE_DEFINITIONS.find(m => m.id === moduleId) || null;
}
