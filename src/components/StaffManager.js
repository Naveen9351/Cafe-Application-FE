import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Check, X, Edit, Trash2, Key, UserCheck, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import styles from './StaffManager.module.css';

const ROLE_PRESETS = {
  admin: {
    name: 'Admin',
    permissions: {
      access_pos: true,
      access_live_orders: true,
      access_menu: true,
      access_tables: true,
      access_reports: true,
      access_settings: true,
      access_khata: true
    }
  },
  manager: {
    name: 'Manager',
    permissions: {
      access_pos: true,
      access_live_orders: true,
      access_menu: true,
      access_tables: true,
      access_reports: true,
      access_settings: false,
      access_khata: true
    }
  },
  cashier: {
    name: 'Cashier',
    permissions: {
      access_pos: true,
      access_live_orders: true,
      access_menu: false,
      access_tables: true,
      access_reports: false,
      access_settings: false,
      access_khata: true
    }
  },
  chef: {
    name: 'Kitchen Chef',
    permissions: {
      access_pos: false,
      access_live_orders: true,
      access_menu: false,
      access_tables: false,
      access_reports: false,
      access_settings: false,
      access_khata: false
    }
  },
  waiter: {
    name: 'Captain / Waiter',
    permissions: {
      access_pos: true,
      access_live_orders: true,
      access_menu: false,
      access_tables: true,
      access_reports: false,
      access_settings: false,
      access_khata: false
    }
  },
  custom: {
    name: 'Custom Role',
    permissions: {
      access_pos: false,
      access_live_orders: false,
      access_menu: false,
      access_tables: false,
      access_reports: false,
      access_settings: false,
      access_khata: false
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setStaffList(res.data.staff || []);
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
    setSelectedRole('cashier');
    setPermissions(ROLE_PRESETS.cashier.permissions);
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaffId(staff._id);
    setFullName(staff.fullName || '');
    setUsername(staff.username || '');
    setPassword(''); // leave blank if no change
    setPhone(staff.phone || '');
    setSelectedRole(staff.role || 'custom');
    setPermissions(staff.permissions || ROLE_PRESETS.custom.permissions);
    setShowModal(true);
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setPermissions({ ...ROLE_PRESETS[roleKey].permissions });
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
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        fullName,
        username,
        phone,
        role: selectedRole,
        permissions
      };
      if (password) payload.password = password;

      if (editingStaffId) {
        await axios.put(`${API_URL}/staff/${editingStaffId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        if (!password) {
          alert('Please enter an initial password for this staff member.');
          setSubmitting(false);
          return;
        }
        await axios.post(`${API_URL}/staff`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove staff member.');
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/staff/${staff._id}`, {
        isActive: !staff.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaff();
    } catch (err) {
      alert('Failed to update status.');
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
            <Users size={26} color="#2563eb" />
            Staff & Role-Based Access Control (RBAC)
          </h2>
          <p>Manage cafe staff members, assign roles, and configure granular permissions across POS and admin modules.</p>
        </div>
        <button className={styles.primaryBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Add New Staff
        </button>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>{staffList.length}</h4>
            <span>Total Staff Members</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#16a34a' }}>
            <UserCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>{staffList.filter(s => s.isActive).length}</h4>
            <span>Active Members</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <Shield size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>{Object.keys(ROLE_PRESETS).length}</h4>
            <span>Configured Roles</span>
          </div>
        </div>
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
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No staff members created yet. Click <strong>"Add New Staff"</strong> to assign POS and terminal access.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.staffAvatar}>
                          {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{staff.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{staff.username}</div>
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
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(staff)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                        className={`${styles.statusPill} ${staff.isActive ? styles.statusActive : styles.statusInactive}`}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: staff.isActive ? '#16a34a' : '#94a3b8' }} />
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </button>
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
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteStaff(staff._id, staff.fullName)}
                          title="Delete Staff"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
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
                  <label>Password {editingStaffId && '(Leave blank to keep unchanged)'} *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder={editingStaffId ? '••••••••' : 'Enter login password'}
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
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Role Preset
                </label>
                <div className={styles.rolePresets}>
                  {Object.entries(ROLE_PRESETS).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      className={`${styles.rolePresetBtn} ${selectedRole === k ? styles.rolePresetActive : ''}`}
                      onClick={() => handleRoleSelect(k)}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className={styles.permissionsCard}>
                <span className={styles.permissionsCardTitle}>Module Permissions</span>
                <div className={styles.permissionsGrid}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_pos}
                      onChange={() => handlePermissionToggle('access_pos')}
                    />
                    POS Terminal & Floor Plan
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_live_orders}
                      onChange={() => handlePermissionToggle('access_live_orders')}
                    />
                    Live Orders & Kitchen Display
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_menu}
                      onChange={() => handlePermissionToggle('access_menu')}
                    />
                    Menu & Category Management
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_tables}
                      onChange={() => handlePermissionToggle('access_tables')}
                    />
                    Table QR Codes & Floor Config
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_reports}
                      onChange={() => handlePermissionToggle('access_reports')}
                    />
                    Financial Reports & Analytics
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_khata}
                      onChange={() => handlePermissionToggle('access_khata')}
                    />
                    Customer Khata / Borrow Ledger
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!permissions.access_settings}
                      onChange={() => handlePermissionToggle('access_settings')}
                    />
                    Store Settings & Configuration
                  </label>
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
