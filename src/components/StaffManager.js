import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Check, X, Edit, Trash2, Key, UserCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import { TableRowSkeleton } from './common/SkeletonLoader';
import styles from './StaffManager.module.css';

const ALL_PERMISSIONS_LIST = [
  { key: 'access_dashboard', label: 'Dashboard & Overview Analytics' },
  { key: 'access_pos', label: 'POS Terminal & Floor Plan' },
  { key: 'access_live_orders', label: 'Live Orders & Kitchen Display' },
  { key: 'access_orders', label: 'Orders Directory & Past Bills' },
  { key: 'access_menu', label: 'Menu & Category Management' },
  { key: 'access_tables', label: 'Table QR Codes & Floor Config' },
  { key: 'access_crm', label: 'Customer Management & CRM' },
  { key: 'access_staff', label: 'Staff & Role Management' },
  { key: 'access_reports', label: 'Financial Reports & Analytics' },
  { key: 'access_sales_summary', label: 'Item Summary & Dish Sales' },
  { key: 'access_khata', label: 'Customer Khata / Borrow Ledger' },
  { key: 'access_settings', label: 'Store Settings & Configuration' },
];

const ROLE_PRESETS = {
  admin: {
    name: 'Admin',
    permissions: {
      access_dashboard: true,
      access_pos: true,
      access_live_orders: true,
      access_orders: true,
      access_menu: true,
      access_tables: true,
      access_crm: true,
      access_staff: true,
      access_reports: true,
      access_sales_summary: true,
      access_khata: true,
      access_settings: true
    }
  },
  manager: {
    name: 'Manager',
    permissions: {
      access_dashboard: true,
      access_pos: true,
      access_live_orders: true,
      access_orders: true,
      access_menu: true,
      access_tables: true,
      access_crm: true,
      access_staff: false,
      access_reports: true,
      access_sales_summary: true,
      access_khata: true,
      access_settings: false
    }
  },
  cashier: {
    name: 'Cashier',
    permissions: {
      access_dashboard: false,
      access_pos: true,
      access_live_orders: true,
      access_orders: true,
      access_menu: false,
      access_tables: true,
      access_crm: false,
      access_staff: false,
      access_reports: false,
      access_sales_summary: true,
      access_khata: true,
      access_settings: false
    }
  },
  chef: {
    name: 'Kitchen Chef',
    permissions: {
      access_dashboard: false,
      access_pos: false,
      access_live_orders: true,
      access_orders: true,
      access_menu: false,
      access_tables: false,
      access_crm: false,
      access_staff: false,
      access_reports: false,
      access_sales_summary: false,
      access_khata: false,
      access_settings: false
    }
  },
  waiter: {
    name: 'Captain / Waiter',
    permissions: {
      access_dashboard: false,
      access_pos: true,
      access_live_orders: true,
      access_orders: false,
      access_menu: false,
      access_tables: true,
      access_crm: false,
      access_staff: false,
      access_reports: false,
      access_sales_summary: false,
      access_khata: false,
      access_settings: false
    }
  },
  custom: {
    name: 'Custom Role',
    permissions: {
      access_dashboard: false,
      access_pos: false,
      access_live_orders: false,
      access_orders: false,
      access_menu: false,
      access_tables: false,
      access_crm: false,
      access_staff: false,
      access_reports: false,
      access_sales_summary: false,
      access_khata: false,
      access_settings: false
    }
  }
};

export default function StaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('cashier');
  const [permissions, setPermissions] = useState(ROLE_PRESETS.cashier.permissions);
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token
        }
      });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data.staff || []);
        const filtered = raw.filter(s => s.role?.toLowerCase() !== 'admin' && s.role?.toLowerCase() !== 'super_admin');
        setStaffList(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingStaffId(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setSelectedRole('Cashier');
    setPermissions(ROLE_PRESETS.cashier.permissions);
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaffId(staff._id);
    setFullName(staff.fullName || staff.name || '');
    setUsername(staff.username || staff.email || '');
    setPassword(''); // leave blank if no change
    setPhone(staff.phone || '');
    setSelectedRole(staff.role || 'Staff');
    setPermissions(staff.permissions || ROLE_PRESETS.custom.permissions);
    setFormIsActive(staff.isActive !== undefined ? staff.isActive : (staff.status === 'active'));
    setShowModal(true);
  };

  const handleRoleSelect = (roleKey) => {
    const preset = ROLE_PRESETS[roleKey];
    if (preset) {
      setSelectedRole(preset.name);
      setPermissions({ ...preset.permissions });
    }
  };

  const handlePermissionToggle = (permKey) => {
    setPermissions(prev => ({
      ...prev,
      [permKey]: !prev[permKey]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (phone.trim() && !/^[0-9]{10}$/.test(phone.trim())) {
        toast.error('Mobile number must be exactly 10 digits');
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: username.trim(),
        name: fullName.trim(),
        phone: phone.trim(),
        role: selectedRole.trim().toLowerCase(),
        designation: selectedRole.trim(),
        status: formIsActive ? 'active' : 'inactive',
        isActive: formIsActive,
        permissions
      };
      if (password) payload.password = password;

      if (editingStaffId) {
        await axios.put(`${API_URL}/staff/${editingStaffId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-auth-token': token
          }
        });
        toast.success(`Staff member "${payload.fullName}" updated!`);
      } else {
        if (!password) {
          toast.error('Please enter an initial password for this staff member.');
          setSubmitting(false);
          return;
        }
        await axios.post(`${API_URL}/staff`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-auth-token': token
          }
        });
        toast.success(`Staff member "${payload.fullName}" created!`);
      }

      setShowModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Error saving staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id, name, role) => {
    if (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'super_admin') {
      toast.error('Admin accounts cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/staff/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token
        }
      });
      setStaffList(prev => prev.filter(s => s._id !== id));
      toast.success(`Staff member "${name}" removed`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to remove staff member.');
    }
  };

  const handleToggleStatus = async (staff) => {
    const currentActive = staff.isActive !== undefined ? Boolean(staff.isActive) : (staff.status === 'active');
    const nextActive = !currentActive;
    const nextStatus = nextActive ? 'active' : 'inactive';

    // Instant Optimistic Update
    setStaffList(prev => prev.map(s => s._id === staff._id ? { ...s, isActive: nextActive, status: nextStatus } : s));
    toast.success(`"${staff.fullName || staff.name}" marked ${nextActive ? 'Active' : 'Inactive'}`);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/staff/${staff._id}`, {
        status: nextStatus,
        isActive: nextActive
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token
        }
      });
    } catch (err) {
      // Revert on failure
      setStaffList(prev => prev.map(s => s._id === staff._id ? { ...s, isActive: currentActive, status: staff.status } : s));
      toast.error(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const getRoleClass = (role) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'manager': return styles.roleManager;
      case 'cashier': return styles.roleCashier;
      case 'chef': return styles.roleChef;
      default: return styles.roleWaiter;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <Users size={20} color="#2563eb" />
            Staff Management
          </h2>
        </div>
        <button className={styles.primaryBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Add New Staff
        </button>
      </div>



      {/* Staff Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.staffTable}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Phone / Contact</th>
                <th>Granted Permissions</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton rows={4} cols={6} />
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No staff members created yet. Click <strong>"Add New Staff"</strong> to assign POS and terminal access.
                  </td>
                </tr>
              ) : (
                staffList.map((staff, idx) => (
                  <motion.tr
                    key={staff._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.04, 0.3) }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.staffAvatar}>
                          {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{staff.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {staff.username?.includes('@') ? staff.username : `@${staff.username}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${getRoleClass(staff.role)}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td>{staff.phone || '—'}</td>
                    <td>
                      <div className={styles.permissionsList}>
                        {staff.permissions?.access_pos && <span className={styles.permissionTag}>POS</span>}
                        {staff.permissions?.access_live_orders && <span className={styles.permissionTag}>Kitchen/Live</span>}
                        {staff.permissions?.access_menu && <span className={styles.permissionTag}>Menu</span>}
                        {staff.permissions?.access_tables && <span className={styles.permissionTag}>QR & Tables</span>}
                        {staff.permissions?.access_reports && <span className={styles.permissionTag}>Reports</span>}
                        {staff.permissions?.access_khata && <span className={styles.permissionTag}>Khata</span>}
                        {staff.permissions?.access_settings && <span className={styles.permissionTag}>Settings</span>}
                      </div>
                    </td>
                    <td>
                      <div
                        onClick={() => handleToggleStatus(staff)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          userSelect: 'none',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          transition: 'background 0.15s ease'
                        }}
                        title={`Click to mark ${staff.isActive ? 'Inactive' : 'Active'}`}
                      >
                        <div style={{
                          width: 38,
                          height: 20,
                          borderRadius: 100,
                          background: staff.isActive ? '#10b981' : '#cbd5e1',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          flexShrink: 0
                        }}>
                          <div style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: 3,
                            left: staff.isActive ? 21 : 3,
                            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: staff.isActive ? '#16a34a' : '#64748b'
                        }}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleOpenEditModal(staff)}
                          title="Edit Permissions"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        {staff.role?.toLowerCase() !== 'admin' && staff.role?.toLowerCase() !== 'super_admin' && (
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDeleteStaff(staff._id, staff.fullName, staff.role)}
                            title="Delete Staff"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingStaffId ? 'Edit Staff Member & Permissions' : 'Create Staff Member'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Username / Login ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh_pos"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Password {!editingStaffId && '*'}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder={editingStaffId ? 'Leave blank to keep unchanged' : 'Enter login password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.inputField}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit Phone No"
                    value={phone}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={styles.inputField}
                  />
                </div>
              </div>

              {/* Account Status Switch in Modal */}
              <div style={{
                margin: '12px 0 16px 0',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Account Status</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {formIsActive ? 'Staff can sign in and perform assigned tasks' : 'Staff access is temporarily blocked'}
                  </div>
                </div>
                <div
                  onClick={() => setFormIsActive(!formIsActive)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{
                    width: 40,
                    height: 22,
                    borderRadius: 100,
                    background: formIsActive ? '#10b981' : '#cbd5e1',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: formIsActive ? 21 : 3,
                      transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: formIsActive ? '#16a34a' : '#64748b' }}>
                    {formIsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Custom Role Input Box */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Staff Role / Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cashier, Floor Captain, Head Chef, Manager..."
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={styles.inputField}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                {/* Quick Role Suggestions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick suggestions:</span>
                  {Object.entries(ROLE_PRESETS).filter(([k]) => k !== 'custom').map(([k, v]) => {
                    const isSelected = selectedRole.toLowerCase() === v.name.toLowerCase() || selectedRole.toLowerCase() === k.toLowerCase();
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleRoleSelect(k)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '100px',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#2563eb' : '#475569',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className={styles.permissionsCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={styles.permissionsCardTitle} style={{ margin: 0 }}>Module Permissions</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const allTrue = {};
                        ALL_PERMISSIONS_LIST.forEach(p => { allTrue[p.key] = true; });
                        setPermissions(allTrue);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allFalse = {};
                        ALL_PERMISSIONS_LIST.forEach(p => { allFalse[p.key] = false; });
                        setPermissions(allFalse);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className={styles.permissionsGrid}>
                  {ALL_PERMISSIONS_LIST.map((item) => (
                    <label key={item.key} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={!!permissions[item.key]}
                        onChange={() => handlePermissionToggle(item.key)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : (editingStaffId ? 'Update Staff' : 'Create Staff Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
