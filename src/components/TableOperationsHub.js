import React, { useState, useMemo } from 'react';
import { 
  Grid, Plus, Search, Check, X, RefreshCw, CreditCard, 
  Trash2, QrCode, Printer, Smartphone, Zap, Coffee, 
  ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function TableOperationsHub({
  tables = [],
  orders = [],
  tenantInfo = null,
  tenantId = '',
  onSettleTable,
  onUpdateOrderStatus,
  onOpenPOS,
  onRefresh,
  onAddTable,
  onDeleteTable,
  onUpdateCapacity
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'occupied', 'available', 'preparing', 'ready'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableForPayment, setSelectedTableForPayment] = useState(null);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState('4');
  const [newTableZone, setNewTableZone] = useState('Main Floor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Form State (Rich POS Features)
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'upi', 'card'
  const [discountType, setDiscountType] = useState('none'); // 'none', '5', '10', '15', '50flat', 'custom'
  const [discountAmount, setDiscountAmount] = useState(0);
  const [tipType, setTipType] = useState('none'); // 'none', '20', '50', '100', 'custom'
  const [tipAmount, setTipAmount] = useState(0);
  const [cashTendered, setCashTendered] = useState('');
  const [showUpiQR, setShowUpiQR] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [showDishesExpanded, setShowDishesExpanded] = useState(true);

  // Helper to match active order with table
  const getActiveOrderForTable = (tbl) => {
    const rawNum = String(tbl.tableNumber || '').trim().toLowerCase();
    const numOnly = rawNum.replace(/[^0-9]/g, '');
    return orders.find(o => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      const orderTbl = String(o.tableNumber || o.table || '').trim().toLowerCase();
      const orderNumOnly = orderTbl.replace(/[^0-9]/g, '');
      return orderTbl === rawNum || (numOnly && orderNumOnly && numOnly === orderNumOnly) || orderTbl === `table ${numOnly}`;
    });
  };

  // Metric aggregates
  const occupiedTables = useMemo(() => tables.filter(t => !!getActiveOrderForTable(t)), [tables, orders]);
  const availableTables = useMemo(() => tables.filter(t => !getActiveOrderForTable(t)), [tables, orders]);
  const totalSeats = useMemo(() => tables.reduce((sum, t) => sum + (Number(t.seatingCapacity) || 4), 0), [tables]);
  
  const totalUnsettledRevenue = useMemo(() => {
    return occupiedTables.reduce((sum, t) => {
      const order = getActiveOrderForTable(t);
      return sum + (Number(order?.total || order?.totalAmount) || 0);
    }, 0);
  }, [occupiedTables]);

  const activeGuestsCount = useMemo(() => {
    return occupiedTables.reduce((sum, t) => sum + (Number(t.seatingCapacity) || 2), 0);
  }, [occupiedTables]);

  // Filtered tables with natural numeric serial sorting (1, 2, 3, ... 10, 11)
  const filteredTables = useMemo(() => {
    const list = tables.filter(t => {
      const order = getActiveOrderForTable(t);
      const isOccupied = !!order;
      const matchSearch = String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order?.orderNumber && String(order.orderNumber).includes(searchQuery)) ||
        (order?.customer?.name && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterTab === 'occupied') return isOccupied;
      if (filterTab === 'available') return !isOccupied;
      if (filterTab === 'preparing') return isOccupied && (order.status === 'pending' || order.status === 'preparing');
      if (filterTab === 'ready') return isOccupied && (order.status === 'ready' || order.status === 'served');
      return true;
    });

    return list.sort((a, b) => {
      return String(a.tableNumber || '').localeCompare(String(b.tableNumber || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [tables, orders, filterTab, searchQuery]);

  const handleCreateNewTable = async (e) => {
    e.preventDefault();
    if (!newTableNum.trim()) {
      toast.error('Please provide a table number');
      return;
    }
    setIsSubmitting(true);
    try {
      if (onAddTable) {
        await onAddTable({
          tableNumber: newTableNum.trim(),
          seatingCapacity: Number(newTableCap) || 4,
          zone: newTableZone
        });
      }
      toast.success(`Table ${newTableNum} created successfully!`);
      setShowAddModal(false);
      setNewTableNum('');
      setNewTableCap('4');
    } catch (err) {
      toast.error('Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSettle = async () => {
    if (!selectedTableForPayment) return;
    const tableNum = selectedTableForPayment.table.tableNumber;
    setIsSubmitting(true);
    try {
      if (onSettleTable) {
        await onSettleTable(tableNum, {
          paymentMethod,
          discount: Number(discountAmount) || 0,
          tip: Number(tipAmount) || 0,
          customerName,
          customerPhone
        });
      }
      if (sendWhatsapp && customerPhone) {
        const subtotal = Number(selectedTableForPayment.activeOrder?.subtotal || selectedTableForPayment.activeOrder?.total || 0);
        const tax = Math.round(subtotal * 0.05);
        const grandTotal = Math.max(0, subtotal + tax + Number(tipAmount || 0) - Number(discountAmount || 0));
        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(`🧾 *Receipt from ${tenantInfo?.name || 'Cafe'}*\n📍 Table: ${tableNum}\n🔖 Order: #${selectedTableForPayment.activeOrder?.orderNumber || ''}\n💵 Total Paid: ₹${grandTotal} (${paymentMethod.toUpperCase()})\n\nThank you for dining with us! ✨`);
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
      }
      toast.success(`Table ${tableNum} bill settled! Table marked clean.`);
      setSelectedTableForPayment(null);
      setDiscountAmount(0);
      setDiscountType('none');
      setTipAmount(0);
      setTipType('none');
      setCashTendered('');
      setCustomerName('');
      setCustomerPhone('');
      setShowUpiQR(false);
    } catch (err) {
      toast.error('Failed to settle table order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchSettleAll = async () => {
    if (occupiedTables.length === 0) {
      toast.error('No active tables to settle');
      return;
    }
    if (!window.confirm(`Are you sure you want to settle all ${occupiedTables.length} active tables?`)) {
      return;
    }
    setIsSubmitting(true);
    for (const tbl of occupiedTables) {
      try {
        if (onSettleTable) {
          await onSettleTable(tbl.tableNumber, { paymentMethod: 'cash' });
        }
      } catch (e) {}
    }
    setIsSubmitting(false);
    toast.success(`Batch settled ${occupiedTables.length} tables!`);
    if (onRefresh) onRefresh();
  };

  const getQRScanUrl = (tableNum) => {
    const base = window.location.origin || 'http://localhost:3000';
    return `${base}/menu?tenantId=${tenantId}&table=${encodeURIComponent(tableNum)}`;
  };

  return (
    <div style={{ width: '100%', paddingBottom: '2rem' }}>
      
      {/* 1. EXECUTIVE COMMAND & METRICS HEADER (LIGHT LUXURY COMPACT THEME) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        color: '#0f172a',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #c7d2fe'
            }}>
              <Grid size={18} color="#4f46e5" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Dining Floor & Live Table Operations Hub
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Real-time table turnover, running tabs, kitchen status & multi-mode bill settlement
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleBatchSettleAll}
              disabled={occupiedTables.length === 0 || isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #fed7aa',
                background: '#fff7ed',
                color: '#c2410c',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: occupiedTables.length === 0 ? 'not-allowed' : 'pointer',
                opacity: occupiedTables.length === 0 ? 0.6 : 1
              }}
            >
              <Zap size={13} color="#ea580c" /> Batch Settle All ({occupiedTables.length})
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)'
              }}
            >
              <Plus size={14} /> Add New Table
            </button>

            <button
              type="button"
              onClick={onRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Refresh Live Status"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* 4 Compact Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ background: '#f8fafc', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>TOTAL TABLES</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              {tables.length} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>({totalSeats} Seats)</span>
            </div>
          </div>

          <div style={{ background: '#fffbeb', padding: '9px 12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
            <span style={{ fontSize: '10px', color: '#92400e', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>OCCUPIED TABLES</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#d97706', marginTop: 2 }}>
              {occupiedTables.length} <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 700 }}>({tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}% Busy)</span>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', padding: '9px 12px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '10px', color: '#065f46', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>FREE / CLEAN</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669', marginTop: 2 }}>
              {availableTables.length} <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>Ready</span>
            </div>
          </div>

          <div style={{ background: '#eef2ff', padding: '9px 12px', borderRadius: '10px', border: '1px solid #c7d2fe' }}>
            <span style={{ fontSize: '10px', color: '#3730a3', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>UNSETTLED BILLS</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4f46e5', marginTop: 2 }}>
              ₹{Math.round(totalUnsettledRevenue).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: '#ffffff',
        padding: '9px 14px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.25rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '5px 10px',
          minWidth: '220px'
        }}>
          <Search size={13} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search table number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%', color: '#0f172a' }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Tables (${tables.length})` },
            { id: 'occupied', label: `🔴 Busy (${occupiedTables.length})` },
            { id: 'available', label: `🟢 Free (${availableTables.length})` },
            { id: 'preparing', label: `🟡 In Kitchen` },
            { id: 'ready', label: `🔵 Bill Ready` }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterTab(f.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '7px',
                border: filterTab === f.id ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                background: filterTab === f.id ? '#eef2ff' : '#ffffff',
                color: filterTab === f.id ? '#4f46e5' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ULTRA COMPACT & POLISHED TABLE CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
        gap: '0.75rem'
      }}>
        {filteredTables.map((tbl) => {
          const activeOrder = getActiveOrderForTable(tbl);
          const isOccupied = !!activeOrder;
          const elapsedMins = activeOrder?.createdAt
            ? Math.max(1, Math.round((new Date() - new Date(activeOrder.createdAt)) / 60000))
            : 5;
          const orderTotal = Math.round(activeOrder?.total || activeOrder?.totalAmount || 0);

          return (
            <motion.div
              key={tbl._id || tbl.tableNumber}
              whileHover={{ y: -2, boxShadow: '0 6px 16px -2px rgba(15, 23, 42, 0.08)' }}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: isOccupied ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                padding: '0.75rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isOccupied ? '0 3px 12px rgba(245, 158, 11, 0.12)' : '0 1px 4px rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle top indicator bar for occupied / pending tables */}
              {isOccupied && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
                }} />
              )}

              <div>
                {/* Card Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      letterSpacing: '-0.01em'
                    }}>
                      Table {tbl.tableNumber}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      👥 {tbl.seatingCapacity || 4}
                    </span>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3.5,
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '100px',
                    background: isOccupied ? '#fef3c7' : '#ecfdf5',
                    color: isOccupied ? '#b45309' : '#047857',
                    border: isOccupied ? '1px solid #fde68a' : '1px solid #a7f3d0'
                  }}>
                    <span style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: isOccupied ? '#f59e0b' : '#10b981'
                    }} />
                    {isOccupied ? `⚡ Due (${elapsedMins}m)` : 'Free'}
                  </span>
                </div>

                {/* Middle Content Section */}
                {isOccupied ? (
                  <div style={{
                    background: '#fffdf5',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    border: '1px solid #fef3c7',
                    marginBottom: '6px'
                  }}>
                    {/* Amount & Order Number */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8' }}>
                        #{activeOrder.orderNumber || activeOrder._id?.slice(-4)}
                      </span>
                      <strong style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                        ₹{orderTotal}
                      </strong>
                    </div>

                    {/* Items List Preview */}
                    <div style={{
                      fontSize: '10.5px',
                      color: '#475569',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 4
                    }}>
                      {activeOrder.items?.map(it => `${it.quantity || 1}x ${it.name || it.item?.name}`).join(', ') || 'Dine-in items'}
                    </div>

                    {/* Kitchen Stage Mini Switcher */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3, borderTop: '1px dashed #fde68a' }}>
                      <span style={{ fontSize: '8.5px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Kitchen:</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(activeOrder._id, 'preparing')}
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            border: 'none',
                            background: activeOrder.status === 'preparing' ? '#f59e0b' : '#fef3c7',
                            color: activeOrder.status === 'preparing' ? '#ffffff' : '#b45309',
                            cursor: 'pointer'
                          }}
                        >
                          Cooking
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(activeOrder._id, 'ready')}
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            border: 'none',
                            background: activeOrder.status === 'ready' ? '#10b981' : '#ecfdf5',
                            color: activeOrder.status === 'ready' ? '#ffffff' : '#047857',
                            cursor: 'pointer'
                          }}
                        >
                          Served
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Coffee size={13} color="#94a3b8" />
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                      Clean & Ready for guests
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div style={{ display: 'flex', gap: 4, paddingTop: '5px', borderTop: '1px solid #f1f5f9' }}>
                {isOccupied ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedTableForPayment({ table: tbl, activeOrder })}
                      style={{
                        flex: 1.6,
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3.5,
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <CreditCard size={11} /> Settle (₹{orderTotal})
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPOS && onOpenPOS(tbl.tableNumber)}
                      style={{
                        padding: '5px 7px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                      title="Add Items in POS"
                    >
                      <Plus size={10} /> POS
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenPOS && onOpenPOS(tbl.tableNumber)}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0',
                        background: '#ecfdf5',
                        color: '#059669',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3
                      }}
                    >
                      <Plus size={11} /> Take Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTableForQR(tbl)}
                      style={{
                        padding: '5px 7px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#4f46e5',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                      title="Show Table QR Code"
                    >
                      <QrCode size={11} /> QR
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTable && onDeleteTable(tbl._id || tbl.tableNumber)}
                      style={{
                        padding: '5px 6px',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2',
                        background: '#fef2f2',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Delete Table"
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem', background: '#ffffff', borderRadius: '14px', border: '1px dashed #cbd5e1', marginTop: '1rem' }}>
          <Grid size={32} color="#94a3b8" style={{ marginBottom: 6 }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>No tables found</h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>Try changing the filter tab or click "+ Add New Table" above.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE MULTI-MODE PAYMENT & SETTLEMENT MODAL                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedTableForPayment && (() => {
          const activeOrder = selectedTableForPayment.activeOrder;
          const items = activeOrder?.items || [];
          const subtotal = Number(activeOrder?.subtotal || activeOrder?.total || 0);
          const tax = Math.round(subtotal * 0.05);

          // Discount calculations
          let calculatedDiscount = 0;
          if (discountType === '5') calculatedDiscount = Math.round(subtotal * 0.05);
          else if (discountType === '10') calculatedDiscount = Math.round(subtotal * 0.10);
          else if (discountType === '15') calculatedDiscount = Math.round(subtotal * 0.15);
          else if (discountType === '50flat') calculatedDiscount = Math.min(subtotal, 50);
          else if (discountType === 'custom') calculatedDiscount = Math.min(subtotal, Number(discountAmount) || 0);

          // Tip calculation
          let calculatedTip = 0;
          if (tipType === '20') calculatedTip = 20;
          else if (tipType === '50') calculatedTip = 50;
          else if (tipType === '100') calculatedTip = 100;
          else if (tipType === 'custom') calculatedTip = Number(tipAmount) || 0;

          const grandTotal = Math.max(0, subtotal + tax + calculatedTip - calculatedDiscount);
          const cashGivenNum = Number(cashTendered) || 0;
          const cashChange = cashGivenNum > 0 ? cashGivenNum - grandTotal : 0;

          const upiUri = `upi://pay?pa=${encodeURIComponent(tenantInfo?.upiId || 'cafe@upi')}&pn=${encodeURIComponent(tenantInfo?.name || 'Cafe Order')}&am=${grandTotal}&cu=INR&tn=Table%20${selectedTableForPayment.table.tableNumber}%20Bill`;

          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.25rem'
            }} onClick={() => setSelectedTableForPayment(null)}>
              <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '1.75rem',
                  width: '100%',
                  maxWidth: '520px',
                  boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                  maxHeight: '92vh',
                  overflowY: 'auto'
                }}
              >
                {/* 1. Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.28)'
                    }}>
                      <Coffee size={16} /> Table {selectedTableForPayment.table.tableNumber}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Settle & Close Bill
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                          Order #{activeOrder?.orderNumber || activeOrder?._id?.slice(-5)}
                        </span>
                        <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 7px', borderRadius: '6px', fontWeight: 700 }}>
                          {activeOrder?.channel || 'Dine-In'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTableForPayment(null)}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      borderRadius: '50%',
                      width: 34,
                      height: 34,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      transition: 'all 0.2s ease'
                    }}
                    title="Close Modal"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* 2. Itemized Order Breakdown (Collapsible) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div 
                    onClick={() => setShowDishesExpanded(!showDishesExpanded)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      padding: '4px 2px',
                      marginBottom: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        Ordered Items
                      </span>
                      <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                        {items.length} dishes
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontSize: '11px', fontWeight: 800 }}>
                      <span>₹{Math.round(subtotal)}</span>
                      {showDishesExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showDishesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                          border: '1px solid #f1f5f9',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          background: '#fafafa'
                        }}
                      >
                        {items.map((it, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                              borderBottom: idx === (items.length - 1) ? 'none' : '1px solid #f1f5f9'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                background: '#eef2ff',
                                color: '#4f46e5',
                                fontWeight: 800,
                                fontSize: '11px',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                minWidth: '22px',
                                textAlign: 'center'
                              }}>
                                x{it.quantity || 1}
                              </span>
                              <div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                                  {it.name || it.item?.name || 'Dish'}
                                </span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                  @ ₹{Number(it.price || it.item?.price || 0)}
                                </span>
                              </div>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                              ₹{Math.round((it.quantity || 1) * (Number(it.price || it.item?.price || 0)))}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Discount & Offers Section */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Tag size={13} color="#4f46e5" /> Discount / Offers
                    </span>
                    {calculatedDiscount > 0 && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                        - ₹{calculatedDiscount} Saved
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { id: 'none', label: 'None' },
                      { id: '5', label: '5% Off' },
                      { id: '10', label: '10% Off' },
                      { id: '15', label: '15% Off' },
                      { id: '50flat', label: 'Flat ₹50' },
                      { id: 'custom', label: 'Custom ₹' }
                    ].map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDiscountType(d.id);
                          if (d.id === '5') setDiscountAmount(Math.round(subtotal * 0.05));
                          else if (d.id === '10') setDiscountAmount(Math.round(subtotal * 0.10));
                          else if (d.id === '15') setDiscountAmount(Math.round(subtotal * 0.15));
                          else if (d.id === '50flat') setDiscountAmount(50);
                          else if (d.id === 'none') setDiscountAmount(0);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: discountType === d.id ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                          background: discountType === d.id ? '#eef2ff' : '#ffffff',
                          color: discountType === d.id ? '#4f46e5' : '#475569',
                          boxShadow: discountType === d.id ? '0 2px 6px rgba(79, 70, 229, 0.12)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {discountType === 'custom' && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Enter Discount:</span>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ Amount"
                        style={{
                          width: '120px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Payment Method Selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                    Select Payment Method
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'cash', label: 'Cash', icon: '💵', subtitle: 'Currency' },
                      { id: 'upi', label: 'UPI Pay', icon: '📱', subtitle: 'QR / Apps' },
                      { id: 'card', label: 'Card', icon: '💳', subtitle: 'Swipe / POS' }
                    ].map(m => {
                      const isActive = paymentMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '14px',
                            border: isActive ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                            background: isActive ? '#f5f7ff' : '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.16)' : '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.18s ease',
                            position: 'relative'
                          }}
                        >
                          <div style={{ fontSize: '20px', marginBottom: 3 }}>{m.icon}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: isActive ? '#4f46e5' : '#1e293b' }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                            {m.subtitle}
                          </div>
                          {isActive && (
                            <div style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#4f46e5' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Contextual Assistant Panel (Cash / UPI) */}
                {paymentMethod === 'cash' && (
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Quick Tender Cash Received:</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[
                          grandTotal,
                          Math.ceil(grandTotal / 50) * 50,
                          Math.ceil(grandTotal / 100) * 100,
                          grandTotal <= 500 ? 500 : 2000
                        ].filter((v, i, a) => a.indexOf(v) === i && v >= grandTotal).slice(0, 3).map((val, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashTendered(String(val))}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            ₹{val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number"
                        placeholder="Enter Cash Given (₹)"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          background: '#ffffff'
                        }}
                      />
                      {cashGivenNum >= grandTotal && (
                        <div style={{
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#059669',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span>Return Change:</span>
                          <span style={{ fontSize: '13px', fontWeight: 900 }}>₹{Math.round(cashChange)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        <Smartphone size={16} color="#4f46e5" />
                        <span>GPay / PhonePe / Paytm / BHIM</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUpiQR(!showUpiQR)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '8px',
                          border: '1px solid #6366f1',
                          background: showUpiQR ? '#6366f1' : '#ffffff',
                          color: showUpiQR ? '#ffffff' : '#4f46e5',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {showUpiQR ? 'Hide QR' : 'Show UPI QR'}
                      </button>
                    </div>
                    {showUpiQR && (
                      <div style={{
                        marginTop: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: '#ffffff',
                        padding: 14,
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}>
                        <QRCodeCanvas value={upiUri} size={140} />
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: 8, fontWeight: 600 }}>
                          Scan to pay exact bill ₹{grandTotal}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Customer CRM & WhatsApp Receipt Option */}
                <div style={{ background: '#f8fafc', padding: '11px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Guest Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none', background: '#ffffff' }}
                    />
                    <input
                      type="tel"
                      placeholder="10-digit Phone No"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none', background: '#ffffff' }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#15803d', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={sendWhatsapp}
                      onChange={(e) => setSendWhatsapp(e.target.checked)}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span>📲 Send instant digital receipt to customer on WhatsApp</span>
                  </label>
                </div>

                {/* 7. Bill Totals Summary */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: 4 }}>
                    <span>Subtotal ({items.length} dishes)</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>₹{Math.round(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: 4 }}>
                    <span>CGST (2.5%) + SGST (2.5%)</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>₹{tax}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                      <span>Discount Applied</span>
                      <span>- ₹{calculatedDiscount}</span>
                    </div>
                  )}
                  {calculatedTip > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4f46e5', fontWeight: 700, marginBottom: 4 }}>
                      <span>Tip / Gratuity</span>
                      <span>+ ₹{calculatedTip}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 900, color: '#0f172a', borderTop: '1.5px dashed #cbd5e1', paddingTop: 10, marginTop: 6 }}>
                    <span>Total Amount Payable</span>
                    <span style={{ color: '#059669', fontSize: '22px', letterSpacing: '-0.02em' }}>₹{grandTotal}</span>
                  </div>
                </div>

                {/* 8. Action Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Printing receipt...");
                      window.print();
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Printer size={16} /> Print Receipt
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmSettle}
                    style={{
                      flex: 1.6,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Settling...
                      </>
                    ) : (
                      <>
                        <Check size={16} strokeWidth={3} /> Confirm Settle & Free Table
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. ADD NEW TABLE MODAL                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }} onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>Add Dining Table</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>Assign table number, capacity & floor zone.</p>

              <form onSubmit={handleCreateNewTable}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Table Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5, Patio 2, Terrace A"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Seating Capacity (Guests)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="4"
                    value={newTableCap}
                    onChange={(e) => setNewTableCap(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Dining Zone / Section</label>
                  <select
                    value={newTableZone}
                    onChange={(e) => setNewTableZone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Main Floor">Main AC Dining Floor</option>
                    <option value="Patio / Outdoor">Patio / Outdoor</option>
                    <option value="Rooftop">Rooftop Lounge</option>
                    <option value="VIP Lounge">VIP Private Suite</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ flex: 1.2, padding: '10px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Create Table
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. QUICK TABLE QR CODE MODAL                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedTableForQR && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }} onClick={() => setSelectedTableForQR(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '380px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Table {selectedTableForQR.tableNumber} QR Code
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedTableForQR(null)}
                  style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                marginBottom: '1rem'
              }}>
                <QRCodeCanvas
                  value={getQRScanUrl(selectedTableForQR.tableNumber)}
                  size={180}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                Scan to open digital menu for Table {selectedTableForQR.tableNumber}
              </p>

              <button
                type="button"
                onClick={() => setSelectedTableForQR(null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
