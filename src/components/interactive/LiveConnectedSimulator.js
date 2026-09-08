import React, { useState } from "react";
import QRMenuSimulator from "./QRMenuSimulator";
import KDSSimulator from "./KDSSimulator";
import { Utensils, CheckCircle2 } from "lucide-react";

export default function LiveConnectedSimulator() {
  const [syncedTicket, setSyncedTicket] = useState(null);
  const [flashSync, setFlashSync] = useState(false);

  const handleOrderPlacedFromPhone = (order) => {
    const newKdsTicket = {
      id: `live-${Date.now()}`,
      orderNumber: `#${Math.floor(Math.random() * 80) + 106}`,
      tableNumber: order.tableNumber,
      orderType: "Dine-In",
      serverName: "Table QR",
      timeMinutes: 0,
      timeSeconds: 0,
      status: "New",
      station: "Grill",
      totalAmount: order.total,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
        station: "Grill"
      }))
    };

    setSyncedTicket(newKdsTicket);
    setFlashSync(true);
    setTimeout(() => setFlashSync(false), 2500);
  };

  return (
    <div className="w-full space-y-4">
      {/* Interactive Guidance Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/50">
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold shrink-0">
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 m-0">
              <span>Interactive Dual-Screen Workflow</span>
              <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 font-bold uppercase tracking-wider">
                Live Sync
              </span>
            </h4>
            <p className="text-[10px] text-slate-600 font-medium m-0">
              Tap "Send Order to Kitchen" on the phone (Left) to see it appear live in the New Orders column on the KDS board (Right).
            </p>
          </div>
        </div>

        {flashSync && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-bold shadow-md shadow-emerald-600/30 animate-in fade-in zoom-in-95 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Order Arrived in New Orders!</span>
          </div>
        )}
      </div>

      {/* Side-by-Side Dual Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Guest QR Phone App */}
        <div className="lg:col-span-4 flex flex-col items-center justify-between">
          <div className="w-full mb-1.5 flex items-center justify-between text-[11px] text-slate-700 px-1 font-bold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              1. Guest Dining Phone
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Table #14</span>
          </div>
          <QRMenuSimulator onOrderPlaced={handleOrderPlacedFromPhone} />
        </div>

        {/* Right: 4-Stage Kitchen Display System (KDS) Board */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="w-full mb-1.5 flex items-center justify-between text-[11px] text-slate-700 px-1 font-bold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              2. Real-Time 4-Stage Kitchen Display Board (KDS)
            </span>
            <span className="text-[10px] text-slate-500 font-normal">New → In Kitchen → Ready → Served</span>
          </div>
          <KDSSimulator externalTicket={syncedTicket} />
        </div>
      </div>
    </div>
  );
}
