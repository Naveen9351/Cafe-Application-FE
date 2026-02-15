import { useState, useEffect } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaShoppingCart, FaPlus, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ChevronRight, Menu as MenuIcon,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream,
  Croissant, GlassWater, Martini, Cake, Soup, Cookie,
  Beer, Wine, Globe, Heart
} from "lucide-react";
import styles from "./Menu.module.css";

const API = process.env.REACT_APP_API_URL || "https://cafe-application-be-1.onrender.com/api";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantInfo, setTenantInfo] = useState({ name: "Multi-Cafe", address: "" });

  const { addItem, items: cartItems } = useCartContext();
  const [searchParams] = useSearchParams();



  // Icon Map for Dynamic Categories
  const iconMap = {
    UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream,
    Croissant, GlassWater, Martini, Cake, Soup, Cookie,
    Beer, Wine
  };

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // 1. Get query params
    const urlTable = searchParams.get("table");
    const urlTenant = searchParams.get("tenantId") || searchParams.get("tenant"); // Handle both

    // 2. Handle Tenant ID
    if (urlTenant) {
      setTenantId(urlTenant);
      localStorage.setItem("tenantId", urlTenant);
      fetchTenantInfo(urlTenant);
    } else {
      // Try to recover from local storage
      const storedTenant = localStorage.getItem("tenantId");
      if (storedTenant) {
        setTenantId(storedTenant);
        fetchTenantInfo(storedTenant);
      } else {
        toast.error("No cafe specified! Please scan a valid QR code.");
        return;
      }
    }

    // 3. Handle Table Number
    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem("tableNumber", urlTable);
    } else {
      const stored = localStorage.getItem("tableNumber");
      if (stored) setTableNumber(stored);
    }

    // 4. Fetch Menu
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
    toast.success(`${item.name} added to cart!`, {
      icon: '🛍️',
      style: { borderRadius: '12px', background: '#1a2e35', color: '#fff' },
    });
  };

  const cartTotalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={styles.page}>
      <Toaster position="top-center" />

      {/* ---------- BEAUTIFIED HERO ---------- */}
      <header className={styles.hero}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.heroContent}
        >
          <div className={styles.badge}>Welcome to</div>
          {/* DYNAMIC TENANT LOGO */}
          {tenantInfo.logo && (
            <div className={styles.businessLogo}>
              <img src={tenantInfo.logo} alt={tenantInfo.name} />
            </div>
          )}
          {/* DYNAMIC TENANT NAME */}
          <h1 className={styles.heroTitle}>{tenantInfo.name}</h1>
          <p className={styles.heroSubtitle}>
            {tenantInfo.address || "Indulge in our curated selection of artisanal delights."}
          </p>

          <div className={styles.searchWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search dishes..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>
      </header>

      {/* ---------- STICKY CATEGORIES ---------- */}
      <section className={styles.categories}>
        <div className={styles.categoryScroll}>
          {/* <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory("all")}
            className={`${styles.categoryPill} ${selectedCategory === "all" ? styles.activePill : ""}`}
          >
            <span className={styles.iconWrapper}><UtensilsCrossed size={16} /></span>
            All Items
          </motion.button> */}
          {categories.map((c) => {
            const IconComponent = iconMap[c.icon] || UtensilsCrossed;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(c.id)}
                className={`${styles.categoryPill} ${selectedCategory === c.id ? styles.activePill : ""
                  }`}
              >
                <span className={styles.iconWrapper}><IconComponent size={16} /></span>
                {c.name}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ---------- MENU GRID WITH ANIMATIONS ---------- */}
      <main className={styles.menu}>
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              // initial={{ opacity: 0 }}
              // animate={{ opacity: 1 }}
              // exit={{ opacity: 0 }}
              className={styles.empty}
            >
              <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-5521508-4610092.png" alt="Empty" className={styles.emptyImg} />
              <p>No items found. Try searching for something else!</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={styles.grid}
            >
              {filteredItems.map((item) => (
                <motion.article
                  // layout
                  // initial={{ opacity: 0, scale: 0.9 }}
                  // animate={{ opacity: 1, scale: 1 }}
                  key={item._id}
                  className={styles.card}
                >
                  <div className={styles.imgWrap}>
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"}
                      alt={item.name}
                      className={styles.img}
                      loading="lazy"
                    />
                    <span className={styles.tag}>{item.category}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.price}>₹{item.price}</p>
                    <p className={styles.desc}>{item.description}</p>
                    <button
                      onClick={() => handleAdd(item)}
                      className={styles.addBtn}
                    >
                      <FaPlus size={14} />
                      Add to Order List
                    </button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ---------- PREMIUM FLOATING CART ---------- */}
      <AnimatePresence>
        {cartTotalItems > 0 && (
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
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1rem' }}>View Your Order</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>{cartTotalItems} items added</p>
                </div>
              </div>
              <ChevronRight size={24} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>{tenantInfo.name}</div>
        <p className={styles.footerAddress}>{tenantInfo.address || "Serving the best flavors in town."}</p>

        <div className={styles.socialLinks}>
          <div className={styles.socialCircle}><Globe size={18} /></div>
          <div className={styles.socialCircle}><Heart size={18} /></div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} Digital Menu Experience</p>
          <div className={styles.poweredBy}>
            Powered by <span>RestroCloud OS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
