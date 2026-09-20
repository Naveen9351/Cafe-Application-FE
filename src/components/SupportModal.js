import React, { useState, useRef } from 'react';
import axios from 'axios';
import { X, HelpCircle, UploadCloud, CheckCircle2, AlertTriangle, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './SupportModal.module.css';
import { API_URL as API } from '../config/api';

export default function SupportModal({ isOpen, onClose, tenantInfo }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('POS Terminal');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in both Subject and Description');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        subject: subject.trim(),
        category,
        description: description.trim(),
        priority,
        screenshotUrl: screenshot || '',
        contactEmail: tenantInfo?.email || '',
        contactPhone: tenantInfo?.phone || ''
      };

      const res = await axios.post(`${API}/tickets`, payload, {
        headers: { 'x-auth-token': token }
      });

      toast.success(res.data.message || 'Support ticket raised successfully!');
      setSubject('');
      setDescription('');
      setScreenshot(null);
      onClose();
    } catch (err) {
      console.error('Submit ticket error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <HelpCircle size={20} color="#2563eb" />
            Raise Support Ticket
          </h3>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
            >
              <option value="POS Terminal">POS Terminal & Billing</option>
              <option value="Kitchen KDS">Kitchen Display & KOT</option>
              <option value="QR Menu">Table QR Code / Menu</option>
              <option value="Billing & Taxes">Billing, Taxes & Subscription</option>
              <option value="Bug Report">Technical Bug / Crash</option>
              <option value="Feature Request">New Feature Request</option>
              <option value="Other">Other Query</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g. Printer disconnected during billing"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe what happened, error messages, and how to reproduce it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Priority Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={styles.select}
            >
              <option value="normal">Normal (Standard inquiry)</option>
              <option value="high">High (Affecting operations)</option>
              <option value="urgent">Urgent (Billing / Outlet blocked)</option>
            </select>
          </div>

          {/* Screenshot Attachment (Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Attach Screenshot (Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            {screenshot ? (
              <div className={styles.previewWrap}>
                <img src={screenshot} alt="Screenshot Preview" className={styles.previewImg} />
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className={styles.removeImgBtn}
                  title="Remove screenshot"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={24} color="#64748b" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Click to upload screenshot or drag & drop
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>PNG, JPG up to 5MB</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
