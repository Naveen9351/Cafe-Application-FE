import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  Undo2,
  ChefHat,
  Flame,
  Check
} from "lucide-react";
import styles from "../../styles/Simulator.module.css";

const INITIAL_TICKETS = [
  {
    id: "t-104",
    orderNumber: "#104",
    tableNumber: 14,
    timeMinutes: 1,
    status: "New",
    totalAmount: 665,
    items: [
      { name: "Dry-Aged Angus Truffle Burger", quantity: 2, notes: "Brioche • Med Well" },
      { name: "Salt & Pepper Crispy Calamari", quantity: 1, notes: "Garlic Aioli Dip" }
    ]
  },
  {
    id: "t-103",
    orderNumber: "#103",
    tableNumber: 8,
    timeMinutes: 6,
    status: "Preparing",
    totalAmount: 480,
    items: [
      { name: "Iced Ceremonial Matcha Latte", quantity: 2, notes: "Oat Milk • Less Ice" }
    ]
  },
  {
    id: "t-102",
    orderNumber: "#102",
    tableNumber: 22,
    timeMinutes: 11,
    status: "Ready",
    totalAmount: 320,
    items: [
      { name: "Woodfired Artisan Margherita", quantity: 1, notes: "Extra Basil Oil" }
    ]
  }
];

export default function KDSSimulator({ incomingTicket }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);

  useEffect(() => {
    if (incomingTicket) {
      setTickets((prev) => [incomingTicket, ...prev]);
    }
  }, [incomingTicket]);

  const updateTicketStatus = (id, nextStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
  };

  const getTicketsByStatus = (status) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className={styles.kdsBoard}>
      {/* Header */}
      <div className={styles.kdsHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ChefHat style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-main)" }}>
            Real-Time Kitchen Queue (KDS)
          </span>
        </div>
        <span className="badge-pill badge-emerald" style={{ fontSize: 9 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-emerald)" }} />
          Active WebSockets Sync
        </span>
      </div>

      {/* 3 Active Columns */}
      <div className={styles.kdsColumns}>
        {/* Column 1: New Orders */}
        <div className={styles.kdsColumn}>
          <div className={styles.kdsColumnTitle}>
            <span>1. New Incoming</span>
            <span className="badge-pill badge-blue" style={{ fontSize: 9 }}>
              {getTicketsByStatus("New").length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getTicketsByStatus("New").map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                  <span>Table #{ticket.tableNumber}</span>
                  <span style={{ color: "var(--color-primary)" }}>{ticket.orderNumber}</span>
                </div>
                <div className={styles.ticketItems}>
                  {ticket.items.map((item, idx) => (
                    <div key={idx}>
                      <strong>{item.quantity}x</strong> {item.name}
                      <div style={{ fontSize: 10, color: "var(--text-subtle)" }}>{item.notes}</div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => updateTicketStatus(ticket.id, "Preparing")}
                  className={styles.ticketBtn}
                >
                  Start Preparing →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: In Prep */}
        <div className={styles.kdsColumn}>
          <div className={styles.kdsColumnTitle}>
            <span>2. In Prep Line</span>
            <span className="badge-pill badge-indigo" style={{ fontSize: 9 }}>
              {getTicketsByStatus("Preparing").length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getTicketsByStatus("Preparing").map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                  <span>Table #{ticket.tableNumber}</span>
                  <span style={{ color: "var(--color-indigo)" }}>{ticket.orderNumber}</span>
                </div>
                <div className={styles.ticketItems}>
                  {ticket.items.map((item, idx) => (
                    <div key={idx}>
                      <strong>{item.quantity}x</strong> {item.name}
                      <div style={{ fontSize: 10, color: "var(--text-subtle)" }}>{item.notes}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => updateTicketStatus(ticket.id, "New")}
                    style={{ padding: "4px 8px", background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 6, cursor: "pointer" }}
                  >
                    <Undo2 style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTicketStatus(ticket.id, "Ready")}
                    className={styles.ticketBtn}
                    style={{ flex: 1 }}
                  >
                    Mark Ready ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready / Plated */}
        <div className={styles.kdsColumn}>
          <div className={styles.kdsColumnTitle}>
            <span>3. Ready for Runner</span>
            <span className="badge-pill badge-emerald" style={{ fontSize: 9 }}>
              {getTicketsByStatus("Ready").length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getTicketsByStatus("Ready").map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard} style={{ borderColor: "var(--color-emerald-border)" }}>
                <div className={styles.ticketHeader}>
                  <span>Table #{ticket.tableNumber}</span>
                  <span style={{ color: "var(--color-emerald)" }}>{ticket.orderNumber}</span>
                </div>
                <div className={styles.ticketItems}>
                  {ticket.items.map((item, idx) => (
                    <div key={idx}>
                      <strong>{item.quantity}x</strong> {item.name}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--color-emerald)", textAlign: "center", padding: "4px 0" }}>
                  ✓ Plated & Notified
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
