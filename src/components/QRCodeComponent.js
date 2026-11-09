import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Download, Trash2, Edit3, QrCode, RefreshCw, Users, Check, AlertCircle, Sparkles, Search, Layers, Wifi, Smartphone, Globe, Copy, ExternalLink, Coffee, Eye, Printer, X, Palette, Image as ImageIcon, Sliders, RotateCcw, Upload, CheckCircle2, FileText, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const STAND_TEMPLATES = [
  {
    id: 'food-acrylic',
    name: '1. Fresh Food Acrylic Stand',
    tag: 'POPULAR',
    desc: 'Appetizing top food banner, crisp central QR, and vibrant curved banner with phone scan arrows',
    previewImg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    primaryColor: '#15803d',
    accentColor: '#22c55e',
    bgStyle: 'white',
    cardBorder: 'solid',
    cornerRadius: 'rounded',
    ctaTitle: 'VIEW OUR MENU ON YOUR PHONE!'
  },
  {
    id: 'luxury-gold',
    name: '2. Royal Gold & Dark Dining',
    tag: 'FINE DINE',
    desc: 'Moody candlelight ambience with double gold hairline borders, cursive script Menu and gold logo frame',
    previewImg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    primaryColor: '#d4af37',
    accentColor: '#f59e0b',
    bgStyle: 'dark',
    cardBorder: 'gold',
    cornerRadius: 'sharp',
    ctaTitle: 'FOR A CONTACTLESS MENU, SCAN QR CODE'
  },
  {
    id: 'green-tent',
    name: '3. Artisan Green',
    tag: 'CAFE TENT',
    desc: 'Forest olive green tent heading with star accents ✦ VIEW OUR MENU ✦ and fresh brunch food base',
    previewImg: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    primaryColor: '#1b4332',
    accentColor: '#40916c',
    bgStyle: 'cream',
    cardBorder: 'thin',
    cornerRadius: 'rounded',
    ctaTitle: '✦ VIEW OUR MENU ✦'
  },
  {
    id: 'gourmet-arch',
    name: '4. Gourmet Arched Stand',
    tag: 'GOURMET',
    desc: 'Arched navy blue card with warm amber trim, circular dish badge, bold MENU header and Scan Me base',
    previewImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    primaryColor: '#17203d',
    accentColor: '#f59e0b',
    bgStyle: 'white',
    cardBorder: 'double',
    cornerRadius: 'pill',
    ctaTitle: 'SCAN ME'
  },
  {
    id: 'craft-splatter',
    name: '5. Modern Barista Splatter',
    tag: 'ARTISAN',
    desc: 'Artisanal warm kraft background with organic modern coffee blobs, paint strokes, and clean QR frame',
    previewImg: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    primaryColor: '#451a03',
    accentColor: '#d97706',
    bgStyle: 'cream',
    cardBorder: 'none',
    cornerRadius: 'rounded',
    ctaTitle: 'SCAN TO ORDER & PAY'
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
  templateId: 'food-acrylic',
  restaurantName: resName || 'The Landmark',
  tagline: 'SMART CONTACTLESS DINING',
  logoUrl: resLogo || '',
  showLogo: !!resLogo,
  tablePrefix: 'T',
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

// Smart table name formatter
// Clean table number into "T X" (e.g. "T 1", "T 01", "T M1")
const formatTableBadge = (tableNum) => {
  if (tableNum === null || tableNum === undefined || tableNum === '') return 'T 1';
  let str = String(tableNum).trim();
  str = str.replace(/^table[\s-_]*/i, '').trim();
  return `T ${str}`;
};

const formatTableName = (num) => {
  return formatTableBadge(num);
};

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
    } catch (e) { }
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
    } catch (e) { }
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
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editingSectionOldName, setEditingSectionOldName] = useState('');
  const [editingSectionNewName, setEditingSectionNewName] = useState('');

  const handleSaveEditSection = async (e) => {
    if (e) e.preventDefault();
    const clean = editingSectionNewName.trim();
    if (!clean) {
      toast.error('Category name cannot be empty');
      return;
    }
    if (clean.toLowerCase() === editingSectionOldName.toLowerCase()) {
      setShowEditSectionModal(false);
      return;
    }
    if (tableSections.some(s => s.toLowerCase() === clean.toLowerCase() && s.toLowerCase() !== editingSectionOldName.toLowerCase())) {
      toast.error(`Category "${clean}" already exists`);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update tableSections in localStorage and state
      const updatedSections = tableSections.map(s => s.toLowerCase() === editingSectionOldName.toLowerCase() ? clean : s);
      if (!updatedSections.some(s => s.toLowerCase() === clean.toLowerCase())) {
        updatedSections.push(clean);
      }
      saveSections(updatedSections);

      // 2. Update affected tables on backend
      const affectedTables = tables.filter(t => (t.section || 'Main Hall').toLowerCase() === editingSectionOldName.toLowerCase());
      const token = localStorage.getItem('token');

      await Promise.all(affectedTables.map(t => {
        if (t._id && !t._id.startsWith('tbl_')) {
          return axios.put(`${API}/tables/${t._id}`, {
            tableNumber: t.tableNumber,
            section: clean,
            seatingCapacity: t.seatingCapacity || 4
          }, {
            headers: { 'x-auth-token': token }
          }).catch(err => console.error('Error updating table section:', t.tableNumber, err));
        }
        return Promise.resolve();
      }));

      // 3. Update frontend state
      setTables(prev => prev.map(t => (t.section || 'Main Hall').toLowerCase() === editingSectionOldName.toLowerCase() ? { ...t, section: clean } : t));

      if (selectedSection.toLowerCase() === editingSectionOldName.toLowerCase()) {
        setSelectedSection(clean);
      }

      toast.success(`Category renamed to "${clean}"`);
      setShowEditSectionModal(false);
    } catch (err) {
      console.error('Error renaming category:', err);
      toast.error('Failed to rename category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveSections = (newSecs) => {
    setTableSections(newSecs);
    try {
      localStorage.setItem(`serivq_table_sections_${effectiveTenantId}`, JSON.stringify(newSecs));
    } catch (e) { }
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
    } catch (e) { }
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
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
        } catch (e) { }
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
    canvas.height = 1800;
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

    const currentTplId = config?.templateId || 'food-acrylic';
    const primary = config?.primaryColor || '#15803d';
    const accent = config?.accentColor || '#22c55e';
    const brandName = config?.restaurantName || restaurantName || 'The Landmark';
    const tableText = formatTableBadge(table.tableNumber);

    // ----------------------------------------------------
    // TEMPLATE 1: FRESH FOOD ACRYLIC STAND (80% QR / 20% REST)
    // ----------------------------------------------------
    if (currentTplId === 'food-acrylic' || currentTplId === 'acrylic') {
      // 1. Base card
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1800);

      // Acrylic border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#e2e8f0';
      drawRoundedRect(35, 35, 1130, 1730, 48);
      ctx.stroke();

      // Top Food Graphic Header (y = 35 to 220)
      const grad = ctx.createLinearGradient(0, 35, 0, 220);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#292524');
      grad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(83, 35);
      ctx.lineTo(1117, 35);
      ctx.quadraticCurveTo(1165, 35, 1165, 83);
      ctx.lineTo(1165, 220);
      ctx.lineTo(35, 220);
      ctx.lineTo(35, 83);
      ctx.quadraticCurveTo(35, 35, 83, 35);
      ctx.closePath();
      ctx.fill();

      // Top Header Brand & Table Badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const dispBrand = brandName.length > 20 ? brandName.slice(0, 18) + '...' : brandName;
      ctx.fillText(dispBrand.toUpperCase(), 75, 120);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '700 24px system-ui, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('CONTACTLESS DINING', 75, 170);

      // Table Badge on right
      ctx.fillStyle = primary;
      drawRoundedRect(840, 80, 280, 80, 40);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tableText, 980, 134);

      // Central Square QR Container (Perfect Square: NO GAP)
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(110, 395, 980, 980, 36);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f1f5f9';
      ctx.stroke();

      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 140, 425, 920, 920);
      }

      // Bottom Curved Banner (~10% height)
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.moveTo(35, 1610);
      ctx.quadraticCurveTo(600, 1565, 1165, 1610);
      ctx.lineTo(1165, 1717);
      ctx.quadraticCurveTo(1165, 1765, 1117, 1765);
      ctx.lineTo(83, 1765);
      ctx.quadraticCurveTo(35, 1765, 35, 1717);
      ctx.closePath();
      ctx.fill();

      // Bottom curved text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const cta = config?.ctaTitle || 'VIEW OUR MENU ON YOUR PHONE!';
      ctx.fillText(`↶  ${cta}  ↷`, 600, 1665);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.font = '600 24px system-ui, sans-serif';
      ctx.fillText('Open camera & scan QR code to order', 600, 1710);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '800 20px system-ui, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('• DINVIQ •', 600, 1745);

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // TEMPLATE 2: ROYAL GOLD & DARK DINING (80% QR / 20% REST)
    // ----------------------------------------------------
    if (currentTplId === 'luxury-gold' || currentTplId === 'dark') {
      const gold = primary || '#d4af37';

      // 1. Dark Luxury Gradient BG
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1800);
      bgGrad.addColorStop(0, '#18181b');
      bgGrad.addColorStop(0.5, '#0d0d11');
      bgGrad.addColorStop(1, '#08080a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 1800);

      // Outer Double Gold Borders
      ctx.lineWidth = 5;
      ctx.strokeStyle = gold;
      drawRoundedRect(35, 35, 1130, 1730, 18);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = gold + '66';
      drawRoundedRect(50, 50, 1100, 1700, 12);
      ctx.stroke();

      // Cursive Script "Menu" + Table Capsule (~10% height)
      ctx.fillStyle = gold;
      ctx.font = 'italic 86px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText('Menu', 90, 145);

      // Table capsule
      ctx.strokeStyle = gold;
      ctx.lineWidth = 3;
      drawRoundedRect(840, 85, 280, 72, 36);
      ctx.stroke();
      ctx.fillStyle = gold;
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tableText, 980, 134);

      // Subtle gold divider
      ctx.strokeStyle = gold + '44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 190);
      ctx.lineTo(1130, 190);
      ctx.stroke();

      // Dominant Central QR Code Container with gold border (Perfect Square: NO GAP)
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(110, 365, 980, 980, 32);
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = gold;
      ctx.stroke();

      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 140, 395, 920, 920);
      }

      // Bottom dashed box (~10% height)
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 10]);
      ctx.strokeStyle = gold;
      drawRoundedRect(220, 1510, 760, 72, 14);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = gold;
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const dispBrand = brandName.length > 20 ? brandName.slice(0, 18) + '...' : brandName;
      ctx.fillText(`${dispBrand.toUpperCase()} • SCAN QR`, 600, 1557);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('FAST & CONTACTLESS LUXURY DINING', 600, 1630);

      ctx.fillStyle = gold;
      ctx.font = '800 20px system-ui, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('• DINVIQ •', 600, 1695);

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // TEMPLATE 3: ARTISAN GREEN TABLE TENT (80% QR / 20% REST)
    // ----------------------------------------------------
    if (currentTplId === 'green-tent') {
      const green = primary || '#1b4332';

      // 1. Full Forest Green Background
      ctx.fillStyle = green;
      ctx.fillRect(0, 0, 1200, 1800);

      // Top Green Tent Portion (~10% height)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.letterSpacing = '3px';
      ctx.fillText('✦ VIEW MENU ✦', 80, 140);

      // Table Pill on Right (Translucent white)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      drawRoundedRect(860, 85, 260, 70, 35);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tableText, 990, 133);

      // Dominant QR Card inside Green Tent (Perfect Square: NO GAP)
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(110, 400, 980, 980, 42);
      ctx.fill();

      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 140, 430, 920, 920);
      }

      // Bottom Brunch Food Graphic section (Rich dark organic photo bar)
      const bGrad = ctx.createLinearGradient(0, 1590, 0, 1800);
      bGrad.addColorStop(0, 'rgba(20, 50, 38, 0.9)');
      bGrad.addColorStop(1, 'rgba(10, 25, 18, 0.98)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 1590, 1200, 210);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 1590, 1200, 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '1px';
      ctx.fillText('Fresh Daily • Scan with Camera to Order', 600, 1680);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('• DINVIQ •', 600, 1735);

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // TEMPLATE 4: GOURMET ARCHED STAND (80% QR / 20% REST)
    // ----------------------------------------------------
    if (currentTplId === 'gourmet-arch') {
      const archColor = primary || '#17203d';
      const trimColor = accent || '#f59e0b';

      // Base White Card
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1800);

      // Outer Rounded Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#e2e8f0';
      drawRoundedRect(35, 25, 1130, 1750, 52);
      ctx.stroke();

      // Top Ribbon & MENU Title (~10% height)
      ctx.fillStyle = archColor;
      drawRoundedRect(60, 45, 420, 68, 10);
      ctx.fill();
      ctx.fillStyle = trimColor;
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const displayBrand = brandName.length > 20 ? brandName.slice(0, 18) + '...' : brandName;
      ctx.fillText(`★ ${displayBrand} ★`, 270, 88);

      // Bold MENU Title
      ctx.fillStyle = archColor;
      ctx.font = '900 68px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MENU', 520, 102);

      // Table Capsule
      ctx.fillStyle = trimColor;
      drawRoundedRect(860, 45, 280, 68, 34);
      ctx.fill();
      ctx.fillStyle = archColor;
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tableText, 1000, 91);

      // Arched Body Framing QR Code
      ctx.fillStyle = archColor;
      drawRoundedRect(60, 145, 1080, 1600, 80);
      ctx.fill();

      // Amber Trim
      ctx.lineWidth = 10;
      ctx.strokeStyle = trimColor;
      drawRoundedRect(60, 145, 1080, 1600, 80);
      ctx.stroke();

      // Dominant QR Code inside Arch (PERFECT SQUARE: TIGHT 30px PADDING, ZERO GAP)
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(110, 220, 980, 980, 36);
      ctx.fill();

      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 140, 250, 920, 920);
      }

      // Bottom "Scan Me" on rich navy background (~10% height)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const archCta = config?.ctaTitle || 'SCAN ME';
      ctx.fillText(`${archCta}  •  ${tableText}`, 600, 1380);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.font = '600 28px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('FAST & CONTACTLESS ORDERING', 600, 1460);

      ctx.fillStyle = trimColor;
      ctx.font = '800 24px system-ui, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('• DINVIQ •', 600, 1540);

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // TEMPLATE 5: MODERN BARISTA SPLATTER / CRAFT (80% QR / 20% REST)
    // ----------------------------------------------------
    {
      const craftPrimary = primary || '#451a03';
      const craftAccent = accent || '#d97706';

      // Warm Craft Background
      ctx.fillStyle = '#fef7ee';
      ctx.fillRect(0, 0, 1200, 1800);

      // Organic Splatters / Blobs in corners
      ctx.fillStyle = craftAccent + '25';
      ctx.beginPath();
      ctx.arc(1140, 60, 260, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = craftPrimary + '18';
      ctx.beginPath();
      ctx.arc(50, 1740, 280, 0, Math.PI * 2);
      ctx.fill();

      // Top Header Brand & Table Capsule (~10% height)
      ctx.fillStyle = craftPrimary;
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const dispBrand = brandName.length > 20 ? brandName.slice(0, 18) + '...' : brandName;
      ctx.fillText(dispBrand.toUpperCase(), 75, 130);

      ctx.fillStyle = craftPrimary;
      drawRoundedRect(840, 75, 280, 74, 37);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tableText, 980, 125);

      // Dominant QR Code Container with artistic brackets (Perfect Square: NO GAP)
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(110, 360, 980, 980, 32);
      ctx.fill();

      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 140, 390, 920, 920);
      }

      // Corner Brackets framing the square QR code tightly
      ctx.lineWidth = 12;
      ctx.strokeStyle = craftPrimary;
      // Top-Left
      ctx.beginPath(); ctx.moveTo(80, 470); ctx.lineTo(80, 330); ctx.lineTo(220, 330); ctx.stroke();
      // Top-Right
      ctx.beginPath(); ctx.moveTo(980, 330); ctx.lineTo(1120, 330); ctx.lineTo(1120, 470); ctx.stroke();
      // Bottom-Left
      ctx.beginPath(); ctx.moveTo(80, 1230); ctx.lineTo(80, 1370); ctx.lineTo(220, 1370); ctx.stroke();
      // Bottom-Right
      ctx.beginPath(); ctx.moveTo(980, 1370); ctx.lineTo(1120, 1370); ctx.lineTo(1120, 1230); ctx.stroke();

      // Bottom CTA Headline (~10% height)
      ctx.fillStyle = craftPrimary;
      ctx.font = '900 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const craftCta = config?.ctaTitle || 'SCAN TO ORDER & PAY';
      ctx.fillText(craftCta, 600, 1530);

      ctx.fillStyle = '#78350f';
      ctx.font = '600 26px system-ui, sans-serif';
      ctx.fillText('Point camera to view menu & place order', 600, 1600);

      ctx.fillStyle = '#78350f';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('• DINVIQ •', 600, 1665);

      return canvas.toDataURL('image/png');
    }
  };

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
              <span>${formatTableBadge(t.tableNumber)}</span>
            </div>
            <div class="direct-inner">
              <div class="direct-header">
                <div class="direct-badge">${formatTableBadge(t.tableNumber)}</div>
                <div class="direct-title">${(restaurantName || 'THE LANDMARK').toUpperCase()}</div>
              </div>

              <div class="direct-qr-wrap">
                ${qrDataUrl ? `<img src="${qrDataUrl}" class="direct-qr-img" alt="Table ${t.tableNumber} QR" />` : ''}
              </div>

              <div class="direct-footer">
                <div class="direct-cta">SCAN TO VIEW MENU & ORDER</div>
                <div class="direct-sub">Point phone camera to scan • No app required</div>
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
    <title>${restaurantName} - Direct Table QRs</title>
    <style>
      @page { size: A4 portrait; margin: 8mm 6mm; }
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
        gap: 6mm;
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
        padding: 5px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        height: 133mm;
        box-sizing: border-box;
      }
      .cut-guide {
        display: flex;
        justify-content: space-between;
        font-size: 7.5px;
        font-weight: 700;
        color: #94a3b8;
        padding-bottom: 2px;
      }
      .direct-inner {
        flex: 1;
        border: 2px solid #0f172a;
        border-radius: 10px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        box-sizing: border-box;
      }
      /* Header (~10% height) */
      .direct-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 4px;
        border-bottom: 1px solid #e2e8f0;
      }
      .direct-badge {
        font-size: 15px;
        font-weight: 900;
        color: #ffffff;
        background: #0f172a;
        padding: 3px 14px;
        border-radius: 100px;
        letter-spacing: 0.8px;
      }
      .direct-title {
        font-size: 11px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: 1px;
      }
      /* QR Center (80% Area Focus) */
      .direct-qr-wrap {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2mm 0;
      }
      .direct-qr-img {
        width: 78mm;
        height: 78mm;
        max-width: 78mm;
        max-height: 78mm;
        display: block;
        object-fit: contain;
      }
      /* Footer (~10% height) */
      .direct-footer {
        width: 100%;
        padding-top: 4px;
        border-top: 1px solid #e2e8f0;
      }
      .direct-cta {
        font-size: 11px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: 0.5px;
      }
      .direct-sub {
        font-size: 7.5px;
        font-weight: 600;
        color: #64748b;
        margin-top: 1px;
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
    const brandName = config?.restaurantName || restaurantName || 'The Landmark';

    const pagesHtml = pages.map((chunk, pageIndex) => {
      const cardsHtml = chunk.map(t => {
        const canvas = document.getElementById(`qr-canvas-${t.tableNumber}`) ||
          document.getElementById(`preview-qr-canvas-${t.tableNumber}`) ||
          document.querySelector('canvas[id^="qr-canvas-"]');

        let cardDataUrl = '';
        if (canvas) {
          try {
            cardDataUrl = generateStandeeCardDataUrl(t, config, canvas);
          } catch (err) {
            console.error('Error generating standee print image for table', t.tableNumber, err);
          }
        }

        return `
          <div class="stand-card">
            <div class="cut-guide">
              <span>✂ Cut along line</span>
              <span>${formatTableBadge(t.tableNumber)}</span>
            </div>
            <div class="card-media-wrap">
              ${cardDataUrl ? `<img src="${cardDataUrl}" class="standee-img" alt="${formatTableBadge(t.tableNumber)}" />` : ''}
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
        margin: 6mm 6mm;
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
        gap: 5mm;
        height: 282mm;
        max-height: 282mm;
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
        border-radius: 8px;
        padding: 2.5mm 2.5mm 1.5mm 2.5mm;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 138mm;
        max-height: 138mm;
        box-sizing: border-box;
        overflow: hidden;
      }
      .cut-guide {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 7.5px;
        font-weight: 700;
        color: #94a3b8;
        padding-bottom: 1.5mm;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }
      .card-media-wrap {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .standee-img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: 100%;
        object-fit: contain;
        display: block;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
</html>`;

    executeIframePrint(fullHtml);
  };

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
      {/* STREAMLINED CLEAN HEADER BAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Left: Title + Table Count Badge + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <QrCode size={19} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Table QR Codes
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 9px',
                borderRadius: '100px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0'
              }}>
                {tables.length} {tables.length === 1 ? 'Table' : 'Tables'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '210px'
          }}>
            <Search size={14} color="#94a3b8" />
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
              <RefreshCw size={12} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            )}
          </div>
        </div>

        {/* Right: Simplified 4 Clear Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          {/* 1. Export / Print Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
              title="Print & Export Options"
            >
              <Printer size={14} color="#475569" />
              <span>Export</span>
              <ChevronDown size={13} color="#94a3b8" style={{ transform: showExportMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {showExportMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setShowExportMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '240px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 30px -4px rgba(15,23,42,0.18), 0 4px 6px -2px rgba(15,23,42,0.05)',
                    padding: '6px',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      printCustomizedStands(filteredTables, standeeConfig);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Printer size={15} color="#4f46e5" />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 800 }}>Print Standees (PDF)</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Print ready • 4 per A4 page</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      downloadAllStandees();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Download size={15} color="#0284c7" />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 800 }}>Download All Standees</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>High-Res PNG (1200×1800)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      downloadAllQRs();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <QrCode size={15} color="#059669" />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 800 }}>Download QRs Only</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Clean pure QR codes (1000×1000)</div>
                    </div>
                  </button>

                  </div>
              </>
            )}
          </div>

          {/* 2. Standee Studio Button */}
          <button
            type="button"
            onClick={() => {
              setEditorPreviewTable(filteredTables[0] || tables[0] || null);
              setShowStandeeEditorModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: '8px',
              border: '1px solid #aad0feff',
              background: '#fff7ed',
              color: '#0c55c2ff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(194, 65, 12, 0.05)'
            }}
            title="Open Standee Studio to choose templates & customize"
          >
            <Palette size={14} color="#0c5aeaff" />
            <span>Standee Studio</span>
          </button>

          {/* 3. Add Category Button */}
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
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Create new category or section (e.g. Terrace, Outdoor)"
          >
            <Plus size={14} />
            <span>Category</span>
          </button>

          {/* 4. Add Table Dropdown (Add One by One, Add in Batch) */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddMenu(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
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
              title="Add tables"
            >
              <Plus size={15} />
              <span>Add Table</span>
              <ChevronDown size={13} style={{ transform: showAddMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {showAddMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setShowAddMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '210px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 30px -4px rgba(15,23,42,0.18), 0 4px 6px -2px rgba(15,23,42,0.05)',
                    padding: '6px',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      setShowAddModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Plus size={15} color="#2563eb" />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 800 }}>Add One by One</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Create single table</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      handleOpenBatchModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eef2ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Layers size={15} color="#4f46e5" />
                    <div>
                      <div style={{ color: '#0f172a', fontWeight: 800 }}>Add in Batch</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Create multiple tables at once</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
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
                      fontSize: '1.15rem',
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
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSectionOldName(secName);
                        setEditingSectionNewName(secName);
                        setShowEditSectionModal(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 9px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#2563eb',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Edit "${secName}" Category Name`}
                    >
                      <Edit3 size={12} /> Edit Category
                    </button>
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
                          {/* 1. Header with Table Badge, Edit & Delete Buttons (Zero Wrap Guarantee) */}
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '30px', marginBottom: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1, marginRight: 6, display: 'flex', alignItems: 'center' }}>
                              <div
                                style={{
                                  background: '#f8fafc',
                                  color: '#0f172a',
                                  border: '1px solid #e2e8f0',
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100%',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  display: 'inline-block'
                                }}
                                title={formatTableName(table.tableNumber)}
                              >
                                {formatTableName(table.tableNumber)}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                              <button
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

      {/* EDIT CATEGORY / SECTION MODAL */}
      <AnimatePresence>
        {showEditSectionModal && (
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
          }} onClick={() => setShowEditSectionModal(false)}>
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
                Edit Category Name
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                Rename "<strong>{editingSectionOldName}</strong>". All tables in this category will be updated automatically.
              </p>

              <form onSubmit={handleSaveEditSection}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category / Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editingSectionNewName}
                    onChange={(e) => setEditingSectionNewName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #2563eb',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowEditSectionModal(false)}
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
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1
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
                        {formatTableBadge(item.tableNumber)}
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
                Delete {formatTableBadge(tableToDelete.tableNumber)}?
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
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{formatTableBadge(previewTable.tableNumber)}</span>
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
                    border: '1px solid #b1c7ffff',
                    background: '#bfe6ffff',
                    color: '#fffbfbff',
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
            {/* STUDIO TOP HEADER BAR (Compact, Modern & Sleek) */}
            <div style={{
              height: '46px',
              padding: '0 14px',
              background: '#0f172a',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              zIndex: 10,
              boxSizing: 'border-box'
            }}>
              {/* Left Branding (Compact) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                }}>
                  <Sliders size={14} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                    Standee Studio
                  </span>
                  <span style={{ fontSize: '8.5px', fontWeight: 800, background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    DESIGNER
                  </span>
                </div>
              </div>

              {/* Center Controls: Preview Table Selector & Zoom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e293b', padding: '2px 8px', borderRadius: '6px', border: '1px solid #334155', height: '28px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8' }}>Preview:</span>
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
                      fontSize: '11px',
                      fontWeight: 800,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {(filteredTables.length > 0 ? filteredTables : tables).map(t => (
                      <option key={t._id || t.tableNumber} value={t.tableNumber} style={{ background: '#0f172a', color: '#ffffff' }}>
                        {formatTableBadge(t.tableNumber)} ({t.seatingCapacity || 4} Guests)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zoom Controls (Compact) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#1e293b', padding: '2px 4px', borderRadius: '6px', border: '1px solid #334155', height: '28px', boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={12} />
                  </button>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#f8fafc', minWidth: '32px', textAlign: 'center' }}>
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                    title="Zoom In"
                  >
                    <ZoomIn size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(1)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px 4px', fontSize: '9px', fontWeight: 700 }}
                    title="Reset Zoom to 100%"
                  >
                    1:1
                  </button>
                </div>
              </div>

              {/* Right Action Buttons (Compact & Sleek) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                    gap: 4,
                    padding: '0 8px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Reset to Factory Defaults"
                >
                  <RotateCcw size={11} /> Reset
                </button>

                <button
                  type="button"
                  onClick={() => saveStandeeConfig(standeeConfig)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0 10px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Check size={12} /> Save
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
                    gap: 4,
                    padding: '0 10px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <Download size={12} /> Download
                </button>

                <button
                  type="button"
                  onClick={() => printCustomizedStands(filteredTables, standeeConfig)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0 11px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <Printer size={12} /> Print PDF
                </button>

                <div style={{ width: '1px', height: '18px', background: '#334155', margin: '0 2px' }} />

                <button
                  type="button"
                  onClick={() => setShowStandeeEditorModal(false)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
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
                  <X size={15} />
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
              {/* LEFT STUDIO SIDEBAR - SIMPLE TEMPLATE SELECTOR ONLY */}
              <div style={{
                width: '290px',
                minWidth: '270px',
                maxWidth: '310px',
                background: '#ffffff',
                borderRight: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
              }}>
                {/* Clean Header */}
                <div style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Layers size={14} color="#0f172a" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                      Select Template
                    </span>
                  </div>
                  <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5px 6px', borderRadius: '100px' }}>
                    5 Designs
                  </span>
                </div>

                {/* Direct 5 Templates List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STAND_TEMPLATES.map(tpl => {
                    const currentTplId = standeeConfig.templateId || 'food-acrylic';
                    const isSelected = currentTplId === tpl.id || (currentTplId === 'acrylic' && tpl.id === 'food-acrylic');
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setStandeeConfig(prev => ({
                            ...prev,
                            templateId: tpl.id,
                            bgStyle: tpl.bgStyle,
                            cardBorder: tpl.cardBorder,
                            cornerRadius: tpl.cornerRadius,
                            primaryColor: tpl.primaryColor,
                            accentColor: tpl.accentColor,
                            ctaTitle: tpl.ctaTitle
                          }));
                          toast.success(`Selected "${tpl.name}"`);
                        }}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '7px',
                          overflow: 'hidden',
                          border: `2px solid ${tpl.primaryColor}`,
                          flexShrink: 0
                        }}>
                          <img
                            src={tpl.previewImg}
                            alt={tpl.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                              {tpl.name}
                            </span>
                            <span style={{
                              fontSize: '8px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '100px',
                              background: isSelected ? '#2563eb' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#64748b'
                            }}>
                              {tpl.tag}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '9.5px', color: '#64748b', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tpl.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                padding: '1rem', overflow: 'auto', position: 'relative'
              }}>
                {/* Scaled Preview Standee Card */}
                {(() => {
                  const prevT = editorPreviewTable || filteredTables[0] || tables[0] || { tableNumber: 1, seatingCapacity: 4 };
                  const currentTplId = standeeConfig.templateId || 'food-acrylic';
                  const primary = standeeConfig.primaryColor || '#15803d';
                  const accent = standeeConfig.accentColor || '#22c55e';
                  const brandName = standeeConfig.restaurantName || restaurantName || 'The Landmark';
                  const tableText = formatTableBadge(prevT.tableNumber);

                  return (
                    <div
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease',
                        width: '280px', minHeight: '420px', height: '420px',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                        borderRadius: currentTplId === 'luxury-gold' ? '6px' : (currentTplId === 'gourmet-arch' ? '24px 24px 16px 16px' : '18px'),
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        background: currentTplId === 'luxury-gold' ? '#0d0d11' : (currentTplId === 'craft-splatter' ? '#fef7ee' : '#ffffff')
                      }}
                    >
                      {/* ---------------------------------------------------- */}
                      {/* TEMPLATE 1: FRESH FOOD ACRYLIC STAND (80% QR / 20% REST) */}
                      {/* ---------------------------------------------------- */}
                      {(currentTplId === 'food-acrylic' || currentTplId === 'acrylic') && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, position: 'relative', background: '#ffffff' }}>
                          {/* Top Food Banner: Clean single line brand + badge */}
                          <div style={{ position: 'relative', height: '44px', overflow: 'hidden', flexShrink: 0 }}>
                            <img
                              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                              alt="Fresh Food"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.7) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 10px'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, marginRight: 8 }}>
                                <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>
                                  {brandName}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '7.5px', fontWeight: 700, letterSpacing: '1px', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                                  CONTACTLESS DINING
                                </span>
                              </div>
                              <div style={{
                                background: primary,
                                color: '#ffffff',
                                padding: '3px 10px',
                                borderRadius: '100px',
                                fontSize: '10.5px',
                                fontWeight: 900,
                                letterSpacing: '0.5px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                {tableText}
                              </div>
                            </div>
                          </div>

                          {/* Center Dominant QR Code (80% Area Focus) */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                            <div style={{
                              padding: '8px',
                              background: '#ffffff',
                              borderRadius: '14px',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                              border: '1.5px solid #f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <QRCodeCanvas
                                id={`preview-qr-canvas-${prevT.tableNumber}`}
                                value={getTableQRUrl(prevT.tableNumber)}
                                size={215}
                                level="H"
                                includeMargin={false}
                                fgColor="#0f172a"
                              />
                            </div>
                          </div>

                          {/* Bottom Curved Banner (~10% height) */}
                          <div style={{
                            background: primary,
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderTopLeftRadius: '14px',
                            borderTopRightRadius: '14px',
                            textAlign: 'center',
                            boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
                            flexShrink: 0
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.4px'
                            }}>
                              <span style={{ fontSize: '12px', transform: 'scaleX(-1)' }}>↷</span>
                              <span>{standeeConfig.ctaTitle || 'VIEW OUR MENU ON YOUR PHONE!'}</span>
                              <span style={{ fontSize: '12px' }}>↷</span>
                            </div>
                            <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
                              Open camera & scan QR code to order
                            </div>
                            <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.65)', marginTop: 2, textTransform: 'uppercase' }}>
                              • dinviq •
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---------------------------------------------------- */}
                      {/* TEMPLATE 2: ROYAL GOLD & DARK DINING (80% QR / 20% REST) */}
                      {/* ---------------------------------------------------- */}
                      {(currentTplId === 'luxury-gold' || currentTplId === 'dark') && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          flex: 1,
                          position: 'relative',
                          background: 'linear-gradient(180deg, #18181b 0%, #0d0d11 100%)',
                          padding: '10px 12px',
                          boxSizing: 'border-box'
                        }}>
                          {/* Double Gold Borders */}
                          <div style={{ position: 'absolute', inset: '6px', border: `1.5px solid ${primary}`, borderRadius: '4px', pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', inset: '9px', border: `1px solid ${primary}55`, borderRadius: '2px', pointerEvents: 'none' }} />

                          {/* Top Header (~40px) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 5px', zIndex: 1, borderBottom: `1px solid ${primary}33`, flexShrink: 0 }}>
                            <div style={{
                              fontFamily: 'Playfair Display, Georgia, serif',
                              fontStyle: 'italic',
                              fontSize: '24px',
                              color: primary,
                              letterSpacing: '1px',
                              lineHeight: 1
                            }}>
                              Menu
                            </div>
                            <div style={{
                              border: `1.5px solid ${primary}`,
                              padding: '2px 9px',
                              borderRadius: '100px',
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.8px',
                              color: primary,
                              background: 'rgba(0,0,0,0.4)',
                              whiteSpace: 'nowrap'
                            }}>
                              {tableText}
                            </div>
                          </div>

                          {/* Center Dominant QR Code in Gold Frame (80% Area Focus) */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '8px 2px' }}>
                            <div style={{
                              padding: '8px',
                              background: '#ffffff',
                              borderRadius: '8px',
                              border: `2.5px solid ${primary}`,
                              boxShadow: `0 0 24px ${primary}44`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <QRCodeCanvas
                                id={`preview-qr-canvas-${prevT.tableNumber}`}
                                value={getTableQRUrl(prevT.tableNumber)}
                                size={215}
                                level="H"
                                includeMargin={false}
                                fgColor="#000000"
                              />
                            </div>
                          </div>

                          {/* Bottom Footer (~40px) */}
                          <div style={{ textAlign: 'center', zIndex: 1, flexShrink: 0, paddingBottom: 1 }}>
                            <div style={{
                              display: 'inline-block',
                              border: `1px dashed ${primary}`,
                              padding: '2px 10px',
                              borderRadius: '4px',
                              fontSize: '8px',
                              fontWeight: 800,
                              letterSpacing: '1px',
                              color: primary,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {brandName} • SCAN QR
                            </div>
                            <div style={{ fontSize: '7.5px', fontWeight: 600, color: '#94a3b8', marginTop: 2, letterSpacing: '0.8px' }}>
                              FAST & CONTACTLESS LUXURY DINING
                            </div>
                            <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '2px', color: primary, opacity: 0.8, marginTop: 1, textTransform: 'uppercase' }}>
                              • dinviq •
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---------------------------------------------------- */}
                      {/* TEMPLATE 3: ARTISAN GREEN TABLE TENT (80% QR / 20% REST) */}
                      {/* ---------------------------------------------------- */}
                      {currentTplId === 'green-tent' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, position: 'relative', background: primary }}>
                          {/* Top Forest Green Tent Header (~40px) */}
                          <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff', flexShrink: 0 }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              letterSpacing: '1.5px',
                              fontFamily: 'Playfair Display, Georgia, serif'
                            }}>
                              ✦ VIEW MENU ✦
                            </div>
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.22)',
                              padding: '2px 9px',
                              borderRadius: '100px',
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.8px',
                              whiteSpace: 'nowrap'
                            }}>
                              {tableText}
                            </div>
                          </div>

                          {/* Center Dominant QR Code (80% Area Focus) */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', zIndex: 2 }}>
                            <div style={{
                              padding: '8px',
                              background: '#ffffff',
                              borderRadius: '14px',
                              boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <QRCodeCanvas
                                id={`preview-qr-canvas-${prevT.tableNumber}`}
                                value={getTableQRUrl(prevT.tableNumber)}
                                size={215}
                                level="H"
                                includeMargin={false}
                                fgColor="#0f172a"
                              />
                            </div>
                          </div>

                          {/* Bottom Food Strip (~38px): Clean without crowded text */}
                          <div style={{ height: '38px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                            <img
                              src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"
                              alt="Artisan Brunch"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(27,67,50,0.6) 0%, rgba(0,0,0,0.75) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 8px'
                            }}>
                              <span style={{ color: '#ffffff', fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.8px', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                                Fresh Daily • Scan with Camera to Order
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '7px', fontWeight: 800, letterSpacing: '2px', marginTop: 1, textTransform: 'uppercase' }}>
                                • dinviq •
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---------------------------------------------------- */}
                      {/* TEMPLATE 4: GOURMET ARCHED STAND (80% QR / 20% REST) */}
                      {/* ---------------------------------------------------- */}
                      {currentTplId === 'gourmet-arch' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, position: 'relative', background: '#ffffff', padding: '6px 8px 6px' }}>
                          {/* Top Header (~38px) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 4px', flexShrink: 0 }}>
                            <div style={{
                              background: primary,
                              color: accent,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '8.5px',
                              fontWeight: 800,
                              letterSpacing: '0.5px',
                              maxWidth: '120px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              ★ {brandName} ★
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: '15px',
                                fontWeight: 900,
                                color: primary,
                                letterSpacing: '2px',
                                lineHeight: 1
                              }}>
                                MENU
                              </span>
                              <span style={{
                                background: accent,
                                color: primary,
                                padding: '2px 7px',
                                borderRadius: '100px',
                                fontSize: '9.5px',
                                fontWeight: 900,
                                whiteSpace: 'nowrap'
                              }}>
                                {tableText}
                              </span>
                            </div>
                          </div>

                          {/* Arched Section Framing Huge QR Code (80% Area Focus) */}
                          <div style={{
                            flex: 1,
                            background: primary,
                            borderRadius: '32px 32px 12px 12px',
                            border: `2px solid ${accent}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            padding: '8px 6px 6px'
                          }}>
                            {/* Dominant QR Code inside Arch */}
                            <div style={{
                              padding: '7px',
                              background: '#ffffff',
                              borderRadius: '12px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <QRCodeCanvas
                                id={`preview-qr-canvas-${prevT.tableNumber}`}
                                value={getTableQRUrl(prevT.tableNumber)}
                                size={215}
                                level="H"
                                includeMargin={false}
                                fgColor="#0f172a"
                              />
                            </div>

                            {/* "Scan Me" & Table info (~34px) */}
                            <div style={{ textAlign: 'center', marginTop: 4, flexShrink: 0 }}>
                              <div style={{ color: '#ffffff', fontSize: '10.5px', fontWeight: 900, letterSpacing: '0.5px' }}>
                                {standeeConfig.ctaTitle || 'SCAN ME'} • <span style={{ color: accent }}>{tableText}</span>
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '7.5px', fontWeight: 700, letterSpacing: '1px', marginTop: 1 }}>
                                FAST & CONTACTLESS ORDERING
                              </div>
                              <div style={{ color: accent, fontSize: '7px', fontWeight: 800, letterSpacing: '2px', opacity: 0.9, marginTop: 1, textTransform: 'uppercase' }}>
                                • dinviq •
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---------------------------------------------------- */}
                      {/* TEMPLATE 5: MODERN BARISTA SPLATTER (80% QR / 20% REST) */}
                      {/* ---------------------------------------------------- */}
                      {currentTplId === 'craft-splatter' && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          flex: 1,
                          position: 'relative',
                          background: '#fef7ee',
                          padding: '8px 10px 6px',
                          overflow: 'hidden'
                        }}>
                          {/* Organic Coffee Blobs */}
                          <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '80px',
                            height: '80px',
                            borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                            background: `${accent}22`,
                            pointerEvents: 'none'
                          }} />
                          <div style={{
                            position: 'absolute',
                            bottom: '-25px',
                            left: '-20px',
                            width: '90px',
                            height: '90px',
                            borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%',
                            background: `${primary}18`,
                            pointerEvents: 'none'
                          }} />

                          {/* Top Header (~38px): Single line brand + badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, padding: '0 2px 4px', flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: primary, letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                              {brandName}
                            </div>
                            <div style={{
                              background: primary,
                              color: '#ffffff',
                              padding: '2px 9px',
                              borderRadius: '100px',
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.5px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              {tableText}
                            </div>
                          </div>

                          {/* Center Dominant QR Code with Corner Brackets (80% Area Focus) */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '6px 2px' }}>
                            <div style={{ position: 'relative', padding: '6px' }}>
                              {/* Corner Brackets */}
                              <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `2.5px solid ${primary}`, borderLeft: `2.5px solid ${primary}` }} />
                              <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: `2.5px solid ${primary}`, borderRight: `2.5px solid ${primary}` }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: `2.5px solid ${primary}`, borderLeft: `2.5px solid ${primary}` }} />
                              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `2.5px solid ${primary}`, borderRight: `2.5px solid ${primary}` }} />

                              <div style={{
                                padding: '7px',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <QRCodeCanvas
                                  id={`preview-qr-canvas-${prevT.tableNumber}`}
                                  value={getTableQRUrl(prevT.tableNumber)}
                                  size={215}
                                  level="H"
                                  includeMargin={false}
                                  fgColor={primary}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bottom Headline (~36px) */}
                          <div style={{ textAlign: 'center', zIndex: 1, flexShrink: 0, paddingBottom: 1 }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: primary, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              {standeeConfig.ctaTitle || 'SCAN TO ORDER & PAY'}
                            </div>
                            <div style={{ fontSize: '7.5px', color: '#78350f', fontWeight: 600, marginTop: 1 }}>
                              Point camera to view menu & place order
                            </div>
                            <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '2px', color: '#78350f', opacity: 0.7, marginTop: 1, textTransform: 'uppercase' }}>
                              • dinviq •
                            </div>
                          </div>
                        </div>
                      )}
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
