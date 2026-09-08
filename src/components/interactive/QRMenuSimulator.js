import React, { useState } from "react";
import {
  QrCode,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import styles from "../../styles/Simulator.module.css";

const SAMPLE_MENU = [
  {
    id: "truffle-burger",
    name: "Dry-Aged Angus Truffle Burger",
    category: "Mains",
    price: 385,
    description: "Dry-aged prime patty, black truffle aioli, aged cheddar, caramelized onions, toasted brioche.",
    dietary: ["Chef's Pick"],
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Brioche Bun", "Medium Well", "Truffle Fries"]
  },
  {
    id: "woodfired-margherita",
    name: "Woodfired Artisan Margherita",
    category: "Mains",
    price: 320,
    description: "San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, cold-pressed olive oil.",
    dietary: ["Vegetarian"],
    imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Thin Crust", "Extra Basil Oil"]
  },
  {
    id: "crispy-calamari",
    name: "Salt & Pepper Crispy Calamari",
    category: "Starters",
    price: 280,
    description: "Tender local calamari, charred lemon, house-smoked paprika garlic aioli.",
    dietary: ["Crispy", "Popular"],
    imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Garlic Aioli Dip", "Mild Spice"]
  },
  {
    id: "ceremonial-matcha",
    name: "Iced Ceremonial Matcha Latte",
    category: "Drinks",
    price: 240,
    description: "Single-origin Uji matcha, organic oat milk, light vanilla bean foam.",
    dietary: ["Vegan", "Popular"],
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Oat Milk", "Less Ice"]
  }
];

export default function QRMenuSimulator({ onOrderPlaced }) {
  const [cart, setCart] = useState([
    {
      id: "truffle-burger",
      name: "Dry-Aged Angus Truffle Burger",
      price: 385,
      quantity: 1,
      notes: "Brioche • Medium Well"
    }
  ]);
  const [orderState, setOrderState] = useState("browsing"); // browsing, placed

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          notes: item.defaultModifiers.slice(0, 2).join(" • ")
        }
      ];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    setOrderState("placed");

    if (onOrderPlaced) {
      onOrderPlaced({
        tableNumber: 14,
        items: cart,
        total: totalAmount
      });
    }

    setTimeout(() => {
      setOrderState("browsing");
      setCart([]);
    }, 4500);
  };

  return (
    <div className={styles.phoneFrame}>
      {/* Phone Notch */}
      <div className={styles.phoneNotch} />

      {/* Phone Header */}
      <div className={styles.phoneHeader}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase" }}>
            The Copper Chimney
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-main)" }}>
            Table #14 • Dine-In
          </div>
        </div>
        <span className="badge-pill badge-blue" style={{ fontSize: 9 }}>
          Menu Live (₹)
        </span>
      </div>

      {/* Menu List Scroll */}
      <div className={styles.phoneMenuScroll}>
        {orderState === "placed" ? (
          <div style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-emerald-light)", color: "var(--color-emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 style={{ width: 28, height: 28 }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)" }}>
              Order Sent Straight to Kitchen!
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Look at the Kitchen Display (Right). KOT #104 has arrived instantly with zero delay.
            </p>
          </div>
        ) : (
          SAMPLE_MENU.map((dish) => {
            const inCart = cart.find((i) => i.id === dish.id);
            return (
              <div key={dish.id} className={styles.foodCard}>
                <img src={dish.imageUrl} alt={dish.name} className={styles.foodImg} />
                <div className={styles.foodInfo}>
                  <div>
                    <div className={styles.foodName}>{dish.name}</div>
                    <div className={styles.foodPrice}>₹{dish.price}</div>
                  </div>

                  {inCart ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-end" }}>
                      <button
                        onClick={() => removeFromCart(dish.id)}
                        style={{ width: 22, height: 22, borderRadius: 4, background: "var(--bg-card-subtle)", border: "1px solid var(--border-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Minus style={{ width: 12, height: 12 }} />
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{inCart.quantity}</span>
                      <button
                        onClick={() => addToCart(dish)}
                        style={{ width: 22, height: 22, borderRadius: 4, background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Plus style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(dish)}
                      className={styles.foodBtn}
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Phone Bottom Cart Bar */}
      {orderState === "browsing" && (
        <div className={styles.phoneFooter}>
          <button
            type="button"
            onClick={handleSendOrder}
            disabled={cart.length === 0}
            className="btn-electric"
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 12,
              borderRadius: "var(--radius-md)",
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            <span>Send to Kitchen (₹{totalAmount})</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
}
