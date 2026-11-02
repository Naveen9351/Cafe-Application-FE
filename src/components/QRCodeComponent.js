import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Download, Trash2, Edit3, QrCode, RefreshCw, Users, Check, AlertCircle, Sparkles, Search, Layers, Wifi, Smartphone, Globe, Copy, ExternalLink, Coffee, Eye, Printer, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL as API } from '../config/api';
import { buildTableMenuUrl } from '../utils/tableToken';

const QRCodeComponent = ({ orders = [], initialTables = [], tenantInfo = null }) => {
  const { user, tenantId } = useAuth();
  const effectiveTenantId = tenantId || user?.tenantId || '6a762ef86c9d5c8be315f10a';

  const restaurantName = tenantInfo?.name || tenantInfo?.settings?.restaurantName || localStorage.getItem('restaurant_name') || 'The Landmark';
  const restaurantLogo = tenantInfo?.logo || tenantInfo?.settings?.logo || localStorage.getItem('restaurant_logo') || null;

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
  
  // Target Host Configuration for QR Codes (Defaults to current local origin or saved host)
  const defaultHost = (typeof window !== 'undefined' && window.location.origin)
    ? window.location.origin
    : 'https://cafe-application-fe.vercel.app';
  const [qrBaseUrl, setQrBaseUrl] = useState(() => {
    const saved = localStorage.getItem('serivq_qr_base_url');
    if (saved) return saved;
    return defaultHost;
  });
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
    return buildTableMenuUrl(qrBaseUrl, tableNum, effectiveTenantId);
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
        const total = Number(o.total || o.totalAmount || o.finalTotal || o.billAmount) || (o.items || []).reduce((acc, it) => acc + ((Number(it.price) || 0) * (it.quantity || 1)), 0);
        const itemsCount = (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
        
        const applyToKey = (key) => {
          if (!key) return;
          if (!lookup[key]) {
            lookup[key] = {
              orderId: o.orderId || o._id,
              totalAmount: total,
              itemCount: itemsCount || (o.items ? o.items.length : 1),
              status: o.status || 'preparing',
              placedAt: o.createdAt,
              ordersCount: 1
            };
          } else {
            lookup[key].totalAmount += total;
            lookup[key].itemCount += itemsCount;
            lookup[key].ordersCount += 1;
          }
        };

        if (raw) applyToKey(raw);
        if (numOnly && numOnly !== raw) applyToKey(numOnly);
        if (numOnly) applyToKey(`Table ${numOnly}`);
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

    // Check duplicate table name
    const isDuplicate = tables.some(t =>
      t._id !== editingTable._id &&
      String(t.tableNumber || '').trim().toLowerCase() === cleanNum.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`Table "${cleanNum}" already exists. Table name must be unique.`);
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

  // High-Resolution Standee Card Canvas Generator (1200 x 1600 px - 300 DPI Print Quality)
  const generateStandeeCardDataUrl = (table, name, logo, qrCanvas) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');

    const drawRoundedRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 1. Pure Crisp White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1600);

    // 2. Elegant Outer Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0f172a';
    drawRoundedRect(50, 50, 1100, 1500, 36);
    ctx.stroke();

    // 3. Precision Cut/Crop Corner Markers
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#94a3b8';
    // Top-Left
    ctx.beginPath(); ctx.moveTo(25, 50); ctx.lineTo(45, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(50, 25); ctx.lineTo(50, 45); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(1155, 50); ctx.lineTo(1175, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1150, 25); ctx.lineTo(1150, 45); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(25, 1550); ctx.lineTo(45, 1550); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(50, 1555); ctx.lineTo(50, 1575); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(1155, 1550); ctx.lineTo(1175, 1550); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1150, 1555); ctx.lineTo(1150, 1575); ctx.stroke();

    // 4. Inner Hairline Accent Frame
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#e2e8f0';
    drawRoundedRect(66, 66, 1068, 1468, 26);
    ctx.stroke();

    // 5. Header: Restaurant Brand Name & Subtitle
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText((name || 'THE LANDMARK').toUpperCase(), 600, 160);

    ctx.fillStyle = '#64748b';
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SMART CONTACTLESS DINING', 600, 205);

    // Header subtle accent line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(440, 230);
    ctx.lineTo(760, 230);
    ctx.stroke();

    // 6. Table Identifier Capsule Badge
    const pillW = 420;
    const pillH = 80;
    const pillX = 600 - pillW / 2;
    const pillY = 265;
    ctx.fillStyle = '#0f172a';
    drawRoundedRect(pillX, pillY, pillW, pillH, 40);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`TABLE ${table.tableNumber}`, 600, pillY + 54);

    // Capacity Indicator
    ctx.fillStyle = '#64748b';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`👥 ${table.seatingCapacity || 4} GUESTS CAPACITY`, 600, 390);

    // 7. QR Code Frame Card (with soft shadow feel & border)
    const qrBoxSize = 620;
    const qrBoxX = 600 - qrBoxSize / 2;
    const qrBoxY = 425;
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Draw High-Res QR from canvas
    if (qrCanvas) {
      const qrDrawSize = 540;
      const qrOffset = (qrBoxSize - qrDrawSize) / 2;
      ctx.drawImage(qrCanvas, qrBoxX + qrOffset, qrBoxY + qrOffset, qrDrawSize, qrDrawSize);
    }

    // Modern Scan Target Corner Brackets on QR Box
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0f172a';
    const brLen = 28;
    // Top-Left Bracket
    ctx.beginPath();
    ctx.moveTo(qrBoxX + 16, qrBoxY + 16 + brLen);
    ctx.lineTo(qrBoxX + 16, qrBoxY + 16);
    ctx.lineTo(qrBoxX + 16 + brLen, qrBoxY + 16);
    ctx.stroke();
    // Top-Right Bracket
    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - 16 - brLen, qrBoxY + 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + 16 + brLen);
    ctx.stroke();
    // Bottom-Left Bracket
    ctx.beginPath();
    ctx.moveTo(qrBoxX + 16, qrBoxY + qrBoxSize - 16 - brLen);
    ctx.lineTo(qrBoxX + 16, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + 16 + brLen, qrBoxY + qrBoxSize - 16);
    ctx.stroke();
    // Bottom-Right Bracket
    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - 16 - brLen, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + qrBoxSize - 16 - brLen);
    ctx.stroke();

    // 8. Call to Action Heading
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SCAN TO BROWSE MENU & ORDER', 600, 1100);

    // 9. 3-Step Guide Chips
    const stepsY = 1140;
    const stepW = 280;
    const stepH = 150;
    const stepGap = 45;
    const startX = 600 - (stepW * 3 + stepGap * 2) / 2;

    const steps = [
      { num: '1', title: 'Scan QR', desc: 'with phone camera' },
      { num: '2', title: 'Browse Menu', desc: '& customize dishes' },
      { num: '3', title: 'Hot Food', desc: 'served to table' }
    ];

    steps.forEach((st, idx) => {
      const sx = startX + idx * (stepW + stepGap);

      // Card Background
      ctx.fillStyle = '#f8fafc';
      drawRoundedRect(sx, stepsY, stepW, stepH, 18);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Number badge
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.arc(sx + stepW / 2, stepsY + 34, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px sans-serif';
      ctx.fillText(st.num, sx + stepW / 2, stepsY + 41);

      // Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(st.title, sx + stepW / 2, stepsY + 90);

      // Desc
      ctx.fillStyle = '#64748b';
      ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(st.desc, sx + stepW / 2, stepsY + 120);

      // Arrow separator
      if (idx < 2) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('›', sx + stepW + stepGap / 2, stepsY + 80);
      }
    });

    // 10. Card Footer
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 1390);
    ctx.lineTo(1080, 1390);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('⚡ Fast & Contactless Dining Experience • No App Required', 600, 1435);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Powered by DineviQ Smart Dining', 600, 1475);

    return canvas.toDataURL('image/png');
  };

  // Download High-Resolution 1200x1600 Standee Card PNG
  const downloadTableStandee = (table) => {
    const qrCanvas = document.getElementById(`qr-canvas-${table.tableNumber}`) || document.getElementById(`preview-qr-canvas-${table.tableNumber}`);
    if (!qrCanvas) {
      toast.error('Unable to capture QR code');
      return;
    }

    try {
      const standeeUrl = generateStandeeCardDataUrl(table, restaurantName, restaurantLogo, qrCanvas);
      const downloadLink = document.createElement('a');
      downloadLink.href = standeeUrl.replace('image/png', 'image/octet-stream');
      downloadLink.download = `table - ${table.tableNumber} - Standee.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success(`Downloaded Table ${table.tableNumber} Standee Card (HD)`);
    } catch (e) {
      console.error('Standee generation error:', e);
      toast.error('Failed to generate standee card');
    }
  };

  // Download Ultra-High-Res 1000x1000 Pure QR Code PNG (Solid White BG + Quiet Zone)
  const downloadTableQROnly = (tableNum) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`) || document.getElementById(`preview-qr-canvas-${tableNum}`);
    if (canvas) {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1000;
      exportCanvas.height = 1000;
      const ctx = exportCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.drawImage(canvas, 0, 0, 1000, 1000);

      const pngUrl = exportCanvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `table - ${tableNum} - QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success(`Downloaded Table ${tableNum} High-Res QR`);
    } else {
      toast.error('Unable to capture QR image');
    }
  };

  // Main download helper (defaults to standee card for maximum print readiness)
  const downloadTableQR = (tableNum) => {
    const table = tables.find(t => String(t.tableNumber) === String(tableNum)) || { tableNumber: tableNum, seatingCapacity: 4 };
    downloadTableStandee(table);
  };

  // Batch Download all Standee Cards as high-res PNGs
  const downloadAllStandees = () => {
    tables.forEach((t, i) => {
      setTimeout(() => downloadTableStandee(t), i * 350);
    });
    toast.success(`Exporting ${tables.length} table standee cards...`);
  };

  // Batch Download all Pure QRs as high-res PNGs
  const downloadAllQRs = () => {
    tables.forEach((t, i) => {
      setTimeout(() => downloadTableQROnly(t.tableNumber), i * 300);
    });
    toast.success(`Exporting ${tables.length} table QR codes...`);
  };

  // Print Standees PDF with 2x2 A4 Grid, Razor-Sharp High DPI QR & Luxury Design (Seamless in-page printing, NO leftover tabs!)
  const printTableStands = (targetTables = tables) => {
    if (!targetTables || targetTables.length === 0) {
      toast.error('No tables found to print');
      return;
    }

    // Chunk tables into groups of 4 for perfect 2x2 A4 page layout
    const chunkArray = (arr, size) => {
      const res = [];
      for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size));
      }
      return res;
    };

    const pages = chunkArray(targetTables, 4);

    const pagesHtml = pages.map((chunk, pageIndex) => {
      const cardsHtml = chunk.map(t => {
        const canvas = document.getElementById(`qr-canvas-${t.tableNumber}`) || document.getElementById(`preview-qr-canvas-${t.tableNumber}`);
        const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';
        return `
          <div class="stand-card">
            <div class="cut-guide">
              <span>✂ Cut along border</span>
              <span>TABLE ${t.tableNumber}</span>
            </div>
            <div class="card-inner">
              <div class="brand-header">
                ${restaurantLogo ? `<img src="${restaurantLogo}" class="brand-logo" alt="${restaurantName}" />` : ''}
                <div class="brand-title">${(restaurantName || 'THE LANDMARK').toUpperCase()}</div>
                <div class="brand-subtitle">SMART CONTACTLESS DINING</div>
              </div>

              <div class="table-badge-wrap">
                <div class="table-badge">
                  <span class="badge-prefix">TABLE</span>
                  <span class="badge-num">${t.tableNumber}</span>
                </div>
                <div class="capacity-tag">👥 ${t.seatingCapacity || 4} GUESTS CAPACITY</div>
              </div>

              <div class="qr-container">
                <div class="bracket top-left"></div>
                <div class="bracket top-right"></div>
                <div class="bracket bottom-left"></div>
                <div class="bracket bottom-right"></div>
                ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-code-img" alt="Table ${t.tableNumber} QR" />` : ''}
              </div>

              <div class="instructions-section">
                <div class="cta-title">SCAN TO BROWSE MENU & ORDER</div>
                <div class="steps-row">
                  <div class="step-card">
                    <span class="step-num">1</span>
                    <span class="step-txt"><strong>Scan QR</strong><br/>with camera</span>
                  </div>
                  <div class="step-arrow">›</div>
                  <div class="step-card">
                    <span class="step-num">2</span>
                    <span class="step-txt"><strong>Browse Menu</strong><br/>& customize</span>
                  </div>
                  <div class="step-arrow">›</div>
                  <div class="step-card">
                    <span class="step-num">3</span>
                    <span class="step-txt"><strong>Food Served</strong><br/>hot to table</span>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <span>⚡ Fast & Contactless Dining • No App Required</span>
                <span class="powered-tag">Powered by DineviQ</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="print-page ${pageIndex === pages.length - 1 ? 'last-page' : ''}">
          ${cardsHtml}
        </div>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${restaurantName} - Table QR Standees</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 10mm 8mm;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print-page {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 7mm;
        height: 275mm;
        max-height: 275mm;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
      }
      .print-page.last-page {
        page-break-after: auto;
        break-after: auto;
      }
      .stand-card {
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        padding: 6px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        height: 133mm;
        box-sizing: border-box;
      }
      .cut-guide {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 7.5px;
        font-weight: 700;
        color: #94a3b8;
        padding: 0 4px 4px 4px;
        letter-spacing: 0.5px;
      }
      .card-inner {
        flex: 1;
        border: 2px solid #0f172a;
        border-radius: 12px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        background: #ffffff;
        box-sizing: border-box;
      }
      .brand-header {
        margin-top: 2px;
      }
      .brand-logo {
        max-height: 28px;
        max-width: 140px;
        object-fit: contain;
        margin-bottom: 2px;
      }
      .brand-title {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #0f172a;
        line-height: 1.1;
      }
      .brand-subtitle {
        font-size: 7.5px;
        font-weight: 700;
        letter-spacing: 1.2px;
        color: #64748b;
        margin-top: 1px;
      }
      .table-badge-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        margin: 3px 0;
      }
      .table-badge {
        background: #0f172a;
        color: #ffffff;
        padding: 4px 18px;
        border-radius: 100px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .badge-prefix {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #94a3b8;
      }
      .badge-num {
        font-size: 19px;
        font-weight: 900;
        letter-spacing: 0.5px;
        color: #ffffff;
      }
      .capacity-tag {
        font-size: 8px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.3px;
      }
      .qr-container {
        position: relative;
        padding: 6px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .qr-code-img {
        width: 120px;
        height: 120px;
        display: block;
        border-radius: 4px;
      }
      .bracket {
        position: absolute;
        width: 10px;
        height: 10px;
        border-color: #0f172a;
      }
      .bracket.top-left {
        top: -1px; left: -1px;
        border-top: 2.5px solid #0f172a;
        border-left: 2.5px solid #0f172a;
        border-top-left-radius: 4px;
      }
      .bracket.top-right {
        top: -1px; right: -1px;
        border-top: 2.5px solid #0f172a;
        border-right: 2.5px solid #0f172a;
        border-top-right-radius: 4px;
      }
      .bracket.bottom-left {
        bottom: -1px; left: -1px;
        border-bottom: 2.5px solid #0f172a;
        border-left: 2.5px solid #0f172a;
        border-bottom-left-radius: 4px;
      }
      .bracket.bottom-right {
        bottom: -1px; right: -1px;
        border-bottom: 2.5px solid #0f172a;
        border-right: 2.5px solid #0f172a;
        border-bottom-right-radius: 4px;
      }
      .instructions-section {
        width: 100%;
        margin-top: 3px;
      }
      .cta-title {
        font-size: 9px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: 0.4px;
        margin-bottom: 4px;
      }
      .steps-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 2px;
      }
      .step-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 3px 4px;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 0;
      }
      .step-num {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: #4f46e5;
        color: #ffffff;
        font-size: 8px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2px;
      }
      .step-txt {
        font-size: 7px;
        color: #334155;
        line-height: 1.15;
      }
      .step-arrow {
        font-size: 10px;
        font-weight: 800;
        color: #94a3b8;
        padding: 0 1px;
        flex-shrink: 0;
      }
      .card-footer {
        width: 100%;
        border-top: 1px solid #f1f5f9;
        padding-top: 3px;
        margin-top: 3px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 6.5px;
        font-weight: 700;
        color: #94a3b8;
      }
      .powered-tag {
        color: #64748b;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
</html>`;

    // Seamless in-page printing via hidden iframe: NO new tabs, NO leftover blank pages!
    const existingFrame = document.getElementById('serivq-standee-print-frame');
    if (existingFrame) existingFrame.remove();

    const printFrame = document.createElement('iframe');
    printFrame.id = 'serivq-standee-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(fullHtml);
    frameDoc.close();

    const triggerPrint = () => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.onafterprint = () => {
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              printFrame.remove();
            }
          }, 100);
        };
        printFrame.contentWindow.print();
      } catch (err) {
        console.error('Iframe print failed, falling back to popup with auto-close:', err);
        const fallbackWin = window.open('', '_blank');
        if (fallbackWin) {
          fallbackWin.document.write(fullHtml + `
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                  window.onafterprint = function() { window.close(); };
                  setTimeout(function() { window.close(); }, 6000);
                }, 250);
              };
            </script>
          `);
          fallbackWin.document.close();
        }
      }
    };

    setTimeout(triggerPrint, 250);
  };

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchesSearch = !searchQuery || String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesSearch;
    });
  }, [tables, searchQuery]);

  return (
    <div style={{ width: '100%' }}>
      {/* UNIFIED SINGLE COMPACT HEADER BAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '0.65rem 1rem',
        marginBottom: '1rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Left: Compact Title & Search Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <QrCode size={17} />
            </div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Table QR Codes
            </h2>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '5px 10px',
            width: '190px'
          }}>
            <Search size={13} color="#94a3b8" />
            <input 
              type="text"
              placeholder="Search table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%', color: '#1e293b' }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                <X size={12} />
              </button>
            )}
            {isRefreshing && (
              <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
              </span>
            )}
          </div>
        </div>

        {/* Right: Table Count + Action Buttons in ONE LINE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: '#f1f5f9',
            padding: '5px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#475569'
          }}>
            Total Tables: <strong style={{ color: '#0f172a' }}>{tables.length}</strong>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => printTableStands(filteredTables)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: '8px',
              border: '1px solid #c7d2fe',
              background: '#eef2ff',
              color: '#4338ca',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Print Table QR Standees PDF (2x2 A4 Grid)"
          >
            <Printer size={13} /> Print Stands (PDF)
          </button>
          <button
            type="button"
            onClick={downloadAllStandees}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Download All Table Standee Cards (1200x1600 HD PNG)"
          >
            <Printer size={13} /> Standees (PNG)
          </button>
          <button
            type="button"
            onClick={downloadAllQRs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Download All Pure QR Codes (1000x1000 HD PNG)"
          >
            <Download size={13} /> QRs Only
          </button>
          <button
            type="button"
            onClick={handleOpenBatchModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Batch Add Tables"
          >
            <Layers size={13} /> Quick Batch
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 13px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={14} /> Add Table
          </button>
        </div>
      </div>

      <style>{`
        .table-qr-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .table-qr-grid-4 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 768px) {
          .table-qr-grid-4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 480px) {
          .table-qr-grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Grid of Dynamic Table Cards / Skeleton Loader */}
      {loading && tables.length === 0 ? (
        <div className="table-qr-grid-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sk) => (
            <div
              key={sk}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1rem 0.85rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.85
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: 70, height: 22, borderRadius: 8, background: '#f1f5f9' }} />
                <div style={{ width: 50, height: 20, borderRadius: 6, background: '#f1f5f9' }} />
              </div>
              <div style={{ width: 120, height: 120, borderRadius: 12, background: '#f8fafc', border: '1.5px dashed #cbd5e1', marginBottom: '10px' }} />
              <div style={{ width: '100%', height: 28, borderRadius: 8, background: '#f1f5f9', marginBottom: '8px' }} />
              <div style={{ width: '100%', height: 32, borderRadius: 8, background: '#e2e8f0' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="table-qr-grid-4">
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
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1rem 0.85rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* 1. Header with Table Badge, Edit & Delete Buttons */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(table)}
                      title="Edit Table Name / Seating Capacity"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Edit3 size={13} />
                    </button>

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
                </div>

                {/* 2. QR Code Canvas Frame (Compact, Clickable for Preview) */}
                <div
                  onClick={() => setPreviewTable(table)}
                  title="Click to preview full-screen QR & print options"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, #fbfcfe 0%, #f8fafc 100%)',
                    padding: '10px 8px 8px',
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
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'inline-flex',
                    border: '1px solid #e2e8f0'
                  }}>
                    <QRCodeCanvas
                      id={`qr-canvas-${table.tableNumber}`}
                      value={qrUrl}
                      size={800}
                      style={{ width: '105px', height: '105px', display: 'block' }}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                      level="H"
                      includeMargin={true}
                      marginSize={2}
                    />
                  </div>
                  
                  <span style={{
                    marginTop: '6px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Coffee size={11} color="#64748b" /> Dine-in Menu & Order
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
                    onClick={() => downloadTableStandee(table)}
                    title="Download Table Standee Card (1200x1600 Print-Ready HD PNG)"
                    style={{
                      flex: 1.2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '7px 7px',
                      borderRadius: '8px',
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      color: '#4338ca',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Printer size={12} color="#4338ca" /> Standee
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadTableQROnly(table.tableNumber)}
                    title="Download Pure High-Res QR Code (Solid White 1000x1000 PNG)"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '7px 8px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Download size={12} color="#475569" /> QR
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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
                    id={`preview-qr-canvas-${previewTable.tableNumber}`}
                    value={getTableQRUrl(previewTable.tableNumber)}
                    size={800}
                    style={{ width: '220px', height: '220px', display: 'block' }}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    level="H"
                    includeMargin={true}
                    marginSize={2}
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
                  onClick={() => downloadTableStandee(previewTable)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #c7d2fe',
                    background: '#eef2ff',
                    color: '#4338ca',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Download 1200x1600 Standee Card PNG"
                >
                  <Printer size={13} /> Standee PNG
                </button>

                <button
                  type="button"
                  onClick={() => downloadTableQROnly(previewTable.tableNumber)}
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
                  title="Download 1000x1000 Pure QR Code PNG"
                >
                  <Download size={13} /> QR PNG
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