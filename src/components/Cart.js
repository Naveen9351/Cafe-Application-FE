// src/pages/Cart.jsx
import { useState, useEffect } from "react";
import { useCartContext } from "../context/CartContext";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  FaPlus,
  FaMinus,
  FaTrash,
  FaShoppingCart,
  FaExclamationCircle,
} from "react-icons/fa";
import styles from "./Cart.module.css";

const API = process.env.REACT_APP_API_URL || "https://cafe-application-be-1.onrender.com/api";

export default function Cart() {
  const {
    items,
    setItems,
    updateItemQuantity,
    removeItem,        // <-- this is the key!
    getCartTotal,
  } = useCartContext();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState(
    localStorage.getItem("tableNumber") || ""
  );
  const [error, setError] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [cartKey, setCartKey] = useState(0);

  /* --------------------------------------------------------------- */
  /* 1. Table number */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const urlTable = searchParams.get("table");
    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem("tableNumber", urlTable);
    } else if (!tableNumber) {
      const stored = localStorage.getItem("tableNumber");
      if (!stored) {
        setError("No table number detected. Scan the QR code on your table.");
      } else {
        setTableNumber(stored);
      }
    }
  }, [searchParams, tableNumber]);

  /* --------------------------------------------------------------- */
  /* 2. Sync with localStorage */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved && items.length === 0) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cartItems", e);
      }
    }
  }, [items.length, setItems]);

  useEffect(() => {
    if (items.length) {
      localStorage.setItem("cartItems", JSON.stringify(items));
    } else {
      localStorage.removeItem("cartItems");
    }
  }, [items]);

  /* --------------------------------------------------------------- */
  /* 3. Place order */
  /* --------------------------------------------------------------- */
  const placeOrder = async () => {
    if (!tableNumber) {
      toast.error("Table number required");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsPlacing(true);
    setError(null);
    try {
      const payload = {
        items: items.map((i) => i.id),
        quantities: items.map((i) => i.quantity),
        total: getCartTotal(),
        tableNumber,
        status: "pending",
      };
      const { data } = await axios.post(`${API}/orders`, payload);

      // Clear cart
      setItems([]);
      localStorage.removeItem("cartItems");
      setCartKey((k) => k + 1);
      navigate(`/order/status/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  /* --------------------------------------------------------------- */
  /* 4. Clear Cart – using setItems */
  /* --------------------------------------------------------------- */
  const handleClearCart = () => {
    if (isPlacing) return;
    setItems([]);
    localStorage.removeItem("cartItems");
    setCartKey((k) => k + 1);
    toast.success("Cart cleared!");
  };

  /* --------------------------------------------------------------- */
  /* 5. Remove single item – using removeItem from context */
  /* --------------------------------------------------------------- */
  const handleRemoveItem = (id) => {
    if (isPlacing) return;
    removeItem(id); // <-- this is the fix
    toast.success("Item removed");
  };

  /* --------------------------------------------------------------- */
  /* 6. Helpers */
  /* --------------------------------------------------------------- */
  const cartTotalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={styles.page} key={cartKey}>
      <Toaster position="top-center" />

      {/* HERO */}
      <header className={styles.hero}>
        <h1 className={styles.title}>Your Cart</h1>
        {tableNumber && (
          <p className={styles.tableBadge}>Table #{tableNumber}</p>
        )}
      </header>

      {/* ERROR */}
      {error && (
        <div className={styles.alert}>
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}

      {/* EMPTY STATE */}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <FaShoppingCart size={48} />
          <p>Your cart is empty.</p>
          {tableNumber && (
            <Link to={`/menu?table=${tableNumber}`} className={styles.emptyLink}>
              Add items for Table #{tableNumber}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ITEMS GRID */}
          <section className={styles.grid}>
            {items.map((item) => (
              <article key={item.id} className={styles.card}>
                <img
                  src={item.image || "/placeholder-food.jpg"}
                  alt={item.name}
                  className={styles.itemImg}
                  loading="lazy"
                />
                <div className={styles.cardBody}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.priceLine}>
                    ₹{item.price} × {item.quantity} = ₹
                    {(item.price * item.quantity).toFixed(2)}
                  </p>

                  <div className={styles.actions}>
                    <button
                      onClick={() =>
                        updateItemQuantity(item.id, item.quantity + 1)
                      }
                      className={styles.qtyBtn}
                      disabled={isPlacing}
                    >
                      <FaPlus />
                    </button>

                    <span className={styles.qty}>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateItemQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      className={styles.qtyBtn}
                      disabled={isPlacing || item.quantity <= 1}
                    >
                      <FaMinus />
                    </button>

                    {/* DELETE BUTTON – NOW WORKS */}
                    {/* <button
                      onClick={() => handleRemoveItem(item.id)}
                      className={styles.removeBtn}
                      disabled={isPlacing}
                    >
                      <FaTrash />
                    </button> */}
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* SUMMARY */}
          <section className={styles.summary}>
            <div className={styles.totalRow}>
              <span>Total ({cartTotalItems} items)</span>
              <strong>₹{getCartTotal().toFixed(2)}</strong>
            </div>

            <div className={styles.buttonRow}>
              <button
                onClick={handleClearCart}
                disabled={isPlacing}
                className={styles.clearBtn}
              >
                Clear Cart
              </button>

              <button
                onClick={placeOrder}
                disabled={!tableNumber || isPlacing}
                className={styles.orderBtn}
              >
                {isPlacing ? "Placing…" : `Place Order – Table #${tableNumber}`}
              </button>
            </div>
          </section>
        </>
      )}

      {/* FAB */}
      <Link
        to={`/menu?table=${tableNumber}`}
        className={styles.fab}
        aria-label="Back to menu"
      >
        <FaShoppingCart size={26} />
        {cartTotalItems > 0 && (
          <span className={styles.fabBadge}>{cartTotalItems}</span>
        )}
      </Link>
    </div>
  );
}