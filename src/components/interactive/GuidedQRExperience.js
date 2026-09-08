import React, { useState } from "react";
import {
  QrCode,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Camera,
  RotateCcw,
  Check,
  Send,
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
    description: "Small-batch blend, aromatic bitters, flamed orange peel, smoked cedar mist.",
    dietary: ["Signature"],
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80"
  }
];

export default function GuidedQRExperience() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState({
    "truffle-burger": { item: SAMPLE_MENU[0], quantity: 1 }
  });

  const steps = [
    {
      num: 1,
      title: "Scan the Table QR",
      desc: "Opens the menu instantly in mobile Safari or Chrome. No app download, no account signup."
    },
    {
      num: 2,
      title: "Browse & Customize",
      desc: "Guests explore photo-rich menus in Indian Rupees (₹), select cooking temperatures, add sides, and specify allergy notes."
    },
    {
      num: 3,
      title: "Review & Place Order",
      desc: "Diners review their seated cart and send the order straight to the kitchen in 1 tap."
    },
    {
      num: 4,
      title: "Live KDS & KOT Sync",
      desc: "The order instantly arrives on kitchen display screens and thermal KOT printers."
    }
  ];

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
        [item.id]: { item, quantity: count }
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

  const resetFlow = () => {
    setCurrentStep(1);
    setCart({
      "truffle-burger": { item: SAMPLE_MENU[0], quantity: 1 }
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive 4-Step Vertical Stepper */}
        <div className="lg:col-span-6 space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-600" /> Interactive Stepper Flow
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
              How Table QR Ordering Works
            </h3>
            <p className="text-xs text-slate-500 font-medium m-0">
              Tap through the 4 steps below or interact directly with the phone.
            </p>
          </div>

          {/* 4 Steps Vertical Stepper with connected line */}
          <div className="relative space-y-3 pl-1">
            <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-slate-200" />

            {steps.map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <div
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  className={`relative flex items-start gap-3.5 p-3 rounded-2xl transition-all cursor-pointer border ${
                    isActive
                      ? "bg-orange-50/70 border-orange-300 shadow-sm"
                      : isCompleted
                      ? "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                      : "bg-transparent border-transparent hover:bg-slate-50"
                  }`}
                >
                  {/* Step Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all ${
                      isActive
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-4 ring-orange-100"
                        : isCompleted
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white border-2 border-slate-300 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>

                  <div className="space-y-0.5 flex-1">
                    <h4
                      className={`text-xs sm:text-sm font-bold transition-colors m-0 ${
                        isActive ? "text-orange-950 font-extrabold" : "text-slate-800"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium m-0">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prompt footer */}
          <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-center gap-2 text-xs font-semibold text-orange-800">
            <Smartphone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Go on, tap through the phone on the right!</span>
          </div>
        </div>

        {/* Right Column: Interactive Phone Device Screen */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-[325px] bg-slate-900 rounded-[38px] p-3 shadow-2xl shadow-slate-900/20 border-4 border-slate-700 ring-1 ring-slate-400/30">
            {/* Phone Inner Screen */}
            <div className="relative w-full bg-slate-50 rounded-[28px] overflow-hidden flex flex-col min-h-[470px] text-slate-900">
              {/* Top Status Bar */}
              <div className="pt-2 px-5 pb-1.5 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 bg-white">
                <span className="font-bold text-slate-900">9:41</span>
                <div className="w-16 h-3.5 bg-slate-900 rounded-full mx-auto" />
                <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Wi-Fi</span>
                </div>
              </div>

              {/* STEP 1: Scan Table QR Screen */}
              {currentStep === 1 && (
                <div className="flex-1 p-4 flex flex-col items-center justify-between text-center space-y-3 animate-in fade-in zoom-in-95">
                  <div className="space-y-0.5 pt-1">
                    <div className="text-[9px] font-black tracking-widest uppercase text-orange-600">
                      THE COPPER CHIMNEY
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 m-0">TABLE 7</h4>
                    <p className="text-[10px] text-slate-500 font-medium m-0">Fine Casual Dining</p>
                  </div>

                  {/* Table QR Stand */}
                  <div className="relative p-3.5 rounded-2xl bg-white border border-slate-200 shadow-md space-y-1.5 w-full max-w-[200px]">
                    <div className="text-[9px] font-bold text-slate-800 tracking-wider">TABLE 7</div>
                    
                    <div className="relative w-28 h-28 mx-auto bg-white p-1 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                        <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                        <rect x="10" y="10" width="18" height="18" rx="2" fill="#ffffff" />
                        <rect x="14" y="14" width="10" height="10" rx="1" fill="#0f172a" />
                        <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                        <rect x="72" y="10" width="18" height="18" rx="2" fill="#ffffff" />
                        <rect x="76" y="14" width="10" height="10" rx="1" fill="#0f172a" />
                        <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
                        <rect x="10" y="72" width="18" height="18" rx="2" fill="#ffffff" />
                        <rect x="14" y="76" width="10" height="10" rx="1" fill="#0f172a" />
                        <rect x="40" y="8" width="6" height="6" fill="#0f172a" />
                        <rect x="52" y="8" width="6" height="6" fill="#0f172a" />
                        <rect x="40" y="20" width="6" height="6" fill="#0f172a" />
                        <rect x="46" y="26" width="6" height="6" fill="#0f172a" />
                        <rect x="10" y="40" width="6" height="6" fill="#0f172a" />
                        <rect x="22" y="46" width="6" height="6" fill="#0f172a" />
                        <rect x="40" y="40" width="8" height="8" fill="#ea580c" />
                        <rect x="54" y="40" width="6" height="6" fill="#0f172a" />
                        <rect x="68" y="46" width="6" height="6" fill="#0f172a" />
                        <rect x="80" y="40" width="6" height="6" fill="#0f172a" />
                        <rect x="40" y="58" width="6" height="6" fill="#0f172a" />
                        <rect x="52" y="54" width="6" height="6" fill="#0f172a" />
                        <rect x="68" y="68" width="6" height="6" fill="#0f172a" />
                        <rect x="80" y="74" width="6" height="6" fill="#0f172a" />
                        <rect x="46" y="80" width="6" height="6" fill="#0f172a" />
                        <rect x="58" y="80" width="6" height="6" fill="#0f172a" />
                      </svg>
                    </div>

                    <div className="text-[8px] text-slate-500 font-medium">Scan with camera to view menu</div>
                  </div>

                  <div className="space-y-2.5 w-full">
                    <p className="text-[11px] text-slate-600 font-medium px-2 leading-tight m-0">
                      You are seated at <strong className="text-slate-900">Table 7</strong>. Tap below to simulate scanning the code.
                    </p>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Browse Menu & Add to Cart */}
              {currentStep === 2 && (
                <div className="flex-1 flex flex-col justify-between animate-in fade-in zoom-in-95">
                  <div className="p-2.5 bg-white border-b border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-900 m-0">The Copper Chimney</h4>
                        <p className="text-[9px] text-slate-500 m-0">Table 7 • Photo Menu</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-orange-100 text-orange-800 font-bold">
                        {totalItemCount} in Cart
                      </span>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {["All", "Mains", "Starters", "Drinks"].map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap border-0 cursor-pointer ${
                            selectedCategory === cat
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Menu Items List */}
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[280px] bg-slate-100/60">
                    {SAMPLE_MENU.filter(
                      (i) => selectedCategory === "All" || i.category === selectedCategory
                    ).map((item) => {
                      const inCart = cart[item.id];

                      return (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-white border border-slate-200 flex gap-2 items-center justify-between shadow-2xs"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            <div className="text-[11px] font-bold text-slate-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-black text-orange-700 font-mono">
                              ₹{item.price}
                            </div>
                          </div>

                          {inCart ? (
                            <div className="flex items-center gap-1 bg-orange-50 border border-orange-300 rounded p-0.5">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="w-3.5 h-3.5 flex items-center justify-center text-orange-800 text-xs font-bold cursor-pointer border-0 bg-transparent"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[9px] font-black text-orange-900 px-1 font-mono">
                                {inCart.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item)}
                                className="w-3.5 h-3.5 flex items-center justify-center text-orange-800 text-xs font-bold cursor-pointer border-0 bg-transparent"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="px-2 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold hover:bg-orange-700 cursor-pointer shadow-2xs border-0"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Proceed to Step 3 */}
                  <div className="p-2.5 bg-white border-t border-slate-200 space-y-1">
                    <div className="flex justify-between text-[10px] px-1 font-bold text-slate-800">
                      <span>{totalItemCount} Items Selected</span>
                      <span className="text-orange-600 font-mono">₹{subtotal}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer border-0"
                    >
                      <span>Proceed to Review Cart</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review Cart & Place Order */}
              {currentStep === 3 && (
                <div className="flex-1 p-3 flex flex-col justify-between animate-in fade-in zoom-in-95 bg-white">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-900 m-0">Table 7 Order Summary</h4>
                        <p className="text-[9px] text-slate-500 m-0">Review before kitchen dispatch</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[9px] text-orange-600 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        + Add dishes
                      </button>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {Object.values(cart).map((entry) => (
                        <div
                          key={entry.item.id}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-[10px]">{entry.item.name}</div>
                            <span className="text-[9px] text-slate-500 font-mono">
                              Qty: {entry.quantity} x ₹{entry.item.price}
                            </span>
                          </div>
                          <span className="font-black text-slate-900 text-[11px] font-mono">
                            ₹{entry.item.price * entry.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-0.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (5%)</span>
                        <span className="font-mono">₹{gst}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-[11px] pt-1 border-t border-slate-200">
                        <span>Grand Total</span>
                        <span className="text-orange-600 font-mono">₹{grandTotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Order to Kitchen</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Live KDS & KOT Sync */}
              {currentStep === 4 && (
                <div className="flex-1 p-3.5 flex flex-col items-center justify-between text-center space-y-2.5 bg-white">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto mt-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900 m-0">Order #104 Live in Kitchen!</h4>
                    <p className="text-[10px] text-slate-600 leading-tight max-w-[220px] m-0">
                      Ticket routed to Grill & Bar KDS screens with instant KOT generation.
                    </p>
                  </div>

                  {/* Digital Chit Card */}
                  <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-left space-y-1 text-[9px] font-mono">
                    <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-0.5">
                      <span>SERVIQ KOT #104</span>
                      <span>TABLE 7</span>
                    </div>
                    <div className="text-slate-600 pt-0.5 space-y-0.5">
                      <div>1x Angus Truffle Burger (Grill)</div>
                      <div>1x Crispy Calamari (Fryer)</div>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                      <span>Status: In Kitchen Prep</span>
                      <span>₹{grandTotal}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetFlow}
                    className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restart Walkthrough</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
