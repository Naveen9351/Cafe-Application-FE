import React, { useState } from "react";
import {
  QrCode,
  ShoppingBag,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

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
    id: "burrata-salad",
    name: "Heirloom Burrata & Pesto Salad",
    category: "Starters",
    price: 310,
    description: "Fresh burrata, organic heirloom tomatoes, basil reduction, artisan sourdough toast.",
    dietary: ["Vegetarian"],
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Extra Balsamic", "Sourdough Toast"]
  },
  {
    id: "smoked-old-fashioned",
    name: "Cedar Smoked Signature Blend",
    category: "Drinks",
    price: 350,
    description: "Small-batch blend, aromatic bitters, flamed orange peel, smoked cedar mist.",
    dietary: ["Signature"],
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Hand-Cut Clear Ice", "Smoked Rim"]
  },
  {
    id: "chocolate-fondant",
    name: "Warm Valrhona Chocolate Fondant",
    category: "Desserts",
    price: 240,
    description: "Molten dark chocolate center, vanilla bean gelato, candied hazelnut praline.",
    dietary: ["Housemade"],
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80",
    defaultModifiers: ["Vanilla Gelato", "Extra Berry Coulis"]
  }
];

export default function QRMenuSimulator({ onOrderPlaced }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState({
    "truffle-burger": { item: SAMPLE_MENU[0], quantity: 1, notes: "Brioche • Truffle Fries" }
  });
  const [isOrdered, setIsOrdered] = useState(false);

  const categories = ["All", "Mains", "Starters", "Drinks", "Desserts"];

  const filteredItems =
    selectedCategory === "All"
      ? SAMPLE_MENU
      : SAMPLE_MENU.filter((item) => item.category === selectedCategory);

  const totalItemCount = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = Object.values(cart).reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const count = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: count,
          notes: existing?.notes || item.defaultModifiers.join(" • ")
        }
      };
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[itemId]) {
        if (updated[itemId].quantity > 1) {
          updated[itemId].quantity -= 1;
        } else {
          delete updated[itemId];
        }
      }
      return updated;
    });
  };

  const handlePlaceOrder = () => {
    if (totalItemCount === 0) return;

    const orderPayload = {
      tableNumber: 14,
      items: Object.values(cart).map((c) => ({
        name: c.item.name,
        quantity: c.quantity,
        notes: c.notes,
        price: c.item.price
      })),
      total: grandTotal
    };

    setIsOrdered(true);
    if (onOrderPlaced) {
      onOrderPlaced(orderPayload);
    }
  };

  const resetDemo = () => {
    setIsOrdered(false);
    setCart({
      "truffle-burger": { item: SAMPLE_MENU[0], quantity: 1, notes: "Brioche • Truffle Fries" }
    });
  };

  return (
    <div className="relative w-full max-w-[320px] mx-auto bg-slate-900 rounded-[38px] p-3 shadow-2xl shadow-slate-900/20 border-4 border-slate-700 ring-1 ring-slate-400/30">
      {/* Phone Screen Container */}
      <div className="relative w-full bg-slate-50 rounded-[28px] overflow-hidden flex flex-col min-h-[460px] max-h-[490px] text-slate-900">
        {/* Top Status Bar */}
        <div className="pt-2 px-4 pb-1.5 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 bg-white shrink-0">
          <span className="font-bold text-slate-900">9:41</span>
          <div className="w-16 h-3.5 bg-slate-900 rounded-full mx-auto" />
          <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>5G</span>
          </div>
        </div>

        {/* Restaurant Header */}
        <div className="p-2.5 bg-white border-b border-slate-200 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                S
              </div>
              <div>
                <h4 className="text-[11px] font-black tracking-tight text-slate-900 m-0">The Copper Chimney</h4>
                <p className="text-[9px] font-medium text-slate-500 m-0">Fine Casual Dining</p>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-[9px] font-bold">
              <QrCode className="w-2.5 h-2.5 text-orange-600" />
              <span>Table 14</span>
            </div>
          </div>

          {/* Category Tabs */}
          {!isOrdered && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap transition-all cursor-pointer border-0 ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Menu / Order State Area */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[290px] bg-slate-100/60 relative">
          {isOrdered ? (
            /* Order Sent Confirmation Screen */
            <div className="p-4 rounded-2xl bg-white border border-emerald-300 text-center space-y-2.5 my-auto shadow-sm animate-in zoom-in-95">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-slate-900 m-0">Order Sent to Kitchen!</h5>
                <p className="text-[10px] text-slate-600 leading-tight m-0">
                  Your meal is being prepared for <strong className="text-slate-900">Table 14</strong>.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 text-left space-y-1 text-[10px] border border-slate-200">
                <div className="flex justify-between text-slate-500">
                  <span>Status</span>
                  <span className="text-emerald-700 font-bold">In Preparation</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Items</span>
                  <span className="text-slate-900 font-semibold">{totalItemCount} dishes</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Bill</span>
                  <span className="text-orange-600 font-black">₹{grandTotal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetDemo}
                className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Simulate Ordering Again</span>
              </button>
            </div>
          ) : (
            /* Menu Items List */
            filteredItems.map((item) => {
              const inCart = cart[item.id];
              return (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-2xs transition-all flex gap-2 items-center group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-[10px] font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors m-0">
                          {item.name}
                        </h5>
                        <span className="text-[10px] font-black text-slate-900 shrink-0 font-mono">
                          ₹{item.price}
                        </span>
                      </div>

                      <p className="text-[8px] text-slate-500 line-clamp-1 mt-0.5 leading-snug m-0">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-0.5">
                      <div className="flex items-center gap-1">
                        {item.dietary?.slice(0, 1).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[7px] px-1 py-0.2 rounded bg-orange-50 text-orange-800 font-bold border border-orange-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-0.5 bg-orange-50 border border-orange-300 rounded p-0.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-3.5 h-3.5 rounded flex items-center justify-center text-orange-800 hover:bg-orange-200 text-[10px] font-bold cursor-pointer border-0 bg-transparent"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="text-[9px] font-black text-orange-900 px-0.5 font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="w-3.5 h-3.5 rounded flex items-center justify-center text-orange-800 hover:bg-orange-200 text-[10px] font-bold cursor-pointer border-0 bg-transparent"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-2 py-0.5 rounded bg-orange-600 text-white text-[8px] font-bold hover:bg-orange-700 transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs border-0"
                        >
                          <Plus className="w-2 h-2" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Cart Bar */}
        {!isOrdered && (
          <div className="p-2.5 bg-white border-t border-slate-200 mt-auto space-y-1 shadow-md shrink-0">
            <div className="flex items-center justify-between text-[10px] px-0.5">
              <span className="text-slate-600 flex items-center gap-1 font-bold">
                <ShoppingBag className="w-3 h-3 text-orange-600" />
                <span>{totalItemCount} Items</span>
              </span>
              <span className="text-slate-900 font-black text-[11px] font-mono">
                ₹{grandTotal}
              </span>
            </div>

            <button
              type="button"
              disabled={totalItemCount === 0}
              onClick={handlePlaceOrder}
              className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 border-0"
            >
              <span>Send Order to Kitchen</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
