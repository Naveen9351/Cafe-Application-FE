import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ChevronRight, Sliders, Star, ChevronLeft, Menu as MenuIcon, Search, Plus, Minus, Sun, Moon, Sparkles, Heart, Check, Clock, X, FileText, Utensils, Zap
} from "lucide-react";
import { getValidFoodImage } from "./AdminPanel";
import { decodeTableToken, encodeTableToken } from "../utils/tableToken";
import styles from "./Menu.module.css";
import { API_URL as API } from "../config/api";
import RestaurantCafeLottieLoader from "./RestaurantCafeLottieLoader";
import DishDetailsModal from "./DishDetailsModal";

export default function Menu() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
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
        const elapsed = Date.now() - fetchStart;
        const delay = Math.max(0, 2500 - elapsed);
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
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
    map.set("all", { id: "all", name: "All Items", icon: "🍽️", count: items.length });

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
        if (id && id !== 'all' && c.name?.toLowerCase() !== 'all' && c.name?.toLowerCase() !== 'all items') {
          // Never use string icon name directly; map to emoji
          const emoji = (c.icon && /\p{Extended_Pictographic}/u.test(c.icon) && c.icon.length <= 4)
            ? c.icon
            : getCategoryEmoji(c.name || c.icon || id);
          map.set(id, { id, name: c.name, icon: emoji, aliases: c.aliases || [], count: 0 });
        }
      });
    }

    items.forEach(it => {
      if (it.category) {
        const rawCat = String(it.category).trim();
        const id = rawCat.toLowerCase().replace(/\s+/g, '-');
        if (!map.has(id) && !map.has(rawCat) && id !== 'all') {
          const displayName = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).replace(/[-_]/g, ' ');
          map.set(id, { id, name: displayName, icon: getCategoryEmoji(displayName), count: 0 });
        }
      }
    });

    const list = Array.from(map.values()).map(cat => {
      if (cat.id === "all") {
        return { ...cat, count: items.length };
      }
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

    // Only return categories that have items in the current menu
    return list.filter(cat => cat.id === 'all' || cat.count > 0);
  }, [categories, items]);

  const filteredItems = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedCategory === "all") return true;

    const selectedCatObj = allCategories.find(c => c.id.toLowerCase() === selectedCategory.toLowerCase());
    const itemCat = String(item.category || '').toLowerCase().trim();
    const itemCatNorm = itemCat.replace(/\s+/g, '-');
    const selectedCatNorm = selectedCategory.toLowerCase().replace(/\s+/g, '-');

    const matchesAlias = selectedCatObj?.aliases && Array.isArray(selectedCatObj.aliases) && selectedCatObj.aliases.some(a => itemCat.includes(a.toLowerCase()) || a.toLowerCase().includes(itemCat));

    return (
      itemCatNorm === selectedCatNorm ||
      itemCat === selectedCategory.toLowerCase() ||
      (selectedCatObj && (itemCat === selectedCatObj.name.toLowerCase() || itemCatNorm === selectedCatObj.name.toLowerCase().replace(/\s+/g, '-'))) ||
      matchesAlias
    );
  });

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

  const handleIncrement = (item, event) => {
    if (event && event.stopPropagation) event.stopPropagation();
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
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      let targetX = window.innerWidth - 45;
      let targetY = 40;

      // Prefer top header cart icon if available, else bottom floating cart
      if (cartIconRef.current) {
        const cartRect = cartIconRef.current.getBoundingClientRect();
        targetX = cartRect.left + cartRect.width / 2;
        targetY = cartRect.top + cartRect.height / 2;
      } else if (bottomCartRef.current) {
        const cartRect = bottomCartRef.current.getBoundingClientRect();
        targetX = cartRect.left + cartRect.width / 2;
        targetY = cartRect.top + cartRect.height / 2;
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
    } else {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 400);
    }

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

      {/* FLYING CART PARTICLES OVERLAY */}
      {flyingParticles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.startX - 18, y: p.startY - 18, scale: 1, opacity: 1 }}
          animate={{
            x: [
              p.startX - 18,
              (p.startX + p.targetX) / 2 + (p.startX < p.targetX ? -40 : 40),
              p.targetX - 18,
            ],
            y: [
              p.startY - 18,
              Math.min(p.startY, p.targetY) - 70,
              p.targetY - 18,
            ],
            scale: [1, 1.25, 0.35],
            opacity: [1, 1, 0.8],
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            setFlyingParticles((prev) => prev.filter((it) => it.id !== p.id));
            setIsCartBouncing(true);
            setTimeout(() => setIsCartBouncing(false), 450);
          }}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: 36,
            height: 36,
            borderRadius: '50%',
            overflow: 'hidden',
            zIndex: 9999,
            pointerEvents: 'none',
            border: '2px solid #ffffff',
            boxShadow: `0 8px 25px ${theme.accentGlow}`,
          }}
        >
          <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </motion.div>
      ))}

      <div className={styles.appContainer} style={{ backgroundColor: theme.bgPage, borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 20px 80px rgba(0, 0, 0, 0.8)' : '0 10px 40px rgba(0, 0, 0, 0.05)', transition: 'background-color 0.3s, border-color 0.3s' }}>

        {/* SCREEN 1: Home Menu Browsing (Always rendered) */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          {/* Top Header */}
          <div style={{ backgroundColor: theme.bgHeader, padding: '1.25rem 1rem 1rem', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.3s', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {cafeLogo ? (
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: `1.5px solid ${theme.border}`,
                    boxShadow: `0 3px 10px ${theme.accentGlow}`,
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
                          e.currentTarget.parentElement.innerHTML = `<span style="font-size:13px;font-weight:800;color:${theme.textMain};">${cafeInitials}</span>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${theme.accent}, #b91c1c)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${theme.accentGlow}`,
                    flexShrink: 0,
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    letterSpacing: '0.5px'
                  }}>
                    {cafeInitials}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: theme.textMuted, fontWeight: '700', display: 'block' }}>Table #{tableNumber}</span>
                  <h2 style={{ fontSize: '0.98rem', fontWeight: '800', color: theme.textMain, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cafeName}</h2>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {/* Theme Toggle Button */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  {isDarkMode ? <Sun size={19} color="#fbbe21" /> : <Moon size={19} color="#475569" />}
                </button>

                {/* Cart Header Icon */}
                <Link to={`/cart?table=${tableNumber}`} ref={cartIconRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <motion.div
                    animate={isCartBouncing ? { scale: [1, 1.35, 0.9, 1.15, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ShoppingBag size={21} color={theme.textMain} />
                    {cartTotalItems > 0 && (
                      <span style={{ position: 'absolute', top: '-5px', right: '-7px', backgroundColor: theme.accent, color: '#ffffff', fontSize: '0.6rem', fontWeight: '900', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${theme.accentGlow}` }}>
                        {cartTotalItems}
                      </span>
                    )}
                  </motion.div>
                </Link>
              </div>
            </div>

            {/* Search Box - Only show after initial loading */}
            {!isLoading && (
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color={theme.textMuted} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Would you like to eat something?..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '0.65rem 0.85rem 0.65rem 2.5rem', color: theme.inputText, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* Live Active Order Banner (Customer Dashboard) - Only show after initial loading */}
            {!isLoading && activeRunningOrder && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const tbl = activeRunningOrder.tableNumber || tableNumber;
                  const token = tbl ? encodeTableToken(tbl) : '';
                  navigate(`/order/status/${activeRunningOrder._id}${token ? `?t=${encodeURIComponent(token)}` : ''}`);
                }}
                style={{
                  marginTop: '0.75rem',
                  marginBottom: '0.2rem',
                  padding: '11px 14px',
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.22), rgba(234, 88, 12, 0.08))'
                    : 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  border: `1.5px solid ${isDarkMode ? 'rgba(234, 88, 12, 0.5)' : '#fb923c'}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(234, 88, 12, 0.15)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    background: '#ea580c',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)'
                  }}>
                    <Utensils size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 850, color: isDarkMode ? '#ffedd5' : '#9a3412', letterSpacing: '-0.01em' }}>
                        Order #{activeRunningOrder.orderNumber || activeRunningOrder._id?.slice(-5).toUpperCase()}
                      </span>
                      {activeRunningOrder.sessionOrders?.length > 1 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          backgroundColor: '#ea580c',
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '100px'
                        }}>
                          {activeRunningOrder.sessionOrders.length} Rounds
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11.5px', color: isDarkMode ? '#fdba74' : '#c2410c', fontWeight: 600, marginTop: 2 }}>
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: activeRunningOrder.status === 'ready' ? '#16a34a' : '#ea580c',
                        boxShadow: `0 0 0 2.5px ${activeRunningOrder.status === 'ready' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(234, 88, 12, 0.25)'}`
                      }} />
                      <span style={{ textTransform: 'capitalize' }}>
                        {activeRunningOrder.status === 'preparing'
                          ? '👨‍🍳 Cooking in Kitchen'
                          : activeRunningOrder.status === 'ready'
                          ? '🎉 Ready to Serve'
                          : '⏳ Order Placed'}
                      </span>
                      <span>•</span>
                      <span>{activeRunningOrder.items?.length || 0} items</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 12px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  borderRadius: '100px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
                }}>
                  <span>Track</span>
                  <ChevronRight size={13} />
                </div>
              </motion.div>
            )}
          </div>

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
              {/* Categories Navigation */}
              {allCategories.length > 0 && (
                <section className={styles.categoryBar} style={{ backgroundColor: isDarkMode ? 'rgba(20, 16, 12, 0.94)' : 'rgba(255, 255, 255, 0.96)', borderBottom: `1px solid ${theme.border}` }}>
                  {allCategories.map((c) => {
                    const isSelected = (selectedCategory === "all" && c.id === "all") || (selectedCategory.toLowerCase() === c.id.toLowerCase());
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={styles.categoryPill}
                        style={{
                          background: isSelected ? `linear-gradient(135deg, ${theme.accent}, #b91c1c)` : (isDarkMode ? '#1e1812' : '#f8fafc'),
                          color: isSelected ? '#ffffff' : theme.catText,
                          border: isSelected ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
                          boxShadow: isSelected ? `0 4px 14px ${theme.accentGlow}` : 'none'
                        }}
                      >
                        <span style={{ fontSize: '14px', lineHeight: 1 }}>{c.icon}</span>
                        <span style={{ fontWeight: isSelected ? '800' : '600' }}>{c.name}</span>
                        {c.count > 0 && (
                          <span
                            className={styles.categoryCount}
                            style={{
                              backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : (isDarkMode ? '#2c221a' : '#e2e8f0'),
                              color: isSelected ? '#ffffff' : theme.textMuted,
                            }}
                          >
                            {c.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </section>
              )}

              {/* Dishes Grid */}
              <main style={{ padding: '0.75rem 1rem 1rem', width: '100%', boxSizing: 'border-box' }}>
                {filteredItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: theme.textMuted }}>
                    <p>No dishes found. Try searching for something else!</p>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {filteredItems.map((item) => {
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
                                        <Minus size={13} strokeWidth={3.5} />
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
                                        <Plus size={13} strokeWidth={3.5} />
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
                                    <Plus size={16} strokeWidth={3.5} />
                                  </motion.button>
                                );
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
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

        {/* Floating Bottom Center Overlapping Dishes Cart - Only show when NOT loading */}
        <AnimatePresence>
          {!isLoading && cartTotalItems > 0 && !selectedItem && (
            <motion.div
              ref={bottomCartRef}
              initial={{ y: 100, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.8, opacity: 0 }}
              whileTap={{ scale: 0.92 }}
              className={styles.floatingCenterCart}
            >
              <Link to={`/cart?table=${tableNumber}`} className={styles.cartCircleLink}>
                <motion.div
                  animate={isCartBouncing ? { scale: [1, 1.3, 0.9, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={styles.circularStackContainer}
                >
                  {/* Left Dish Image (if 3+ items) */}
                  {cartItems.length >= 3 && (
                    <img
                      src={cartItems[2]?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"}
                      alt={cartItems[2]?.name || "Dish"}
                      className={`${styles.dishCircle} ${styles.dishCircleLeft}`}
                      style={{ borderColor: theme.bgPage }}
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"; }}
                    />
                  )}

                  {/* Right Dish Image (if 2+ items) */}
                  {cartItems.length >= 2 && (
                    <img
                      src={cartItems[1]?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"}
                      alt={cartItems[1]?.name || "Dish"}
                      className={`${styles.dishCircle} ${styles.dishCircleRight}`}
                      style={{ borderColor: theme.bgPage }}
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"; }}
                    />
                  )}

                  {/* Center Main Dish Image (Latest or 1st item) */}
                  <div className={styles.centerDishWrapper}>
                    <img
                      src={cartItems[0]?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"}
                      alt={cartItems[0]?.name || "Dish"}
                      className={`${styles.dishCircle} ${styles.dishCircleCenter}`}
                      style={{ borderColor: theme.bgPage }}
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"; }}
                    />

                    {/* Total Item Count Badge */}
                    <span className={styles.floatingBadge} style={{ backgroundColor: theme.accent, borderColor: theme.bgPage }}>
                      {cartTotalItems}
                    </span>
                  </div>
                </motion.div>

                {/* Sleek Bottom Price Label */}
                <div className={styles.cartPillLabel} style={{ backgroundColor: isDarkMode ? '#1e1812' : '#ffffff', color: theme.textMain, borderColor: theme.border }}>
                  <span>₹{Math.round(getCartTotal())}</span>
                  <ChevronRight size={14} color={theme.accent} />
                </div>
              </Link>
            </motion.div>
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

      </div>
    </div>
  );
}


