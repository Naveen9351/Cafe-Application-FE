import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Download, Trash2, Edit3, QrCode, RefreshCw, Users, Check, AlertCircle, Sparkles, Search, Layers, Wifi, Smartphone, Globe, Copy, ExternalLink, Coffee, Eye, Printer, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL as API } from '../config/api';

const QRCodeComponent = ({ orders = [], initialTables = [] }) => {
  const { user, tenantId } = useAuth();
  const effectiveTenantId = tenantId || user?.tenantId || '6a762ef86c9d5c8be315f10a';

  // Instant SWR Cache: initialize immediately from props or session storage for 0ms lag
  const [tables, setTables] = useState(() => {
    if (Array.isArray(initialTables) && initialTables.length > 0) return initialTables;
    try {
      const cached = sessionStorage.getItem(`serivq_tables_${effectiveTenantId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(() => tables.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'occupied'
  
  // Base QR Target Host Configuration for Mobile Wi-Fi Scanning
  const localDefaultHost = window.location.hostname === 'localhost' ? 'http://192.168.1.10:3000' : (window.location.origin || 'http://localhost:3000');
  const [qrBaseUrl, setQrBaseUrl] = useState(() => localStorage.getItem('serivq_qr_base_url') || localDefaultHost);
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [tempHost, setTempHost] = useState(qrBaseUrl);
  
  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick batch generator state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [batchDefaultCap, setBatchDefaultCap] = useState('4');
  const [batchItems, setBatchItems] = useState([]);

  // Edit Table & Seating Capacity Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editCapacity, setEditCapacity] = useState('4');

  // Custom Delete Confirmation Modal State
  const [tableToDelete, setTableToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Click-to-Enlarge Full Screen QR Modal State
  const [previewTable, setPreviewTable] = useState(null);

  // Sync with initialTables prop when parent updates
  useEffect(() => {
    if (Array.isArray(initialTables) && initialTables.length > 0) {
      setTables(initialTables);
      setLoading(false);
    }
  }, [initialTables]);

  const getTableQRUrl = (tableNum) => {
    const cleanBase = (qrBaseUrl || window.location.origin || 'http://localhost:3000').replace(/\/$/, '');
    return `${cleanBase}/menu?tenantId=${effectiveTenantId}&table=${encodeURIComponent(tableNum)}`;
  };

  const handleSaveHost = (newHost) => {
    const clean = newHost.trim().replace(/\/$/, '');
    if (!clean) return;
    setQrBaseUrl(clean);
    localStorage.setItem('serivq_qr_base_url', clean);
    setIsEditingHost(false);
    toast.success(`QR Codes updated to point to ${clean}`);
  };

  // Active Orders Lookup for live peek (items count, total amount)
  const { activeOrdersLookup } = useMemo(() => {
    const lookup = {};
    (orders || []).forEach(o => {
      const isSettled = o.status === 'completed' || o.status === 'cancelled' || o.settlement?.status === 'settled';
      if (!isSettled) {
        const raw = String(o.tableNumber || o.table || '').trim();
        const numOnly = raw.replace(/[^0-9]/g, '') || raw;
        const total = o.totalAmount || o.finalTotal || o.billAmount || (o.items || []).reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);
        const itemsCount = (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
        
        const summary = {
          orderId: o.orderId || o._id,
          totalAmount: total,
          itemCount: itemsCount || (o.items ? o.items.length : 1),
          status: o.status || 'preparing',
          placedAt: o.createdAt
        };
        
        if (raw) lookup[raw] = summary;
        if (numOnly) lookup[numOnly] = summary;
        lookup[`Table ${numOnly}`] = summary;
      }
    });
    return { activeOrdersLookup: lookup };
  }, [orders]);

  const getTableActiveOrder = (t) => {
    const raw = String(t.tableNumber || '').trim();
    const numOnly = raw.replace(/[^0-9]/g, '') || raw;
    return activeOrdersLookup[raw] || activeOrdersLookup[numOnly] || activeOrdersLookup[`Table ${numOnly}`] || null;
  };

  const isTableOccupied = (t) => {
    return Boolean(getTableActiveOrder(t));
  };

  const fetchTables = async (silent = false) => {
    try {
      if (!silent && tables.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/tables`, {
        headers: { 'x-auth-token': token }
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTables(res.data);
        try {
          sessionStorage.setItem(`serivq_tables_${effectiveTenantId}`, JSON.stringify(res.data));
        } catch (e) {}
      } else if (tables.length === 0) {
        const initialDefaults = [
          { _id: 'tbl_1', tableNumber: '1', status: 'available' },
          { _id: 'tbl_2', tableNumber: '2', status: 'available' },
          { _id: 'tbl_3', tableNumber: '3', status: 'available' },
          { _id: 'tbl_4', tableNumber: '4', status: 'available' }
        ];
        setTables(initialDefaults);
      }
    } catch (err) {
      console.log('Error fetching tables from server, using active state:', err.message);
      if (tables.length === 0) {
        setTables([
          { _id: 'tbl_1', tableNumber: '1', status: 'available' },
          { _id: 'tbl_2', tableNumber: '2', status: 'available' },
          { _id: 'tbl_3', tableNumber: '3', status: 'available' },
          { _id: 'tbl_4', tableNumber: '4', status: 'available' }
        ]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables(tables.length > 0);
  }, [effectiveTenantId]);

  const handleAddSingleTable = async (e) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }

    const cleanNum = newTableNumber.trim();
    if (tables.some(t => String(t.tableNumber).toLowerCase() === cleanNum.toLowerCase())) {
      toast.error(`Table ${cleanNum} already exists`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      let createdTable = null;

      try {
        const res = await axios.post(`${API}/tables`, {
          tableNumber: cleanNum,
          seatingCapacity: Number(newCapacity) || 4
        }, {
          headers: { 'x-auth-token': token }
        });
        createdTable = res.data;
      } catch (apiErr) {
        createdTable = {
          _id: `tbl_${Date.now()}`,
          tableNumber: cleanNum,
          seatingCapacity: Number(newCapacity) || 4,
          status: 'available'
        };
      }

      setTables(prev => [...prev, createdTable]);
      toast.success(`Table ${cleanNum} and QR code generated!`);
      setNewTableNumber('');
      setNewCapacity('4');
      setShowAddModal(false);
    } catch (err) {
      toast.error('Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCapacity = async (table, newCap) => {
    const capNum = Math.max(1, parseInt(newCap, 10) || 1);
    try {
      const token = localStorage.getItem('token');
      if (table._id && !table._id.startsWith('tbl_')) {
        await axios.put(`${API}/tables/${table._id}`, { seatingCapacity: capNum }, {
          headers: { 'x-auth-token': token }
        });
      }
      setTables(prev => prev.map(t => (t._id === table._id || t.tableNumber === table.tableNumber) ? { ...t, seatingCapacity: capNum } : t));
      toast.success(`Table ${table.tableNumber} seating capacity set to ${capNum} customer`);
    } catch (err) {
      console.log('Update capacity warning:', err.message);
      setTables(prev => prev.map(t => (t._id === table._id || t.tableNumber === table.tableNumber) ? { ...t, seatingCapacity: capNum } : t));
      toast.success(`Table ${table.tableNumber} seating capacity set to ${capNum} customer`);
    }
  };

  // Helper to pre-calculate upcoming batch table list
  const generateBatchItems = (count, defaultCap) => {
    const num = Math.min(50, Math.max(1, parseInt(count, 10) || 1));
    const cap = Math.max(1, parseInt(defaultCap, 10) || 4);
    const existingNums = new Set(tables.map(t => parseInt(t.tableNumber, 10)).filter(n => !isNaN(n)));
    let nextNum = 1;
    const items = [];
    while (items.length < num) {
      if (!existingNums.has(nextNum)) {
        items.push({
          tableNumber: String(nextNum),
          seatingCapacity: cap
        });
        existingNums.add(nextNum);
      }
      nextNum++;
    }
    return items;
  };

  const handleOpenBatchModal = () => {
    const items = generateBatchItems(batchCount, batchDefaultCap);
    setBatchItems(items);
    setShowBatchModal(true);
  };

  const handleBatchCountChange = (val) => {
    setBatchCount(val);
    const items = generateBatchItems(val, batchDefaultCap);
    setBatchItems(items);
  };

  const handleBatchItemCapacityChange = (idx, newCap) => {
    setBatchItems(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        seatingCapacity: Math.max(1, parseInt(newCap, 10) || 1)
      };
      return copy;
    });
  };

  const handleApplyDefaultToAll = () => {
    const cap = Math.max(1, parseInt(batchDefaultCap, 10) || 4);
    setBatchItems(prev => prev.map(item => ({ ...item, seatingCapacity: cap })));
    toast.success(`Set seating capacity to ${cap} customer for all ${batchItems.length} tables`);
  };

  const handleBatchGenerate = async () => {
    if (batchItems.length === 0) {
      toast.error('No tables to generate');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const addedList = [];

    for (const item of batchItems) {
      try {
        const res = await axios.post(`${API}/tables`, item, {
          headers: { 'x-auth-token': token }
        });
        addedList.push(res.data);
      } catch (err) {
        addedList.push({
          _id: `tbl_${Date.now()}_${item.tableNumber}`,
          tableNumber: item.tableNumber,
          seatingCapacity: item.seatingCapacity,
          status: 'available'
        });
      }
    }

    setTables(prev => [...prev, ...addedList]);
    toast.success(`Generated ${addedList.length} new tables with individual seating capacities!`);
    setShowBatchModal(false);
    setIsSubmitting(false);
  };

  const handleOpenEditModal = (table) => {
    setEditingTable(table);
    setEditTableNumber(table.tableNumber);
    setEditCapacity(String(table.seatingCapacity || 4));
    setShowEditModal(true);
  };

  const handleSaveEditTable = async (e) => {
    e.preventDefault();
    if (!editingTable) return;
    const cleanNum = String(editTableNumber).trim();
    const capNum = Math.max(1, parseInt(editCapacity, 10) || 1);

    if (!cleanNum) {
      toast.error('Table number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (editingTable._id && !editingTable._id.startsWith('tbl_')) {
        await axios.put(`${API}/tables/${editingTable._id}`, {
          tableNumber: cleanNum,
          seatingCapacity: capNum
        }, {
          headers: { 'x-auth-token': token }
        });
      }

      setTables(prev => prev.map(t => (t._id === editingTable._id) ? {
        ...t,
        tableNumber: cleanNum,
        seatingCapacity: capNum
      } : t));

      toast.success(`Table ${cleanNum} seating capacity set to ${capNum} customer!`);
      setShowEditModal(false);
      setEditingTable(null);
    } catch (err) {
      toast.error('Failed to update table capacity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`${API}/tables/${tableToDelete._id}`, {
          headers: { 'x-auth-token': token }
        });
      } catch (err) {
        console.log('Local fallback deletion:', err.message);
      }

      setTables(prev => prev.filter(t => t._id !== tableToDelete._id));
      toast.success(`Table ${tableToDelete.tableNumber} deleted`);
      setTableToDelete(null);
    } catch (err) {
      toast.error('Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadTableQR = (tableNum) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`);
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${tableNum}.png`; // Exact table-{num} naming format
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success(`Downloaded table-${tableNum}.png`);
    } else {
      toast.error('Unable to capture QR image');
    }
  };

  const downloadAllQRs = () => {
    tables.forEach((t, i) => {
      setTimeout(() => downloadTableQR(t.tableNumber), i * 300);
    });
    toast.success(`Exporting ${tables.length} table QR codes...`);
  };

  const printTableStands = (targetTables = tables) => {
    if (!targetTables || targetTables.length === 0) {
      toast.error('No tables found to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print table standees');
      return;
    }

    const cardsHtml = targetTables.map(t => {
      const canvas = document.getElementById(`qr-canvas-${t.tableNumber}`);
      const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';
      return `
        <div class="stand-card">
          <div class="brand-title">SERIVQ SMART DINING</div>
          <div class="table-pill">TABLE ${t.tableNumber}</div>
          <div class="capacity-tag">${t.seatingCapacity || 4} GUESTS CAPACITY</div>
          <div class="qr-wrapper">
            ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Table ${t.tableNumber} QR" />` : ''}
          </div>
          <div class="instructions">
            <span class="step-title">SCAN TO DINE-IN & ORDER</span>
            <p>1. Open Phone Camera & Scan QR<br/>2. Browse Menu & Choose Dishes<br/>3. Hot Food Served to Your Table</p>
          </div>
          <div class="stand-footer">✨ Fast & Contactless Dining Experience</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table Standees - SerivQ Dining</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; background: #fff; }
            .grid-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15mm; }
            .stand-card { border: 2px dashed #94a3b8; border-radius: 18px; padding: 22px 18px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; page-break-inside: avoid; height: 128mm; }
            .brand-title { font-size: 11px; font-weight: 800; letter-spacing: 2.5px; color: #64748b; margin-bottom: 6px; }
            .table-pill { font-size: 26px; font-weight: 900; background: #0f172a; color: #ffffff; padding: 6px 24px; border-radius: 100px; display: inline-block; margin-bottom: 4px; }
            .capacity-tag { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 10px; }
            .qr-wrapper img { width: 145px; height: 145px; border-radius: 12px; border: 1px solid #e2e8f0; padding: 8px; }
            .instructions { margin-top: 8px; }
            .step-title { display: block; font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
            .instructions p { font-size: 10px; color: #475569; line-height: 1.45; margin: 4px 0 0 0; }
            .stand-footer { font-size: 9px; font-weight: 700; color: #94a3b8; border-top: 1px solid #f1f5f9; width: 100%; padding-top: 8px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="grid-container">${cardsHtml}</div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredTables = useMemo(() => {
    return tables
      .filter(t => {
        const matchesSearch = String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        const occupied = isTableOccupied(t);
        if (statusFilter === 'available') return !occupied;
        if (statusFilter === 'occupied') return occupied;
        return true;
      })
      .sort((a, b) => {
        return String(a.tableNumber || '').localeCompare(String(b.tableNumber || ''), undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [tables, searchQuery, statusFilter, activeOrdersLookup]);

  return (
    <div style={{ width: '100%' }}>      {/* Consolidated Top Header & Action Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Row 1: Title and Main Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
                <QrCode size={18} />
              </div>
              Dynamic Table & QR Manager
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Generate, customize, and print digital dine-in QR codes for every table.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => printTableStands(filteredTables)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={14} /> Print Stands
            </button>
            <button
              type="button"
              onClick={downloadAllQRs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={14} /> Download All
            </button>
            <button
              type="button"
              onClick={handleOpenBatchModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={14} /> Quick Batch Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={15} /> Add Table
            </button>
          </div>
        </div>

        {/* Row 2: Search & Status Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', minWidth: '260px' }}>
            <Search size={14} color="#94a3b8" />
            <input 
              type="text"
              placeholder="Search table number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '100%', color: '#1e293b' }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                <Check size={13} />
              </button>
            )}
            {isRefreshing && (
              <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
              </span>
            )}
          </div>

          {/* Quick Filter Pill Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                background: statusFilter === 'all' ? '#0f172a' : '#f8fafc',
                color: statusFilter === 'all' ? '#ffffff' : '#475569',
                padding: '6px 12px',
                borderRadius: '8px',
                border: statusFilter === 'all' ? '1px solid #0f172a' : '1px solid #e2e8f0',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All ({tables.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              style={{
                background: statusFilter === 'available' ? '#16a34a' : '#f0fdf4',
                color: statusFilter === 'available' ? '#ffffff' : '#16a34a',
                padding: '6px 12px',
                borderRadius: '8px',
                border: statusFilter === 'available' ? '1px solid #16a34a' : '1px solid #bbf7d0',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Available ({tables.filter(t => !activeOrdersLookup[String(t.tableNumber || '').toLowerCase().trim()]).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('occupied')}
              style={{
                background: statusFilter === 'occupied' ? '#d97706' : '#fffbeb',
                color: statusFilter === 'occupied' ? '#ffffff' : '#d97706',
                padding: '6px 12px',
                borderRadius: '8px',
                border: statusFilter === 'occupied' ? '1px solid #d97706' : '1px solid #fde68a',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Occupied ({tables.filter(t => !!activeOrdersLookup[String(t.tableNumber || '').toLowerCase().trim()]).length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Dynamic Table Cards / Skeleton Loader */}
      {loading && tables.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map((sk) => (
            <div
              key={sk}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.85
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: 80, height: 24, borderRadius: 8, background: '#f1f5f9' }} />
                <div style={{ width: 64, height: 20, borderRadius: 100, background: '#f1f5f9' }} />
              </div>
              <div style={{ width: 160, height: 160, borderRadius: 14, background: '#f8fafc', border: '1.5px dashed #cbd5e1', marginBottom: '12px' }} />
              <div style={{ width: '100%', height: 32, borderRadius: 10, background: '#f1f5f9', marginBottom: '10px' }} />
              <div style={{ width: '100%', height: 38, borderRadius: 10, background: '#e2e8f0' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {filteredTables.map((table) => {
            const qrUrl = getTableQRUrl(table.tableNumber);
            const isOccupied = isTableOccupied(table);
            const activeOrder = getTableActiveOrder(table);

            return (
              <motion.div
                key={table._id || table.tableNumber}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: isOccupied ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 6px 16px -2px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* 1. Header with Table Badge, Live Status & Delete Button */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      Table {table.tableNumber}
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4.5,
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '100px',
                      background: isOccupied ? '#fffbeb' : '#f0fdf4',
                      color: isOccupied ? '#92400e' : '#166534',
                      border: isOccupied ? '1px solid #fde68a' : '1px solid #bbf7d0'
                    }}>
                      <span style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: isOccupied ? '#f59e0b' : '#22c55e'
                      }}></span>
                      {isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTableToDelete(table)}
                    title="Delete Table"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      border: '1px solid #fee2e2',
                      background: '#fff1f2',
                      color: '#e11d48',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Live Order Peek Badge (if table is active) */}
                {activeOrder && (
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 10px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#92400e'
                  }}>
                    <span>🍳 {activeOrder.itemCount} items active</span>
                    <span>₹{activeOrder.totalAmount}</span>
                  </div>
                )}

                {/* 2. QR Code Canvas Frame (Clickable for High-Res Full Screen Preview) */}
                <div
                  onClick={() => setPreviewTable(table)}
                  title="Click to preview full-screen QR & print options"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, #fbfcfe 0%, #f8fafc 100%)',
                    padding: '14px 10px 10px',
                    borderRadius: '14px',
                    border: '1px solid #f1f5f9',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    background: '#ffffff',
                    padding: '10px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'inline-flex',
                    border: '1px solid #e2e8f0'
                  }}>
                    <QRCodeCanvas
                      id={`qr-canvas-${table.tableNumber}`}
                      value={qrUrl}
                      size={140}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  
                  <span style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Coffee size={12} color="#64748b" /> Dine-in Menu & Order
                  </span>
                </div>

                {/* 3. Seating Capacity Stepper Row */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
                    <Users size={13} color="#64748b" />
                    <span>{table.seatingCapacity || 4} Guests</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateCapacity(table, Math.max(1, (table.seatingCapacity || 4) - 1))}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                      title="Decrease seats"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCapacity(table, (table.seatingCapacity || 4) + 1)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                      title="Increase seats"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. Actions Footer */}
                <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#1e293b',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Eye size={13} color="#475569" /> View
                  </a>

                  <button
                    type="button"
                    onClick={() => downloadTableQR(table.tableNumber)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#1e293b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Download size={13} color="#475569" /> Download
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}  )}

      {filteredTables.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', marginTop: '1rem' }}>
          <QrCode size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', margin: 0 }}>No tables found</h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>Click "+ Add Table" above to create your first dine-in QR code.</p>
        </div>
      )}

      {/* ADD SINGLE TABLE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
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
                borderRadius: '18px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Add New Table</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>Create a table and auto-generate its dedicated scan URL.</p>

              <form onSubmit={handleAddSingleTable}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Table Number / Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5, Patio 2, Terrace A"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
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

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Seating Capacity (Customer)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="4"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
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

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Table'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SEATING CAPACITY & TABLE MODAL */}
      <AnimatePresence>
        {showEditModal && editingTable && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }} onClick={() => setShowEditModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Edit Table & Seating Capacity
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                Modify table identifier or customer seating capacity.
              </p>

              <form onSubmit={handleSaveEditTable}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Table Identifier / Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTableNumber}
                    onChange={(e) => setEditTableNumber(e.target.value)}
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

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Seating Capacity (Customer) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: '8px', flexWrap: 'wrap' }}>
                    {[2, 4, 6, 8, 10].map(cap => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setEditCapacity(String(cap))}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: editCapacity === String(cap) ? '1px solid #0f172a' : '1px solid #e2e8f0',
                          background: editCapacity === String(cap) ? '#0f172a' : '#f8fafc',
                          color: editCapacity === String(cap) ? '#ffffff' : '#475569',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {cap} Customer
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK BATCH MODAL WITH INDIVIDUAL SEATING CAPACITY */}
      <AnimatePresence>
        {showBatchModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }} onClick={() => setShowBatchModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '460px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Quick Batch Table Generation</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                Generate tables in batch and customize individual seating capacities below.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Number of Tables to Add</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={batchCount}
                  onChange={(e) => handleBatchCountChange(e.target.value)}
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

              {/* Quick Bulk Setting */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Quick Fill Default Capacity:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={batchDefaultCap}
                    onChange={(e) => setBatchDefaultCap(e.target.value)}
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyDefaultToAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Apply to All Tables
                  </button>
                </div>
              </div>

              {/* Individual Table Seating Capacities List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Individual Seating Capacity per Table:
                </label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: '4px' }}>
                  {batchItems.map((item, idx) => (
                    <div
                      key={item.tableNumber}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Table {item.tableNumber}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={item.seatingCapacity}
                          onChange={(e) => handleBatchItemCapacityChange(idx, e.target.value)}
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>customer</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchGenerate}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isSubmitting ? 'Generating...' : `Generate ${batchItems.length} Tables`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {tableToDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }} onClick={() => !isDeleting && setTableToDelete(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '2rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <Trash2 size={26} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Delete Table {tableToDelete.tableNumber}?
              </h3>
              
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.75rem 0', lineHeight: 1.5 }}>
                Guests will no longer be able to scan this QR code or place digital dine-in orders. This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setTableToDelete(null)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteTable}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLICK-TO-ENLARGE HIGH-RES QR MODAL */}
      <AnimatePresence>
        {previewTable && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }} onClick={() => setPreviewTable(null)}>
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
                maxWidth: '440px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewTable(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 14px', borderRadius: '100px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Table {previewTable.tableNumber}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>• {previewTable.seatingCapacity || 4} Guests</span>
              </div>

              {/* Large QR Display */}
              <div style={{
                background: 'linear-gradient(180deg, #fbfcfe 0%, #f8fafc 100%)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}>
                  <QRCodeCanvas
                    value={getTableQRUrl(previewTable.tableNumber)}
                    size={220}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '10px' }}>
                  Scan to preview menu on your smartphone
                </span>
              </div>

              {/* Target URL with Copy Button */}
              <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  readOnly
                  value={getTableQRUrl(previewTable.tableNumber)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '11.5px',
                    color: '#475569',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getTableQRUrl(previewTable.tableNumber));
                    toast.success(`Copied Table ${previewTable.tableNumber} URL`);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Copy size={13} /> Copy
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => printTableStands([previewTable])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={13} /> Standee
                </button>

                <button
                  type="button"
                  onClick={() => downloadTableQR(previewTable.tableNumber)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Download
                </button>

                <a
                  href={getTableQRUrl(previewTable.tableNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={13} /> Open View
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodeComponent;