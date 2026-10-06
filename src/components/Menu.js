import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ChevronRight, Sliders, Star, ChevronLeft, Menu as MenuIcon, Search, Plus, Minus, Sun, Moon, Sparkles, Heart, Check, Clock, X, FileText, Utensils, UtensilsCrossed, Zap
} from "lucide-react";
import { getValidFoodImage } from "./AdminPanel";
import { decodeTableToken, encodeTableToken } from "../utils/tableToken";
import styles from "./Menu.module.css";
import { API_URL as API } from "../config/api";
import RestaurantCafeLottieLoader from "./RestaurantCafeLottieLoader";
import DishDetailsModal from "./DishDetailsModal";
import TableBadge from "./common/TableBadge";
import TrackOrderBadge from "./common/TrackOrderBadge";
import CustomerBottomNav from "./common/CustomerBottomNav";

// Track whether initial full-screen culinary loader has already been displayed in the current page session
let hasShownInitialAppLoader = false;

// Curated high-res plate food photos for category badges (Burgers, Pizzas, Cakes, Rolls, Thali, Chai, Coffee, etc.)
export const getCategoryPlateImage = (catName = '', catId = '') => {
  const lower = `${catName} ${catId}`.toLowerCase();

  if (lower.includes('all')) {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('cake') || lower.includes('pastry') || lower.includes('dessert') || lower.includes('sweet') || lower.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('roll') || lower.includes('wrap') || lower.includes('kathi') || lower.includes('burrito')) {
    return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('thali') || lower.includes('meal') || lower.includes('lunch') || lower.includes('dinner')) {
    return 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('chai') || lower.includes('tea')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('cold coffee') || lower.includes('shake') || lower.includes('cooler') || lower.includes('beverage') || lower.includes('mocktail') || lower.includes('drink') || lower.includes('juice')) {
    return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('coffee') || lower.includes('latte') || lower.includes('cappuccino') || lower.includes('espresso')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('sandwich') || lower.includes('toast') || lower.includes('panini')) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('pasta') || lower.includes('noodle') || lower.includes('maggi') || lower.includes('spaghetti')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281724?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('snack') || lower.includes('fries') || lower.includes('starter') || lower.includes('appetizer') || lower.includes('nachos') || lower.includes('momo') || lower.includes('garlic bread')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('biryani') || lower.includes('rice') || lower.includes('pulao') || lower.includes('curry')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=240&auto=format&fit=crop&q=80';
  }
  if (lower.includes('combo') || lower.includes('special') || lower.includes('offer')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=240&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240&auto=format&fit=crop&q=80';
};

// Sleek Shimmer Skeleton for Categories and Menu Items Grid
function MenuSkeletonShimmer({ isDarkMode, theme }) {
  const shimmerClass = `${styles.shimmerBox} ${!isDarkMode ? styles.shimmerLight : ''}`;
  const elementBg = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0';
  const cardBg = theme?.cardBg || theme?.bgCard || (isDarkMode ? '#1e1610' : '#ffffff');

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Category Circular Plates Skeleton Bar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.35rem 0.85rem 0.25rem',
        overflowX: 'hidden',
        borderBottom: `1px solid ${borderCol}`,
        backgroundColor: isDarkMode ? 'rgba(20, 16, 12, 0.94)' : 'rgba(255, 255, 255, 0.96)'
      }}>
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '52px' }}>
            <div
              className={shimmerClass}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: elementBg,
                flexShrink: 0
              }}
            />
            <div
              className={shimmerClass}
              style={{
                width: '36px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: elementBg
              }}
            />
          </div>
        ))}
      </div>

      {/* Dishes Cards Skeleton Grid */}
      <main style={{ padding: '0.65rem 1rem 1.25rem', width: '100%', boxSizing: 'border-box' }}>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className={styles.dishCard}
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderCol}`,
                padding: '0.45rem 0.45rem 0.5rem',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                boxSizing: 'border-box'
              }}
            >
              {/* Image box shimmer */}
              <div
                className={shimmerClass}
                style={{
                  width: '100%',
                  height: '86px',
                  borderRadius: '10px',
                  backgroundColor: elementBg
                }}
              />

              {/* Title and Badge Line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <div
                  className={shimmerClass}
                  style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: elementBg }}
                />
                <div
                  className={shimmerClass}
                  style={{ flex: 1, height: '14px', borderRadius: '4px', backgroundColor: elementBg }}
                />
              </div>

              {/* Description Subtitle */}
              <div
                className={shimmerClass}
                style={{ width: '65%', height: '10px', borderRadius: '3px', backgroundColor: elementBg }}
              />

              {/* Price & Add Button Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <div
                  className={shimmerClass}
                  style={{ width: '42px', height: '16px', borderRadius: '4px', backgroundColor: elementBg }}
                />
                <div
                  className={shimmerClass}
                  style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: elementBg }}
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Menu() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isLoading, setIsLoading] = useState(!hasShownInitialAppLoader);
  const [isFetchingMenu, setIsFetchingMenu] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(() => {
    let name = "SERVIQ Gourmet Bistro";
    let logo = null;
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const parsed = JSON.parse(u);
        name = parsed.restaurantName || parsed.businessName || parsed.tenantName || parsed.name || name;
        logo = parsed.restaurantLogo || parsed.logo || null;
      }
    } catch (e) {}
    const storedLogo = localStorage.getItem('restaurant_logo');
    if (storedLogo) logo = storedLogo;
    const storedName = localStorage.getItem('restaurant_name');
    if (storedName) name = storedName;
    return { name, logo, address: "Indiranagar, Bangalore" };
  });

  // Dedicated Dish Details Page State
  const [viewingDishDetails, setViewingDishDetails] = useState(null);

  // Selected Item & Variant for Customization Options (Bottom Sheet)
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [dishNotes, setDishNotes] = useState("");
  const [modalDishQty, setModalDishQty] = useState(1);

  // Live Active Order on Customer Dashboard
  const [activeRunningOrder, setActiveRunningOrder] = useState(null);

  const { addItem, updateItemQuantity, removeItem, items: cartItems, getCartTotal } = useCartContext();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  // Light Theme by default, synced via localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Item Details Modal State Handlers
  const openItemDetails = (item) => {
    if (!item) return;
    setSelectedItem(item);
    const vars = item.variants || item.sizes || item.portionSizes || [];
    setSelectedVariant(Array.isArray(vars) && vars.length > 0 ? vars[0] : null);
    setSelectedAddons([]);
    setDishNotes("");
    setModalDishQty(1);
  };

  const closeItemDetails = () => {
    setSelectedItem(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
    setDishNotes("");
    setModalDishQty(1);
  };

  // Animation States for Flying Cart Particles & Cart Badge Bounce
  const [flyingParticles, setFlyingParticles] = useState([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const cartIconRef = useRef(null);
  const bottomCartRef = useRef(null);
  const categoryBarRef = useRef(null);
  const stickyWrapperRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const userSelectedManually = useRef(false);

  // Auto-set initial selected variant whenever selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      const vars = selectedItem.variants || selectedItem.sizes || selectedItem.portionSizes || [];
      if (Array.isArray(vars) && vars.length > 0) {
        setSelectedVariant(vars[0]);
      } else {
        setSelectedVariant(null);
      }
      setSelectedAddons([]);
      setDishNotes("");
      setModalDishQty(1);
    } else {
      setSelectedVariant(null);
      setSelectedAddons([]);
      setDishNotes("");
      setModalDishQty(1);
    }
  }, [selectedItem]);

  // Polling for live active order for customer dashboard banner
  useEffect(() => {
    let pollInterval;
    const checkLiveOrder = async () => {
      const lastOrdId = localStorage.getItem('serviq_last_order_id');
      let sessionIds = [];
      try {
        const raw = localStorage.getItem('serviq_session_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) sessionIds = parsed;
        }
      } catch (e) {}

      const candidateIds = Array.from(new Set([
        lastOrdId,
        ...sessionIds.slice().reverse()
      ])).filter(Boolean);

      // 1. Try checking known order IDs
      for (const ordId of candidateIds) {
        try {
          const res = await axios.get(`${API}/orders/status/${ordId}`);
          if (res.data && ['pending', 'confirmed', 'preparing', 'ready'].includes(res.data.status)) {
            setActiveRunningOrder(res.data);
            return;
          }
        } catch (e) {
          // continue
        }
      }

      // 2. Try checking active order for table or customer phone via /active-session
      const tokenParam = searchParams.get('t') || searchParams.get('code') || searchParams.get('token');
      const curTable = tableNumber || (tokenParam ? decodeTableToken(tokenParam) : null) || (searchParams.get('table') ? decodeTableToken(searchParams.get('table')) : null) || localStorage.getItem('tableNumber');
      const currentTenantId = tenantId || searchParams.get('tenantId') || localStorage.getItem('tenantId');
      const phone = localStorage.getItem('customer_phone') || localStorage.getItem('verified_customer_phone');

      if ((curTable && curTable !== 'Takeaway' && curTable !== 'Counter') || phone) {
        try {
          const res = await axios.get(`${API}/orders/active-session`, {
            params: {
              tableNumber: curTable,
              tenantId: currentTenantId,
              phone: phone
            }
          });
          if (res.data && ['pending', 'confirmed', 'preparing', 'ready'].includes(res.data.status)) {
            setActiveRunningOrder(res.data);
            if (res.data._id) {
              localStorage.setItem('serviq_last_order_id', res.data._id);
            }
            return;
          }
        } catch (e) {
          // fallback
        }
      }

      setActiveRunningOrder(null);
    };

    checkLiveOrder();
    pollInterval = setInterval(checkLiveOrder, 5000);
    return () => clearInterval(pollInterval);
  }, [tableNumber, tenantId, searchParams]);

  const theme = isDarkMode ? {
    bgPage: '#090706',
    bgHeader: '#14100c',
    bgCard: '#18130e',
    bgInner: '#1e1812',
    textMain: '#f5ebe0',
    textMuted: '#a39282',
    accent: '#e05c5c',
    accentGlow: 'rgba(224, 92, 92, 0.4)',
    border: 'rgba(224, 92, 92, 0.2)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    inputBg: '#1f1913',
    inputText: '#ffffff',
    catBg: '#1e1812',
    catText: '#a39282',
    badgeBg: '#e05c5c',
  } : {
    bgPage: '#f8fafc',
    bgHeader: '#ffffff',
    bgCard: '#ffffff',
    bgInner: '#f1f5f9',
    textMain: '#0f172a',
    textMuted: '#64748b',
    accent: '#e05c5c',
    accentGlow: 'rgba(224, 92, 92, 0.25)',
    border: '#e2e8f0',
    cardBorder: '#e2e8f0',
    inputBg: '#f1f5f9',
    inputText: '#0f172a',
    catBg: '#f1f5f9',
    catText: '#64748b',
    badgeBg: '#e05c5c',
  };

  useEffect(() => {
    const urlTable = searchParams.get("table");
    let urlTenant = searchParams.get("tenantId") || searchParams.get("tenant");
    if (!urlTenant) {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed.tenantId) urlTenant = parsed.tenantId;
        }
      } catch (e) {}
    }

    if (urlTenant) {
      setTenantId(urlTenant);
      localStorage.setItem("tenantId", urlTenant);
      fetchTenantInfo(urlTenant);
    } else {
      const storedTenant = localStorage.getItem("tenantId");
      if (storedTenant) {
        setTenantId(storedTenant);
        fetchTenantInfo(storedTenant);
      } else {
        setTenantId("demo-tenant");
      }
    }

    const tokenParam = searchParams.get("t") || searchParams.get("code") || searchParams.get("token");
    let resolvedTable = null;

    if (tokenParam) {
      resolvedTable = decodeTableToken(tokenParam);
    } else if (urlTable) {
      resolvedTable = decodeTableToken(urlTable);
    }

    if (resolvedTable) {
      setTableNumber(resolvedTable);
      localStorage.setItem("tableNumber", resolvedTable);
    } else {
      const stored = localStorage.getItem("tableNumber") || "1";
      setTableNumber(stored);
    }

    const currentTenantId = urlTenant || localStorage.getItem("tenantId");
    
    // Only show full-screen blocking loader on initial app load / page refresh
    const shouldShowLoader = !hasShownInitialAppLoader;
    if (shouldShowLoader) {
      setIsLoading(true);
    } else {
      setIsFetchingMenu(true);
    }
    const fetchStart = Date.now();

    axios
      .get(`${API}/menu`, { params: currentTenantId ? { tenantId: currentTenantId } : {} })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setItems(res.data);
        } else {
          setItems(defaultGourmetItemsFallback);
        }
      })
      .catch((err) => {
        console.log("Using dynamic gourmet catalog fallback:", err);
        setItems(defaultGourmetItemsFallback);
      })
      .finally(() => {
        setIsFetchingMenu(false);
        if (shouldShowLoader) {
          const elapsed = Date.now() - fetchStart;
          const delay = Math.max(0, 1800 - elapsed);
          setTimeout(() => {
            setIsLoading(false);
            hasShownInitialAppLoader = true;
          }, delay);
        }
      });
  }, [searchParams]);

  const defaultGourmetItemsFallback = [
    {
      _id: 'dish_1',
      name: 'Wagyu Truffle Burger',
      description: 'Premium wagyu beef patty, black truffle oil, fontina cheese, and arugula on a toasted brioche bun.',
      price: 480.00,
      category: 'main-courses',
      rating: 4.9,
      isVeg: false,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
      sizes: [
        { name: 'Single Patty', price: 480 },
        { name: 'Double Wagyu', price: 620 }
      ]
    },
    {
      _id: 'dish_2',
      name: 'Smoked Vanilla Cold Brew',
      description: '24-hour slow steeped Ethiopian single-origin coffee with housemade Madagascar vanilla bean syrup.',
      price: 189.00,
      category: 'beverages',
      rating: 4.8,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=600',
      sizes: [
        { name: 'Small (250ml)', price: 189 },
        { name: 'Medium (350ml)', price: 239 },
        { name: 'Large (500ml)', price: 279 }
      ]
    },
    {
      _id: 'dish_3',
      name: 'Valrhona Molten Chocolate Lava',
      description: 'Warm dark chocolate fondant with Madagascar vanilla gelato.',
      price: 249.00,
      category: 'desserts',
      rating: 4.8,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600'
    },
    {
      _id: 'dish_4',
      name: 'Burrata Caprese Salad',
      description: 'Creamy pugliese burrata, heirloom cherry tomatoes, cold-pressed olive oil, aged balsamic, and toasted sourdough.',
      price: 289.00,
      category: 'appetizers',
      rating: 4.8,
      isVeg: true,
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&q=80&w=600'
    }
  ];

  const fetchTenantInfo = async (tid) => {
    try {
      const res = await axios.get(`${API}/tenants/public/${tid}`);
      if (res.data) {
        const fetchedLogo = res.data.logo || res.data.settings?.logo || res.data.logoUrl || localStorage.getItem('restaurant_logo');
        const fetchedName = res.data.name || res.data.businessName || res.data.restaurantName || tenantInfo.name;
        setTenantInfo({
          ...res.data,
          name: fetchedName,
          logo: fetchedLogo || null,
        });
        if (fetchedLogo) localStorage.setItem('restaurant_logo', fetchedLogo);
        if (fetchedName) localStorage.setItem('restaurant_name', fetchedName);
        if (res.data.settings?.categories) {
          setCategories(res.data.settings.categories);
        }
      }
    } catch (err) {
      console.log("Tenant info fetch fallback:", err?.message);
    }
  };

  const allCategories = useMemo(() => {
    const map = new Map();

    const getCategoryEmoji = (str = '') => {
      if (!str) return '🍽️';
      const clean = String(str).trim();
      // If already a valid emoji
      if (/\p{Extended_Pictographic}/u.test(clean) && clean.length <= 4) {
        return clean;
      }
      const lower = clean.toLowerCase();
      if (lower.includes('chai') || lower.includes('tea')) return '☕';
      if (lower.includes('cold coffee') || lower.includes('shake') || lower.includes('cooler') || lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('mocktail') || lower === 'glasswater') return '🥤';
      if (lower.includes('coffee') || lower.includes('latte') || lower.includes('espresso') || lower.includes('cappuccino') || lower === 'coffee') return '☕';
      if (lower.includes('burger') || lower.includes('sandwich') || lower.includes('wrap') || lower === 'sandwich') return '🍔';
      if (lower.includes('pizza') || lower === 'pizza') return '🍕';
      if (lower.includes('dessert') || lower.includes('cake') || lower.includes('pastry') || lower.includes('ice cream') || lower.includes('sweet') || lower.includes('waffle') || lower === 'cookie' || lower === 'cake') return '🍰';
      if (lower.includes('pasta') || lower.includes('main') || lower.includes('curry') || lower.includes('rice') || lower.includes('biryani') || lower.includes('noodle') || lower === 'utensilscrossed') return '🍛';
      if (lower.includes('snack') || lower.includes('starter') || lower.includes('appetizer') || lower.includes('salad') || lower.includes('fries') || lower.includes('nachos') || lower.includes('momo') || lower.includes('garlic bread')) return '🍟';
      if (lower.includes('combo') || lower.includes('offer') || lower.includes('special') || lower.includes('deal') || lower === 'sparkles') return '✨';
      return '🍽️';
    };

    if (Array.isArray(categories) && categories.length > 0) {
      categories.forEach(c => {
        const id = c.id || c.name?.toLowerCase().replace(/\s+/g, '-');
        if (id && id !== 'all' && c.name?.toLowerCase() !== 'all' && c.name?.toLowerCase() !== 'all items' && c.name?.toLowerCase() !== 'all categories') {
          // Never use string icon name directly; map to emoji
          const emoji = (c.icon && /\p{Extended_Pictographic}/u.test(c.icon) && c.icon.length <= 4)
            ? c.icon
            : getCategoryEmoji(c.name || c.icon || id);
          map.set(id, { id, name: c.name, icon: emoji, aliases: c.aliases || [], count: 0, image: c.image || c.imageUrl || null });
        }
      });
    }

    items.forEach(it => {
      if (it.category) {
        const rawCat = String(it.category).trim();
        const id = rawCat.toLowerCase().replace(/\s+/g, '-');
        if (!map.has(id) && !map.has(rawCat) && id !== 'all' && rawCat.toLowerCase() !== 'all') {
          const displayName = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).replace(/[-_]/g, ' ');
          map.set(id, { id, name: displayName, icon: getCategoryEmoji(displayName), count: 0, image: it.image || null });
        }
      }
    });

    const list = Array.from(map.values()).map(cat => {
      const count = items.filter(it => {
        const itCat = String(it.category || '').toLowerCase().trim();
        const itCatNorm = itCat.replace(/\s+/g, '-');
        const targetId = cat.id.toLowerCase();
        const targetName = cat.name.toLowerCase();
        const matchesAlias = cat.aliases && Array.isArray(cat.aliases) && cat.aliases.some(a => itCat.includes(a.toLowerCase()) || a.toLowerCase().includes(itCat));
        return itCatNorm === targetId || itCat === targetName || itCat === targetId || itCatNorm === targetName.replace(/\s+/g, '-') || matchesAlias;
      }).length;
      return { ...cat, count };
    });

    // Only return real categories that have items in the menu (no 'all')
    return list.filter(cat => cat.count > 0);
  }, [categories, items]);

  // Retrieve optimal food plate photo for each category badge
  const getCategoryImageUrl = (cat) => {
    if (cat.image) return cat.image;
    if (cat.imageUrl) return cat.imageUrl;
    if (cat.id !== 'all') {
      const itWithImg = items.find(it => {
        const itCat = String(it.category || '').toLowerCase().trim();
        const itCatNorm = itCat.replace(/\s+/g, '-');
        const targetId = cat.id.toLowerCase();
        const targetName = cat.name.toLowerCase();
        const matchesAlias = cat.aliases && Array.isArray(cat.aliases) && cat.aliases.some(a => itCat.includes(a.toLowerCase()) || a.toLowerCase().includes(itCat));
        const belongs = itCatNorm === targetId || itCat === targetName || itCat === targetId || itCatNorm === targetName.replace(/\s+/g, '-') || matchesAlias;
        return belongs && it.image;
      });
      if (itWithImg && itWithImg.image) return itWithImg.image;
    }
    return getCategoryPlateImage(cat.name, cat.id);
  };

  // Default selectedCategory to the first real category as soon as allCategories is available
  useEffect(() => {
    if (allCategories.length > 0) {
      const isNearTop = (typeof window !== 'undefined' ? window.scrollY : 0) < 80;
      if (!userSelectedManually.current && isNearTop) {
        setSelectedCategory(allCategories[0].id);
      } else {
        const exists = allCategories.some(c => c.id.toLowerCase() === (selectedCategory || '').toLowerCase());
        if (!exists) {
          setSelectedCategory(allCategories[0].id);
        }
      }
    }
  }, [allCategories]);

  // Group items by parent category for clear category-wise display
  const categorizedGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = [];

    allCategories.forEach(cat => {
      const catItems = items.filter(it => {
        const itCat = String(it.category || '').toLowerCase().trim();
        const itCatNorm = itCat.replace(/\s+/g, '-');
        const targetId = cat.id.toLowerCase();
        const targetName = cat.name.toLowerCase();
        const matchesAlias = cat.aliases && Array.isArray(cat.aliases) && cat.aliases.some(a => itCat.includes(a.toLowerCase()) || a.toLowerCase().includes(itCat));
        const belongsToCat = itCatNorm === targetId || itCat === targetName || itCat === targetId || itCatNorm === targetName.replace(/\s+/g, '-') || matchesAlias;

        if (!belongsToCat) return false;

        if (q) {
          return it.name.toLowerCase().includes(q) ||
            (it.description && it.description.toLowerCase().includes(q)) ||
            (it.category && it.category.toLowerCase().includes(q));
        }
        return true;
      });

      if (catItems.length > 0) {
        groups.push({
          category: cat,
          items: catItems
        });
      }
    });

    // Account for any remaining items not caught by mapped categories
    const accountedIds = new Set(groups.flatMap(g => g.items.map(i => i._id)));
    const remaining = items.filter(it => {
      if (accountedIds.has(it._id)) return false;
      if (q) {
        return it.name.toLowerCase().includes(q) ||
          (it.description && it.description.toLowerCase().includes(q)) ||
          (it.category && it.category.toLowerCase().includes(q));
      }
      return true;
    });

    if (remaining.length > 0) {
      groups.push({
        category: { id: 'other', name: 'Other Delights', icon: '✨', count: remaining.length },
        items: remaining
      });
    }

    return groups;
  }, [allCategories, items, searchQuery]);

  const totalFilteredCount = useMemo(() => {
    return categorizedGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [categorizedGroups]);

  // Smooth bidirectional Scroll: Click category pill -> Scroll page to category section
  const handleCategoryClick = (categoryId) => {
    userSelectedManually.current = true;
    setSelectedCategory(categoryId);
    isProgrammaticScroll.current = true;

    // Keep active category pill visible in top horizontal bar
    const activePill = categoryBarRef.current?.querySelector(`[data-cat-pill="${categoryId}"]`);
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    const targetSection = document.getElementById(`category-section-${categoryId}`);
    if (targetSection) {
      const stickyHeight = stickyWrapperRef.current?.offsetHeight || 135;
      const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - stickyHeight - 10;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 750);
  };

  // Bidirectional ScrollSpy: As user scrolls down page, highlight active category & auto-scroll top bar
  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;

      const scrollY = window.scrollY;
      if (scrollY < 80) {
        userSelectedManually.current = false;
        if (allCategories.length > 0 && selectedCategory !== allCategories[0].id) {
          setSelectedCategory(allCategories[0].id);
          const firstPill = categoryBarRef.current?.querySelector(`[data-cat-pill="${allCategories[0].id}"]`);
          if (firstPill) {
            firstPill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
        return;
      }

      const stickyHeight = stickyWrapperRef.current?.offsetHeight || 135;
      const threshold = stickyHeight + 40;

      const sections = document.querySelectorAll('[data-category-id]');
      let currentActiveId = null;

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= threshold && rect.bottom > threshold) {
          currentActiveId = sec.getAttribute('data-category-id');
        }
      });

      // Bottom of page detection: activate last category if at bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70) {
        if (sections.length > 0) {
          currentActiveId = sections[sections.length - 1].getAttribute('data-category-id');
        }
      }

      if (currentActiveId && currentActiveId !== selectedCategory) {
        userSelectedManually.current = true;
        setSelectedCategory(currentActiveId);
        const activePill = categoryBarRef.current?.querySelector(`[data-cat-pill="${currentActiveId}"]`);
        if (activePill) {
          activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCategory, categorizedGroups, allCategories]);

  const FssaiDietaryBadge = ({ isVeg }) => {
    if (isVeg !== false) {
      return (
        <span
          title="Vegetarian"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            border: '1.5px solid #16a34a',
            borderRadius: 3,
            backgroundColor: 'transparent',
            flexShrink: 0,
            marginTop: 2
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
        </span>
      );
    }
    return (
      <span
        title="Non-Vegetarian"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          border: '1.5px solid #dc2626',
          borderRadius: 3,
          backgroundColor: 'transparent',
          flexShrink: 0,
          marginTop: 2
        }}
      >
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: '3.5px solid transparent',
            borderRight: '3.5px solid transparent',
            borderBottom: '6.5px solid #dc2626'
          }}
        />
      </span>
    );
  };

  const getItemQuantity = (item) => {
    if (!item) return 0;
    const matching = cartItems.filter(ci => 
      ci.itemId === item._id || ci.id === item._id || (typeof ci.id === 'string' && ci.id.startsWith(`${item._id}_`))
    );
    return matching.reduce((sum, ci) => sum + (ci.quantity || 0), 0);
  };

  // Trigger flying dish particle animation directly from clicked button into BottomBar Cart
  const triggerFlyToCart = (item, event) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (event) {
      const el = event.currentTarget || event.target;
      if (el && typeof el.getBoundingClientRect === 'function') {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        } else if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX > 0 || event.clientY > 0)) {
          startX = event.clientX;
          startY = event.clientY;
        }
      } else if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX > 0 || event.clientY > 0)) {
        startX = event.clientX;
        startY = event.clientY;
      } else if (event.touches && event.touches[0]) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
      }
    }

    let targetX = window.innerWidth * 0.375;
    let targetY = window.innerHeight - 35;

    // Accurately locate Floating Capsule Cart or BottomBar Cart button center
    if (bottomCartRef.current) {
      const cartRect = bottomCartRef.current.getBoundingClientRect();
      targetX = cartRect.left + cartRect.width / 2;
      targetY = cartRect.top + cartRect.height / 2;
    } else {
      const bottomCartBtn = document.getElementById('bottom-nav-cart-btn') || document.querySelector('[data-bottom-tab="cart"]');
      if (bottomCartBtn) {
        const cartRect = bottomCartBtn.getBoundingClientRect();
        targetX = cartRect.left + cartRect.width / 2;
        targetY = cartRect.top + cartRect.height / 2;
      }
    }

    const particleId = Date.now() + Math.random();
    setFlyingParticles((prev) => [
      ...prev,
      {
        id: particleId,
        startX,
        startY,
        targetX,
        targetY,
        image: getValidFoodImage(item),
      },
    ]);
  };

  const handleIncrement = (item, event) => {
    if (event && event.stopPropagation) event.stopPropagation();

    // Trigger visual flight to cart wherever + is tapped
    triggerFlyToCart(item, event);

    const matching = cartItems.filter(ci => 
      ci.itemId === item._id || ci.id === item._id || (typeof ci.id === 'string' && ci.id.startsWith(`${item._id}_`))
    );
    if (matching.length === 1) {
      updateItemQuantity(matching[0].id, matching[0].quantity + 1);
    } else if (matching.length > 1) {
      updateItemQuantity(matching[matching.length - 1].id, matching[matching.length - 1].quantity + 1);
    } else {
      handleAdd(item, event);
    }
  };

  const handleDecrement = (item, event) => {
    if (event && event.stopPropagation) event.stopPropagation();
    const matching = cartItems.filter(ci => 
      ci.itemId === item._id || ci.id === item._id || (typeof ci.id === 'string' && ci.id.startsWith(`${item._id}_`))
    );
    if (matching.length > 0) {
      const target = matching[matching.length - 1];
      if (target.quantity <= 1) {
        removeItem(target.id);
      } else {
        updateItemQuantity(target.id, target.quantity - 1);
      }
    }
  };

  const handleAdd = (item, event, overrideVariant = null, overrideAddons = null, overrideNotes = null, overrideQty = 1) => {
    if (!item.available && item.available !== undefined) {
      toast.error(`${item.name} is currently out of stock`);
      return;
    }

    const vars = item.variants || item.sizes || item.portionSizes || [];
    const addons = item.addons || [];

    // If item has customizable options (variants or add-ons) and user tapped without customizing, open bottom-sheet modal!
    if ((vars.length > 0 || addons.length > 0) && !overrideVariant && !selectedItem) {
      openItemDetails(item);
      return;
    }

    const chosenVariant = overrideVariant || selectedVariant || (vars.length > 0 ? vars[0] : null);
    let basePrice = item.price;
    let variantLabel = '';

    if (chosenVariant) {
      if (typeof chosenVariant === 'object') {
        basePrice = Number(chosenVariant.price) || item.price;
        variantLabel = chosenVariant.name || chosenVariant.size || '';
      } else {
        variantLabel = String(chosenVariant);
      }
    }

    const chosenAddons = overrideAddons || selectedAddons || [];
    const addonsPrice = chosenAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const addonsLabel = chosenAddons.map(a => a.name).join(', ');

    const discount = item.discount || {};
    let finalBasePrice = basePrice;
    if (discount.isDiscounted && discount.value > 0) {
      if (discount.type === 'percentage') {
        finalBasePrice = Math.max(0, Math.round(basePrice * (1 - discount.value / 100)));
      } else {
        finalBasePrice = Math.max(0, basePrice - discount.value);
      }
    }

    const finalItemPrice = finalBasePrice + addonsPrice;
    const notes = overrideNotes !== null ? overrideNotes : (dishNotes || '');
    const qty = Math.max(1, overrideQty || 1);

    const parts = [item._id];
    if (variantLabel) parts.push(variantLabel);
    if (addonsLabel) parts.push(addonsLabel);
    const cartId = parts.join('_');

    let cartName = item.name;
    if (variantLabel) cartName += ` (${variantLabel})`;
    if (addonsLabel) cartName += ` + ${addonsLabel}`;

    addItem({
      id: cartId,
      itemId: item._id,
      name: cartName,
      price: finalItemPrice,
      originalPrice: basePrice + addonsPrice,
      category: item.category,
      image: getValidFoodImage(item),
      variant: chosenVariant ? (typeof chosenVariant === 'object' ? chosenVariant : { name: variantLabel, price: finalBasePrice }) : null,
      addons: chosenAddons,
      specialNotes: notes,
      quantity: qty
    });

    // Spawn Flying Particle Animation to Cart
    triggerFlyToCart(item, event);

    toast.success(`Added ${item.name} to cart!`, {
      icon: '🍽️',
      style: {
        borderRadius: '16px',
        background: theme.bgCard,
        color: theme.textMain,
        border: `1px solid ${theme.accent}`,
        boxShadow: `0 10px 30px ${theme.accentGlow}`
      },
    });
  };

  const cartTotalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cafeName = tenantInfo?.name || tenantInfo?.restaurantName || tenantInfo?.businessName || localStorage.getItem('restaurant_name') || "SERVIQ Gourmet Bistro";
  const cafeLogo = tenantInfo?.logo || tenantInfo?.settings?.logo || tenantInfo?.logoUrl || localStorage.getItem('restaurant_logo') || null;
  const cafeInitials = cafeName ? cafeName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() : 'SQ';

  return (
    <div className={styles.page} style={{ backgroundColor: theme.bgPage, color: theme.textMain, transition: 'background-color 0.3s' }}>
      <Toaster position="top-center" />

      {/* FLYING CART PARTICLES OVERLAY (Butter-Smooth Parabolic Flight directly into Bottom Cart) */}
      {flyingParticles.map((p) => {
        const midY = Math.min(p.startY - 35, (p.startY + p.targetY) / 2 - 20);
        return (
          <motion.div
            key={p.id}
            initial={{
              x: p.startX - 22,
              y: p.startY - 22,
              scale: 0.95,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              x: [p.startX - 22, (p.startX + p.targetX) / 2, p.targetX - 22],
              y: [p.startY - 22, midY, p.targetY - 22],
              scale: [0.95, 1.25, 0.85, 0.2],
              rotate: [0, -12, 10, 0],
              opacity: [1, 1, 1, 0]
            }}
            transition={{
              duration: 0.65,
              ease: "easeInOut",
              x: { duration: 0.65, times: [0, 0.45, 1], ease: "easeInOut" },
              y: { duration: 0.65, times: [0, 0.35, 1], ease: [0.4, 0, 0.2, 1] },
              scale: { duration: 0.65, times: [0, 0.25, 0.85, 1], ease: "easeInOut" },
              rotate: { duration: 0.65, times: [0, 0.3, 0.7, 1], ease: "easeInOut" },
              opacity: { duration: 0.65, times: [0, 0.85, 0.96, 1], ease: "easeOut" }
            }}
            onAnimationComplete={() => {
              setFlyingParticles((prev) => prev.filter((it) => it.id !== p.id));
              setIsCartBouncing(true);
              setTimeout(() => setIsCartBouncing(false), 500);
            }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: 44,
              height: 44,
              borderRadius: '50%',
              overflow: 'hidden',
              zIndex: 99999,
              pointerEvents: 'none',
              border: '2.5px solid #ffffff',
              boxShadow: `0 10px 25px rgba(234, 88, 12, 0.7), 0 2px 10px rgba(0,0,0,0.3)`,
              willChange: 'transform, opacity',
              transform: 'translateZ(0)'
            }}
          >
            <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
        );
      })}

      <div className={styles.appContainer} style={{ backgroundColor: theme.bgPage, borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 20px 80px rgba(0, 0, 0, 0.8)' : '0 10px 40px rgba(0, 0, 0, 0.05)', transition: 'background-color 0.3s, border-color 0.3s' }}>

        {/* SCREEN 1: Home Menu Browsing (Always rendered) */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          {/* Restaurant & Cafe Animated Culinary Loader */}
          {isLoading ? (
            <RestaurantCafeLottieLoader
              cafeName={cafeName}
              tableNumber={tableNumber}
              cafeLogo={cafeLogo}
              cafeInitials={cafeInitials}
              isDarkMode={isDarkMode}
            />
          ) : (
            <>
              {/* STICKY PINNED TOP SECTION (Header + Search + Active Order Banner + Categories) */}
              <div ref={stickyWrapperRef} className={styles.stickyTopWrapper} style={{ backgroundColor: theme.bgPage }}>
                {/* Top Header Card */}
                <div style={{ backgroundColor: theme.bgHeader, padding: '0.75rem 1rem 0.6rem', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.3s', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {cafeLogo ? (
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: `1.5px solid ${theme.border}`,
                          boxShadow: `0 2px 8px ${theme.accentGlow}`,
                          flexShrink: 0,
                          backgroundColor: theme.bgInner,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={cafeLogo}
                            alt={cafeName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerHTML = `<span style="font-size:12px;font-weight:800;color:${theme.textMain};">${cafeInitials}</span>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          background: `linear-gradient(135deg, ${theme.accent}, #b91c1c)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 3px 10px ${theme.accentGlow}`,
                          flexShrink: 0,
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '0.84rem',
                          letterSpacing: '0.3px'
                        }}>
                          {cafeInitials}
                        </div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <h2 style={{ fontSize: '1.02rem', fontWeight: '800', color: theme.textMain, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{cafeName}</h2>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Order Track Badge (Animated) */}
                      <TrackOrderBadge
                        activeRunningOrder={activeRunningOrder}
                        tableNumber={tableNumber}
                        isDarkMode={isDarkMode}
                      />

                      {/* Table Number Badge */}
                      <TableBadge tableNumber={tableNumber} isDarkMode={isDarkMode} style={{ padding: '4px 9px', fontSize: '0.8rem' }} />

                      {/* Theme Toggle Button */}
                      <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        style={{
                          background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          padding: 0
                        }}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      >
                        {isDarkMode ? <Sun size={16} color="#fbbe21" /> : <Moon size={16} color="#475569" />}
                      </button>
                    </div>
                  </div>

                  {/* Search Box */}
                  <div style={{ display: 'flex', gap: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={15} color={theme.textMuted} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Would you like to eat something?..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '0.48rem 0.85rem 0.48rem 2.35rem', color: theme.inputText, fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Categories Navigation (or Skeleton) */}
                {isFetchingMenu && items.length === 0 ? null : (
                  allCategories.length > 0 && (
                    <section
                      ref={categoryBarRef}
                      className={styles.categoryBar}
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(20, 16, 12, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                        borderBottom: `1px solid ${theme.border}`,
                        padding: '0.35rem 0.85rem 0.25rem',
                      }}
                    >
                      {allCategories.map((c) => {
                        const isSelected = Boolean(selectedCategory && c.id && selectedCategory.toLowerCase() === c.id.toLowerCase());
                        const imgUrl = getCategoryImageUrl(c);
                        return (
                          <button
                            key={c.id}
                            data-cat-pill={c.id}
                            onClick={() => handleCategoryClick(c.id)}
                            className={styles.categoryPill}
                            style={{
                              outline: 'none',
                            }}
                          >
                            <div
                              className={styles.categoryCircleImgWrap}
                              style={{
                                border: isSelected
                                   ? `2.5px solid ${theme.accent}`
                                   : `1.5px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)'}`,
                                boxShadow: isSelected
                                  ? `0 0 0 2px ${isDarkMode ? 'rgba(224, 92, 92, 0.35)' : 'rgba(224, 92, 92, 0.22)'}, 0 4px 12px ${theme.accentGlow}`
                                  : (isDarkMode ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)'),
                                transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                                background: isDarkMode ? '#1e1812' : '#ffffff',
                              }}
                            >
                              <img
                                src={imgUrl}
                                alt={c.name}
                                className={styles.categoryCircleImg}
                                loading="lazy"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getCategoryPlateImage(c.name, c.id);
                                }}
                              />
                            </div>
                            <span
                              className={styles.categoryLabel}
                              style={{
                                color: isSelected
                                  ? theme.accent
                                  : (isDarkMode ? '#cbd5e1' : '#334155'),
                                fontWeight: isSelected ? '900' : '600',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                              }}
                            >
                              {c.name}
                            </span>
                            {isSelected ? (
                              <div
                                className={styles.categoryActiveDot}
                                style={{
                                  backgroundColor: theme.accent,
                                  boxShadow: `0 2px 8px ${theme.accentGlow}`,
                                }}
                              />
                            ) : (
                              <div style={{ height: 3, width: 36, marginTop: 2, visibility: 'hidden' }} />
                            )}
                          </button>
                        );
                      })}
                    </section>
                  )
                )}
              </div>

              {/* Shimmer Skeleton or Real Dishes Grid */}
              {isFetchingMenu && items.length === 0 ? (
                <MenuSkeletonShimmer isDarkMode={isDarkMode} theme={theme} />
              ) : (
                <>
                  {/* Dishes Grid */}
                  <main style={{ padding: '0.75rem 1rem 1rem', width: '100%', boxSizing: 'border-box' }}>
                    {totalFilteredCount === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2.5rem 1rem 2rem',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                          width: '100%'
                        }}
                      >
                        {/* Floating Soft-Glow Icon Container */}
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            width: '76px',
                            height: '76px',
                            borderRadius: '22px',
                            background: isDarkMode
                              ? 'linear-gradient(135deg, rgba(224, 92, 92, 0.16), rgba(249, 115, 22, 0.08))'
                              : 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                            border: `1.5px solid ${isDarkMode ? 'rgba(224, 92, 92, 0.25)' : 'rgba(249, 115, 22, 0.3)'}`,
                            boxShadow: `0 10px 25px ${theme.accentGlow}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            marginBottom: '1rem'
                          }}
                        >
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UtensilsCrossed size={32} color={theme.accent} strokeWidth={2.2} />
                            <motion.div
                              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: theme.accent,
                                borderRadius: '50%',
                                padding: '3px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Search size={11} color="#ffffff" strokeWidth={3} />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Heading & Subtitle */}
                        <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: theme.textMain, margin: '0 0 0.35rem 0', letterSpacing: '-0.01em' }}>
                          {searchQuery ? `No results for "${searchQuery}"` : "No Dishes Available"}
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: theme.textMuted, margin: '0 0 1.1rem 0', maxWidth: '270px', lineHeight: 1.45 }}>
                          {searchQuery
                            ? "We couldn't find any dishes matching your search. Try checking your spelling or explore other items."
                            : "No dishes found in this section right now. Explore other categories!"}
                        </p>

                        {/* Quick Action Button */}
                        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {searchQuery && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => setSearchQuery('')}
                              style={{
                                backgroundColor: theme.accent,
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.45rem 1rem',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                boxShadow: `0 4px 12px ${theme.accentGlow}`
                              }}
                            >
                              <X size={13} strokeWidth={3} />
                              Clear Search
                            </motion.button>
                          )}

                          {allCategories.length > 0 && selectedCategory !== allCategories[0].id && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => { handleCategoryClick(allCategories[0].id); setSearchQuery(''); }}
                              style={{
                                backgroundColor: isDarkMode ? '#1e1812' : '#f1f5f9',
                                color: theme.textMain,
                                border: `1px solid ${theme.border}`,
                                padding: '0.45rem 1rem',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Back to {allCategories[0].name}
                            </motion.button>
                          )}
                        </div>

                        {/* Suggested Quick Category Pills */}
                        {allCategories.length > 1 && (
                          <div style={{ marginTop: '1.4rem', width: '100%' }}>
                            <span style={{ fontSize: '0.66rem', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.45rem' }}>
                              Explore Categories
                            </span>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {allCategories.filter(c => c.id !== 'all').slice(0, 4).map((c) => (
                                <motion.button
                                  key={c.id}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => { handleCategoryClick(c.id); setSearchQuery(''); }}
                                  style={{
                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                                    border: `1px solid ${theme.border}`,
                                    color: theme.textMain,
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '100px',
                                    fontSize: '0.68rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    boxShadow: isDarkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.04)'
                                  }}
                                >
                                  <span>{c.icon}</span>
                                  <span>{c.name}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
                        {categorizedGroups.map((group) => (
                          <section
                            key={group.category.id}
                            id={`category-section-${group.category.id}`}
                            data-category-id={group.category.id}
                            className={styles.categorySection}
                          >
                            {/* Category Section Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.2rem 0.65rem',
                              marginBottom: '0.85rem',
                              borderBottom: `1.5px solid ${theme.border}`,
                              position: 'relative'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{group.category.icon}</span>
                                <h2 style={{
                                  fontSize: '1.08rem',
                                  fontWeight: '800',
                                  color: theme.textMain,
                                  margin: 0,
                                  letterSpacing: '-0.02em'
                                }}>
                                  {group.category.name}
                                </h2>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: '800',
                                  backgroundColor: isDarkMode ? '#2c221a' : '#f1f5f9',
                                  color: theme.accent,
                                  padding: '2px 7.5px',
                                  borderRadius: '100px',
                                  border: `1px solid ${theme.border}`
                                }}>
                                  {group.items.length}
                                </span>
                              </div>
                            </div>

                            {/* Dishes Grid */}
                            <div className={styles.grid}>
                              {group.items.map((item) => {
                                const discount = item.discount || {};
                                const hasDiscount = Boolean(discount.isDiscounted && discount.value > 0);
                                let discountedPrice = item.price;
                                if (hasDiscount) {
                                  if (discount.type === 'percentage') {
                                    discountedPrice = Math.max(0, Math.round(item.price * (1 - discount.value / 100)));
                                  } else {
                                    discountedPrice = Math.max(0, item.price - discount.value);
                                  }
                                }
                                const isOutOfStock = item.available === false || item.isAvailable === false;
                                const vars = item.variants || item.sizes || item.portionSizes || [];
                                const addons = item.addons || [];
                                const isCustomizable = vars.length > 0 || addons.length > 0;

                                return (
                                  <motion.div
                                    key={item._id}
                                    className={styles.dishCard}
                                    style={{
                                      backgroundColor: theme.bgCard,
                                      border: `1px solid ${theme.cardBorder}`,
                                      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.45)' : '0 4px 18px rgba(15, 23, 42, 0.05)',
                                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                      opacity: isOutOfStock ? 0.65 : 1
                                    }}
                                    whileHover={!isOutOfStock ? { y: -3, borderColor: theme.accent } : {}}
                                    whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                                    onClick={() => !isOutOfStock && setViewingDishDetails(item)}
                                  >
                                    {/* Image container */}
                                    <div className={styles.dishImageWrap}>
                                      <img
                                        src={getValidFoodImage(item)}
                                        alt={item.name}
                                        className={styles.dishImg}
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"; }}
                                      />
                                      <div className={styles.ratingPill}>
                                        <Star size={10} color="#fbbe21" fill="#fbbe21" />
                                        <span style={{ fontSize: '9.5px', color: '#ffffff', fontWeight: 800 }}>{item.rating || '4.8'}</span>
                                      </div>

                                      {hasDiscount && (
                                        <span className={styles.discountBadge}>
                                          {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                                        </span>
                                      )}
                                      {isOutOfStock && (
                                        <div className={styles.outOfStockOverlay}>
                                          OUT OF STOCK
                                        </div>
                                      )}
                                    </div>

                                    {/* Content Area */}
                                    <div className={styles.dishContent}>
                                      <div className={styles.dishTitleRow}>
                                        <FssaiDietaryBadge isVeg={item.isVeg !== false} />
                                        <h3 className={styles.dishTitle} style={{ color: theme.textMain }}>
                                          {item.name}
                                        </h3>
                                      </div>
                                      <p className={styles.dishDesc} style={{ color: theme.textMuted }}>
                                        {item.description || "Prepared fresh to order"}
                                      </p>
                                    </div>

                                    {/* Footer: Price & Uniform Action Button */}
                                    <div className={styles.dishFooter}>
                                      <div className={styles.priceCol}>
                                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                          <span className={styles.priceCurrent} style={{ color: hasDiscount ? '#16a34a' : theme.textMain }}>
                                            ₹{discountedPrice}
                                          </span>
                                          {hasDiscount && (
                                            <span className={styles.priceOriginal} style={{ color: theme.textMuted }}>
                                              ₹{item.price}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action Button: Stepper if in cart and single variant, else circular Plus button */}
                                      <div className={styles.btnActionWrapper} onClick={(e) => e.stopPropagation()}>
                                        {(() => {
                                          const qty = getItemQuantity(item);
                                          if (qty > 0 && !isCustomizable) {
                                            return (
                                              <div
                                                className={styles.qtyStepper}
                                                style={{
                                                  backgroundColor: theme.accent,
                                                  boxShadow: `0 3px 10px ${theme.accentGlow}`
                                                }}
                                              >
                                                <motion.button
                                                  whileTap={{ scale: 0.8 }}
                                                  onClick={(e) => handleDecrement(item, e)}
                                                  className={styles.stepperBtn}
                                                  title="Decrease quantity"
                                                >
                                                  <Minus size={11} strokeWidth={3.5} />
                                                </motion.button>
                                                <span className={styles.stepperVal}>
                                                  {qty}
                                                </span>
                                                <motion.button
                                                  whileTap={{ scale: 0.8 }}
                                                  onClick={(e) => handleIncrement(item, e)}
                                                  className={styles.stepperBtn}
                                                  title="Increase quantity"
                                                >
                                                  <Plus size={11} strokeWidth={3.5} />
                                                </motion.button>
                                              </div>
                                            );
                                          }

                                          return (
                                            <motion.button
                                              whileHover={!isOutOfStock ? { scale: 1.1 } : {}}
                                              whileTap={!isOutOfStock ? { scale: 0.88 } : {}}
                                              disabled={isOutOfStock}
                                              onClick={(e) => {
                                                if (isCustomizable) {
                                                  openItemDetails(item);
                                                } else {
                                                  handleAdd(item, e);
                                                }
                                              }}
                                              className={styles.addPlusOnlyBtn}
                                              style={{
                                                backgroundColor: isOutOfStock ? '#64748b' : theme.accent,
                                                boxShadow: isOutOfStock ? 'none' : `0 4px 12px ${theme.accentGlow}`
                                              }}
                                              title="Add dish"
                                            >
                                              <Plus size={13} strokeWidth={3.5} />
                                            </motion.button>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </main>

              {/* Dynamic Combos & Special Offers */}
              {(() => {
                const comboItems = items.filter(it => {
                  const cat = (it.category || '').toLowerCase();
                  return cat.includes('combo') || cat.includes('offer') || it.isCombo || it.isOffer;
                });

                if (comboItems.length === 0) return null;

                return (
                  <div style={{ padding: '0 1rem 1.25rem', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: theme.textMain, margin: 0 }}>Combos & Special Offers</h3>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: theme.accent, cursor: 'pointer' }}>Chef Special</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                      {comboItems.map((cb) => (
                        <motion.div
                          key={cb._id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setViewingDishDetails(cb)}
                          style={{ display: 'flex', borderRadius: '18px', overflow: 'hidden', backgroundColor: theme.accent, height: '105px', boxShadow: `0 6px 20px ${theme.accentGlow}`, cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
                        >
                          <div style={{ flex: 1.2, padding: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                            <div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cb.name}</span>
                              <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.88)', margin: '2px 0 0 0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cb.description || 'Special Chef Combo'}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>₹{cb.price}</span>

                              <motion.button
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.88 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const vars = cb.variants || cb.sizes || cb.portionSizes || [];
                                  const addons = cb.addons || [];
                                  if (vars.length > 0 || addons.length > 0) {
                                    openItemDetails(cb);
                                  } else {
                                    handleAdd(cb, e);
                                  }
                                }}
                                style={{
                                  backgroundColor: '#ffffff',
                                  border: 'none',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  color: theme.accent,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
                                  flexShrink: 0
                                }}
                              >
                                <Plus size={15} strokeWidth={3.5} style={{ display: 'block', margin: 'auto' }} />
                              </motion.button>
                            </div>
                          </div>
                          <div style={{ flex: 0.8, overflow: 'hidden' }}>
                            <img src={getValidFoodImage(cb)} alt={cb.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}
                </>
              )}
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE CUSTOMIZATION & DETAILS BOTTOM SHEET MODAL                      */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {selectedItem && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeItemDetails}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
              />

              {/* Modal Card Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '480px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                  maxHeight: '92vh',
                  boxSizing: 'border-box'
                }}
              >
                {/* Floating Top Close Button */}
                <motion.button
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeItemDetails();
                  }}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.45)',
                    flexShrink: 0
                  }}
                  title="Close"
                >
                  <X size={20} strokeWidth={2.5} />
                </motion.button>

                {/* Bottom Sheet Card */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: theme.bgCard,
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    width: '100%',
                    maxHeight: '82vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
                    border: `1px solid ${theme.border}`,
                    borderBottom: 'none'
                  }}
                >
                  {/* Scrollable Customization Content */}
                  <div style={{ padding: '1.2rem 1.25rem 0.6rem', overflowY: 'auto', flex: '1 1 auto' }}>
                    {/* Header Row: Title & Badge on Left, Quantity Stepper on Right */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingBottom: '0.85rem', borderBottom: `1px solid ${theme.border}`, marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FssaiDietaryBadge isVeg={selectedItem.isVeg !== false} size={16} />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: theme.textMain, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedItem.name}
                        </h3>
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          border: `1.5px solid ${theme.border}`,
                          borderRadius: '10px',
                          padding: '4px 10px',
                          backgroundColor: theme.bgInner,
                          flexShrink: 0
                        }}
                      >
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.78 }}
                          onClick={() => setModalDishQty(prev => Math.max(1, prev - 1))}
                          style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '1px', fontWeight: '900' }}
                          title="Decrease"
                        >
                          <Minus size={14} strokeWidth={3.5} />
                        </motion.button>
                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: theme.textMain, minWidth: '16px', textAlign: 'center' }}>
                          {modalDishQty}
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.78 }}
                          onClick={() => setModalDishQty(prev => prev + 1)}
                          style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '1px', fontWeight: '900' }}
                          title="Increase"
                        >
                          <Plus size={14} strokeWidth={3.5} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Variants / Portion Sizes */}
                    {(() => {
                      const availableVariants = selectedItem.variants || selectedItem.sizes || selectedItem.portionSizes || [];
                      if (!Array.isArray(availableVariants) || availableVariants.length === 0) return null;

                      return (
                        <div style={{ marginBottom: '0.9rem' }}>
                          <h4 style={{ fontSize: '0.78rem', fontWeight: '800', color: theme.textMuted, margin: '0 0 0.55rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Choose Size / Variant
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {availableVariants.map((v, idx) => {
                              const vName = typeof v === 'object' ? (v.name || v.size || `Option ${idx + 1}`) : String(v);
                              const vPrice = typeof v === 'object' ? (Number(v.price) || selectedItem.price) : selectedItem.price;
                              const isSelected = selectedVariant && (
                                typeof selectedVariant === 'object' ? (selectedVariant.name === vName || selectedVariant.size === vName) : String(selectedVariant) === String(v)
                              );

                              return (
                                <motion.div
                                  key={vName || idx}
                                  whileHover={{ scale: 1.006 }}
                                  whileTap={{ scale: 0.985 }}
                                  onClick={() => setSelectedVariant(v)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.72rem 1rem',
                                    borderRadius: '14px',
                                    border: isSelected ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
                                    backgroundColor: isSelected ? `${theme.accent}0d` : theme.bgCard,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: isSelected ? `2px solid ${theme.accent}` : `1.5px solid ${theme.textMuted}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}
                                    >
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: theme.accent }}
                                        />
                                      )}
                                    </div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.accent : theme.textMain }}>
                                      {vName}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: isSelected ? theme.accent : theme.textMain }}>
                                    ₹ {Number(vPrice).toFixed(2)}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Extra Add-ons */}
                    {Array.isArray(selectedItem.addons) && selectedItem.addons.length > 0 && (
                      <div style={{ marginBottom: '0.9rem' }}>
                        <h4 style={{ fontSize: '0.78rem', fontWeight: '800', color: theme.textMuted, margin: '0 0 0.55rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Extra Add-ons
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {selectedItem.addons.map((addon, aIdx) => {
                            const isChecked = selectedAddons.some(a => a.name === addon.name);
                            return (
                              <motion.div
                                key={addon.name || aIdx}
                                whileHover={{ scale: 1.006 }}
                                whileTap={{ scale: 0.985 }}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedAddons(prev => prev.filter(a => a.name !== addon.name));
                                  } else {
                                    setSelectedAddons(prev => [...prev, addon]);
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.68rem 1rem',
                                  backgroundColor: isChecked ? `${theme.accent}0d` : theme.bgCard,
                                  border: isChecked ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
                                  borderRadius: '13px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    style={{ accentColor: theme.accent, width: '15px', height: '15px', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? '700' : '600', color: theme.textMain }}>{addon.name}</span>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: theme.accent }}>+₹{addon.price || 0}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Special Instructions note */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '13px',
                          padding: '0.68rem 1rem',
                          backgroundColor: theme.bgInner
                        }}
                      >
                        <FileText size={16} color={theme.textMuted} style={{ flexShrink: 0 }} />
                        <input
                          type="text"
                          value={dishNotes}
                          onChange={(e) => setDishNotes(e.target.value)}
                          placeholder="Add cooking note (e.g. less spicy, extra dip)..."
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            color: theme.textMain,
                            fontSize: '0.84rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sticky Bottom Action Bar with Total on Left & White Add to Cart Button on Right */}
                  {(() => {
                    const currentPrice = (selectedVariant && typeof selectedVariant === 'object')
                      ? (Number(selectedVariant.price) || selectedItem.price)
                      : selectedItem.price;
                    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
                    const unitPrice = currentPrice + addonsTotal;
                    const dynamicTotal = unitPrice * modalDishQty;

                    return (
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${theme.accent}, #ea580c)`,
                          padding: '0.8rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
                          flexShrink: 0
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.1 }}>
                            ₹ {Number(dynamicTotal).toFixed(2)}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.92)', fontWeight: '600' }}>
                            Total Price
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => {
                            handleAdd(selectedItem, e, selectedVariant, selectedAddons, dishNotes, modalDishQty);
                            closeItemDetails();
                          }}
                          style={{
                            backgroundColor: '#ffffff',
                            color: theme.accent,
                            border: 'none',
                            fontWeight: '800',
                            fontSize: '0.88rem',
                            padding: '0.6rem 1.5rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            letterSpacing: '0.01em'
                          }}
                        >
                          Add to Cart
                        </motion.button>
                      </div>
                    );
                  })()}
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Capsule Cart (Ultra-Premium Gourmet Gradient & Perfectly Horizontally Centered) */}
        <AnimatePresence>
          {!isLoading && cartTotalItems > 0 && !selectedItem && (
            <div className={styles.floatingCapsuleCartWrap}>
              <motion.div
                ref={bottomCartRef}
                initial={{ y: 80, scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 80, scale: 0.9, opacity: 0 }}
                className={styles.floatingCapsuleCart}
              >
                <Link to={`/cart?table=${tableNumber}`} className={styles.capsuleCartLink}>
                  {/* Left: Overlapping Circular Item Images (Avatar Stack) */}
                  <motion.div
                    className={styles.capsuleImgStack}
                    animate={isCartBouncing ? { scale: [1, 1.15, 0.95, 1.08, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    {cartItems.slice(0, 3).map((ci, idx) => (
                      <div
                        key={ci.id || idx}
                        className={styles.capsuleImgWrap}
                        style={{
                          zIndex: idx + 1,
                          marginLeft: idx === 0 ? 0 : -14,
                        }}
                      >
                        <img
                          src={ci.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=240"}
                          alt={ci.name || "Dish"}
                          className={styles.capsuleImg}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=240";
                          }}
                        />
                      </div>
                    ))}
                  </motion.div>

                  {/* Center: View Cart Text & Item Count / Total */}
                  <div className={styles.capsuleTextCol}>
                    <span className={styles.capsuleTitle}>View cart</span>
                    <span className={styles.capsuleSubtitle}>
                      {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}
                      {getCartTotal() > 0 ? ` • ₹${Math.round(getCartTotal())}` : ''}
                    </span>
                  </div>

                  {/* Right: Premium Frosted Disc with Chevron Arrow */}
                  <div className={styles.capsuleArrowCircle}>
                    <ChevronRight size={18} strokeWidth={2.8} color="#ffffff" />
                  </div>
                </Link>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Separate Dish Details Page / Modal */}
        <DishDetailsModal
          dish={viewingDishDetails}
          isOpen={Boolean(viewingDishDetails)}
          onClose={() => setViewingDishDetails(null)}
          onAddToCart={handleAdd}
          onOpenCustomization={(dish) => {
            setViewingDishDetails(null);
            openItemDetails(dish);
          }}
          isDarkMode={isDarkMode}
        />

        {/* Customer Bottom Navigation Bar (Menu, Cart, History, Profile) */}
        {!isLoading && (
          <CustomerBottomNav
            tableNumber={tableNumber}
            tenantId={tenantId}
            tenantInfo={tenantInfo}
            isDarkMode={isDarkMode}
            isCartBouncing={isCartBouncing}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        )}

      </div>
    </div>
  );
}


