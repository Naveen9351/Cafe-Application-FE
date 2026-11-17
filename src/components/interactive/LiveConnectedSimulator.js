import React, { useState } from "react";
import QRMenuSimulator from "./QRMenuSimulator";
import KDSSimulator from "./KDSSimulator";
import styles from "../../styles/Simulator.module.css";

export default function LiveConnectedSimulator() {
  const [syncedTicket, setSyncedTicket] = useState(null);
  const [activeMobileView, setActiveMobileView] = useState("phone"); // 'phone' | 'kds'
  const [hasNewTicket, setHasNewTicket] = useState(false);

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
    setHasNewTicket(true);
  };

  return (
    <div className={styles.simulatorContainer}>
      {/* Mobile View Switcher (Visible only on mobile <= 768px) */}
      <div className={styles.mobileSimulatorTabs}>
        <button
          type="button"
          onClick={() => setActiveMobileView("phone")}
          className={`${styles.mobileTabBtn} ${activeMobileView === "phone" ? styles.mobileTabBtnActive : ""}`}
        >
          📱 1. Guest Phone
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMobileView("kds");
            setHasNewTicket(false);
          }}
          className={`${styles.mobileTabBtn} ${activeMobileView === "kds" ? styles.mobileTabBtnActive : ""}`}
        >
          🍳 2. Kitchen KDS
          {hasNewTicket && <span className={styles.newBadgeDot}>●</span>}
        </button>
      </div>

      {/* Side-by-Side Dual Showcase on Desktop; Responsive Tabbed on Mobile */}
      <div className={`${styles.dualGrid} ${styles[`show_${activeMobileView}`]}`}>
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
        <div className={styles.kdsColumnWrap}>
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
