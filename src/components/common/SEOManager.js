import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isBillingOrAdminSubdomain } from '../../utils/subdomain';

const SEO_MAP = {
  '/': {
    title: 'DineviQ — Autonomous Restaurant & Cafe OS | QR Dining, KDS & POS',
    description: 'DineviQ (dineviq.com) is the premier autonomous AI restaurant management operating system in India. Zero-latency QR table ordering, live KDS, cloud POS, and UPI billing.'
  },
  '/login': {
    title: 'Restaurant Login | DineviQ Cloud Billing & POS Portal',
    description: 'Restaurant Login. Secure access for restaurant cashiers, managers, and kitchen staff to Cloud POS billing, KDS orders, and table management.'
  },
  '/whatsapp': {
    title: 'WhatsApp Ordering & Digital Bills | DineviQ',
    description: 'WhatsApp Restaurant Integration. Send automated WhatsApp bills, loyalty points, and enable frictionless customer chat ordering.'
  },
  '/products': {
    title: 'Products Suite | DineviQ — Dynamic QR, KDS & Cloud POS',
    description: 'Products Suite. Explore Contactless QR Table Menus, Multi-Station Kitchen Display System (KDS), Cloud POS Billing, and Recipe Inventory.'
  },
  '/solutions': {
    title: 'Industry Solutions | DineviQ — Cafes, QSRs, Fine Dining & Cloud Kitchens',
    description: 'DineviQ adapts to specialty cafes, bakeries, high-volume fast-food counters, fine dining restaurants, and multi-brand cloud kitchens across India.'
  },
  '/pricing': {
    title: 'Pricing Plans in ₹ INR | DineviQ — Autonomous Restaurant Software',
    description: 'Pricing Plans. Transparent restaurant tech pricing in Indian Rupees (₹) starting at ₹199/mo with zero hidden fees and unlimited tables.'
  },
  '/demo': {
    title: 'Schedule a Live 1-on-1 Walkthrough | DineviQ Restaurant OS',
    description: 'Book a 15-minute personalized demo with DineviQ restaurant engineering experts. See how to cut ticket times and boost table turnover.'
  },
  '/about': {
    title: 'About DineviQ — Building the Future of Restaurant Technology',
    description: 'About DineviQ. Discover how autonomous AI eliminates restaurant friction, paper tickets, and inventory chaos.'
  },
  '/contact': {
    title: 'Contact Support & Enterprise Sales | DineviQ',
    description: 'Contact Us. 24/7 dedicated support and enterprise sales assistance. Connect via phone, email, or direct WhatsApp support.'
  },
  '/features/pos-billing': {
    title: 'Cloud POS & Thermal Receipt Printer | DineviQ',
    description: 'High-speed cloud POS billing in Indian Rupees with 80mm/58mm thermal receipts, split payments, and Khata ledger management.'
  },
  '/features/inventory': {
    title: 'Automatic Recipe Inventory & Wastage Depletion | DineviQ',
    description: 'Real-time BOM ingredient deductions, low-stock threshold alerts, and automated wastage logs linked directly to kitchen orders.'
  },
  '/features/crm-loyalty': {
    title: 'WhatsApp CRM & Diner Loyalty Engine | DineviQ',
    description: 'Automate WhatsApp bill receipts, collect feedback ratings, and reward repeat diners with customized cashback points.'
  },
  '/features/ai-copilot': {
    title: 'DineviQ AI Neural Copilot — Sales & Staff Forecasting',
    description: 'Predict peak hour rush, forecast ingredient demand, and eliminate food waste with machine learning trained on dining patterns.'
  },
  '/menu': {
    title: 'Live QR Customer Digital Menu | DineviQ',
    description: 'Instant contactless QR menu ordering with high-resolution imagery, modifier customizations, and UPI payment integration.'
  },
  '/register': {
    title: 'Register Your Restaurant & Cafe | DineviQ',
    description: 'Join 500+ restaurants growing with DineviQ. Setup your brand, tables, and live digital menu in less than 5 minutes.'
  }
};

export default function SEOManager() {
  const location = useLocation();

  useEffect(() => {
    const isBilling = isBillingOrAdminSubdomain();
    const pathname = location.pathname;

    let config = SEO_MAP[pathname] || {
      title: 'DineviQ — Autonomous Restaurant & Cafe OS',
      description: 'DineviQ (dineviq.com) is the autonomous AI restaurant management operating system.'
    };

    if (isBilling || pathname === '/login') {
      config = {
        title: 'Restaurant & Cafe Login | DineviQ Billing & POS Portal',
        description: 'Secure login portal for DineviQ Restaurant, Cafe & Bar management. Access Cloud POS billing, KDS kitchen orders, table management, and cashier billing.'
      };
    }

    const canonicalHref = isBilling 
      ? 'https://billing.dineviq.com/' 
      : (pathname === '/login' ? 'https://billing.dineviq.com/' : `https://www.dineviq.com${pathname === '/' ? '' : pathname}`);

    // 1. Update Document Title
    document.title = config.title;

    // 2. Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', config.description);
    }

    // 3. Update OpenGraph Title & URL
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', config.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', config.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalHref);

    // 4. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);
  }, [location.pathname]);

  return null;
}
