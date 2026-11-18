import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Smartphone, CheckCircle2, RefreshCw, X, Unlink
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import styles from './WhatsAppConnectModal.module.css';

export default function WhatsAppConnectModal({ isOpen, onClose, tenantInfo }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    connected: false,
    connecting: false,
    qrCode: null,
    user: null,
    hasSavedSession: false
  });
  const [internalOpen, setInternalOpen] = useState(isOpen);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleOpenEvent = () => setInternalOpen(true);
    window.addEventListener('serviq_open_whatsapp_modal', handleOpenEvent);
    return () => window.removeEventListener('serviq_open_whatsapp_modal', handleOpenEvent);
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const tenantId = tenantInfo?._id;
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {})
    };
  }, [tenantInfo]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp/status`, {
        headers: getHeaders(),
        params: { tenantId: tenantInfo?._id }
      });
      if (res.data?.success) {
        setStatus(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to fetch WhatsApp status:', err.message);
    }
    return null;
  }, [getHeaders, tenantInfo]);

  const initiateConnection = useCallback(async (forceNew = false) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/whatsapp/connect`,
        { forceNew, tenantId: tenantInfo?._id },
        { headers: getHeaders() }
      );
      if (res.data?.success) {
        setStatus(res.data);
        setTimeout(() => {
          fetchStatus();
        }, 1200);
      }
    } catch (err) {
      toast.error('Failed to initiate WhatsApp connection');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, tenantInfo, fetchStatus]);

  const handleDisconnect = async () => {
    if (!window.confirm('Unlink this WhatsApp account?')) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/whatsapp/disconnect`, { tenantId: tenantInfo?._id }, { headers: getHeaders() });
      toast.success('WhatsApp unlinked');
      setStatus({ connected: false, connecting: false, qrCode: null, user: null });
      initiateConnection(true);
    } catch (err) {
      toast.error('Failed to unlink WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!internalOpen) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    fetchStatus().then((current) => {
      if (!current?.connected && !current?.qrCode) {
        initiateConnection(false);
      }
    });

    pollIntervalRef.current = setInterval(async () => {
      const s = await fetchStatus();
      if (s?.connected && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [internalOpen, fetchStatus, initiateConnection]);

  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) onClose();
  };

  if (!internalOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        
        {/* Header - Neutral White */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <FaWhatsapp />
            </div>
            <div className={styles.titleArea}>
              <h3>Link Cafe WhatsApp</h3>
              <p>Scan once with your cafe phone to enable silent e-bills</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {status.connected ? (
            /* Connected View */
            <div className={styles.connectedView}>
              <div className={styles.successIconBadge}>
                <CheckCircle2 size={36} />
              </div>

              <h4>WhatsApp Connected</h4>
              <p>Bills will be sent directly from this number in the background.</p>

              <div className={styles.phoneChip}>
                <Smartphone size={18} color="#059669" />
                <div>
                  <div className={styles.phoneChipLabel}>Sender Number</div>
                  <div className={styles.phoneChipNumber}>+{status.user?.id || 'Connected'}</div>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button type="button" className={styles.keepActiveBtn} onClick={handleClose}>
                  Done
                </button>
                <button
                  type="button"
                  className={styles.unlinkBtn}
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  <Unlink size={13} /> Unlink
                </button>
              </div>
            </div>
          ) : (
            /* QR Scan View */
            <div>
              <div className={styles.setupTip}>
                <strong>1-Time Setup:</strong> Point your cafe phone at the QR code below. Cashiers will never need to log in.
              </div>

              <div className={styles.scanGrid}>
                {/* QR Code Container */}
                <div className={styles.qrWrapper}>
                  <div className={styles.qrFrame}>
                    {status.qrCode ? (
                      <img
                        src={status.qrCode}
                        alt="WhatsApp Linking QR Code"
                        className={styles.qrImage}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={24} className={styles.spinner} style={{ margin: '0 auto 6px auto', display: 'block', color: '#64748b' }} />
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Generating QR...
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.refreshButton}
                    onClick={() => initiateConnection(true)}
                    disabled={loading}
                  >
                    <RefreshCw size={11} className={loading ? styles.spinner : ''} />
                    <span>Reload QR</span>
                  </button>
                </div>

                {/* Numbered Step Instructions */}
                <div className={styles.stepsArea}>
                  <h4>How to Link:</h4>
                  <div className={styles.stepsList}>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>1</span>
                      <span className={styles.stepText}>Open <strong>WhatsApp</strong> on phone</span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>2</span>
                      <span className={styles.stepText}>Go to <strong>Linked Devices</strong></span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>3</span>
                      <span className={styles.stepText}>Tap <strong>Link a Device</strong></span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>4</span>
                      <span className={styles.stepText}>Scan this QR code</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.statusIndicator}>
            <span className={status.connected ? styles.dotActive : status.connecting ? styles.dotWaiting : styles.dotOffline} />
            <span>
              {status.connected
                ? 'Connected'
                : status.connecting
                ? 'Waiting for Scan...'
                : 'Unlinked'}
            </span>
          </div>

          <button type="button" className={styles.closeFooterBtn} onClick={handleClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
