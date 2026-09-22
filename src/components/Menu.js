import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ChevronRight, Sliders, Star, ChevronLeft, Menu as MenuIcon, Search, Plus, Minus, Sun, Moon, Sparkles, Heart
} from "lucide-react";
import { getValidFoodImage } from "./AdminPanel";
import styles from "./Menu.module.css";
import { API_URL as API } from "../config/api";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantInfo, setTenantInfo] = useState({ name: "SERVIQ Gourmet Cafe", address: "Premium Dining Area" });

  // Selected Item & Variant for Detail View (Screen 2)
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

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

  // History management for Mobile Device Back button
  const openItemDetails = (item) => {
    window.history.pushState({ itemDetailModal: true, itemId: item._id }, "");
    setSelectedItem(item);
  };

  const closeItemDetails = () => {
    if (window.history.state && window.history.state.itemDetailModal) {
      window.history.back();
    } else {
      setSelectedItem(null);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedItem) {
        setSelectedItem(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedItem]);

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
    } else {
      setSelectedVariant(null);
    }
  }, [selectedItem]);

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
    const urlTenant = searchParams.get("tenantId") || searchParams.get("tenant");

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
        setTenantInfo({ name: "SERVIQ Gourmet Bistro", address: "Indiranagar, Bangalore" });
      }
    }

    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem("tableNumber", urlTable);
    } else {
      const stored = localStorage.getItem("tableNumber") || "4";
      setTableNumber(stored);
    }

    const currentTenantId = urlTenant || localStorage.getItem("tenantId");
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
      setTenantInfo(res.data);
      if (res.data.settings?.categories) {
        setCategories(res.data.settings.categories);
      }
    } catch (err) {
      console.error("Failed to load tenant info", err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const handleAdd = (item, event, overrideVariant = null) => {
    if (!item.available && item.available !== undefined) {
      toast.error(`${item.name} is currently out of stock`);
      return;
    }

    const vars = item.variants || item.sizes || item.portionSizes || [];
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

    const discount = item.discount || {};
    let finalPrice = basePrice;
    if (discount.isDiscounted && discount.value > 0) {
      if (discount.type === 'percentage') {
        finalPrice = Math.max(0, Math.round(basePrice * (1 - discount.value / 100)));
      } else {
        finalPrice = Math.max(0, basePrice - discount.value);
      }
    }

    const cartId = variantLabel ? `${item._id}_${variantLabel}` : item._id;
    const cartName = variantLabel ? `${item.name} (${variantLabel})` : item.name;

    addItem({
      id: cartId,
      itemId: item._id,
      name: cartName,
      price: finalPrice,
      originalPrice: basePrice,
      category: item.category,
      image: getValidFoodImage(item),
      variant: chosenVariant ? (typeof chosenVariant === 'object' ? chosenVariant : { name: variantLabel, price: finalPrice }) : null,
      addons: []
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

        <AnimatePresence mode="wait">
          {!selectedItem ? (
            // SCREEN 1: Home Menu Browsing
            <motion.div
              key="menu-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}
            >
              {/* Top Header */}
              <div style={{ backgroundColor: theme.bgHeader, padding: '1.25rem 1rem 1rem', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.3s', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: `linear-gradient(135deg, ${theme.accent}, #b91c1c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 15px ${theme.accentGlow}`, flexShrink: 0 }}>
                      <Sparkles size={18} color="#ffffff" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: theme.textMuted, fontWeight: '700', display: 'block' }}>Table #{tableNumber}</span>
                      <h2 style={{ fontSize: '0.98rem', fontWeight: '800', color: theme.textMain, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenantInfo.name || "SERVIQ Bistro"}</h2>
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

                {/* Search Box */}
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
              </div>

              {/* Categories Navigation */}
              <section className={styles.categoryBar}>
                <button
                  onClick={() => setSelectedCategory("all")}
                  style={{
                    backgroundColor: selectedCategory === "all" ? theme.accent : theme.catBg,
                    color: selectedCategory === "all" ? '#ffffff' : theme.catText,
                    border: selectedCategory === "all" ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                    padding: '0.45rem 0.95rem', borderRadius: '100px', fontWeight: '700', fontSize: '0.78rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.25s ease',
                    boxShadow: selectedCategory === "all" ? `0 4px 12px ${theme.accentGlow}` : 'none'
                  }}
                >
                  All Items
                </button>
                {categories
                  .filter((c) => c.id !== "all" && c.name?.toLowerCase() !== "all" && c.name?.toLowerCase() !== "all items")
                  .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    style={{
                      backgroundColor: selectedCategory === c.id ? theme.accent : theme.catBg,
                      color: selectedCategory === c.id ? '#ffffff' : theme.catText,
                      border: selectedCategory === c.id ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                      padding: '0.45rem 0.95rem', borderRadius: '100px', fontWeight: '700', fontSize: '0.78rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.25s ease',
                      boxShadow: selectedCategory === c.id ? `0 4px 12px ${theme.accentGlow}` : 'none'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </section>

              {/* Dishes Grid */}
              <main style={{ padding: '0.5rem 1rem 1rem', width: '100%', boxSizing: 'border-box' }}>
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

                      return (
                        <motion.div
                          key={item._id}
                          layoutId={`dish-card-${item._id}`}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          style={{
                            backgroundColor: theme.bgCard,
                            border: `1px solid ${theme.cardBorder}`,
                            borderRadius: '18px',
                            padding: '0.65rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.6 : 1,
                            transition: 'box-shadow 0.25s, border-color 0.25s',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                            width: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                          }}
                          whileHover={!isOutOfStock ? { y: -3, borderColor: theme.accent } : {}}
                          whileTap={!isOutOfStock ? { scale: 0.97 } : {}}
                          onClick={() => !isOutOfStock && openItemDetails(item)}
                        >
                          <div style={{ borderRadius: '14px', overflow: 'hidden', height: '105px', position: 'relative', width: '100%' }}>
                            <motion.img
                              layoutId={`dish-img-${item._id}`}
                              src={getValidFoodImage(item)}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"; }}
                            />
                            <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Star size={10} color="#fbbe21" fill="#fbbe21" />
                              <span style={{ fontSize: '9px', color: '#ffffff', fontWeight: 800 }}>{item.rating || '4.8'}</span>
                            </div>

                            {hasDiscount && (
                              <span style={{ position: 'absolute', top: 5, left: 5, background: '#ef4444', color: '#fff', fontSize: '8.5px', fontWeight: 900, padding: '2px 5px', borderRadius: 5, boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)' }}>
                                {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                              </span>
                            )}
                            {isOutOfStock && (
                              <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', color: '#fff', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                OUT OF STOCK
                              </span>
                            )}
                          </div>

                          <div style={{ marginTop: '0.5rem', width: '100%', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', minWidth: 0 }}>
                              <span style={{ fontSize: '10px', color: item.isVeg !== false ? '#16a34a' : '#dc2626', fontWeight: 900, lineHeight: 1, flexShrink: 0 }}>
                                {item.isVeg !== false ? '●' : '▲'}
                              </span>
                              <motion.h3
                                layoutId={`dish-title-${item._id}`}
                                style={{ fontSize: '0.85rem', fontWeight: '800', color: theme.textMain, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}
                              >
                                {item.name}
                              </motion.h3>
                            </div>
                            <p style={{ fontSize: '0.68rem', color: theme.textMuted, margin: '2px 0 0 0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description || "Prepared fresh to order"}</p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', width: '100%' }}>
                            <div style={{ overflow: 'hidden' }}>
                              {hasDiscount ? (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                  <motion.span layoutId={`dish-price-${item._id}`} style={{ fontSize: '0.95rem', fontWeight: '900', color: '#16a34a' }}>₹{discountedPrice}</motion.span>
                                  <span style={{ fontSize: '0.7rem', color: theme.textMuted, textDecoration: 'line-through' }}>₹{item.price}</span>
                                </div>
                              ) : (
                                <motion.span layoutId={`dish-price-${item._id}`} style={{ fontSize: '0.95rem', fontWeight: '900', color: theme.textMain }}>₹{item.price}</motion.span>
                              )}
                            </div>

                            {/* Quantity Stepper (+ -) when selected, otherwise + button */}
                            {(() => {
                              const qty = getItemQuantity(item);
                              if (qty > 0) {
                                return (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      backgroundColor: theme.accent,
                                      borderRadius: '100px',
                                      padding: '2px 4px',
                                      gap: '5px',
                                      boxShadow: `0 3px 10px ${theme.accentGlow}`,
                                      height: '28px',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      onClick={(e) => handleDecrement(item, e)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: '2px 3px'
                                      }}
                                      title="Decrease quantity"
                                    >
                                      <Minus size={13} strokeWidth={3.5} />
                                    </motion.button>
                                    <span style={{ fontSize: '0.82rem', fontWeight: '900', color: '#ffffff', minWidth: '14px', textAlign: 'center' }}>
                                      {qty}
                                    </span>
                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      onClick={(e) => handleIncrement(item, e)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: '2px 3px'
                                      }}
                                      title="Increase quantity"
                                    >
                                      <Plus size={13} strokeWidth={3.5} />
                                    </motion.button>
                                  </div>
                                );
                              }

                              return (
                                <motion.button
                                  whileHover={!isOutOfStock ? { scale: 1.12 } : {}}
                                  whileTap={!isOutOfStock ? { scale: 0.88 } : {}}
                                  disabled={isOutOfStock}
                                  onClick={(e) => { e.stopPropagation(); handleAdd(item, e); }}
                                  style={{
                                    backgroundColor: isOutOfStock ? '#64748b' : theme.accent,
                                    border: 'none',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    margin: 0,
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    boxShadow: isOutOfStock ? 'none' : `0 3px 10px ${theme.accentGlow}`,
                                    flexShrink: 0
                                  }}
                                  title="Add to basket"
                                >
                                  <Plus size={15} strokeWidth={3.2} style={{ display: 'block', margin: 'auto' }} />
                                </motion.button>
                              );
                            })()}
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
                          layoutId={`dish-card-${cb._id}`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openItemDetails(cb)}
                          style={{ display: 'flex', borderRadius: '18px', overflow: 'hidden', backgroundColor: theme.accent, height: '105px', boxShadow: `0 6px 20px ${theme.accentGlow}`, cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
                        >
                          <div style={{ flex: 1.2, padding: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                            <div>
                              <motion.span layoutId={`dish-title-${cb._id}`} style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cb.name}</motion.span>
                              <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.88)', margin: '2px 0 0 0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cb.description || 'Special Chef Combo'}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <motion.span layoutId={`dish-price-${cb._id}`} style={{ fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>₹{cb.price}</motion.span>

                              {/* Stepper (+ -) when selected, otherwise + button for Combos */}
                              {(() => {
                                const qty = getItemQuantity(cb);
                                if (qty > 0) {
                                  return (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '100px',
                                        padding: '2px 4px',
                                        gap: '5px',
                                        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
                                        height: '28px',
                                        boxSizing: 'border-box'
                                      }}
                                    >
                                      <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={(e) => handleDecrement(cb, e)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: theme.accent,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          padding: '2px 3px'
                                        }}
                                        title="Decrease quantity"
                                      >
                                        <Minus size={13} strokeWidth={3.5} />
                                      </motion.button>
                                      <span style={{ fontSize: '0.82rem', fontWeight: '900', color: theme.accent, minWidth: '14px', textAlign: 'center' }}>
                                        {qty}
                                      </span>
                                      <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={(e) => handleIncrement(cb, e)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: theme.accent,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          padding: '2px 3px'
                                        }}
                                        title="Increase quantity"
                                      >
                                        <Plus size={13} strokeWidth={3.5} />
                                      </motion.button>
                                    </div>
                                  );
                                }

                                return (
                                  <motion.button
                                    whileHover={{ scale: 1.12 }}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={(e) => { e.stopPropagation(); handleAdd(cb, e); }}
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
                                );
                              })()}
                            </div>
                          </div>
                          <div style={{ flex: 0.8, overflow: 'hidden' }}>
                            <motion.img layoutId={`dish-img-${cb._id}`} src={getValidFoodImage(cb)} alt={cb.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ) : (
            // SCREEN 2: Product Detail View (Refined matching target UI)
            <motion.div
              key="menu-detail"
              layoutId={`dish-card-${selectedItem._id}`}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: theme.bgPage, overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}
            >
              {/* Header Bar */}
              <div style={{ padding: '1.25rem 1.25rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'none', borderBottom: `1px solid ${theme.border}`, boxSizing: 'border-box', width: '100%' }}>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={closeItemDetails}
                  style={{ backgroundColor: 'transparent', border: `none`, width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', color: theme.textMain, boxShadow: 'none' }}
                >
                  <ChevronLeft size={22} color={theme.textMain} />
                </motion.button>
                <span style={{ fontSize: '0.98rem', fontWeight: '800', color: theme.textMain }}>Item Details</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>

                  <Link to={`/cart?table=${tableNumber}`} style={{ backgroundColor: 'none', border: `none`, width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', position: 'relative', textDecoration: 'none', boxShadow: 'none' }}>
                    <ShoppingBag size={18} color={theme.textMain} />
                    {cartTotalItems > 0 && (
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: theme.accent, color: '#ffffff', fontSize: '0.58rem', fontWeight: '900', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(224, 92, 92, 0.4)' }}>
                        {cartTotalItems}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Centered Floating Dish Hero Image */}
              <div style={{ padding: '1.5rem 1.25rem 0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '220px', height: '220px', borderRadius: '28px', overflow: 'hidden', boxShadow: `0 15px 40px ${theme.accentGlow}`, border: `2px solid ${theme.border}`, position: 'relative' }}>
                  <motion.img
                    layoutId={`dish-img-${selectedItem._id}`}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    src={getValidFoodImage(selectedItem)}
                    alt={selectedItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={12} color="#fbbe21" fill="#fbbe21" />
                    <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 800 }}>{selectedItem.rating || '4.8'}</span>
                  </div>
                </div>
              </div>

              {/* Title, Outlet Info & Details */}
              {(() => {
                const availableVariants = selectedItem ? (selectedItem.variants || selectedItem.sizes || selectedItem.portionSizes || []) : [];
                const currentPrice = selectedVariant
                  ? (typeof selectedVariant === 'object' ? (Number(selectedVariant.price) || selectedItem.price) : selectedItem.price)
                  : selectedItem.price;

                return (
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div>
                          <motion.h1
                            layoutId={`dish-title-${selectedItem._id}`}
                            style={{ fontSize: '1.4rem', fontWeight: '900', color: theme.textMain, margin: 0 }}
                          >
                            {selectedItem.name}
                          </motion.h1>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: '11px', color: selectedItem.isVeg !== false ? '#16a34a' : '#dc2626', fontWeight: 900 }}>
                              {selectedItem.isVeg !== false ? '● VEG' : '▲ NON-VEG'}
                            </span>
                            <span style={{ fontSize: '11px', color: theme.textMuted }}>• Fresh In Stock</span>
                          </div>
                        </div>
                        <motion.div layoutId={`dish-price-${selectedItem._id}`} style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: theme.accent }}>₹{currentPrice}</span>
                        </motion.div>
                      </div>

                      {/* Restaurant Outlet Pill */}
                      <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, padding: '0.4rem 0.85rem', borderRadius: '100px' }}>
                        <Sparkles size={14} color={theme.accent} />
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: theme.textMain }}>{tenantInfo.name || "SERVIQ Gourmet Bistro"}</span>
                      </div>

                      <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.85rem', lineHeight: '1.5' }}>
                        {selectedItem.description || "Prepared with fresh organic ingredients, slow cooked to perfection."}
                      </p>

                      {/* Portion Size Options - DYNAMIC: ONLY SHOW IF ITEM HAS VARIANTS/SIZES */}
                      {Array.isArray(availableVariants) && availableVariants.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: theme.textMain, marginBottom: '0.65rem' }}>Serving Portion Size</h3>
                          <div style={{ display: 'flex', gap: '0.65rem' }}>
                            {availableVariants.map((v, idx) => {
                              const vName = typeof v === 'object' ? (v.name || v.size || `Option ${idx + 1}`) : String(v);
                              const vPrice = typeof v === 'object' ? (Number(v.price) || selectedItem.price) : selectedItem.price;
                              const isSelected = selectedVariant && (
                                typeof selectedVariant === 'object' ? (selectedVariant.name === vName || selectedVariant.size === vName) : String(selectedVariant) === String(v)
                              );

                              return (
                                <motion.button
                                  key={vName || idx}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedVariant(v)}
                                  style={{
                                    flex: 1,
                                    backgroundColor: isSelected ? theme.accent : theme.bgCard,
                                    border: isSelected ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
                                    borderRadius: '12px',
                                    color: isSelected ? '#ffffff' : theme.textMuted,
                                    fontWeight: '800',
                                    fontSize: '0.8rem',
                                    padding: '0.65rem 0.4rem',
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? `0 4px 15px ${theme.accentGlow}` : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justify: 'center'
                                  }}
                                >
                                  <span>{vName}</span>
                                  {vPrice && vPrice !== selectedItem.price && (
                                    <span style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>₹{vPrice}</span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pair with recommendation list */}
                      <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: theme.textMain, marginBottom: '0.65rem' }}>People Also Ordered</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                          {items.filter(it => it._id !== selectedItem._id).slice(0, 3).map(rec => (
                            <div
                              key={rec._id}
                              onClick={() => {
                                window.history.replaceState({ itemDetailModal: true, itemId: rec._id }, "");
                                setSelectedItem(rec);
                              }}
                              style={{ minWidth: '130px', backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, padding: '0.5rem', borderRadius: '14px', cursor: 'pointer' }}
                            >
                              <img src={getValidFoodImage(rec)} alt={rec.name} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '10px' }} />
                              <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: theme.textMain, margin: '4px 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</h4>
                              <span style={{ fontSize: '0.75rem', fontWeight: '900', color: theme.accent }}>₹{rec.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sticky Bottom Action Bar (Quantity + Add to Basket) */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {(() => {
                        const variantLabel = selectedVariant ? (selectedVariant.name || selectedVariant.size || '') : '';
                        const targetCartId = variantLabel ? `${selectedItem._id}_${variantLabel}` : selectedItem._id;
                        const cartItemMatch = cartItems.find(ci => ci.id === targetCartId);
                        const qtyInCart = cartItemMatch ? cartItemMatch.quantity : 0;

                        if (qtyInCart > 0) {
                          return (
                            <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  backgroundColor: theme.bgCard,
                                  border: `1.5px solid ${theme.accent}`,
                                  borderRadius: '14px',
                                  padding: '0.4rem 0.75rem',
                                  gap: '1rem',
                                  height: '48px',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => {
                                    if (qtyInCart <= 1) {
                                      removeItem(targetCartId);
                                    } else {
                                      updateItemQuantity(targetCartId, qtyInCart - 1);
                                    }
                                  }}
                                  style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                  title="Decrease quantity"
                                >
                                  <Minus size={18} strokeWidth={3} />
                                </motion.button>
                                <span style={{ fontSize: '1.05rem', fontWeight: '900', color: theme.textMain, minWidth: '18px', textAlign: 'center' }}>
                                  {qtyInCart}
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => updateItemQuantity(targetCartId, qtyInCart + 1)}
                                  style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                  title="Increase quantity"
                                >
                                  <Plus size={18} strokeWidth={3} />
                                </motion.button>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={closeItemDetails}
                                style={{
                                  flex: 1,
                                  backgroundColor: theme.accent,
                                  color: '#ffffff',
                                  border: 'none',
                                  fontWeight: '800',
                                  fontSize: '0.98rem',
                                  padding: '0.85rem',
                                  borderRadius: '14px',
                                  cursor: 'pointer',
                                  boxShadow: `0 8px 25px ${theme.accentGlow}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  height: '48px'
                                }}
                              >
                                Added (₹{currentPrice * qtyInCart}) • Done
                              </motion.button>
                            </div>
                          );
                        }

                        return (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => {
                              handleAdd(selectedItem, e, selectedVariant);
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: theme.accent,
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: '800',
                              fontSize: '0.98rem',
                              padding: '0.95rem',
                              borderRadius: '14px',
                              cursor: 'pointer',
                              boxShadow: `0 8px 25px ${theme.accentGlow}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            Add to Order • ₹{currentPrice}
                            <Plus size={16} strokeWidth={3} />
                          </motion.button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bottom Center Overlapping Dishes Cart */}
        <AnimatePresence>
          {cartTotalItems > 0 && !selectedItem && (
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

      </div>
    </div>
  );
}


