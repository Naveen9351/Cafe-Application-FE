import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Check,
  Undo2,
  ChefHat,
  BellRing,
  UtensilsCrossed
} from "lucide-react";

const INITIAL_TICKETS = [
  {
    id: "t-104",
    orderNumber: "#104",
    tableNumber: 14,
    orderType: "Dine-In",
    serverName: "Table QR",
    timeMinutes: 1,
    timeSeconds: 20,
    status: "New",
    station: "Grill",
    totalAmount: 665,
    items: [
      { name: "Angus Truffle Burger", quantity: 2, notes: "Brioche • Med Well", station: "Grill" },
      { name: "Crispy Calamari", quantity: 1, notes: "Garlic Aioli Dip", station: "Fryer" }
    ]
  },
  {
    id: "t-103",
    orderNumber: "#103",
    tableNumber: 8,
    orderType: "Dine-In",
    serverName: "Server Liam",
    timeMinutes: 7,
    timeSeconds: 45,
    status: "Preparing",
    station: "Bar",
    totalAmount: 630,
    items: [
      { name: "Smoked Signature Blend", quantity: 2, notes: "Cedar Mist", station: "Bar" },
      { name: "Ceremonial Matcha Latte", quantity: 1, notes: "Oat Milk", station: "Bar" }
    ]
  },
  {
    id: "t-102",
    orderNumber: "#102",
    tableNumber: 22,
    orderType: "Dine-In",
    serverName: "Table QR",
    timeMinutes: 12,
    timeSeconds: 10,
    status: "Ready",
    station: "Grill",
    totalAmount: 630,
    items: [
      { name: "Artisan Margherita", quantity: 1, notes: "Extra Basil Oil", station: "Grill" },
      { name: "Burrata & Pesto Salad", quantity: 1, notes: "Sourdough Toast", station: "Grill" }
    ]
  },
  {
    id: "t-101",
    orderNumber: "#101",
    tableNumber: 4,
    orderType: "Dine-In",
    serverName: "Table QR",
    timeMinutes: 19,
    timeSeconds: 30,
    status: "Served",
    station: "Grill",
    totalAmount: 480,
    items: [
      { name: "Valrhona Chocolate Fondant", quantity: 2, notes: "Vanilla Gelato", station: "Grill" }
    ]
  }
];

export default function KDSSimulator({ externalTicket }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedStation, setSelectedStation] = useState("All");

  useEffect(() => {
    if (externalTicket) {
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === externalTicket.id);
        if (exists) return prev;
        return [externalTicket, ...prev];
      });
    }
  }, [externalTicket]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.status === "Served") return t;
          let sec = t.timeSeconds + 1;
          let min = t.timeMinutes;
          if (sec >= 60) {
            sec = 0;
            min += 1;
          }
          return { ...t, timeMinutes: min, timeSeconds: sec };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const moveTicketStatus = (ticketId, nextStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
    );
  };

  const addSimulatedOrder = () => {
    const randomTable = Math.floor(Math.random() * 20) + 1;
    const newId = `t-${Date.now().toString(36)}`;
    const randomOrderNum = `#${Math.floor(Math.random() * 80) + 105}`;
    const stations = ["Grill", "Bar", "Fryer"];
    const st = stations[Math.floor(Math.random() * stations.length)];

    const newTicket = {
      id: newId,
      orderNumber: randomOrderNum,
      tableNumber: randomTable,
      orderType: "Dine-In",
      serverName: "Table QR",
      timeMinutes: 0,
      timeSeconds: 1,
      status: "New",
      station: st,
      totalAmount: 665,
      items: [
        { name: "Angus Truffle Burger", quantity: 1, notes: "Brioche Bun", station: "Grill" },
        { name: "Salt & Pepper Calamari", quantity: 1, notes: "Mild Spice", station: "Fryer" }
      ]
    };

    setTickets((prev) => [newTicket, ...prev]);
  };

  const resetKDS = () => {
    setTickets(INITIAL_TICKETS);
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
  };

  const stationFilteredTickets =
    selectedStation === "All"
      ? tickets
      : tickets.filter((t) => t.station === selectedStation || t.station === "All");

  const newTickets = stationFilteredTickets.filter((t) => t.status === "New");
  const preparingTickets = stationFilteredTickets.filter((t) => t.status === "Preparing");
  const readyTickets = stationFilteredTickets.filter((t) => t.status === "Ready");
  const servedTickets = stationFilteredTickets.filter((t) => t.status === "Served");

  const columns = [
    {
      id: "New",
      title: "New Orders",
      icon: BellRing,
      tickets: newTickets,
      colorHeader: "bg-blue-50 text-blue-900 border-blue-200",
      badgeBg: "bg-blue-600 text-white"
    },
    {
      id: "Preparing",
      title: "In Kitchen",
      icon: ChefHat,
      tickets: preparingTickets,
      colorHeader: "bg-amber-50 text-amber-900 border-amber-200",
      badgeBg: "bg-amber-500 text-slate-950 font-black"
    },
    {
      id: "Ready",
      title: "Plating Ready",
      icon: CheckCircle2,
      tickets: readyTickets,
      colorHeader: "bg-emerald-50 text-emerald-900 border-emerald-200",
      badgeBg: "bg-emerald-600 text-white"
    },
    {
      id: "Served",
      title: "Served to Table",
      icon: UtensilsCrossed,
      tickets: servedTickets,
      colorHeader: "bg-slate-100 text-slate-800 border-slate-200",
      badgeBg: "bg-slate-700 text-white"
    }
  ];

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-3 sm:p-4 text-slate-900 space-y-3 flex flex-col justify-between">
      {/* Top KDS Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 m-0">
                Kitchen Display Board
              </h4>
              <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live 4 Stages
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium m-0">Real-Time Kitchen Orders & Station Routing</p>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          {["All", "Grill", "Bar", "Fryer"].map((station) => (
            <button
              type="button"
              key={station}
              onClick={() => handleStationClick(station)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-0 ${
                selectedStation === station
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={addSimulatedOrder}
            className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>Test Order</span>
          </button>

          <button
            type="button"
            onClick={resetKDS}
            title="Reset tickets"
            className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4-Column Responsive KDS Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 items-start">
        {columns.map((col) => {
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-2 flex flex-col min-h-[360px] max-h-[440px] space-y-2"
            >
              {/* Column Header */}
              <div
                className={`p-1.5 rounded-xl border flex items-center justify-between font-bold text-[11px] ${col.colorHeader}`}
              >
                <div className="flex items-center gap-1.5">
                  <ColIcon className="w-3 h-3" />
                  <span>{col.title}</span>
                </div>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${col.badgeBg}`}>
                  {col.tickets.length}
                </span>
              </div>

              {/* Column Tickets Stream */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                {col.tickets.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs space-y-1 my-auto flex flex-col items-center justify-center min-h-[160px] border border-dashed border-slate-200 rounded-xl bg-white/60">
                    <Check className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-medium text-slate-400">No tickets in stage</span>
                  </div>
                ) : (
                  col.tickets.map((ticket) => {
                    const totalSec = ticket.timeMinutes * 60 + ticket.timeSeconds;
                    const isLate = totalSec > 600;
                    const isWarning = totalSec > 360 && !isLate;

                    const timerBadge = isLate
                      ? "text-rose-700 bg-rose-100 border-rose-300"
                      : isWarning
                      ? "text-amber-800 bg-amber-100 border-amber-300"
                      : "text-emerald-800 bg-emerald-100 border-emerald-300";

                    return (
                      <div
                        key={ticket.id}
                        className={`bg-white rounded-xl p-2.5 border shadow-2xs transition-all space-y-1.5 flex flex-col justify-between ${
                          ticket.status === "New"
                            ? "border-blue-300 ring-1 ring-blue-100"
                            : ticket.status === "Preparing"
                            ? "border-amber-300 ring-1 ring-amber-100"
                            : ticket.status === "Ready"
                            ? "border-emerald-300 ring-1 ring-emerald-100"
                            : "border-slate-200 opacity-80"
                        }`}
                      >
                        {/* Header Row */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <div>
                              <div className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                                <span>Table {ticket.tableNumber}</span>
                                <span className="text-[9px] font-mono text-slate-500 font-bold">
                                  {ticket.orderNumber}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 block -mt-0.5">
                                {ticket.serverName || "Table QR"} • {ticket.station}
                              </span>
                            </div>

                            {/* Timer */}
                            <div
                              className={`flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold border ${timerBadge}`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>
                                {String(ticket.timeMinutes).padStart(2, "0")}:
                                {String(ticket.timeSeconds).padStart(2, "0")}
                              </span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="space-y-1 pt-0.5">
                            {ticket.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] space-y-0.2"
                              >
                                <div className="flex items-start justify-between font-bold text-slate-900 leading-tight">
                                  <span className="truncate pr-1">{item.name}</span>
                                  <span className="px-1 rounded bg-slate-200 text-slate-800 text-[9px] font-mono shrink-0">
                                    x{item.quantity}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-[8px] text-orange-800 font-medium bg-orange-50/70 px-1 py-0.2 rounded leading-tight m-0">
                                    ↳ {item.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {ticket.totalAmount && (
                            <div className="text-right text-[10px] font-bold text-slate-700 pt-0.5">
                              Bill: <span className="text-orange-600">₹{ticket.totalAmount}</span>
                            </div>
                          )}
                        </div>

                        {/* Lifecycle Movement Button */}
                        <div className="pt-1.5 border-t border-slate-100">
                          {ticket.status === "New" && (
                            <button
                              type="button"
                              onClick={() => moveTicketStatus(ticket.id, "Preparing")}
                              className="w-full py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs border-0"
                            >
                              <span>Accept & Prep</span>
                              <span>→</span>
                            </button>
                          )}

                          {ticket.status === "Preparing" && (
                            <button
                              type="button"
                              onClick={() => moveTicketStatus(ticket.id, "Ready")}
                              className="w-full py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs border-0"
                            >
                              <span>Mark Ready</span>
                              <span>→</span>
                            </button>
                          )}

                          {ticket.status === "Ready" && (
                            <button
                              type="button"
                              onClick={() => moveTicketStatus(ticket.id, "Served")}
                              className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs border-0"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Serve to Table</span>
                            </button>
                          )}

                          {ticket.status === "Served" && (
                            <button
                              type="button"
                              onClick={() => moveTicketStatus(ticket.id, "Ready")}
                              className="w-full py-0.5 px-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold text-[9px] flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
                            >
                              <Undo2 className="w-2.5 h-2.5" />
                              <span>Recall</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary Strip */}
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-600 gap-2 font-medium">
        <div className="flex items-center gap-3">
          <span>
            New: <strong className="text-blue-700">{newTickets.length}</strong>
          </span>
          <span>
            In Kitchen: <strong className="text-amber-700">{preparingTickets.length}</strong>
          </span>
          <span>
            Ready: <strong className="text-emerald-700">{readyTickets.length}</strong>
          </span>
          <span>
            Served: <strong className="text-slate-800">{servedTickets.length}</strong>
          </span>
        </div>
        <div className="text-[9px] text-slate-400 hidden sm:block">
          Kitchen Displays, Bump Bars & Android Tablets
        </div>
      </div>
    </div>
  );
}
