import { useState, useEffect } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ChevronRight, Sliders, Star, ChevronLeft, Menu as MenuIcon, Search, Plus, Sun, Moon
} from "lucide-react";
import { getValidFoodImage } from "./AdminPanel";
import styles from "./Menu.module.css";

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

export default function Menu() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantInfo, setTenantInfo] = useState({ name: "The Landmark Cafe", address: "Buenos Aires, AR" });
  
  // Selected Item for Detail view (Screen 2)
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState("mediana"); // chica, mediana, grande

  const { addItem, items: cartItems } = useCartContext();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = isDarkMode ? {
    bgPage: '#0c0907',
    bgHeader: '#232530',
    bgCard: '#1c1510',
    bgInner: '#191512',
    textMain: '#ffffff',
    textMuted: '#b5a494',
    accent: '#e05c5c',
    border: 'rgba(217, 119, 6, 0.15)',
    cardTitle: '#ffffff',
    inputBg: '#ffffff',
    inputText: '#111827',
    catBg: '#f5ebe0',
    catText: '#8c7d70',
    avatarBorder: '#e05c5c',
  } : {
    bgPage: '#f9faf6',
    bgHeader: '#ffffff',
    bgCard: '#ffffff',
    bgInner: '#f1f2ee',
    textMain: '#1e293b',
    textMuted: '#64748b',
    accent: '#84cc16',
    border: '#e4e5e1',
    cardTitle: '#1e293b',
    inputBg: '#f1f2ee',
    inputText: '#1e293b',
    catBg: '#f1f2ee',
    catText: '#64748b',
    avatarBorder: '#84cc16',
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
        toast.error("No cafe specified! Please scan a valid QR code.");
        return;
      }
    }

    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem("tableNumber", urlTable);
    } else {
      const stored = localStorage.getItem("tableNumber");
      if (stored) setTableNumber(stored);
    }

    const currentTenantId = urlTenant || localStorage.getItem("tenantId");
    if (currentTenantId) {
      axios
        .get(`${API}/menu`, { params: { tenantId: currentTenantId } })
        .then((res) => setItems(res.data))
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load menu");
        });
    }
  }, [searchParams]);

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

  const handleAdd = (item) => {
    addItem({
      id: item._id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
    });
    toast.success(`${item.name} añadido!`, {
      icon: '☕',
      style: { borderRadius: '14px', background: theme.bgCard, color: theme.textMain, border: `1px solid ${theme.border}` },
    });
  };

  const cartTotalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={styles.page} style={{ backgroundColor: theme.bgPage, color: theme.textMain, transition: 'background-color 0.3s' }}>
      <Toaster position="top-center" />
      <div className={styles.appContainer} style={{ backgroundColor: theme.bgPage, borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 20px 80px rgba(0, 0, 0, 0.8)' : '0 10px 40px rgba(0, 0, 0, 0.05)', transition: 'background-color 0.3s, border-color 0.3s' }}>
        
        <AnimatePresence mode="wait">
          {!selectedItem ? (
            // SCREEN 1: Home Menu Browsing
            <motion.div
              key="menu-home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              {/* Top Header */}
              <div style={{ backgroundColor: theme.bgHeader, padding: '2rem 1.5rem 1.5rem', borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', transition: 'background-color 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <MenuIcon size={22} color={theme.textMain} />
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: theme.textMain }}>Coffee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Theme Toggle Button */}
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      {isDarkMode ? <Sun size={20} color="#fbbe21" /> : <Moon size={20} color="#475569" />}
                    </button>
                    <Link to={`/cart?table=${tableNumber}`} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <ShoppingBag size={22} color={theme.textMain} />
                      {cartTotalItems > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-8px', backgroundColor: theme.accent, color: isDarkMode ? 'white' : '#1a2e05', fontSize: '0.6rem', fontWeight: '800', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                          {cartTotalItems}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: theme.textMain }}>Good morning, Iv</h2>
                    <p style={{ fontSize: '0.85rem', color: theme.textMuted, marginTop: '2px' }}>What would you like to eat today?</p>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                    alt="user" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.avatarBorder}` }}
                  />
                </div>

                {/* Search Box */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} color={theme.textMuted} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      placeholder="Search coffee, burgers..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', backgroundColor: theme.inputBg, border: isDarkMode ? 'none' : `1px solid ${theme.border}`, borderRadius: '12px', padding: '0.75rem 1rem 0.75rem 2.8rem', color: theme.inputText, fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <button style={{ backgroundColor: theme.accent, border: 'none', borderRadius: '12px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}>
                    <Sliders size={18} color={isDarkMode ? '#ffffff' : '#1a2e05'} />
                  </button>
                </div>
              </div>

              {/* 🔥 Recommended for you */}
              <div style={{ padding: '1rem 1.5rem 0' }}>
                <div style={{ backgroundColor: theme.bgHeader, border: `1.5px dashed ${theme.accent}`, borderRadius: '18px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background-color 0.3s' }}>
                  <div>
                    <span style={{ color: theme.accent, fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 Recommended for you</span>
                    <h3 style={{ color: theme.textMain, fontSize: '1rem', fontWeight: '800', marginTop: '4px' }}>Cappuccino + Croissant</h3>
                    <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginTop: '2px' }}>A perfect morning start combo</p>
                  </div>
                  <button 
                    onClick={() => {
                      const capp = items.find(i => i.name.toLowerCase().includes('cappuccino')) || items[0];
                      if (capp) {
                        handleAdd(capp);
                      } else {
                        toast.error("Item currently unavailable");
                      }
                    }}
                    style={{ backgroundColor: theme.accent, color: isDarkMode ? 'white' : '#1a2e05', border: 'none', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Add +
                  </button>
                </div>
              </div>

              {/* Categories Navigation */}
              <section style={{ padding: '1.25rem 1.5rem 0.5rem', display: 'flex', gap: '0.65rem', overflowX: 'auto' }} className={styles.categoryBar}>
                <button 
                  onClick={() => setSelectedCategory("all")}
                  style={{
                    backgroundColor: selectedCategory === "all" ? theme.accent : theme.catBg,
                    color: selectedCategory === "all" ? (isDarkMode ? 'white' : '#1a2e05') : theme.catText,
                    border: 'none', padding: '0.55rem 1.1rem', borderRadius: '100px', fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background-color 0.3s'
                  }}
                >
                  Todo
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    style={{
                      backgroundColor: selectedCategory === c.id ? theme.accent : theme.catBg,
                      color: selectedCategory === c.id ? (isDarkMode ? 'white' : '#1a2e05') : theme.catText,
                      border: 'none', padding: '0.55rem 1.1rem', borderRadius: '100px', fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background-color 0.3s'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </section>

              {/* Coffee Grid */}
              <main style={{ padding: '1rem 1.5rem', flex: 1 }}>
                {filteredItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: theme.textMuted }}>
                    <p>No items found. Try searching for something else!</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {filteredItems.map((item) => (
                      <div 
                        key={item._id} 
                        style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'background-color 0.3s, border-color 0.3s' }}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div style={{ borderRadius: '14px', overflow: 'hidden', height: '110px', position: 'relative' }}>
                          <img 
                            src={getValidFoodImage(item)} 
                            alt={item.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"; }}
                          />
                        </div>
                        <div style={{ marginTop: '0.65rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: theme.textMain }}>{item.name}</h3>
                          <p style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: '2px', lineClamp: '1' }}>{item.description || "Leche o crema opcional"}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '900', color: theme.textMain }}>₹{item.price}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAdd(item); }}
                            style={{ backgroundColor: theme.accent, border: 'none', width: '28px', height: '28px', borderRadius: '50%', color: isDarkMode ? 'white' : '#1a2e05', fontWeight: '800', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </main>

              {/* Breakfast Combo Banner */}
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: theme.textMain, marginBottom: '0.75rem' }}>Breakfast combos</h3>
                <div style={{ display: 'flex', borderRadius: '20px', overflow: 'hidden', backgroundColor: theme.accent, height: '110px' }}>
                  <div style={{ flex: 1.2, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '800', color: isDarkMode ? 'white' : '#1a2e05', lineHeight: '1.2' }}>Coffee with milk + 2 Croissants</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: '900', color: isDarkMode ? 'white' : '#1a2e05' }}>₹399</span>
                      <button style={{ backgroundColor: theme.bgHeader, border: 'none', width: '28px', height: '28px', borderRadius: '50%', color: theme.textMain, display: 'flex', alignItems: 'center', justify: 'center' }}>+</button>
                    </div>
                  </div>
                  <div style={{ flex: 0.8 }}>
                    <img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=300" alt="combo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // SCREEN 2: Coffee Product Detail Screen
            <motion.div
              key="menu-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bgPage }}
            >
              {/* Product Large Header Image */}
              <div style={{ position: 'relative', height: '240px', backgroundColor: theme.bgHeader, borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', overflow: 'hidden' }}>
                <img 
                  src={selectedItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"} 
                  alt={selectedItem.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                
                {/* Back & Cart Floating Row */}
                <div style={{ position: 'absolute', top: '1.5rem', left: '1.25rem', right: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => setSelectedItem(null)} 
                    style={{ backgroundColor: 'rgba(12,9,7,0.5)', border: 'none', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
                  >
                    <ChevronLeft size={22} color="#ffffff" />
                  </button>
                  <Link to={`/cart?table=${tableNumber}`} style={{ backgroundColor: 'rgba(12,9,7,0.5)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', position: 'relative' }}>
                    <ShoppingBag size={20} color="#ffffff" />
                    {cartTotalItems > 0 && (
                      <span style={{ position: 'absolute', top: '-2px', right: '-2px', backgroundColor: theme.accent, color: isDarkMode ? 'white' : '#1a2e05', fontSize: '0.55rem', fontWeight: '800', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                        {cartTotalItems}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Title & Desc Container */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: theme.textMain }}>{selectedItem.name}</h1>
                  <span style={{ fontSize: '1.6rem', fontWeight: '900', color: theme.accent }}>₹{selectedItem.price}</span>
                </div>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                  {selectedItem.description || "Optional milk or cream, prepared with selected premium coffee beans."}
                </p>

                {/* Size Selector */}
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: theme.textMain, marginBottom: '0.75rem' }}>Size: Small, medium or large</h3>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {["small", "medium", "large"].map((sz) => (
                      <button 
                        key={sz} 
                        onClick={() => setSelectedSize(sz)}
                        style={{
                          flex: 1,
                          backgroundColor: selectedSize === sz ? (isDarkMode ? 'rgba(224, 92, 92, 0.15)' : '#ecfccb') : theme.bgCard,
                          border: selectedSize === sz ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
                          borderRadius: '12px',
                          color: selectedSize === sz ? (isDarkMode ? '#e05c5c' : '#3f6212') : theme.textMuted,
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          padding: '0.75rem',
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          transition: '0.2s'
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    onClick={() => { handleAdd(selectedItem); setSelectedItem(null); }}
                    style={{ backgroundColor: theme.accent, color: isDarkMode ? 'white' : '#1a2e05', border: 'none', fontWeight: '700', fontSize: '1rem', padding: '1rem', borderRadius: '14px', cursor: 'pointer', boxShadow: 'none' }}
                  >
                    Add to cart +
                  </button>
                  <Link to={`/cart?table=${tableNumber}`} style={{ textDecoration: 'none' }}>
                    <button 
                      style={{ width: '100%', backgroundColor: theme.catBg, color: theme.textMain, border: `1px solid ${theme.border}`, fontWeight: '700', fontSize: '1rem', padding: '1rem', borderRadius: '14px', cursor: 'pointer' }}
                    >
                      Place Order
                    </button>
                  </Link>
                </div>

                {/* Accompany Section */}
                <div style={{ marginTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: theme.textMain }}>Pair your coffee with:</h3>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.accent, cursor: 'pointer' }}>View all →</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Media Luna Card */}
                    <div style={{ flex: 1, backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, padding: '0.75rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=150" alt="Croissant" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '10px' }} />
                      <div style={{ marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMain }}>Croissant</h4>
                        <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>₹120</span>
                      </div>
                    </div>
                    {/* Tostado Card */}
                    <div style={{ flex: 1, backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, padding: '0.75rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <img src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=150" alt="Toastie" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '10px' }} />
                      <div style={{ marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMain }}>Toastie</h4>
                        <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>₹120</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Indicator */}
        <AnimatePresence>
          {cartTotalItems > 0 && !selectedItem && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className={styles.cartBarWrapper}
            >
              <Link to={`/cart?table=${tableNumber}`} className={styles.cartBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className={styles.cartIconBox}>
                    <ShoppingBag size={20} />
                    <span className={styles.badgeCount}>{cartTotalItems}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '800', fontSize: '0.95rem' }}>Ver pedido</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7 }}>{cartTotalItems} item(s) seleccionado(s)</p>
                  </div>
                </div>
                <ChevronRight size={20} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
