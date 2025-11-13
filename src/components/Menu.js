// src/pages/Menu.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useCartContext } from "../context/CartContext";
import { Link, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaShoppingCart, FaPlus } from "react-icons/fa";
import QRCodeComponent from "./QRCodeComponent";
import styles from "./Menu.module.css";

const API = process.env.REACT_APP_API_URL || "https://cafe-application-be-1.onrender.com/api";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableNumber, setTableNumber] = useState("");
  const { addItem, items: cartItems } = useCartContext(); // <-- renamed to match context
  const [searchParams] = useSearchParams();

  // ------------------------------------------------------------------ //
  // 1. Static categories
  // ------------------------------------------------------------------ //
  const staticCategories = [
    { id: "all", name: "All" },
    { id: "chai", name: "Chai" },
    { id: "cold-coffee", name: "Cold Coffee" },
    { id: "hot-coffee", name: "Hot Coffee" },
    { id: "maggi", name: "Maggi" },
    { id: "burger", name: "Burger" },
    { id: "pizza", name: "Pizza" },
    { id: "chinese", name: "Chinese" },
    { id: "sandwich", name: "Sandwich" },
    { id: "snacks", name: "Snacks" },
    { id: "wraps", name: "Wraps" },
    { id: "pasta", name: "Pasta" },
    { id: "cold-drinks", name: "Cold Drinks" },
    { id: "mocktails", name: "Mocktails" },
    { id: "juices", name: "Juices" },
    { id: "shakes", name: "Shakes" },
    { id: "desserts", name: "Desserts" },
    { id: "cakes", name: "Cakes" },
    { id: "water", name: "Water" },
    { id: "cigarettes", name: "Cigarettes" },
    { id: "disposables", name: "Disposables" },
    { id: "dips", name: "Dips" },
  ];

  // ------------------------------------------------------------------ //
  // 2. Load table number + fetch menu
  // ------------------------------------------------------------------ //
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

  // ------------------------------------------------------------------ //
  // 3. Filter items
  // ------------------------------------------------------------------ //
  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((i) => i.category === selectedCategory);

  // ------------------------------------------------------------------ //
  // 4. Add-to-cart handler
  // ------------------------------------------------------------------ //
  const handleAdd = (item) => {
    if (!tableNumber) {
      toast.error("Enter your table number first!");
      return;
    }
    addItem({
      id: item._id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
    });
    toast.success(`${item.name} added!`, {
      style: { background: "#10b981", color: "#fff" },
    });
  };

  // ------------------------------------------------------------------ //
  // 5. QR-code URL
  // ------------------------------------------------------------------ //
  const qrUrl = tableNumber
    ? `https://cafe-application-fe.vercel.app/menu?table=${tableNumber}`
    : null;

  // ------------------------------------------------------------------ //
  // 6. Cart badge count (total items, not just length)
  // ------------------------------------------------------------------ //
  const cartTotalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ------------------------------------------------------------------ //
  // 7. Render
  // ------------------------------------------------------------------ //
  return (
    <div className={styles.page}>
      <Toaster position="top-center" />

      {/* ---------- HERO ---------- */}
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>The Landmark cafe</h1>
          <p className={styles.heroSubtitle}>
            Artisanal coffees, teas &amp; bites – all at your table.
          </p>

          {tableNumber && (
            <p className={styles.tableInfo}>
              <strong>Table #{tableNumber}</strong>
            </p>
          )}
        </div>
      </header>

      {/* ---------- CATEGORIES ---------- */}
      <section className={styles.categories}>
        <div className={styles.categoryScroll}>
          {staticCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`${styles.categoryPill} ${
                selectedCategory === c.id ? styles.activePill : ""
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* ---------- MENU GRID ---------- */}
      <section className={styles.menu}>
        {filteredItems.length === 0 ? (
          <p className={styles.empty}>No items in this category.</p>
        ) : (
          <div className={styles.grid}>
            {filteredItems.map((item) => (
              <article key={item._id} className={styles.card}>
                <div className={styles.imgWrap}>
                  <img
                    src={item.image || "/placeholder-food.jpg"}
                    alt={item.name}
                    className={styles.img}
                    loading="lazy"
                  />
                  <span className={styles.tag}>{item.category}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.itemName}>{item.name}</h3>

                  {/* 3-line truncation */}
                  <p className={styles.desc}>
                    {item.description}
                  </p>

                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{item.price}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      className={styles.addBtn}
                      disabled={!tableNumber}
                    >
                      <FaPlus size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- FLOATING CART – NOW SHOWS CORRECT COUNT ---------- */}
      <Link
        to={`/cart?table=${tableNumber}`}
        className={styles.fab}
        aria-label="Open cart"
      >
        <FaShoppingCart size={26} />
        {cartTotalItems > 0 && (
          <span className={styles.fabBadge}>{cartTotalItems}</span>
        )}
      </Link>

      {/* ---------- FOOTER ---------- */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} The Landmark cafe – All rights reserved.
      </footer>
    </div>
  );
}