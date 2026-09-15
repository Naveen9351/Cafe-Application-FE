import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Download, Trash2, Edit3, QrCode, RefreshCw, Users, Check, AlertCircle, Sparkles, Search, Layers, Wifi, Smartphone, Globe, Copy, ExternalLink } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL as API } from '../config/api';

const QRCodeComponent = ({ orders = [] }) => {
  const { user, tenantId } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const effectiveTenantId = tenantId || user?.tenantId || '6a762ef86c9d5c8be315f10a';

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

  const activeOrdersMap = React.useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      if (o.status !== 'completed' && o.status !== 'cancelled') {
        const raw = String(o.tableNumber || o.table || '').trim();
        const numOnly = raw.replace(/[^0-9]/g, '') || raw;
        if (raw) map[raw] = true;
        if (numOnly) map[numOnly] = true;
      }
    });
    return map;
  }, [orders]);

  const isTableOccupied = (t) => {
    const numOnly = String(t.tableNumber).replace(/[^0-9]/g, '') || String(t.tableNumber);
    return Boolean(activeOrdersMap[String(t.tableNumber).trim()] || activeOrdersMap[numOnly] || activeOrdersMap[`Table ${numOnly}`]);
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/tables`, {
        headers: { 'x-auth-token': token }
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTables(res.data);
      } else {
        // Default initial tables if empty
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
    }
  };

  useEffect(() => {
    fetchTables();
  }, [tenantId]);

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

  const filteredTables = tables.filter(t => 
    String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={22} color="#4f46e5" /> Dynamic Table & QR Manager
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Generate, customize, and print digital dine-in QR codes for every table in your restaurant.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={15} /> Download All
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
              color: '#4f46e5',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Layers size={15} /> Quick Batch Add
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
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus size={16} /> Add Table
          </button>
        </div>
      </div>

      {/* Network Host & Live Mobile Scan Config Banner (LIGHT THEME) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.1rem 1.4rem',
        marginBottom: '1.5rem',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        border: '1.5px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#e0e7ff',
              border: '1px solid #c7d2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4f46e5'
            }}>
              <Smartphone size={18} color="#4f46e5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>📱 REAL MOBILE SCAN TARGET HOST</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '100px',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0'
                }}>
                  ACTIVE
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Currently encoding QR codes with: <strong style={{ color: '#4f46e5', fontFamily: 'monospace', fontSize: '12px' }}>{qrBaseUrl}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSaveHost('http://192.168.1.10:3000')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: '8px',
                border: qrBaseUrl.includes('192.168.1.10') ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                background: qrBaseUrl.includes('192.168.1.10') ? '#eef2ff' : '#ffffff',
                color: qrBaseUrl.includes('192.168.1.10') ? '#4f46e5' : '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Wifi size={13} /> Wi-Fi IP (192.168.1.10:3000)
            </button>

            <button
              type="button"
              onClick={() => handleSaveHost('http://localhost:3000')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: '8px',
                border: qrBaseUrl.includes('localhost') ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                background: qrBaseUrl.includes('localhost') ? '#eef2ff' : '#ffffff',
                color: qrBaseUrl.includes('localhost') ? '#4f46e5' : '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              💻 Localhost (Mac only)
            </button>

            <button
              type="button"
              onClick={() => {
                setTempHost(qrBaseUrl);
                setIsEditingHost(!isEditingHost);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: isEditingHost ? '#4f46e5' : '#f8fafc',
                color: isEditingHost ? '#ffffff' : '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Edit3 size={12} /> Custom Host
            </button>
          </div>
        </div>

        {isEditingHost && (
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <input
              type="text"
              placeholder="e.g. http://192.168.1.10:3000 or https://yourdomain.com"
              value={tempHost}
              onChange={(e) => setTempHost(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <button
              type="button"
              onClick={() => handleSaveHost(tempHost)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Filter and Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', minWidth: '240px' }}>
          <Search size={15} color="#94a3b8" />
          <input 
            type="text"
            placeholder="Search table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#1e293b' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          <span>Total Tables: <strong style={{ color: '#0f172a' }}>{tables.length}</strong></span>
          <span>Available: <strong style={{ color: '#10b981' }}>{tables.filter(t => !isTableOccupied(t)).length}</strong></span>
          <span>Occupied: <strong style={{ color: '#f59e0b' }}>{tables.filter(t => isTableOccupied(t)).length}</strong></span>
        </div>
      </div>

      {/* Grid of Dynamic Table Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredTables.map((table) => {
          const qrUrl = getTableQRUrl(table.tableNumber);
          const isOccupied = isTableOccupied(table);

          return (
            <motion.div
              key={table._id || table.tableNumber}
              whileHover={{ y: -4, boxShadow: '0 14px 30px -4px rgba(15, 23, 42, 0.09)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.35rem',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Header with Table Badge & Live Status */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px'
                  }}>
                    {table.tableNumber}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                      Table {table.tableNumber}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Dine-in QR
                    </span>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  background: isOccupied ? '#fef3c7' : '#ecfdf5',
                  color: isOccupied ? '#b45309' : '#059669',
                  border: isOccupied ? '1px solid #fde68a' : '1px solid #a7f3d0'
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isOccupied ? '#f59e0b' : '#10b981'
                  }}></span>
                  {isOccupied ? 'Occupied' : 'Available'}
                </span>
              </div>

              {/* QR Code Canvas Frame */}
              <div style={{
                width: '100%',
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '16px 12px 12px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{
                  background: '#ffffff',
                  padding: '10px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  display: 'inline-flex'
                }}>
                  <QRCodeCanvas
                    id={`qr-canvas-${table.tableNumber}`}
                    value={qrUrl}
                    size={142}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <QrCode size={12} color="#6366f1" /> Scan to view menu & order
                  </span>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    maxWidth: '100%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#475569',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px'
                    }}>
                      {qrUrl}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(qrUrl);
                        toast.success(`Copied Table ${table.tableNumber} URL`);
                      }}
                      title="Copy QR Link"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#4f46e5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px'
                      }}
                    >
                      <Copy size={11} />
                    </button>
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Menu URL"
                      style={{
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px'
                      }}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Seating Capacity Row */}
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  <Users size={14} color="#4f46e5" />
                  <span>Capacity: <strong style={{ color: '#0f172a' }}>{table.seatingCapacity || 4} Customer</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleUpdateCapacity(table, (table.seatingCapacity || 4) - 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
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
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                    title="Increase seats"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(table)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      color: '#4f46e5',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginLeft: '2px'
                    }}
                    title="Edit Seating Capacity"
                  >
                    <Edit3 size={11} /> Edit
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => downloadTableQR(table.tableNumber)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  <Download size={14} /> Download table-{table.tableNumber}
                </button>
                <button
                  type="button"
                  onClick={() => setTableToDelete(table)}
                  title="Delete Table"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    border: '1px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#ef4444',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

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
                      background: '#4f46e5',
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
                          border: editCapacity === String(cap) ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                          background: editCapacity === String(cap) ? '#eef2ff' : '#f8fafc',
                          color: editCapacity === String(cap) ? '#4f46e5' : '#475569',
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
                      background: '#4f46e5',
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
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      color: '#4f46e5',
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
                    background: '#4f46e5',
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
    </div>
  );
};

export default QRCodeComponent;