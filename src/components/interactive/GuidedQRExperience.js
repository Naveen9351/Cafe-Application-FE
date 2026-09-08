import React, { useState } from "react";
import {
  QrCode,
  Plus,
  Minus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Camera,
  RotateCcw,
  Smartphone
} from "lucide-react";

const SAMPLE_MENU = [
  {
    id: "truffle-burger",
    name: "Dry-Aged Angus Truffle Burger",
    category: "Mains",
    price: 385,
    description: "Dry-aged prime beef, black truffle aioli, aged cheddar, toasted brioche.",
    dietary: ["Chef's Pick"],
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "woodfired-margherita",
    name: "Woodfired Artisan Margherita",
    category: "Mains",
    price: 320,
    description: "San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, olive oil.",
    dietary: ["Vegetarian"],
    imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "crispy-calamari",
    name: "Salt & Pepper Crispy Calamari",
    category: "Starters",
    price: 280,
    description: "Tender local squid, charred lemon, smoked paprika garlic aioli.",
    dietary: ["Crispy"],
    imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "smoked-cocktail",
    name: "Cedar Smoked Signature Blend",
    category: "Drinks",
    price: 350,
    description: "Small-batch blend, aromatic bitters, cedar smoke mist.",
    dietary: ["Signature"],
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80"
  }
];

export default function GuidedQRExperience() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cart, setCart] = useState({
    "truffle-burger": { item: SAMPLE_MENU[0], quantity: 1 }
  });

  const steps = [
    {
      step: 1,
      title: "Scan the Table QR",
      desc: "Opens the menu instantly in mobile Safari or Chrome. No app download, no account signup."
    },
    {
      step: 2,
      title: "Browse & Customize",
      desc: "Guests explore photo-rich menus in Indian Rupees (₹), select cooking temperatures, add sides, and specify notes."
    },
    {
      step: 3,
      title: "Review & Place Order",
      desc: "Diners review their seated cart and send the order straight to the kitchen in 1 tap."
    },
    {
      step: 4,
      title: "Live KDS & KOT Sync",
      desc: "The order instantly arrives on kitchen display screens and thermal KOT printers."
    }
  ];

  const addToCart = (dish) => {
    setCart((prev) => ({
      ...prev,
      [dish.id]: {
        item: dish,
        quantity: (prev[dish.id]?.quantity || 0) + 1
      }
    }));
  };

  const removeFromCart = (dishId) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[dishId]?.quantity > 1) {
        updated[dishId].quantity -= 1;
      } else {
        delete updated[dishId];
      }
      return updated;
    });
  };

  const grandTotal = Object.values(cart).reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 2-Column Interactive Walkthrough */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
        
        {/* Left Column: 4 Interactive Stage Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="badge-pill badge-blue" style={{ alignSelf: "flex-start" }}>
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Interactive Stepper Flow</span>
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", margin: 0 }}>
            How Table QR Ordering Works
          </h3>

          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Tap through the 4 steps below or interact directly with the phone simulator.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {steps.map((s) => {
              const isActive = currentStep === s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  style={{
                    padding: 16,
                    borderRadius: "var(--radius-lg)",
                    background: isActive ? "var(--color-primary-light)" : "var(--bg-card-subtle)",
                    border: `1.5px solid ${isActive ? "var(--color-primary)" : "var(--border-subtle)"}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start"
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isActive ? "var(--color-primary)" : "var(--border-subtle)",
                      color: isActive ? "#ffffff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                      {s.title}
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Simulated Phone Step Display */}
        <div
          style={{
            background: "#ffffff",
            border: "4px solid #0f172a",
            borderRadius: 36,
            height: 480,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "var(--shadow-xl)"
          }}
        >
          <div style={{ width: 100, height: 16, background: "#0f172a", borderRadius: "0 0 10px 10px", margin: "0 auto" }} />

          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase" }}>
              The Copper Chimney
            </div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>TABLE #14 • STEP {currentStep} OF 4</div>
          </div>

          <div style={{ flex: 1, padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {currentStep === 1 && (
              <div style={{ textAlign: "center", padding: "20px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <QrCode style={{ width: 80, height: 80, color: "var(--color-primary)" }} />
                <div style={{ fontSize: 14, fontWeight: 800 }}>Scan QR to Open Menu</div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-electric"
                  style={{ width: "100%", padding: "10px", fontSize: 12 }}
                >
                  Simulate QR Scan →
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SAMPLE_MENU.map((dish) => (
                  <div key={dish.id} style={{ display: "flex", gap: 8, padding: 8, background: "var(--bg-card-subtle)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <img src={dish.imageUrl} alt={dish.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>{dish.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 900 }}>₹{dish.price}</div>
                    </div>
                    <button
                      onClick={() => addToCart(dish)}
                      style={{ padding: "4px 8px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 800, cursor: "pointer", alignSelf: "center" }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-electric"
                  style={{ width: "100%", padding: "8px", fontSize: 11, marginTop: 6 }}
                >
                  View Cart ({Object.keys(cart).length} items) →
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>Cart Review</div>
                {Object.values(cart).map((entry) => (
                  <div key={entry.item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span>{entry.quantity}x {entry.item.name}</span>
                    <span style={{ fontWeight: 800 }}>₹{entry.item.price * entry.quantity}</span>
                  </div>
                ))}
                <div style={{ paddingTop: 8, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13 }}>
                  <span>Total (inc. GST)</span>
                  <span style={{ color: "var(--color-primary)" }}>₹{grandTotal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn-electric"
                  style={{ width: "100%", padding: "10px", fontSize: 12, marginTop: 10 }}
                >
                  Place Order Now →
                </button>
              </div>
            )}

            {currentStep === 4 && (
              <div style={{ textAlign: "center", padding: "24px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-emerald-light)", color: "var(--color-emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 style={{ width: 26, height: 26 }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>KOT #104 Fired to Kitchen</div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  Kitchen display screens have chimed. Chefs are now preparing your order.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{ fontSize: 11, fontWeight: 800, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}
                >
                  ↺ Restart Stepper Demo
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
