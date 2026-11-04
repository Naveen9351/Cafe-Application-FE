import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Download, Trash2, Edit3, QrCode, RefreshCw, Users, Check, AlertCircle, Sparkles, Search, Layers, Wifi, Smartphone, Globe, Copy, ExternalLink, Coffee, Eye, Printer, X, Palette, Image as ImageIcon, Sliders, RotateCcw, Upload, CheckCircle2, FileText, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const STAND_TEMPLATES = [
  {
    id: 'acrylic',
    name: 'Classic Acrylic Standee',
    tag: 'POPULAR',
    desc: 'Capsule table badge, branded bold header, 3-step ordering timeline & corner crop brackets',
    badgeStyle: 'capsule',
    bgStyle: 'white',
    cardBorder: 'double',
    cornerRadius: 'rounded',
    primaryColor: '#0f172a',
    accentColor: '#4f46e5'
  },
  {
    id: 'minimalist',
    name: 'Modern Minimalist',
    tag: 'CLEAN',
    desc: 'Airy spacing, sleek typography, minimal pill table badge, clean high-contrast scan area',
    badgeStyle: 'minimal',
    bgStyle: 'white',
    cardBorder: 'thin',
    cornerRadius: 'pill',
    primaryColor: '#1e293b',
    accentColor: '#0284c7'
  },
  {
    id: 'dark',
    name: 'Luxury Dark Lounge',
    tag: 'PREMIUM',
    desc: 'Midnight dark background with metallic gold & bronze accents for high-end dining',
    badgeStyle: 'ribbon',
    bgStyle: 'dark',
    cardBorder: 'gold',
    cornerRadius: 'rounded',
    primaryColor: '#f59e0b',
    accentColor: '#fbbf24'
  },
  {
    id: 'warm',
    name: 'Artisan Cafe & Bakery',
    tag: 'COZY',
    desc: 'Warm cream & kraft paper background with rich espresso brown & honey amber tones',
    badgeStyle: 'capsule',
    bgStyle: 'cream',
    cardBorder: 'solid',
    cornerRadius: 'rounded',
    primaryColor: '#451a03',
    accentColor: '#d97706'
  },
  {
    id: 'compact',
    name: 'Sleek Compact Stand',
    tag: 'EXPRESS',
    desc: 'Extra-large bold table number, high-density QR placement and dedicated Wi-Fi callout',
    badgeStyle: 'large',
    bgStyle: 'white',
    cardBorder: 'thin',
    cornerRadius: 'sharp',
    primaryColor: '#0f172a',
    accentColor: '#10b981'
  }
];

const THEME_PRESETS = [
  { id: 'slate', name: 'Classic Slate', primary: '#0f172a', accent: '#4f46e5' },
  { id: 'indigo', name: 'Royal Indigo', primary: '#1e1b4b', accent: '#6366f1' },
  { id: 'emerald', name: 'Fresh Emerald', primary: '#064e3b', accent: '#059669' },
  { id: 'amber', name: 'Cafe Amber', primary: '#451a03', accent: '#d97706' },
  { id: 'crimson', name: 'Ruby Crimson', primary: '#881337', accent: '#e11d48' },
  { id: 'ocean', name: 'Deep Ocean', primary: '#0c2340', accent: '#0284c7' },
  { id: 'gold', name: 'Luxury Gold', primary: '#18181b', accent: '#eab308' },
  { id: 'purple', name: 'Neon Violet', primary: '#2e1065', accent: '#a855f7' }
];

const getDefaultStandeeConfig = (resName, resLogo) => ({
  templateId: 'acrylic',
  restaurantName: resName || 'The Landmark',
  tagline: 'SMART CONTACTLESS DINING',
  logoUrl: resLogo || '',
  showLogo: !!resLogo,
  tablePrefix: 'TABLE',
  badgeStyle: 'capsule', // 'capsule' | 'minimal' | 'ribbon' | 'large'
  showCapacity: true,
  primaryColor: '#0f172a',
  accentColor: '#4f46e5',
  bgStyle: 'white', // 'white' | 'cream' | 'dark' | 'slate'
  cardBorder: 'double', // 'double' | 'thin' | 'solid' | 'gold' | 'none'
  cornerRadius: 'rounded', // 'rounded' | 'pill' | 'sharp'
  ctaTitle: 'SCAN TO BROWSE MENU & ORDER',
  showInstructions: true,
  step1Title: 'Scan QR',
  step1Desc: 'with phone camera',
  step2Title: 'Browse Menu',
  step2Desc: 'choose & customize',
  step3Title: 'Food Served',
  step3Desc: 'hot to your table',
  showWifi: false,
  wifiSsid: '',
  wifiPass: '',
  footerNote: '⚡ Fast & Contactless Dining • No App Required',
  poweredBy: 'Powered by DineviQ Smart Dining',
  showWatermark: true
});

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
  
  // Table Categories / Sections State (e.g. Main Hall, Rooftop, Garden, Outdoor)
  const [tableSections, setTableSections] = useState(() => {
    try {
      const saved = localStorage.getItem(`serivq_table_sections_${effectiveTenantId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['Main Hall', 'Rooftop', 'Garden', 'Outdoor'];
  });

  const allAvailableSections = useMemo(() => {
    const set = new Set(tableSections);
    tables.forEach(t => {
      if (t.section) set.add(t.section.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [tableSections, tables]);
  const [selectedSection, setSelectedSection] = useState('all');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const saveSections = (newSecs) => {
    setTableSections(newSecs);
    try {
      localStorage.setItem(`serivq_table_sections_${effectiveTenantId}`, JSON.stringify(newSecs));
    } catch (e) {}
  };

  const handleAddSection = (e) => {
    if (e) e.preventDefault();
    const clean = newSectionName.trim();
    if (!clean) return;
    if (tableSections.some(s => s.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Section "${clean}" already exists`);
      return;
    }
    const updated = [...tableSections, clean];
    saveSections(updated);
    setSelectedSection(clean);
    setNewSectionName('');
    setShowAddSectionModal(false);
    toast.success(`Added "${clean}" category`);
  };

  const handleDeleteSection = (secName, e) => {
    if (e) e.stopPropagation();
    if (tableSections.length <= 1) {
      toast.error('At least one section must exist');
      return;
    }
    const updated = tableSections.filter(s => s !== secName);
    saveSections(updated);
    if (selectedSection.toLowerCase() === secName.toLowerCase()) setSelectedSection('all');
    toast.success(`Removed "${secName}"`);
  };

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSection, setNewTableSection] = useState('Main Hall');
  const [newCapacity, setNewCapacity] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick batch generator state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [batchDefaultCap, setBatchDefaultCap] = useState('4');
  const [batchSection, setBatchSection] = useState('Main Hall');
  const [batchItems, setBatchItems] = useState([]);

  // Edit Table & Seating Capacity Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editSection, setEditSection] = useState('Main Hall');
  const [editCapacity, setEditCapacity] = useState('4');

  // Custom Delete Confirmation Modal State
  const [tableToDelete, setTableToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Standee Customizer Configuration State (Persisted per tenant)
  const [standeeConfig, setStandeeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(`serivq_standee_config_${effectiveTenantId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...getDefaultStandeeConfig(restaurantName, restaurantLogo), ...parsed };
      }
    } catch (e) {}
    return getDefaultStandeeConfig(restaurantName, restaurantLogo);
  });

  const saveStandeeConfig = (newCfg) => {
    setStandeeConfig(newCfg);
    try {
      localStorage.setItem(`serivq_standee_config_${effectiveTenantId}`, JSON.stringify(newCfg));
      toast.success('Standee design saved as default!');
    } catch (e) {
      toast.error('Failed to save design');
    }
  };

  // Modals for Download Choice, Print Choice & Customizer Studio
  const [openDownloadDropdownId, setOpenDownloadDropdownId] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [showPrintChoiceModal, setShowPrintChoiceModal] = useState(false);
  const [showStandeeEditorModal, setShowStandeeEditorModal] = useState(false);
  const [editorPreviewTable, setEditorPreviewTable] = useState(null);
  const [editorActiveTab, setEditorActiveTab] = useState('templates'); // 'templates' | 'branding' | 'theme' | 'layout' | 'instructions' | 'footer'

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.download-dropdown-wrap')) {
        setOpenDownloadDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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
          section: newTableSection || 'Main Hall',
          seatingCapacity: Number(newCapacity) || 4
        }, {
          headers: { 'x-auth-token': token }
        });
        createdTable = res.data;
      } catch (apiErr) {
        createdTable = {
          _id: `tbl_${Date.now()}`,
          tableNumber: cleanNum,
          section: newTableSection || 'Main Hall',
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
      const payload = {
        ...item,
        section: batchSection || 'Main Hall'
      };
      try {
        const res = await axios.post(`${API}/tables`, payload, {
          headers: { 'x-auth-token': token }
        });
        addedList.push(res.data);
      } catch (err) {
        addedList.push({
          _id: `tbl_${Date.now()}_${item.tableNumber}`,
          tableNumber: item.tableNumber,
          section: batchSection || 'Main Hall',
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
    setEditSection(table.section || 'Main Hall');
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
          section: editSection || 'Main Hall',
          seatingCapacity: capNum
        }, {
          headers: { 'x-auth-token': token }
        });
      }

      setTables(prev => prev.map(t => (t._id === editingTable._id) ? {
        ...t,
        tableNumber: cleanNum,
        section: editSection || 'Main Hall',
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

  // Seamless hidden in-page iframe printing engine (Zero blank tabs, pure print execution)
  const executeIframePrint = (fullHtml) => {
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

  // High-Resolution Standee Card Canvas Generator (1200 x 1600 px - 300 DPI Print Quality)
  const generateStandeeCardDataUrl = (table, config = standeeConfig, qrCanvas) => {
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

    const isDark = config?.bgStyle === 'dark' || config?.templateId === 'dark';
    const isCream = config?.bgStyle === 'cream' || config?.templateId === 'warm';

    const bgColor = isDark ? '#0f172a' : (isCream ? '#fffdf5' : '#ffffff');
    const primary = config?.primaryColor || (isDark ? '#f59e0b' : '#0f172a');
    const accent = config?.accentColor || (isDark ? '#fbbf24' : '#4f46e5');
    const titleColor = isDark ? '#ffffff' : (isCream ? '#451a03' : primary);
    const subColor = isDark ? '#94a3b8' : (isCream ? '#78350f' : '#64748b');

    const brandName = config?.restaurantName || restaurantName || 'The Landmark';
    const brandTagline = config?.tagline || 'SMART CONTACTLESS DINING';
    const prefix = config?.tablePrefix || 'TABLE';
    const badgeStyle = config?.badgeStyle || 'capsule';

    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 1200, 1600);

    // 2. Outer Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = isDark ? (config?.cardBorder === 'gold' ? '#f59e0b' : '#334155') : (isCream ? '#d97706' : primary);
    drawRoundedRect(50, 50, 1100, 1500, config?.cornerRadius === 'sharp' ? 16 : (config?.cornerRadius === 'pill' ? 50 : 36));
    ctx.stroke();

    // 3. Precision Cut/Crop Corner Markers
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
    ctx.beginPath(); ctx.moveTo(25, 50); ctx.lineTo(45, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(50, 25); ctx.lineTo(50, 45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1155, 50); ctx.lineTo(1175, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1150, 25); ctx.lineTo(1150, 45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 1550); ctx.lineTo(45, 1550); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(50, 1555); ctx.lineTo(50, 1575); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1155, 1550); ctx.lineTo(1175, 1550); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1150, 1555); ctx.lineTo(1150, 1575); ctx.stroke();

    // 4. Inner Hairline Accent Frame
    if (config?.cardBorder !== 'none' && config?.cardBorder !== 'thin') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isDark ? '#1e293b' : (isCream ? '#fef3c7' : '#e2e8f0');
      drawRoundedRect(66, 66, 1068, 1468, 26);
      ctx.stroke();
    }

    // 5. Header: Restaurant Brand Name & Subtitle
    ctx.textAlign = 'center';
    ctx.fillStyle = titleColor;
    ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(brandName.toUpperCase(), 600, 160);

    ctx.fillStyle = subColor;
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(brandTagline, 600, 205);

    // Header subtle accent line
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(460, 230);
    ctx.lineTo(740, 230);
    ctx.stroke();

    // 6. Table Identifier Badge
    if (badgeStyle === 'ribbon') {
      ctx.fillStyle = primary;
      ctx.fillRect(200, 260, 800, 75);
      ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(`${prefix} ${table.tableNumber}`.trim(), 600, 312);
    } else if (badgeStyle === 'large') {
      ctx.fillStyle = accent;
      ctx.font = '800 24px sans-serif';
      ctx.fillText(prefix, 600, 275);
      ctx.fillStyle = titleColor;
      ctx.font = '900 68px sans-serif';
      ctx.fillText(String(table.tableNumber), 600, 335);
    } else if (badgeStyle === 'minimal') {
      const pillW = 380;
      const pillH = 70;
      const pillX = 600 - pillW / 2;
      const pillY = 265;
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      drawRoundedRect(pillX, pillY, pillW, pillH, 35);
      ctx.stroke();
      ctx.fillStyle = titleColor;
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`${prefix} ${table.tableNumber}`.trim(), 600, pillY + 48);
    } else {
      const pillW = 420;
      const pillH = 80;
      const pillX = 600 - pillW / 2;
      const pillY = 265;
      ctx.fillStyle = primary;
      drawRoundedRect(pillX, pillY, pillW, pillH, 40);
      ctx.fill();
      ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(`${prefix} ${table.tableNumber}`.trim(), 600, pillY + 54);
    }

    // Capacity Indicator
    if (config?.showCapacity !== false) {
      ctx.fillStyle = subColor;
      ctx.font = '700 22px sans-serif';
      ctx.fillText(`👥 ${table.seatingCapacity || 4} GUESTS CAPACITY`, 600, 390);
    }

    // 7. QR Code Frame Box
    const qrBoxSize = 620;
    const qrBoxX = 600 - qrBoxSize / 2;
    const qrBoxY = 425;
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.stroke();

    if (qrCanvas) {
      const qrDrawSize = 540;
      const qrOffset = (qrBoxSize - qrDrawSize) / 2;
      ctx.drawImage(qrCanvas, qrBoxX + qrOffset, qrBoxY + qrOffset, qrDrawSize, qrDrawSize);
    }

    // Corner Brackets
    ctx.lineWidth = 5;
    ctx.strokeStyle = isDark ? accent : primary;
    const brLen = 28;
    ctx.beginPath();
    ctx.moveTo(qrBoxX + 16, qrBoxY + 16 + brLen);
    ctx.lineTo(qrBoxX + 16, qrBoxY + 16);
    ctx.lineTo(qrBoxX + 16 + brLen, qrBoxY + 16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - 16 - brLen, qrBoxY + 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + 16 + brLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(qrBoxX + 16, qrBoxY + qrBoxSize - 16 - brLen);
    ctx.lineTo(qrBoxX + 16, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + 16 + brLen, qrBoxY + qrBoxSize - 16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - 16 - brLen, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + qrBoxSize - 16 - brLen);
    ctx.stroke();

    // Wi-Fi Banner if enabled
    if (config?.showWifi && (config?.wifiSsid || config?.wifiPass)) {
      const wifiBoxW = 560;
      const wifiBoxH = 50;
      const wifiBoxX = 600 - wifiBoxW / 2;
      const wifiBoxY = 1060;
      ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
      drawRoundedRect(wifiBoxX, wifiBoxY, wifiBoxW, wifiBoxH, 12);
      ctx.fill();
      ctx.fillStyle = titleColor;
      ctx.font = '700 20px sans-serif';
      const wifiText = `📶 Free Wi-Fi: ${config.wifiSsid || 'Guest'} ${config.wifiPass ? `• Pass: ${config.wifiPass}` : ''}`;
      ctx.fillText(wifiText, 600, wifiBoxY + 32);
    }

    // 8. Call to Action Heading
    ctx.fillStyle = titleColor;
    ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(config?.ctaTitle || 'SCAN TO BROWSE MENU & ORDER', 600, config?.showWifi ? 1145 : 1100);

    // 9. 3-Step Guide Chips
    if (config?.showInstructions !== false) {
      const stepsY = config?.showWifi ? 1180 : 1140;
      const stepW = 280;
      const stepH = 140;
      const stepGap = 45;
      const startX = 600 - (stepW * 3 + stepGap * 2) / 2;

      const steps = [
        { num: '1', title: config?.step1Title || 'Scan QR', desc: config?.step1Desc || 'with phone camera' },
        { num: '2', title: config?.step2Title || 'Browse Menu', desc: config?.step2Desc || '& customize dishes' },
        { num: '3', title: config?.step3Title || 'Hot Food', desc: config?.step3Desc || 'served to table' }
      ];

      steps.forEach((st, idx) => {
        const sx = startX + idx * (stepW + stepGap);

        ctx.fillStyle = isDark ? '#1e293b' : (isCream ? '#fefae0' : '#f8fafc');
        drawRoundedRect(sx, stepsY, stepW, stepH, 18);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
        ctx.stroke();

        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(sx + stepW / 2, stepsY + 30, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
        ctx.font = '900 16px sans-serif';
        ctx.fillText(st.num, sx + stepW / 2, stepsY + 36);

        ctx.fillStyle = titleColor;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(st.title, sx + stepW / 2, stepsY + 80);

        ctx.fillStyle = subColor;
        ctx.font = '600 16px sans-serif';
        ctx.fillText(st.desc, sx + stepW / 2, stepsY + 110);

        if (idx < 2) {
          ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('➔', sx + stepW + stepGap / 2, stepsY + 75);
        }
      });
    }

    // 10. Card Footer
    ctx.strokeStyle = isDark ? '#1e293b' : '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 1400);
    ctx.lineTo(1080, 1400);
    ctx.stroke();

    ctx.fillStyle = subColor;
    ctx.font = '700 20px sans-serif';
    ctx.fillText(config?.footerNote || '⚡ Fast & Contactless Dining Experience • No App Required', 600, 1445);

    if (config?.showWatermark !== false) {
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = '700 16px sans-serif';
      ctx.fillText(config?.poweredBy || 'Powered by DineviQ Smart Dining', 600, 1485);
    }

    return canvas.toDataURL('image/png');
  };

  // Download High-Resolution 1200x1600 Standee Card PNG
  const downloadTableStandee = (table, config = standeeConfig) => {
    const qrCanvas = document.getElementById(`qr-canvas-${table.tableNumber}`) || document.getElementById(`preview-qr-canvas-${table.tableNumber}`);
    if (!qrCanvas) {
      toast.error('Unable to capture QR code');
      return;
    }

    try {
      const standeeUrl = generateStandeeCardDataUrl(table, config, qrCanvas);
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

  // 1. Direct QRs Print (Minimalist, Ink-Saving, High Scanning Speed Sheet)
  const printDirectQRs = (targetTables = tables) => {
    if (!targetTables || targetTables.length === 0) {
      toast.error('No tables found to print');
      return;
    }

    const chunkArray = (arr, size) => {
      const res = [];
      for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
      return res;
    };

    const pages = chunkArray(targetTables, 4);

    const pagesHtml = pages.map((chunk, pageIndex) => {
      const cardsHtml = chunk.map(t => {
        const canvas = document.getElementById(`qr-canvas-${t.tableNumber}`) || document.getElementById(`preview-qr-canvas-${t.tableNumber}`);
        const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';
        return `
          <div class="direct-card">
            <div class="cut-guide">
              <span>✂ Cut along line</span>
              <span>TABLE ${t.tableNumber}</span>
            </div>
            <div class="direct-inner">
              <div class="direct-badge">TABLE ${t.tableNumber}</div>
              <div class="direct-cap">👥 ${t.seatingCapacity || 4} GUESTS CAPACITY</div>
              <div class="direct-qr-wrap">
                ${qrDataUrl ? `<img src="${qrDataUrl}" class="direct-qr-img" alt="Table ${t.tableNumber} QR" />` : ''}
              </div>
              <div class="direct-cta">SCAN TO DINE-IN & ORDER</div>
              <div class="direct-sub">${(restaurantName || 'THE LANDMARK').toUpperCase()} • CONTACTLESS MENU</div>
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
    <title>${restaurantName} - Direct Table QRs</title>
    <style>
      @page { size: A4 portrait; margin: 10mm 8mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
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
      .print-page.last-page { page-break-after: auto; break-after: auto; }
      .direct-card {
        border: 1px dashed #94a3b8;
        border-radius: 12px;
        padding: 8px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        height: 133mm;
        box-sizing: border-box;
      }
      .cut-guide {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        font-weight: 700;
        color: #94a3b8;
        padding-bottom: 4px;
      }
      .direct-inner {
        flex: 1;
        border: 2px solid #0f172a;
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
      }
      .direct-badge {
        font-size: 24px;
        font-weight: 900;
        color: #ffffff;
        background: #0f172a;
        padding: 6px 28px;
        border-radius: 100px;
        letter-spacing: 1px;
      }
      .direct-cap {
        font-size: 10px;
        font-weight: 700;
        color: #475569;
        margin-top: 2px;
      }
      .direct-qr-wrap {
        padding: 6px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        display: inline-flex;
      }
      .direct-qr-img {
        width: 145px;
        height: 145px;
        display: block;
      }
      .direct-cta {
        font-size: 11px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: 0.5px;
      }
      .direct-sub {
        font-size: 8px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.5px;
      }
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
</html>`;

    executeIframePrint(fullHtml);
  };

  // 2. Customized Standees Print (Full Branded Luxury 2x2 A4 Layout)
  const printCustomizedStands = (targetTables = tables, config = standeeConfig) => {
    if (!targetTables || targetTables.length === 0) {
      toast.error('No tables found to print');
      return;
    }

    const chunkArray = (arr, size) => {
      const res = [];
      for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
      return res;
    };

    const pages = chunkArray(targetTables, 4);
    const primary = config?.primaryColor || '#0f172a';
    const accent = config?.accentColor || '#4f46e5';
    const brandName = config?.restaurantName || restaurantName || 'THE LANDMARK';
    const brandTagline = config?.tagline || 'SMART CONTACTLESS DINING';
    const logoToUse = config?.showLogo && config?.logoUrl ? config.logoUrl : null;
    const prefix = config?.tablePrefix || 'TABLE';

    const pagesHtml = pages.map((chunk, pageIndex) => {
      const cardsHtml = chunk.map(t => {
        const canvas = document.getElementById(`qr-canvas-${t.tableNumber}`) || document.getElementById(`preview-qr-canvas-${t.tableNumber}`);
        const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';
        return `
          <div class="stand-card">
            <div class="cut-guide">
              <span>✂ Cut along border</span>
              <span>${prefix} ${t.tableNumber}</span>
            </div>
            <div class="card-inner" style="border-color: ${primary};">
              <div class="brand-header">
                ${logoToUse ? `<img src="${logoToUse}" class="brand-logo" alt="${brandName}" />` : ''}
                <div class="brand-title" style="color: ${primary};">${brandName.toUpperCase()}</div>
                <div class="brand-subtitle">${brandTagline}</div>
              </div>

              <div class="table-badge-wrap">
                <div class="table-badge" style="background: ${primary};">
                  <span class="badge-prefix">${prefix}</span>
                  <span class="badge-num">${t.tableNumber}</span>
                </div>
                ${config?.showCapacity !== false ? `<div class="capacity-tag">👥 ${t.seatingCapacity || 4} GUESTS CAPACITY</div>` : ''}
              </div>

              <div class="qr-container">
                <div class="bracket top-left" style="border-color: ${primary};"></div>
                <div class="bracket top-right" style="border-color: ${primary};"></div>
                <div class="bracket bottom-left" style="border-color: ${primary};"></div>
                <div class="bracket bottom-right" style="border-color: ${primary};"></div>
                ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-code-img" alt="Table ${t.tableNumber} QR" />` : ''}
              </div>

              ${config?.showInstructions !== false ? `
                <div class="instructions-section">
                  <div class="cta-title" style="color: ${primary};">${config?.ctaTitle || 'SCAN TO BROWSE MENU & ORDER'}</div>
                  <div class="steps-row">
                    <div class="step-card">
                      <span class="step-num" style="background: ${accent};">1</span>
                      <span class="step-txt"><strong>${config?.step1Title || 'Scan QR'}</strong><br/>${config?.step1Desc || 'with camera'}</span>
                    </div>
                    <div class="step-arrow">➔</div>
                    <div class="step-card">
                      <span class="step-num" style="background: ${accent};">2</span>
                      <span class="step-txt"><strong>${config?.step2Title || 'Browse Menu'}</strong><br/>${config?.step2Desc || '& customize'}</span>
                    </div>
                    <div class="step-arrow">➔</div>
                    <div class="step-card">
                      <span class="step-num" style="background: ${accent};">3</span>
                      <span class="step-txt"><strong>${config?.step3Title || 'Food Served'}</strong><br/>${config?.step3Desc || 'hot to table'}</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              <div class="card-footer">
                <span>${config?.footerNote || '⚡ Fast & Contactless Dining • No App Required'}</span>
                ${config?.showWatermark !== false ? `<span class="powered-tag">${config?.poweredBy || 'Powered by DineviQ'}</span>` : ''}
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
    <title>${brandName} - Table QR Standees</title>
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
        color: #cbd5e1;
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
      }
      .bracket.top-left {
        top: -1px; left: -1px;
        border-top: 2.5px solid;
        border-left: 2.5px solid;
        border-top-left-radius: 4px;
      }
      .bracket.top-right {
        top: -1px; right: -1px;
        border-top: 2.5px solid;
        border-right: 2.5px solid;
        border-top-right-radius: 4px;
      }
      .bracket.bottom-left {
        bottom: -1px; left: -1px;
        border-bottom: 2.5px solid;
        border-left: 2.5px solid;
        border-bottom-left-radius: 4px;
      }
      .bracket.bottom-right {
        bottom: -1px; right: -1px;
        border-bottom: 2.5px solid;
        border-right: 2.5px solid;
        border-bottom-right-radius: 4px;
      }
      .instructions-section {
        width: 100%;
        margin-top: 3px;
      }
      .cta-title {
        font-size: 9px;
        font-weight: 900;
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

    executeIframePrint(fullHtml);
  };

  // Backwards compatible alias
  const printTableStands = (targetTables = tables) => {
    printCustomizedStands(targetTables, standeeConfig);
  };

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchesSearch = !searchQuery || String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesSearch;
    });
  }, [tables, searchQuery]);

  const groupedTablesBySection = useMemo(() => {
    const sectionsOrder = [];
    const secSet = new Set();
    tableSections.forEach(s => {
      const trimmed = (s || 'Main Hall').trim();
      if (!secSet.has(trimmed.toLowerCase())) {
        secSet.add(trimmed.toLowerCase());
        sectionsOrder.push(trimmed);
      }
    });

    tables.forEach(t => {
      const s = (t.section || 'Main Hall').trim();
      if (!secSet.has(s.toLowerCase())) {
        secSet.add(s.toLowerCase());
        sectionsOrder.push(s);
      }
    });

    const groups = {};
    sectionsOrder.forEach(s => {
      groups[s] = [];
    });

    filteredTables.forEach(t => {
      const s = (t.section || 'Main Hall').trim();
      const match = sectionsOrder.find(sec => sec.toLowerCase() === s.toLowerCase()) || 'Main Hall';
      if (!groups[match]) {
        groups[match] = [];
        sectionsOrder.push(match);
      }
      groups[match].push(t);
    });

    return { sectionsOrder, groups };
  }, [tableSections, tables, filteredTables]);

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
            onClick={() => setShowPrintChoiceModal(true)}
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
            title="Print Table QR Codes (Direct QR Sheet or Customized Standees)"
          >
            <Printer size={13} /> Print Stands (PDF)
          </button>
          <button
            type="button"
            onClick={() => {
              setEditorPreviewTable(filteredTables[0] || tables[0] || null);
              setShowStandeeEditorModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: '8px',
              border: '1px solid #fed7aa',
              background: '#fff7ed',
              color: '#c2410c',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Open Standee Customizer Studio to customize Company Logo, Colors, Instructions & Layout"
          >
            <Palette size={13} /> Customize Standee
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
            onClick={() => {
              setNewSectionName('');
              setShowAddSectionModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 13px',
              borderRadius: '8px',
              border: '1.5px dashed #4f46e5',
              background: '#eef2ff',
              color: '#4338ca',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Create new category or section"
          >
            <Plus size={14} /> Add Category
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
        .table-qr-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.75rem;
        }
        @media (max-width: 1350px) {
          .table-qr-grid-5 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 1024px) {
          .table-qr-grid-5 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 700px) {
          .table-qr-grid-5 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 480px) {
          .table-qr-grid-5 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Grid of Dynamic Table Cards / Skeleton Loader */}
      {loading && tables.length === 0 ? (
        <div className="table-qr-grid-5">
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groupedTablesBySection.sectionsOrder.map((secName) => {
            const secTables = groupedTablesBySection.groups[secName] || [];

            if (searchQuery.trim() && secTables.length === 0) {
              return null;
            }

            return (
              <div key={secName} style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.65rem',
                  marginBottom: '1rem',
                  borderBottom: '1.5px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: 0,
                      letterSpacing: '-0.01em'
                    }}>
                      {secName}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 9px',
                      borderRadius: '100px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0'
                    }}>
                      {secTables.length} {secTables.length === 1 ? 'Table' : 'Tables'}
                    </span>
                  </div>

                  {secName !== 'Main Hall' && secTables.length === 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSection(secName, e)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title={`Remove empty "${secName}" category`}
                    >
                      <Trash2 size={12} /> Remove Category
                    </button>
                  )}
                </div>

                {secTables.length === 0 ? (
                  <div style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    fontSize: '13px'
                  }}>
                    No tables in <strong>{secName}</strong> yet. Click "+ Add Table" to add tables to this category.
                  </div>
                ) : (
                  <div className="table-qr-grid-5">
                    {secTables.map((table) => {
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
                {/* 1. Header with Table Badge, Section Tag, Edit & Delete Buttons */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <div style={{
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      Table {table.tableNumber}
                    </div>
                    {table.section && table.section !== 'Main Hall' && (
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#4f46e5',
                        background: '#eef2ff',
                        padding: '2px 6px',
                        borderRadius: '100px',
                        border: '1px solid #c7d2fe'
                      }}>
                        {table.section}
                      </span>
                    )}
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

                {/* 2. QR Code Canvas Frame (Full-Sized in Section, Clickable for Preview) */}
                <div
                  onClick={() => setPreviewTable(table)}
                  title="Click to preview full-screen QR & print options"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, #fbfcfe 0%, #f8fafc 100%)',
                    padding: '8px',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    marginBottom: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
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
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                    width: '100%',
                    maxWidth: '165px',
                    aspectRatio: '1 / 1',
                    boxSizing: 'border-box'
                  }}>
                    <QRCodeCanvas
                      id={`qr-canvas-${table.tableNumber}`}
                      value={qrUrl}
                      size={800}
                      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
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

                {/* 4. Actions Footer: Download Dropdown Only (View Removed) */}
                <div className="download-dropdown-wrap" style={{ position: 'relative', width: '100%', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDownloadDropdownId(openDownloadDropdownId === (table._id || table.tableNumber) ? null : (table._id || table.tableNumber));
                    }}
                    title="Download Table QR Code or Standee Card"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Download size={13} color="#2563eb" />
                    <span>Download</span>
                    <ChevronDown size={12} color="#64748b" style={{ marginLeft: 2 }} />
                  </button>

                  {openDownloadDropdownId === (table._id || table.tableNumber) && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        marginBottom: '6px',
                        background: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
                        padding: '5px',
                        zIndex: 90,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          downloadTableQROnly(table.tableNumber);
                          setOpenDownloadDropdownId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <QrCode size={14} color="#0284c7" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#0284c7', fontWeight: 800 }}>Pure QR Code</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#64748b' }}>PNG (1000×1000 HD)</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadTableStandee(table, standeeConfig);
                          setOpenDownloadDropdownId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Palette size={14} color="#6366f1" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#4338ca', fontWeight: 800 }}>Standee Card</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#64748b' }}>Print-Ready 300 DPI</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
                  </div>
                )}
              </div>
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

      {/* ADD CATEGORY / SECTION MODAL */}
      <AnimatePresence>
        {showAddSectionModal && (
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
          }} onClick={() => setShowAddSectionModal(false)}>
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
                Add New Category / Section
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                Create a dining zone or area for your tables (e.g. Rooftop, Terrace, Garden, 1st Floor, VIP Lounge).
              </p>

              <form onSubmit={handleAddSection}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Rooftop, Terrace, Garden, VIP Lounge"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSectionModal(false);
                      setNewSectionName('');
                    }}
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
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Category / Section</label>
                  <select
                    value={newTableSection}
                    onChange={(e) => setNewTableSection(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {allAvailableSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
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

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category / Section *
                  </label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {allAvailableSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Category / Section for Batch</label>
                <select
                  value={batchSection}
                  onChange={(e) => setBatchSection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {allAvailableSections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
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

        {/* ============================================================== */}
        {/* 2. PRINT CHOICE MODAL (Direct QRs Sheet vs Customized Standees) */}
        {/* ============================================================== */}
        {showPrintChoiceModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1rem'
            }}
            onClick={() => setShowPrintChoiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '560px',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#eef2ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                      Print Table QR Codes
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Choose how you want to print {filteredTables.length} tables on A4 sheets
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPrintChoiceModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2 Print Choice Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '20px' }}>
                {/* Print Option 1: Direct QR Sheet */}
                <div
                  onClick={() => {
                    printDirectQRs(filteredTables);
                    setShowPrintChoiceModal(false);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '2px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0284c7';
                    e.currentTarget.style.background = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <QrCode size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        1. Direct QR Codes (Clean Grid)
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '100px' }}>
                        Minimalist • Ink-Saving
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      Prints high-contrast table badges and giant QR codes on clean A4 grids with cut guidelines. Best for acrylic table stands or quick printing.
                    </p>
                  </div>
                </div>

                {/* Print Option 2: Customized Standees */}
                <div
                  onClick={() => {
                    printCustomizedStands(filteredTables, standeeConfig);
                    setShowPrintChoiceModal(false);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '2px solid #c7d2fe',
                    background: '#f8faff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                    e.currentTarget.style.background = '#eef2ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#c7d2fe';
                    e.currentTarget.style.background = '#f8faff';
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Printer size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        2. Customized Branded Standees
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '100px' }}>
                        Full Restaurant Branding
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      Prints luxury 2x2 A4 table standees with company logo, brand color theme, table badges, ordering instructions, and guest capacity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Want to customize before printing?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditorPreviewTable(filteredTables[0] || tables[0] || null);
                    setShowStandeeEditorModal(true);
                    setShowPrintChoiceModal(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fed7aa',
                    background: '#fff7ed',
                    color: '#c2410c',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Palette size={14} /> Open Standee Studio Editor
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. FULL-SCREEN STANDEE & TEMPLATE CUSTOMIZER STUDIO            */}
        {/* ============================================================== */}
        {showStandeeEditorModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: '#090d16',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* STUDIO TOP HEADER BAR */}
            <div style={{
              height: '60px',
              padding: '0 20px',
              background: '#0f172a',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              zIndex: 10
            }}>
              {/* Left Branding */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                      Table Standee & Template Studio
                    </h2>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '2px 8px', borderRadius: '100px' }}>
                      FULL-SCREEN DESIGNER
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
                    Complete layout templates, brand colors, Wi-Fi info & print-ready standees
                  </p>
                </div>
              </div>

              {/* Center Controls: Preview Table Selector & Zoom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', padding: '4px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Preview:</span>
                  <select
                    value={editorPreviewTable?.tableNumber || filteredTables[0]?.tableNumber || tables[0]?.tableNumber || '1'}
                    onChange={(e) => {
                      const sel = tables.find(t => String(t.tableNumber) === String(e.target.value)) || filteredTables.find(t => String(t.tableNumber) === String(e.target.value));
                      if (sel) setEditorPreviewTable(sel);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {(filteredTables.length > 0 ? filteredTables : tables).map(t => (
                      <option key={t._id || t.tableNumber} value={t.tableNumber} style={{ background: '#0f172a', color: '#ffffff' }}>
                        Table {t.tableNumber} ({t.seatingCapacity || 4} Guests)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e293b', padding: '3px 6px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'flex' }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', minWidth: '36px', textAlign: 'center' }}>
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'flex' }}
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const def = getDefaultStandeeConfig(restaurantName, restaurantLogo);
                    setStandeeConfig(def);
                    toast.success('Reset template to standard default');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#94a3b8',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Reset to Factory Defaults"
                >
                  <RotateCcw size={12} /> Reset
                </button>

                <button
                  type="button"
                  onClick={() => saveStandeeConfig(standeeConfig)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Check size={14} /> Save Design
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const prevT = editorPreviewTable || filteredTables[0] || tables[0];
                    if (prevT) downloadTableStandee(prevT, standeeConfig);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <Download size={14} /> Download Standee
                </button>

                <button
                  type="button"
                  onClick={() => printCustomizedStands(filteredTables, standeeConfig)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 15px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <Printer size={14} /> Print PDF
                </button>

                <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 4px' }} />

                <button
                  type="button"
                  onClick={() => setShowStandeeEditorModal(false)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Close Studio (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* STUDIO WORKSPACE (Split Left Studio Sidebar & Right Large Canvas) */}
            <div style={{
              flex: 1,
              display: 'flex',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {/* LEFT STUDIO SIDEBAR */}
              <div style={{
                width: '460px',
                minWidth: '420px',
                maxWidth: '500px',
                background: '#ffffff',
                borderRight: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
              }}>
                {/* 6 Studio Navigation Tabs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '6px',
                  gap: 4
                }}>
                  {[
                    { id: 'templates', label: 'Templates', icon: Layers },
                    { id: 'branding', label: 'Brand', icon: ImageIcon },
                    { id: 'theme', label: 'Colors', icon: Palette },
                    { id: 'layout', label: 'Badge', icon: Sliders },
                    { id: 'instructions', label: 'Steps', icon: FileText },
                    { id: 'footer', label: 'Footer', icon: CheckCircle2 }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = editorActiveTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEditorActiveTab(tab.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          padding: '6px 2px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isActive ? '#0f172a' : 'transparent',
                          color: isActive ? '#ffffff' : '#64748b',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={14} color={isActive ? '#ffffff' : '#64748b'} />
                        <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 700 }}>
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Forms Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  {/* ============================================================== */}
                  {/* TAB 0: TEMPLATES (Complete Ready-Made Layout Templates)       */}
                  {/* ============================================================== */}
                  {editorActiveTab === 'templates' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          Choose Complete Template Layout
                        </h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                          Select a professionally curated standee design. Colors and branding adapt automatically.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {STAND_TEMPLATES.map(tpl => {
                          const isSelected = (standeeConfig.templateId || 'acrylic') === tpl.id;
                          return (
                            <div
                              key={tpl.id}
                              onClick={() => {
                                setStandeeConfig(prev => ({
                                  ...prev,
                                  templateId: tpl.id,
                                  badgeStyle: tpl.badgeStyle,
                                  bgStyle: tpl.bgStyle,
                                  cardBorder: tpl.cardBorder,
                                  cornerRadius: tpl.cornerRadius,
                                  primaryColor: tpl.primaryColor,
                                  accentColor: tpl.accentColor
                                }));
                                toast.success(`Applied "${tpl.name}" Template`);
                              }}
                              style={{
                                padding: '14px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                                background: isSelected ? '#eff6ff' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12
                              }}
                            >
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: tpl.bgStyle === 'dark' ? '#0f172a' : (tpl.bgStyle === 'cream' ? '#fef3c7' : '#f1f5f9'),
                                border: `2px solid ${tpl.primaryColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <QrCode size={18} color={tpl.primaryColor} />
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                  <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                                    {tpl.name}
                                  </span>
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: '100px',
                                    background: isSelected ? '#2563eb' : '#f1f5f9',
                                    color: isSelected ? '#ffffff' : '#64748b'
                                  }}>
                                    {tpl.tag}
                                  </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                  {tpl.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* TAB 1: BRANDING & LOGO                                        */}
                  {/* ============================================================== */}
                  {editorActiveTab === 'branding' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Restaurant / Brand Name *
                        </label>
                        <input
                          type="text"
                          value={standeeConfig.restaurantName}
                          onChange={(e) => setStandeeConfig(prev => ({ ...prev, restaurantName: e.target.value }))}
                          placeholder="e.g. The Landmark"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            fontWeight: 700,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Tagline / Subtitle
                        </label>
                        <input
                          type="text"
                          value={standeeConfig.tagline}
                          onChange={(e) => setStandeeConfig(prev => ({ ...prev, tagline: e.target.value }))}
                          placeholder="e.g. SMART CONTACTLESS DINING"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Logo Switcher & URL */}
                      <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Show Brand Logo
                          </label>
                          <input
                            type="checkbox"
                            checked={standeeConfig.showLogo}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, showLogo: e.target.checked }))}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </div>

                        {standeeConfig.showLogo && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                Logo Image URL
                              </label>
                              <input
                                type="url"
                                value={standeeConfig.logoUrl}
                                onChange={(e) => setStandeeConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder="https://..."
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '12px',
                                  outline: 'none',
                                  background: '#ffffff',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            {restaurantLogo && restaurantLogo !== standeeConfig.logoUrl && (
                              <button
                                type="button"
                                onClick={() => setStandeeConfig(prev => ({ ...prev, logoUrl: restaurantLogo }))}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px dashed #2563eb',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Sparkles size={12} /> Use Cafe Profile Logo
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* TAB 2: COLORS, THEME & BACKGROUND                             */}
                  {/* ============================================================== */}
                  {editorActiveTab === 'theme' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {/* Theme Palettes */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                          Brand Color Presets
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {THEME_PRESETS.map(preset => {
                            const isSelected = standeeConfig.primaryColor === preset.primary && standeeConfig.accentColor === preset.accent;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setStandeeConfig(prev => ({
                                  ...prev,
                                  primaryColor: preset.primary,
                                  accentColor: preset.accent
                                }))}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                  background: isSelected ? '#eff6ff' : '#ffffff',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.primary }} />
                                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.accent }} />
                                </div>
                                <span style={{ fontSize: '11.5px', fontWeight: isSelected ? 800 : 700, color: '#0f172a' }}>
                                  {preset.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Colors */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                            Primary Color
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="color"
                              value={standeeConfig.primaryColor || '#0f172a'}
                              onChange={(e) => setStandeeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                              style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: 0 }}
                            />
                            <input
                              type="text"
                              value={standeeConfig.primaryColor}
                              onChange={(e) => setStandeeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                              style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                            Accent Highlight
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="color"
                              value={standeeConfig.accentColor || '#4f46e5'}
                              onChange={(e) => setStandeeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                              style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: 0 }}
                            />
                            <input
                              type="text"
                              value={standeeConfig.accentColor}
                              onChange={(e) => setStandeeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                              style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Standee Background Style */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                          Standee Background Tone
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {[
                            { id: 'white', label: 'Pure White', bg: '#ffffff', border: '#e2e8f0' },
                            { id: 'cream', label: 'Warm Cream', bg: '#fffdf5', border: '#fef08a' },
                            { id: 'dark', label: 'Midnight Dark', bg: '#0f172a', border: '#334155', textLight: true }
                          ].map(bg => {
                            const isSel = (standeeConfig.bgStyle || 'white') === bg.id;
                            return (
                              <button
                                key={bg.id}
                                type="button"
                                onClick={() => setStandeeConfig(prev => ({ ...prev, bgStyle: bg.id }))}
                                style={{
                                  padding: '10px 8px',
                                  borderRadius: '8px',
                                  border: isSel ? '2px solid #2563eb' : `1px solid ${bg.border}`,
                                  background: bg.bg,
                                  color: bg.textLight ? '#ffffff' : '#0f172a',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  textAlign: 'center'
                                }}
                              >
                                {bg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Border & Corners */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                            Border Style
                          </label>
                          <select
                            value={standeeConfig.cardBorder || 'double'}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, cardBorder: e.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                          >
                            <option value="double">Double Framed</option>
                            <option value="solid">Solid Bold</option>
                            <option value="thin">Thin Minimal</option>
                            <option value="gold">Gold Luxury</option>
                            <option value="none">Borderless</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                            Corner Radius
                          </label>
                          <select
                            value={standeeConfig.cornerRadius || 'rounded'}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, cornerRadius: e.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                          >
                            <option value="rounded">Smooth (20px)</option>
                            <option value="pill">Pill Shape (32px)</option>
                            <option value="sharp">Sharp (8px)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* TAB 3: TABLE BADGE & QR LAYOUT                                */}
                  {/* ============================================================== */}
                  {editorActiveTab === 'layout' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Table Prefix
                        </label>
                        <input
                          type="text"
                          value={standeeConfig.tablePrefix || 'TABLE'}
                          onChange={(e) => setStandeeConfig(prev => ({ ...prev, tablePrefix: e.target.value }))}
                          placeholder="e.g. TABLE, NO., TBL, ZONE"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            fontWeight: 700,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Badge Shape Style */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                          Table Badge Style
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {[
                            { id: 'capsule', label: 'Capsule Pill' },
                            { id: 'ribbon', label: 'Ribbon Banner' },
                            { id: 'minimal', label: 'Minimalist Outline' },
                            { id: 'large', label: 'Giant Number' }
                          ].map(badge => {
                            const isSel = (standeeConfig.badgeStyle || 'capsule') === badge.id;
                            return (
                              <button
                                key={badge.id}
                                type="button"
                                onClick={() => setStandeeConfig(prev => ({ ...prev, badgeStyle: badge.id }))}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: isSel ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                  background: isSel ? '#eff6ff' : '#ffffff',
                                  color: isSel ? '#1d4ed8' : '#0f172a',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {badge.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Show Seating Capacity</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Displays "👥 4 GUESTS CAPACITY" on standee</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={standeeConfig.showCapacity !== false}
                          onChange={(e) => setStandeeConfig(prev => ({ ...prev, showCapacity: e.target.checked }))}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* TAB 4: INSTRUCTIONS & CAFE WI-FI                               */}
                  {/* ============================================================== */}
                  {editorActiveTab === 'instructions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Scan Steps Toggle */}
                      <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                              3-Step Scan Instructions
                            </span>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                              Guides guests to scan, choose items & order
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={standeeConfig.showInstructions !== false}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, showInstructions: e.target.checked }))}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </div>

                        {standeeConfig.showInstructions !== false && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                Call to Action Headline
                              </label>
                              <input
                                type="text"
                                value={standeeConfig.ctaTitle}
                                onChange={(e) => setStandeeConfig(prev => ({ ...prev, ctaTitle: e.target.value }))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, boxSizing: 'border-box' }}
                              />
                            </div>

                            {/* Step 1 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>STEP 1 TITLE</label>
                                <input
                                  type="text"
                                  value={standeeConfig.step1Title}
                                  onChange={(e) => setStandeeConfig(prev => ({ ...prev, step1Title: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: 2 }}>STEP 1 DESC</label>
                                <input
                                  type="text"
                                  value={standeeConfig.step1Desc}
                                  onChange={(e) => setStandeeConfig(prev => ({ ...prev, step1Desc: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>STEP 2 TITLE</label>
                                <input
                                  type="text"
                                  value={standeeConfig.step2Title}
                                  onChange={(e) => setStandeeConfig(prev => ({ ...prev, step2Title: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: 2 }}>STEP 2 DESC</label>
                                <input
                                  type="text"
                                  value={standeeConfig.step2Desc}
                                  onChange={(e) => setStandeeConfig(prev => ({ ...prev, step2Desc: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>STEP 3 TITLE</label>
                                <input
                                  type="text"
                                  value={standeeConfig.step3Title}
                                  onChange={(e) => setStandeeConfig(prev => ({ ...prev, step3Title: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: 2 }}>STEP 3 DESC</label>
                                <input
                                  type="text"
                                  value={standeeConfig.step3Desc}
                                  onChange={(e) => setStandeeConfig(prev => ({ ...prev, step3Desc: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Optional Cafe Wi-Fi Callout */}
                      <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                              Include Free Wi-Fi Callout
                            </span>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                              Prints Wi-Fi network and password right on standee
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={standeeConfig.showWifi === true}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, showWifi: e.target.checked }))}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </div>

                        {standeeConfig.showWifi && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                Wi-Fi Name (SSID)
                              </label>
                              <input
                                type="text"
                                value={standeeConfig.wifiSsid || ''}
                                onChange={(e) => setStandeeConfig(prev => ({ ...prev, wifiSsid: e.target.value }))}
                                placeholder="e.g. Landmark_Guest"
                                style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                Wi-Fi Password
                              </label>
                              <input
                                type="text"
                                value={standeeConfig.wifiPass || ''}
                                onChange={(e) => setStandeeConfig(prev => ({ ...prev, wifiPass: e.target.value }))}
                                placeholder="e.g. welcome@123"
                                style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* TAB 5: FOOTER & WATERMARK                                     */}
                  {/* ============================================================== */}
                  {editorActiveTab === 'footer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Standee Footer Note
                        </label>
                        <input
                          type="text"
                          value={standeeConfig.footerNote}
                          onChange={(e) => setStandeeConfig(prev => ({ ...prev, footerNote: e.target.value }))}
                          placeholder="e.g. ⚡ Fast & Contactless Dining • No App Required"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12.5px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            Show Powered By Watermark
                          </span>
                          <input
                            type="checkbox"
                            checked={standeeConfig.showWatermark !== false}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, showWatermark: e.target.checked }))}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </div>

                        {standeeConfig.showWatermark !== false && (
                          <input
                            type="text"
                            value={standeeConfig.poweredBy}
                            onChange={(e) => setStandeeConfig(prev => ({ ...prev, poweredBy: e.target.value }))}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT LARGE WORKBENCH LIVE PREVIEW */}
              <div style={{
                flex: 1,
                background: '#090d16',
                backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                overflow: 'auto',
                position: 'relative'
              }}>
                {/* Scaled Preview Standee Card */}
                {(() => {
                  const prevT = editorPreviewTable || filteredTables[0] || tables[0] || { tableNumber: 1, seatingCapacity: 4 };
                  const isDark = standeeConfig.bgStyle === 'dark' || standeeConfig.templateId === 'dark';
                  const isCream = standeeConfig.bgStyle === 'cream' || standeeConfig.templateId === 'warm';

                  const cardBg = isDark ? '#0f172a' : (isCream ? '#fffdf5' : '#ffffff');
                  const primary = standeeConfig.primaryColor || (isDark ? '#f59e0b' : '#0f172a');
                  const accent = standeeConfig.accentColor || (isDark ? '#fbbf24' : '#4f46e5');
                  const titleColor = isDark ? '#ffffff' : (isCream ? '#451a03' : primary);
                  const subColor = isDark ? '#94a3b8' : (isCream ? '#78350f' : '#64748b');
                  const borderCol = isDark ? (standeeConfig.cardBorder === 'gold' ? '#f59e0b' : '#334155') : (isCream ? '#d97706' : primary);

                  const radiusVal = standeeConfig.cornerRadius === 'sharp' ? '8px' : (standeeConfig.cornerRadius === 'pill' ? '28px' : '18px');

                  return (
                    <div
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease',
                        width: '320px',
                        background: cardBg,
                        borderRadius: radiusVal,
                        border: `3px solid ${borderCol}`,
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        padding: '18px 16px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        flexShrink: 0
                      }}
                    >
                      {/* Logo & Header */}
                      <div style={{ marginBottom: 8, width: '100%' }}>
                        {standeeConfig.showLogo && standeeConfig.logoUrl && (
                          <img
                            src={standeeConfig.logoUrl}
                            alt="Logo"
                            style={{ maxHeight: '26px', maxWidth: '120px', objectFit: 'contain', marginBottom: 4 }}
                          />
                        )}
                        <div style={{ fontSize: '13px', fontWeight: 900, color: titleColor, letterSpacing: '0.8px', lineHeight: 1.15 }}>
                          {(standeeConfig.restaurantName || 'THE LANDMARK').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '7.5px', fontWeight: 700, color: subColor, letterSpacing: '0.8px', marginTop: 2 }}>
                          {standeeConfig.tagline}
                        </div>
                        <div style={{ width: '45px', height: '2px', background: accent, margin: '6px auto 0' }} />
                      </div>

                      {/* Table Identifier Badge */}
                      {standeeConfig.badgeStyle === 'ribbon' ? (
                        <div style={{
                          width: '100%',
                          background: primary,
                          color: isDark ? '#0f172a' : '#ffffff',
                          padding: '4px 0',
                          fontSize: '13px',
                          fontWeight: 900,
                          letterSpacing: '0.5px',
                          marginBottom: 6
                        }}>
                          {standeeConfig.tablePrefix || 'TABLE'} {prevT.tableNumber}
                        </div>
                      ) : standeeConfig.badgeStyle === 'large' ? (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: accent }}>{standeeConfig.tablePrefix || 'TABLE'}</div>
                          <div style={{ fontSize: '24px', fontWeight: 900, color: titleColor, lineHeight: 1 }}>{prevT.tableNumber}</div>
                        </div>
                      ) : standeeConfig.badgeStyle === 'minimal' ? (
                        <div style={{
                          border: `1.5px solid ${accent}`,
                          padding: '2px 14px',
                          borderRadius: '100px',
                          marginBottom: 6,
                          fontSize: '11px',
                          fontWeight: 800,
                          color: titleColor
                        }}>
                          {standeeConfig.tablePrefix || 'TABLE'} {prevT.tableNumber}
                        </div>
                      ) : (
                        <div style={{
                          background: primary,
                          color: isDark ? '#0f172a' : '#ffffff',
                          padding: '3px 16px',
                          borderRadius: '100px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          marginBottom: 6
                        }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', opacity: 0.85 }}>
                            {standeeConfig.tablePrefix || 'TABLE'}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 900 }}>
                            {prevT.tableNumber}
                          </span>
                        </div>
                      )}

                      {standeeConfig.showCapacity !== false && (
                        <div style={{ fontSize: '7.5px', fontWeight: 700, color: subColor, marginBottom: 8 }}>
                          👥 {prevT.seatingCapacity || 4} GUESTS CAPACITY
                        </div>
                      )}

                      {/* High-Res QR Box */}
                      <div style={{
                        width: '170px',
                        height: '170px',
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '10px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10
                      }}>
                        {/* Brackets */}
                        <div style={{ position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderTop: `2.5px solid ${isDark ? accent : primary}`, borderLeft: `2.5px solid ${isDark ? accent : primary}` }} />
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderTop: `2.5px solid ${isDark ? accent : primary}`, borderRight: `2.5px solid ${isDark ? accent : primary}` }} />
                        <div style={{ position: 'absolute', bottom: 6, left: 6, width: 8, height: 8, borderBottom: `2.5px solid ${isDark ? accent : primary}`, borderLeft: `2.5px solid ${isDark ? accent : primary}` }} />
                        <div style={{ position: 'absolute', bottom: 6, right: 6, width: 8, height: 8, borderBottom: `2.5px solid ${isDark ? accent : primary}`, borderRight: `2.5px solid ${isDark ? accent : primary}` }} />

                        <QRCodeCanvas
                          id={`preview-qr-canvas-${prevT.tableNumber}`}
                          value={getTableQRUrl(prevT.tableNumber)}
                          size={150}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {/* Wi-Fi callout if enabled */}
                      {standeeConfig.showWifi && (standeeConfig.wifiSsid || standeeConfig.wifiPass) && (
                        <div style={{
                          width: '100%',
                          background: isDark ? '#1e293b' : '#f1f5f9',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          marginBottom: 8,
                          fontSize: '8px',
                          fontWeight: 700,
                          color: titleColor
                        }}>
                          📶 Wi-Fi: <strong>{standeeConfig.wifiSsid || 'Guest'}</strong> {standeeConfig.wifiPass ? `• Pass: ${standeeConfig.wifiPass}` : ''}
                        </div>
                      )}

                      {/* Instructions */}
                      {standeeConfig.showInstructions !== false && (
                        <div style={{ width: '100%', marginBottom: 10 }}>
                          <div style={{ fontSize: '8.5px', fontWeight: 800, color: titleColor, letterSpacing: '0.4px', marginBottom: 6 }}>
                            {standeeConfig.ctaTitle || 'SCAN TO BROWSE MENU & ORDER'}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                            {[
                              { num: '1', t: standeeConfig.step1Title, d: standeeConfig.step1Desc },
                              { num: '2', t: standeeConfig.step2Title, d: standeeConfig.step2Desc },
                              { num: '3', t: standeeConfig.step3Title, d: standeeConfig.step3Desc }
                            ].map(s => (
                              <div key={s.num} style={{ background: isDark ? '#1e293b' : (isCream ? '#fefae0' : '#f8fafc'), padding: '5px 2px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: accent, color: isDark ? '#0f172a' : '#ffffff', fontSize: '7.5px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                                  {s.num}
                                </span>
                                <div style={{ fontSize: '7px', color: titleColor, fontWeight: 700 }}>{s.t}</div>
                                <div style={{ fontSize: '5.5px', color: subColor }}>{s.d}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Note & Watermark */}
                      <div style={{ width: '100%', borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 2, fontSize: '6.5px', color: subColor }}>
                        <span>{standeeConfig.footerNote}</span>
                        {standeeConfig.showWatermark !== false && (
                          <span style={{ fontWeight: 800, opacity: 0.8 }}>{standeeConfig.poweredBy}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Floating bottom indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid #334155',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Sparkles size={12} color="#38bdf8" />
                  <span>Real-time Studio Preview • Changes automatically reflect on download & print</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
};
export default QRCodeComponent;
