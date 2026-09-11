import React, { useState } from "react";
import QRMenuSimulator from "./QRMenuSimulator";
import KDSSimulator from "./KDSSimulator";
import { Utensils, CheckCircle2, Sparkles } from "lucide-react";
import styles from "../../styles/Simulator.module.css";

export default function LiveConnectedSimulator() {
  const [syncedTicket, setSyncedTicket] = useState(null);
  const [flashSync, setFlashSync] = useState(false);

  const handleOrderPlacedFromPhone = (order) => {
    const newKdsTicket = {
      id: `live-${Date.now()}`,
      orderNumber: `#${Math.floor(Math.random() * 80) + 106}`,
      tableNumber: order.tableNumber,
      timeMinutes: 0,
      status: "New",
      totalAmount: order.total,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        notes: i.notes
      }))
    };

    setSyncedTicket(newKdsTicket);
    setFlashSync(true);
    setTimeout(() => setFlashSync(false), 3000);
  };

  return (
    <div className={styles.simulatorContainer}>
      {/* Interactive Guidance Banner */}
      <div className={styles.guidanceBanner}>
        <div className={styles.guidanceLeft}>
          <div className={styles.guidanceIcon}>
            <Utensils style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div className={styles.guidanceTitle}>
              <span>Live Connected Restaurant Simulator</span>
              <span className="badge-pill badge-blue" style={{ fontSize: 9 }}>
                Live Sync
              </span>
            </div>
            <div className={styles.guidanceDesc}>
              Add an item on the phone (Left) and tap "Send to Kitchen" — watch it appear live on the KDS board (Right) in real time!
            </div>
          </div>
        </div>

        {flashSync && (
          <div className="badge-pill badge-emerald" style={{ padding: "6px 14px" }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            <span>KOT Arrived in New Orders Column!</span>
          </div>
        )}
      </div>

      {/* Side-by-Side Dual Showcase */}
      <div className={styles.dualGrid}>
        {/* Left: Guest QR Phone App */}
        <div className={styles.phoneColumn}>
          <div className={styles.columnHeader}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }} />
              1. Guest Dining Phone
            </span>
            <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 500 }}>Table #14</span>
          </div>
          <QRMenuSimulator onOrderPlaced={handleOrderPlacedFromPhone} />
        </div>

        {/* Right: Kitchen Display System (KDS) Board */}
        <div>
          <div className={styles.columnHeader}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-indigo)" }} />
              2. Multi-Station Kitchen Display (KDS)
            </span>
            <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 500 }}>Chef View</span>
          </div>
          <KDSSimulator incomingTicket={syncedTicket} />
        </div>
      </div>
    </div>
  );
}
