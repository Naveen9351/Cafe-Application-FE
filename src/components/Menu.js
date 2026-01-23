import { useState, useEffect } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaShoppingCart, FaPlus, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight, Menu as MenuIcon } from "lucide-react";
import styles from "./Menu.module.css";

const API = process.env.REACT_APP_API_URL || "https://cafe-application-be-1.onrender.com/api";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem, items: cartItems } = useCartContext();
  const [searchParams] = useSearchParams();

  const staticCategories = [
    { id: "all", name: "All", icon: "🍽️" },
    { id: "chai", name: "Chai", icon: "☕" },
    { id: "cold-coffee", name: "Cold Coffee", icon: "🧋" },
    { id: "hot-coffee", name: "Hot Coffee", icon: "☕" },
    { id: "burger", name: "Burger", icon: "🍔" },
    { id: "pizza", name: "Pizza", icon: "🍕" },
    { id: "chinese", name: "Chinese", icon: "🥢" },
    { id: "sandwich", name: "Sandwich", icon: "🥪" },
    { id: "snacks", name: "Snacks", icon: "🍟" },
    { id: "wraps", name: "Wraps", icon: "🌯" },
    { id: "pasta", name: "Pasta", icon: "🍝" },
    { id: "cold-drinks", name: "Drinks", icon: "🥤" },
    { id: "mocktails", name: "Mocktails", icon: "🍸" },
    { id: "shakes", name: "Shakes", icon: "🧋" },
    { id: "desserts", name: "Desserts", icon: "🍰" },
  ];

  useEffect(() => {
    const urlTable = searchParams.get("table");
    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem("tableNumber", urlTable);
    } else {
      const stored = localStorage.getItem("tableNumber");
      if (stored) setTableNumber(stored);
    }

    axios
      .get(`${API}/menu`)
      .then((res) => setItems(res.data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load menu");
      });
  }, [searchParams]);

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
          <div className={styles.badge}>Welcome to Naveen's Cafe !!</div>
          <h1 className={styles.heroTitle}>Premium <span className={styles.accentText}>Cafe</span> Experience</h1>
          <p className={styles.heroSubtitle}>
            Indulge in our curated selection of artisanal delights, crafted for the true connoisseur.
          </p>

          <div className={styles.searchWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search your favorites..."
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
          {staticCategories.map((c) => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(c.id)}
              className={`${styles.categoryPill} ${selectedCategory === c.id ? styles.activePill : ""
                }`}
            >
              <span>{c.icon}</span>
              {c.name}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ---------- MENU GRID WITH ANIMATIONS ---------- */}
      <main className={styles.menu}>
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={item._id}
                  className={styles.card}
                >
                  <div className={styles.imgWrap}>
                    <img
                      src={item.image || "/placeholder-food.jpg"}
                      alt={item.name}
                      className={styles.img}
                      loading="lazy"
                    />
                    <div className={styles.overlay} />
                    <span className={styles.tag}>{item.category}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <span className={styles.price}>₹{item.price}</span>
                    </div>
                    <p className={styles.desc}>{item.description}</p>
                    <button
                      onClick={() => handleAdd(item)}
                      className={styles.addBtn}
                    >
                      <FaPlus size={14} />
                      Add to Order
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
              <div className={styles.cartInfo}>
                <div className={styles.cartIconBox}>
                  <ShoppingBag size={20} />
                  <span className={styles.badgeCount}>{cartTotalItems}</span>
                </div>
                <div>
                  <p className={styles.cartLabel}>View Order</p>
                  <p className={styles.cartSubtext}>Naveen's Cafe</p>
                </div>
              </div>
              <ChevronRight size={24} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>Naveen's</div>
        <p>© {new Date().getFullYear()} Naveen's cafe. Crafted with passion.</p>
      </footer>
    </div>
  );
}
