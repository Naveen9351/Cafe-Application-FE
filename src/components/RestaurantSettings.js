import React, { useState, useEffect } from 'react';
import {
  Building2, Clock, CreditCard,
  Upload, Trash2, CheckCircle, Info, X, ShieldCheck, Check, Sparkles, BookOpen,
  QrCode, Receipt, Lock, Smartphone, RefreshCw, AlertCircle, Printer, Download,
  TrendingUp, Volume2, Volume1, VolumeX, Play, Globe, Moon,
  MapPin, Phone, Mail, Sliders, Settings, ChevronRight, MessageSquare, Send, CheckCircle2, Zap
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import WhatsAppConnectModal from './WhatsAppConnectModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { GPayIcon, PhonePeIcon, PaytmIcon, BhimIcon, validateUpiId, buildUpiUri } from './common/UpiBrandLogos';
import { API_URL } from '../config/api';
import styles from './RestaurantSettings.module.css';
import { useTranslation } from '../utils/translations';
import { getAudioSettings, saveAudioSettings, previewTone, TONE_OPTIONS } from '../utils/audioChime';

const AVAILABLE_PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 499,
    period: 'Monthly',
    features: [
      'Fast Counter POS & Walk-in Billing',
      'Dish & Menu Management with in-stock toggle',
      'Orders Management & Bill Re-print',
      'Basic Daily Revenue Dashboard',
      'Cafe Branding, GST % & Sound Chime'
    ]
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    price: 799,
    period: 'Monthly',
    popular: true,
    features: [
      'Everything in Starter, plus:',
      'Table Suite: Dynamic Table QR Ordering',
      'Live Orders & Kitchen Display Screen (KDS)',
      'Temporary Tables & Floating Open Tabs',
      'Multi-Floor & Seating Layout Manager',
      'Customer Khata (Udhari) Credit Ledger',
      'Dish-wise Item Summary Sales Reports'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    period: 'Monthly',
    features: [
      'Everything in Growth, plus All 16 Modules:',
      'Direct WhatsApp E-Bills & Broadcasts',
      'Customer CRM, Lifetime Metrics & Loyalty',
      'Full Financial Reports Suite (.xlsx Export)',
      'Staff Role Management & PIN Security',
      'AI Copilot & Dineviq Assistant Insights'
    ]
  }
];

export default function RestaurantSettings({ tenantInfo, onSave }) {
  const [activeSection, setActiveSection] = useState('all');
  const [logoPreview, setLogoPreview] = useState(tenantInfo?.logo || '');

  // In-App Upgrade Modal & Payment State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(AVAILABLE_PLANS[1]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'checkout', 'verifying', 'success'
  const [payMethod, setPayMethod] = useState('upi_qr'); // 'upi_qr', 'upi_vpa', 'card', 'netbanking'
  const [upiVpa, setUpiVpa] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  // WhatsApp E-Bill Dispatcher State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTestReceipt = async () => {
    const cleanDigits = String(testPhone || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      toast.error('Please enter a valid 10-digit customer WhatsApp number');
      return;
    }
    setIsSendingTest(true);
    const toastId = toast.loading('Sending test receipt via WhatsApp...');
    try {
      const res = await axios.post(`${API_URL}/whatsapp/send-bill`, {
        phone: cleanDigits,
        message: `🧾 *TEST E-BILL DISPATCH*\n*${(tenantInfo?.name || 'DINEVIQ CAFE').toUpperCase()}*\n──────────────────────\n✅ *Status:* Engine connected and active!\n• 1x Cold Brew Coffee - ₹180\n• 1x Margherita Sourdough - ₹320\n──────────────────────\n*GRAND TOTAL: ₹500 (PAID ✅)*\n──────────────────────\n✨ Your Cafe POS is ready to send silent WhatsApp bills with 1-click!`,
        tenantId: tenantInfo?._id
      });
      if (res.data?.success) {
        toast.success(`Test receipt delivered to +${res.data.phone || cleanDigits}! 📱`, { id: toastId });
        setTestPhone('');
      } else {
        throw new Error(res.data?.error || 'Failed to dispatch');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Error sending test WhatsApp', { id: toastId });
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkWa = async () => {
      try {
        const res = await axios.get(`${API_URL}/whatsapp/status`, {
          params: { tenantId: tenantInfo?._id }
        });
        if (isMounted && res.data?.success) {
          setWaConnected(res.data.connected);
          setWaPhone(res.data.user?.id || '');
        }
      } catch (e) { }
    };
    checkWa();
    return () => { isMounted = false; };
  }, [tenantInfo, showWhatsAppModal]);

  // Razorpay Route Linked Account State
  const [routeAccount, setRouteAccount] = useState(tenantInfo?.razorpay || null);
  const [isCheckingRouteStatus, setIsCheckingRouteStatus] = useState(false);
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);
  const [routeFormMode, setRouteFormMode] = useState('connect_id'); // 'connect_id' | 'register_api'
  const [routeForm, setRouteForm] = useState({
    accountId: tenantInfo?.razorpay?.accountId || '',
    businessName: tenantInfo?.name || '',
    legalName: tenantInfo?.name || '',
    email: tenantInfo?.email || '',
    phone: tenantInfo?.phone || '',
    businessType: 'individual',
    contactName: tenantInfo?.name || '',
    accountNumber: '',
    ifscCode: '',
    street: tenantInfo?.address || '',
    city: '',
    state: '',
    postalCode: ''
  });

  const fetchRouteStatus = async (silent = false) => {
    if (!tenantInfo?._id) return;
    setIsCheckingRouteStatus(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const res = await axios.get(`${API_URL}/payments/account/status`, {
        params: { tenantId: tenantInfo._id },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data) {
        setRouteAccount(res.data);
        if (!silent) {
          toast.success(`Verification Status: ${res.data.accountStatus?.toUpperCase() || 'SYNCED'}`);
        }
      }
    } catch (err) {
      if (!silent) {
        toast.error(err.response?.data?.error || 'Failed to check verification status');
      }
    } finally {
      setIsCheckingRouteStatus(false);
    }
  };

  useEffect(() => {
    if (tenantInfo?._id) {
      fetchRouteStatus(true);
    }
  }, [tenantInfo?._id]);

  const handleConnectRouteAccount = async (e) => {
    if (e) e.preventDefault();
    setIsSubmittingRoute(true);
    const toastId = toast.loading('Connecting Razorpay Route payment account...');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const payload = {
        tenantId: tenantInfo?._id,
        ...routeForm
      };
      if (routeFormMode === 'connect_id') {
        if (!routeForm.accountId?.trim()) {
          toast.error('Please enter your Razorpay Linked Account ID (e.g. acc_...)', { id: toastId });
          setIsSubmittingRoute(false);
          return;
        }
      } else {
        if (!routeForm.businessName || !routeForm.email || !routeForm.phone) {
          toast.error('Please fill in business name, email, and phone', { id: toastId });
          setIsSubmittingRoute(false);
          return;
        }
      }

      const res = await axios.post(`${API_URL}/payments/account/register`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        toast.success('Razorpay Route payment account linked successfully!', { id: toastId });
        setRouteAccount(res.data.razorpay);
        if (onSave) {
          onSave({ razorpay: res.data.razorpay });
        }
      } else {
        throw new Error(res.data?.error || 'Failed to connect');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to connect payment account', { id: toastId });
    } finally {
      setIsSubmittingRoute(false);
    }
  };

  const handleUnlinkRouteAccount = async () => {
    if (!window.confirm('Are you sure you want to unlink your Razorpay payment account? Online customer payments will be held on the master account until reconnected.')) {
      return;
    }
    const toastId = toast.loading('Unlinking payment account...');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const res = await axios.post(`${API_URL}/payments/account/unlink`, {
        tenantId: tenantInfo?._id
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        toast.success('Razorpay Route account unlinked.', { id: toastId });
        setRouteAccount(null);
        setRouteForm(prev => ({ ...prev, accountId: '' }));
        if (onSave) {
          onSave({ razorpay: { accountId: null, accountStatus: 'unlinked' } });
        }
      }
    } catch (err) {
      toast.error('Failed to unlink account', { id: toastId });
    }
  };

  // Audio Notification Settings State
  const [audioSettings, setAudioSettings] = useState(() => getAudioSettings());
  const { lang, isHindi, setLanguage: setAppLanguage } = useTranslation();

  // Helper to calculate whether night menu is active right now
  const isNightActiveNow = () => {
    try {
      const d = new Date();
      const currentMins = d.getHours() * 60 + d.getMinutes();
      const [sH, sM] = (form.nightMenuStart || '22:00').split(':').map(Number);
      const [eH, eM] = (form.nightMenuEnd || '05:00').split(':').map(Number);
      const startMins = sH * 60 + (sM || 0);
      const endMins = eH * 60 + (eM || 0);

      if (startMins > endMins) {
        // Overnight span e.g. 22:00 to 05:00
        return currentMins >= startMins || currentMins <= endMins;
      }
      return currentMins >= startMins && currentMins <= endMins;
    } catch (e) {
      return false;
    }
  };

  const handleLanguageChange = (newLang) => {
    setAppLanguage(newLang);
    setForm(prev => ({ ...prev, language: newLang }));
    onSave({ settings: { ...tenantInfo?.settings, language: newLang } });
    toast.success(newLang === 'hi' ? 'भाषा बदलकर हिन्दी कर दी गई है' : 'Language set to English');
  };

  const handleToggleNightMenu = (checked) => {
    setForm(prev => ({ ...prev, enableNightMenu: checked }));
    onSave({ settings: { ...tenantInfo?.settings, enableNightMenu: checked } });
    toast.success(checked ? 'Open / Night Menu enabled (POS Only)' : 'Open / Night Menu disabled');
  };

  const handleNightTimeChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    onSave({ settings: { ...tenantInfo?.settings, [field]: val } });
  };

  useEffect(() => {
    const handleAudioChange = (e) => {
      if (e.detail) {
        setAudioSettings(e.detail);
      } else {
        setAudioSettings(getAudioSettings());
      }
    };
    window.addEventListener('serviq_audio_settings_changed', handleAudioChange);
    return () => window.removeEventListener('serviq_audio_settings_changed', handleAudioChange);
  }, []);

  const handleAudioMuteToggle = (muted) => {
    const nextVol = muted ? 0 : (audioSettings.volume === 0 ? 7 : audioSettings.volume);
    saveAudioSettings({ muted, volume: nextVol });
    setAudioSettings(prev => ({ ...prev, muted, volume: nextVol }));
    if (!muted) {
      previewTone(audioSettings.tone, nextVol);
    }
    toast.success(muted ? 'Order sound muted' : 'Order sound unmuted');
  };

  const handleAudioVolumeChange = (vol) => {
    const v = Number(vol);
    const isMute = v === 0;
    saveAudioSettings({ volume: v, muted: isMute });
    setAudioSettings(prev => ({ ...prev, volume: v, muted: isMute }));
    if (!isMute) {
      previewTone(audioSettings.tone, v);
    }
  };

  const handleAudioToneChange = (toneId) => {
    saveAudioSettings({ tone: toneId });
    setAudioSettings(prev => ({ ...prev, tone: toneId }));
    previewTone(toneId, audioSettings.volume === 0 ? 5 : audioSettings.volume);
  };
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const [form, setForm] = useState({
    restaurantName: tenantInfo?.name || tenantInfo?.businessName || '',
    gstNumber: tenantInfo?.gstNumber || '',
    storeAddress: tenantInfo?.address || '',
    primaryPhone: tenantInfo?.phone || '',
    publicEmail: tenantInfo?.email || '',
    operatingMode: tenantInfo?.settings?.operatingMode || 'dine_in',
    profitMargin: tenantInfo?.settings?.profitMargin !== undefined ? tenantInfo.settings.profitMargin : 40,
    enableEstimatedPrepTime: tenantInfo?.settings?.enableEstimatedPrepTime || false,
    enableKhata: tenantInfo?.settings?.enableKhata || false,
    enableCustomerOtp: tenantInfo?.settings?.enableCustomerOtp !== false,
    enableNightMenu: tenantInfo?.settings?.enableNightMenu || false,
    nightMenuStart: tenantInfo?.settings?.nightMenuStart || '22:00',
    nightMenuEnd: tenantInfo?.settings?.nightMenuEnd || '05:00',
    upiId: tenantInfo?.settings?.upiId || '',
    upiPayeeName: tenantInfo?.settings?.upiPayeeName || tenantInfo?.name || '',
    enableDirectUpi: tenantInfo?.settings?.enableDirectUpi !== false,
    language: tenantInfo?.settings?.language || 'en',
    operatingHours: tenantInfo?.settings?.operatingHours || [
      { day: 'Monday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Tuesday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Wednesday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Thursday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Friday', enabled: true, open: '09:00 AM', close: '11:00 PM' },
      { day: 'Saturday', enabled: true, open: '10:00 AM', close: '11:30 PM' },
      { day: 'Sunday', enabled: false, open: 'Closed for Business', close: '' },
    ]
  });

  useEffect(() => {
    if (tenantInfo) {
      setForm(prev => ({
        ...prev,
        restaurantName: tenantInfo.name || tenantInfo.businessName || prev.restaurantName,
        gstNumber: tenantInfo.gstNumber || prev.gstNumber,
        storeAddress: tenantInfo.address || prev.storeAddress,
        primaryPhone: tenantInfo.phone || prev.primaryPhone,
        publicEmail: tenantInfo.email || prev.publicEmail,
        profitMargin: tenantInfo.settings?.profitMargin !== undefined ? tenantInfo.settings.profitMargin : prev.profitMargin,
        enableEstimatedPrepTime: tenantInfo.settings?.enableEstimatedPrepTime !== undefined ? tenantInfo.settings.enableEstimatedPrepTime : false,
        enableKhata: tenantInfo.settings?.enableKhata !== undefined ? tenantInfo.settings.enableKhata : false,
        enableCustomerOtp: tenantInfo.settings?.enableCustomerOtp !== undefined ? tenantInfo.settings.enableCustomerOtp : true,
        upiId: tenantInfo.settings?.upiId || '',
        upiPayeeName: tenantInfo.settings?.upiPayeeName || tenantInfo.name || '',
        enableDirectUpi: tenantInfo.settings?.enableDirectUpi !== false,
        operatingHours: tenantInfo.settings?.operatingHours || prev.operatingHours,
      }));
      if (tenantInfo.logo) setLogoPreview(tenantInfo.logo);
    }
  }, [tenantInfo]);

  const handleCopyMondayToAll = () => {
    const monday = form.operatingHours[0];
    setForm(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map(d => ({
        ...d,
        enabled: monday.enabled,
        open: monday.open,
        close: monday.close
      }))
    }));
    toast.success('Monday hours applied to all days!');
  };

  const handleToggleDay = (idx) => {
    setForm(prev => {
      const updated = [...prev.operatingHours];
      updated[idx].enabled = !updated[idx].enabled;
      if (!updated[idx].enabled) {
        updated[idx].open = 'Closed for Business';
        updated[idx].close = '';
      } else {
        updated[idx].open = '09:00 AM';
        updated[idx].close = '10:00 PM';
      }
      return { ...prev, operatingHours: updated };
    });
  };

  // Instant direct toggle for Khata (Customer Credit)
  const handleToggleKhataDirect = async (checked) => {
    setForm(prev => ({ ...prev, enableKhata: checked }));
    try {
      const token = localStorage.getItem('token');
      const tid = tenantInfo?._id || tenantInfo?.id;
      if (token && tid) {
        await axios.put(`${API_URL}/tenants/${tid}`, { enableKhata: checked }, {
          headers: { 'x-auth-token': token }
        });
      }
      if (onSave) {
        onSave({ enableKhata: checked });
      }
      if (checked) {
        toast.success('Customer Khata / Borrow feature enabled! POS and Khata Ledger are now active.', { duration: 4000 });
      } else {
        toast('Customer Khata feature disabled', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error updating Khata setting:', err);
      toast.error('Failed to update Khata setting');
    }
  };

  // Instant direct toggle for Kitchen Prep Time Estimation
  const handleTogglePrepTimeDirect = async (checked) => {
    setForm(prev => ({ ...prev, enableEstimatedPrepTime: checked }));
    try {
      const token = localStorage.getItem('token');
      const tid = tenantInfo?._id || tenantInfo?.id;
      if (token && tid) {
        await axios.put(`${API_URL}/tenants/${tid}`, { enableEstimatedPrepTime: checked }, {
          headers: { 'x-auth-token': token }
        });
      }
      if (onSave) {
        onSave({ enableEstimatedPrepTime: checked });
      }
      if (checked) {
        toast.success('Kitchen prep time estimation enabled!');
      } else {
        toast('Kitchen prep time estimation disabled', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error updating Prep Time setting:', err);
      toast.error('Failed to update Prep Time setting');
    }
  };

  // Instant direct toggle for Customer Order Verification (SMS OTP & Google Login)
  const handleToggleCustomerOtpDirect = async (checked) => {
    setForm(prev => ({ ...prev, enableCustomerOtp: checked }));
    try {
      const token = localStorage.getItem('token');
      const tid = tenantInfo?._id || tenantInfo?.id;
      if (token && tid) {
        await axios.put(`${API_URL}/tenants/${tid}`, { enableCustomerOtp: checked }, {
          headers: { 'x-auth-token': token }
        });
      }
      if (onSave) {
        onSave({ enableCustomerOtp: checked });
      }
      if (checked) {
        toast.success('Customer Verification enabled (SMS OTP & Google Login required for ordering)', { duration: 4000 });
      } else {
        toast('Customer Verification disabled. Diners can order as guest without OTP.', { icon: 'ℹ️', duration: 4000 });
      }
    } catch (err) {
      console.error('Error updating customer OTP setting:', err);
      toast.error('Failed to update verification setting');
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (form.primaryPhone && !/^[0-9]{10}$/.test(form.primaryPhone.trim())) {
      toast.error('Primary phone must be a valid 10-digit mobile number');
      return;
    }

    if (onSave) {
      onSave({
        name: form.restaurantName,
        restaurantName: form.restaurantName,
        logo: logoPreview,
        gstNumber: form.gstNumber,
        address: form.storeAddress,
        phone: form.primaryPhone,
        email: form.publicEmail,
        profitMargin: Number(form.profitMargin) || 40,
        enableEstimatedPrepTime: form.enableEstimatedPrepTime,
        enableKhata: form.enableKhata,
        enableCustomerOtp: form.enableCustomerOtp,
        upiId: form.upiId,
        upiPayeeName: form.upiPayeeName,
        enableDirectUpi: form.enableDirectUpi,
        operatingHours: form.operatingHours
      });
    } else {
      toast.success('Restaurant settings saved successfully!');
    }
  };

  const handleDiscard = () => {
    if (tenantInfo) {
      setForm({
        restaurantName: tenantInfo.name || tenantInfo.businessName || '',
        gstNumber: tenantInfo.gstNumber || '',
        storeAddress: tenantInfo.address || '',
        primaryPhone: tenantInfo.phone || '',
        publicEmail: tenantInfo.email || '',
        enableEstimatedPrepTime: tenantInfo.settings?.enableEstimatedPrepTime || false,
        enableKhata: tenantInfo.settings?.enableKhata || false,
        enableCustomerOtp: tenantInfo.settings?.enableCustomerOtp !== undefined ? tenantInfo.settings.enableCustomerOtp : true,
        operatingHours: tenantInfo.settings?.operatingHours || form.operatingHours
      });
      if (tenantInfo.logo) setLogoPreview(tenantInfo.logo);
    }
    toast('Changes reset to saved identity', { icon: '↩️' });
  };

  // Process and verify real payment before activating subscription
  const handleProcessSecurePayment = async () => {
    // Validate inputs depending on method
    if (payMethod === 'upi_vpa' && (!upiVpa || !upiVpa.includes('@'))) {
      toast.error('Please enter a valid UPI ID (e.g. yourname@okaxis)');
      return;
    }
    if (payMethod === 'card') {
      const cleanNum = cardData.number.replace(/\s+/g, '');
      if (cleanNum.length < 15 || !cardData.expiry || !cardData.cvv) {
        toast.error('Please enter valid card details (16-digit card, expiry, and CVV)');
        return;
      }
    }

    try {
      setIsUpgrading(true);
      setPaymentStep('verifying');

      // Realistic Payment Gateway Authorization & Verification Delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const token = localStorage.getItem('token');
      const generatedPaymentId = `PAY_RZP_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const bankRefNo = `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const paymentMethodName =
        payMethod === 'upi_qr' ? 'UPI Dynamic QR Scan (Instant)' :
          payMethod === 'upi_vpa' ? `UPI ID (${upiVpa})` :
            payMethod === 'card' ? `Credit/Debit Card (Ending in ${cardData.number.slice(-4) || '4242'})` :
              `Net Banking (${selectedBank})`;

      const res = await axios.post(`${API_URL}/tenants/upgrade-plan`, {
        planId: selectedPlanToUpgrade.id,
        plan: selectedPlanToUpgrade.id,
        price: selectedPlanToUpgrade.price,
        amount: selectedPlanToUpgrade.price,
        paymentMethod: paymentMethodName,
        paymentId: generatedPaymentId,
        transactionRef: bankRefNo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        const invoiceNumber = `INV-DINEVIQ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        setPaymentReceipt({
          invoiceNo: invoiceNumber,
          paymentId: generatedPaymentId,
          bankRef: bankRefNo,
          planName: selectedPlanToUpgrade.name,
          amount: selectedPlanToUpgrade.price,
          method: paymentMethodName,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          validity: selectedPlanToUpgrade.period
        });
        setPaymentStep('success');
        toast.success(`Payment of ₹${selectedPlanToUpgrade.price} verified! Plan upgraded to ${selectedPlanToUpgrade.name}!`, { duration: 5000 });
      }
    } catch (err) {
      setPaymentStep('checkout');
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const SECTIONS = [
    { id: 'all', label: 'All Settings', icon: Sliders },
    { id: 'general', label: 'General Identity', icon: Building2 },
    { id: 'operations', label: 'Operations & Hours', icon: Clock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'whatsapp', label: 'WhatsApp E-Bills', icon: MessageSquare },
    { id: 'language', label: 'Language & Display', icon: Globe },
    { id: 'audio', label: 'Audio & Chimes', icon: Volume2 },
    { id: 'subscription', label: 'Subscription & Plan', icon: ShieldCheck }
  ];

  const renderGeneral = () => (
    <section className={styles.sectionCard} id="general">
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBox}>
            <Building2 size={16} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>General Identity</h3>
            <p className={styles.cardSubtitle}>Logo, store information, and official contact channels</p>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.identityGrid}>
          {/* Logo Box */}
          <div className={styles.logoDropzone}>
            <label className={styles.fieldLabel}>Restaurant Logo</label>
            <div className={styles.logoBox}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className={styles.logoImage} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  <Building2 size={30} />
                  <span style={{ fontSize: '10px', marginTop: 4, color: '#94a3b8' }}>No Logo</span>
                </div>
              )}
              <label className={styles.replaceOverlay}>
                <Upload size={14} />
                <span>{logoPreview ? 'Change' : 'Upload'}</span>
                <small>PNG, JPG &lt; 5MB</small>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Logo file size must be under 5MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLogoPreview(reader.result);
                        toast.success('New logo selected');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Form fields */}
          <div className={styles.formCol}>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Restaurant Name</label>
                <div className={styles.inputWrapper}>
                  <Building2 size={14} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="e.g. Cafe Delight"
                    value={form.restaurantName}
                    onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                    className={styles.textInput}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>GST / Tax Number</label>
                <div className={styles.inputWrapper}>
                  <Receipt size={14} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Store Address</label>
              <div className={styles.inputWrapper}>
                <MapPin size={14} className={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. 1224 Main Road, Sector 5, City"
                  value={form.storeAddress}
                  onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                  className={styles.textInput}
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Primary Phone</label>
                <div className={styles.inputWrapper}>
                  <Phone size={14} className={styles.inputIcon} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit Phone No"
                    value={form.primaryPhone}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setForm({ ...form, primaryPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className={styles.textInput}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Public Email</label>
                <div className={styles.inputWrapper}>
                  <Mail size={14} className={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="e.g. contact@mycafe.com"
                    value={form.publicEmail}
                    onChange={(e) => setForm({ ...form, publicEmail: e.target.value })}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderOperations = () => (
    <section className={styles.sectionCard} id="operations">
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBox}>
            <Clock size={16} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Operations & Feature Controls</h3>
            <p className={styles.cardSubtitle}>Weekly schedule, kitchen prep timer, and financial switches</p>
          </div>
        </div>
        <button type="button" className={styles.copyBtn} onClick={handleCopyMondayToAll}>
          📋 Copy Monday to All
        </button>
      </div>

      <div className={styles.cardBody}>
        {/* Weekly hours */}
        <div className={styles.hoursList}>
          {form.operatingHours.map((schedule, idx) => (
            <div key={schedule.day} className={styles.hourRow}>
              <div className={styles.daySwitch}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={() => handleToggleDay(idx)}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.dayName}>{schedule.day}</span>
              </div>

              {schedule.enabled ? (
                <div className={styles.timeInputs}>
                  <input
                    type="text"
                    value={schedule.open}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => {
                        const updated = [...prev.operatingHours];
                        updated[idx].open = val;
                        return { ...prev, operatingHours: updated };
                      });
                    }}
                    className={styles.timeField}
                  />
                  <span className={styles.toLabel}>to</span>
                  <input
                    type="text"
                    value={schedule.close}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => {
                        const updated = [...prev.operatingHours];
                        updated[idx].close = val;
                        return { ...prev, operatingHours: updated };
                      });
                    }}
                    className={styles.timeField}
                  />
                </div>
              ) : (
                <span className={styles.closedBadge}>Closed for Business</span>
              )}
            </div>
          ))}
        </div>

        {/* Feature Switches */}
        <div className={styles.featureList}>
          <div className={styles.featureRow}>
            <div className={styles.featureInfo}>
              <span className={styles.featureTitle}>Kitchen Prep Time Estimation</span>
              <p className={styles.featureDesc}>Prompt staff for prep time &amp; show live countdown to diners</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.enableEstimatedPrepTime}
                onChange={(e) => handleTogglePrepTimeDirect(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureInfo}>
              <div className={styles.featureTitleWrap}>
                <span className={styles.featureTitle}>Customer Order Verification</span>
                <span className={styles.featureBadge} style={{ background: '#fef3c7', color: '#b45309' }}>SMS OTP &amp; GOOGLE</span>
              </div>
              <p className={styles.featureDesc}>
                Require customers to verify via SMS OTP or Google Login before placing table orders. Turn OFF to allow instant guest ordering without OTP (useful if SMS gateway is experiencing downtime).
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.enableCustomerOtp}
                onChange={(e) => handleToggleCustomerOtpDirect(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureInfo}>
              <div className={styles.featureTitleWrap}>
                <span className={styles.featureTitle}>Customer Khata &amp; Borrow Ledger</span>
                <span className={styles.featureBadge}>UDHAR</span>
              </div>
              <p className={styles.featureDesc}>Enable customer credit tracking at POS checkout &amp; Khata ledger</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.enableKhata}
                onChange={(e) => handleToggleKhataDirect(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.featureInfo}>
              <span className={styles.featureTitle}>Estimated Net Profit Margin (%)</span>
              <p className={styles.featureDesc}>Target margin percentage used for dashboard profit calculations</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                min="1"
                max="100"
                value={form.profitMargin ?? 40}
                onChange={(e) => setForm({ ...form, profitMargin: Math.max(1, Math.min(100, Number(e.target.value) || 0)) })}
                className={styles.profitInput}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderWhatsApp = () => (
    <section className={styles.sectionCard} id="whatsapp">
      <div className={styles.cardBody} style={{ padding: '18px 22px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#25D366',
              flexShrink: 0
            }}>
              <FaWhatsapp />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  WhatsApp E-Bill Dispatcher
                </h4>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: waConnected ? '#ecfdf5' : '#fef3c7',
                  color: waConnected ? '#059669' : '#b45309',
                  border: waConnected ? '1px solid #a7f3d0' : '1px solid #fde68a'
                }}>
                  {waConnected ? `Linked (+${waPhone})` : 'Not Linked'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                {waConnected
                  ? `Silent background dispatch active from +${waPhone}. Staff never need to log in.`
                  : 'Link cafe phone once to send digital bills silently to customers.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <QrCode size={14} />
            <span>{waConnected ? 'Manage Device' : 'Link Cafe Phone'}</span>
          </button>
        </div>
      </div>
    </section>
  );

  const renderLanguage = () => (
    <section className={styles.sectionCard} id="language">
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBox}>
            <Globe size={16} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Interface Language (भाषा)</h3>
            <p className={styles.cardSubtitle}>Choose dashboard and POS system language for your store</p>
          </div>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          background: isHindi ? '#fff7ed' : '#eff6ff',
          color: isHindi ? '#c2410c' : '#1d4ed8',
          border: isHindi ? '1px solid #fed7aa' : '1px solid #bfdbfe'
        }}>
          {isHindi ? '● सक्रिय: हिन्दी' : '● Active: English'}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.languageGrid}>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`${styles.languageCard} ${!isHindi ? styles.activeLanguage : ''}`}
          >
            <div>
              <span className={styles.langName}>🇬🇧 English</span>
              <span className={styles.langSub}>Default international layout</span>
            </div>
            {!isHindi && <Check size={16} color="#4f46e5" />}
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('hi')}
            className={`${styles.languageCard} ${isHindi ? styles.activeLanguage : ''}`}
          >
            <div>
              <span className={styles.langName}>🇮🇳 हिन्दी (Hindi)</span>
              <span className={styles.langSub}>पूरा डैशबोर्ड और पीओएस</span>
            </div>
            {isHindi && <Check size={16} color="#4f46e5" />}
          </button>
        </div>
      </div>
    </section>
  );

  const renderAudio = () => (
    <section className={styles.sectionCard} id="audio">
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBox}>
            <Volume2 size={16} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Order Chime &amp; Audio Alerts</h3>
            <p className={styles.cardSubtitle}>Sound notifications, volume level, and tone styles for new orders</p>
          </div>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          background: audioSettings.muted ? '#fee2e2' : '#ecfdf5',
          color: audioSettings.muted ? '#b91c1c' : '#059669',
          border: audioSettings.muted ? '1px solid #fecaca' : '1px solid #a7f3d0'
        }}>
          {audioSettings.muted ? '● Muted' : `● Active - Vol ${audioSettings.volume}`}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.audioBlock}>
          {/* Integrated Volume Control Row with Toggle on Icon */}
          <div className={styles.volumeControlRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label className={styles.switch} title={audioSettings.muted ? "Enable sound alerts" : "Mute sound alerts"}>
                <input
                  type="checkbox"
                  checked={!audioSettings.muted}
                  onChange={(e) => handleAudioMuteToggle(!e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>

              <button
                type="button"
                onClick={() => handleAudioMuteToggle(!audioSettings.muted)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                title={audioSettings.muted ? "Click to unmute" : "Click to mute"}
              >
                {audioSettings.muted || audioSettings.volume === 0 ? (
                  <VolumeX size={18} color="#ef4444" />
                ) : audioSettings.volume <= 4 ? (
                  <Volume1 size={18} color="#4f46e5" />
                ) : (
                  <Volume2 size={18} color="#4f46e5" />
                )}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: audioSettings.muted ? '#94a3b8' : '#334155' }}>
                  Volume
                </span>
              </button>
            </div>

            <div className={styles.volumeSliderWrap}>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                disabled={audioSettings.muted}
                value={audioSettings.muted ? 0 : audioSettings.volume}
                onChange={(e) => handleAudioVolumeChange(e.target.value)}
                className={styles.volumeSlider}
                style={{ opacity: audioSettings.muted ? 0.35 : 1, cursor: audioSettings.muted ? 'not-allowed' : 'pointer' }}
              />
              <span className={styles.volumeLevelTag}>
                {audioSettings.muted ? 'Muted' : `Level ${audioSettings.volume} / 10`}
              </span>
            </div>
          </div>

          {/* Compact Tone Variation Grid (Just Name & Play Button) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                Notification Tune (4 Styles)
              </span>
              <button
                type="button"
                onClick={() => previewTone(audioSettings.tone, audioSettings.volume)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #c7d2fe',
                  background: '#eef2ff',
                  color: '#4338ca',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Volume2 size={12} /> Test Current Tone
              </button>
            </div>

            <div className={styles.tuneGrid}>
              {TONE_OPTIONS.map(tone => {
                const isSelected = audioSettings.tone === tone.id;
                return (
                  <div
                    key={tone.id}
                    onClick={() => handleAudioToneChange(tone.id)}
                    className={`${styles.tuneCard} ${isSelected ? styles.activeToneCard : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={styles.tuneTitle}>{tone.label}</span>
                      {isSelected && <Check size={14} color="#4f46e5" />}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAudioToneChange(tone.id);
                        previewTone(tone.id, audioSettings.volume);
                      }}
                      className={`${styles.tunePlayBtn} ${isSelected ? styles.activeTunePlayBtn : ''}`}
                      title={`Preview ${tone.label}`}
                    >
                      <Play size={11} style={{ marginLeft: 1 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderSubscription = () => (
    <section className={styles.sectionCard} id="subscription">
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBox}>
            <CreditCard size={16} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Subscription &amp; In-App Upgrades</h3>
            <p className={styles.cardSubtitle}>Plan validity, active entitlements, and payment history</p>
          </div>
        </div>
        <span style={{
          background: tenantInfo?.subscription?.isActive !== false ? '#ecfdf5' : '#fee2e2',
          color: tenantInfo?.subscription?.isActive !== false ? '#059669' : '#b91c1c',
          border: tenantInfo?.subscription?.isActive !== false ? '1px solid #a7f3d0' : '1px solid #fecaca',
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600
        }}>
          {tenantInfo?.subscription?.isActive !== false ? '● ACTIVE PLAN' : '● DEACTIVATED'}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.subStatsGrid}>
          <div className={styles.subStatCard}>
            <span className={styles.subStatLabel}>Current Active Plan</span>
            <div className={styles.subStatValue}>
              {tenantInfo?.subscription?.plan === '1_year' ? '1 Year Ultimate Pro' : tenantInfo?.subscription?.plan === '6_months' ? '6 Months Saver' : '1 Month Starter'}
            </div>
          </div>
          <div className={styles.subStatCard}>
            <span className={styles.subStatLabel}>Plan Pricing</span>
            <div className={styles.subStatValueGreen}>
              ₹{tenantInfo?.subscription?.price || 999}
            </div>
          </div>
          <div className={styles.subStatCard}>
            <span className={styles.subStatLabel}>Plan Validity / Renewal</span>
            <div className={styles.subStatValue}>
              {tenantInfo?.subscription?.endDate ? new Date(tenantInfo.subscription.endDate).toLocaleDateString('en-IN') : 'Active Lifetime'}
            </div>
          </div>
        </div>

        <div className={styles.subNotice}>
          <ShieldCheck size={16} color="#4f46e5" style={{ flexShrink: 0 }} />
          <span>Subscription tiers and renewals are managed by Platform Super Admin. Contact support for custom enterprise tiers.</span>
        </div>

        {/* History table */}
        {(tenantInfo?.subscriptionHistory && tenantInfo.subscriptionHistory.length > 0) && (
          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
              Subscription Activity History
            </span>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action Date</th>
                </tr>
              </thead>
              <tbody>
                {tenantInfo.subscriptionHistory.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{item.plan}</td>
                    <td>₹{item.price}</td>
                    <td>
                      <span className={styles.statusActive}>
                        {item.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {item.actionDate ? new Date(item.actionDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderPayment = () => {
    const isLinked = Boolean(routeAccount?.isLinked || routeAccount?.accountId || tenantInfo?.razorpay?.accountId);
    const accountId = routeAccount?.accountId || tenantInfo?.razorpay?.accountId;
    const status = routeAccount?.accountStatus || tenantInfo?.razorpay?.accountStatus || 'created';
    const isLive = status === 'activated';

    return (
      <section className={styles.sectionCard} id="payment">
        <div className={styles.cardHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIconBox} style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <CreditCard size={16} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Payment Gateway &amp; Razorpay Route</h3>
              <p className={styles.cardSubtitle}>
                Connect your café bank account to receive customer order payouts directly via Razorpay Route
              </p>
            </div>
          </div>
          {isLinked && (
            <span className={isLive ? styles.statusPillActive : styles.statusPillReview}>
              {isLive ? '● ROUTE ACTIVE' : `● ${status.toUpperCase().replace('_', ' ')}`}
            </span>
          )}
        </div>

        <div className={styles.cardBody}>
          {/* ── 1. DIRECT CAFE UPI (INSTANT 0-SECOND BANK SETTLEMENT) ── */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#065f46' }}>
                    Direct Café UPI (Instant Bank Settlement &amp; 0% Fee)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#047857' }}>
                    Customer payments via Google Pay, PhonePe, Paytm, or Dynamic QR go 100% directly into your bank account!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GPayIcon size={22} />
                <PhonePeIcon size={22} />
                <PaytmIcon size={18} />
                <BhimIcon size={22} />
                <span style={{
                  background: (form.upiId && !form.upiId.endsWith('@gmail.com')) ? '#d1fae5' : '#fef3c7',
                  color: (form.upiId && !form.upiId.endsWith('@gmail.com')) ? '#065f46' : '#92400e',
                  border: (form.upiId && !form.upiId.endsWith('@gmail.com')) ? '1px solid #6ee7b7' : '1px solid #fde68a',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginLeft: '4px'
                }}>
                  {(form.upiId && !form.upiId.endsWith('@gmail.com')) ? '● UPI ACTIVE' : '● ENTER UPI ID'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) auto', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className={styles.inputGroup}>
                  <label style={{ color: '#065f46', fontWeight: 700 }}>Your Café UPI ID / VPA</label>
                  <div className={styles.inputWrapper}>
                    <Smartphone size={14} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="e.g. 9351862675@paytm or 9351862675@ybl or naveen935186@okaxis"
                      value={form.upiId}
                      onChange={(e) => setForm({ ...form, upiId: e.target.value.trim() })}
                      className={styles.textInput}
                      style={{
                        borderColor: form.upiId.endsWith('@gmail.com') ? '#ef4444' : '#a7f3d0',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Warning if email was entered */}
                  {form.upiId.endsWith('@gmail.com') && (
                    <div style={{
                      marginTop: '5px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fca5a5',
                      color: '#b91c1c',
                      fontSize: '0.74rem',
                      lineHeight: 1.4
                    }}>
                      <strong>❌ Attention:</strong> &quot;{form.upiId}&quot; is an email address, NOT a UPI ID. PhonePe and Google Pay will show &quot;Invalid QR code&quot; when scanned. A UPI ID must end with a bank handle like <code>@paytm</code>, <code>@ybl</code>, or <code>@okaxis</code>.
                    </div>
                  )}

                  {/* Helpful Quick Pick Suggestions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 600 }}>Quick suggestions:</span>
                    {['9351862675@paytm', '9351862675@ybl', 'naveen935186@okaxis'].map(sugg => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => setForm({ ...form, upiId: sugg })}
                        style={{
                          fontSize: '0.66rem',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          border: form.upiId === sugg ? '1px solid #059669' : '1px solid #cbd5e1',
                          background: form.upiId === sugg ? '#dcfce7' : '#ffffff',
                          color: form.upiId === sugg ? '#065f46' : '#334155',
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>

                  <small style={{ color: '#047857', fontSize: '0.72rem', marginTop: '3px' }}>
                    Accepts any UPI ID (PhonePe, Google Pay, Paytm, BHIM, Bank VPA).
                  </small>
                </div>

                <div className={styles.inputGroup}>
                  <label style={{ color: '#065f46', fontWeight: 600 }}>Payee Name (Shown in Customer's UPI App)</label>
                  <div className={styles.inputWrapper}>
                    <Building2 size={14} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="e.g. Cafee Delight"
                      value={form.upiPayeeName}
                      onChange={(e) => setForm({ ...form, upiPayeeName: e.target.value })}
                      className={styles.textInput}
                      style={{ borderColor: '#a7f3d0', background: '#ffffff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSave}
                    className={styles.saveBtn}
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)', alignSelf: 'flex-start' }}
                  >
                    <Check size={13} /> Save UPI Settings
                  </button>
                </div>
              </div>

              {/* Dynamic QR Live Test Preview */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #d1fae5',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                minWidth: '170px'
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#065f46', marginBottom: '8px' }}>
                  Live Dynamic QR Preview
                </span>
                <QRCodeSVG
                  value={buildUpiUri({
                    upiId: (form.upiId && !form.upiId.endsWith('@gmail.com')) ? form.upiId : '9351862675@paytm',
                    payeeName: form.upiPayeeName || form.restaurantName || 'Cafee',
                    amount: 100,
                    note: 'Sample Bill'
                  })}
                  size={125}
                  level="M"
                />
                <span style={{ fontSize: '0.7rem', color: '#334155', marginTop: '8px', fontWeight: 600 }}>
                  Pre-filled: <strong style={{ color: '#059669' }}>₹100.00</strong>
                </span>
                <span style={{ fontSize: '0.64rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                  ✓ Locks amount in GPay &amp; PhonePe
                </span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  <GPayIcon size={16} />
                  <PhonePeIcon size={16} />
                  <PaytmIcon size={14} />
                  <BhimIcon size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. RAZORPAY ROUTE MULTI-VENDOR GATEWAY (CARDS & NETBANKING) ── */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
              Razorpay Route (Optional: Cards, NetBanking &amp; Commission)
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#64748b' }}>
              Connect your Razorpay Linked Account ID to accept Credit/Debit cards and NetBanking with automated platform commission deduction.
            </p>
          </div>

          {isLinked ? (
            /* Connected Account View */
            <div className={styles.connectedCard}>
              <div className={styles.connectedCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {routeAccount?.businessName || tenantInfo?.name || 'Connected Café Account'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                      Linked ID: {accountId}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fetchRouteStatus(false)}
                    disabled={isCheckingRouteStatus}
                    className={styles.routeBtnSecondary}
                    title="Refresh live status from Razorpay Route"
                  >
                    <RefreshCw size={13} className={isCheckingRouteStatus ? 'animate-spin' : ''} />
                    <span>{isCheckingRouteStatus ? 'Checking...' : 'Check Status'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUnlinkRouteAccount}
                    className={styles.routeBtnDanger}
                    title="Disconnect this Razorpay account"
                  >
                    <Trash2 size={13} />
                    <span>Unlink</span>
                  </button>
                </div>
              </div>

              {/* Account Details Grid */}
              <div className={styles.subStatsGrid} style={{ marginTop: '1rem' }}>
                <div className={styles.subStatCard}>
                  <span className={styles.subStatLabel}>Razorpay Account ID</span>
                  <div className={styles.subStatValue} style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {accountId}
                  </div>
                </div>

                <div className={styles.subStatCard}>
                  <span className={styles.subStatLabel}>Bank Account</span>
                  <div className={styles.subStatValue} style={{ fontSize: '0.85rem' }}>
                    {routeAccount?.bankAccountNumber ? `•••• ${routeAccount.bankAccountNumber}` : 'Verified via Razorpay'}
                  </div>
                  {routeAccount?.bankIfsc && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>IFSC: {routeAccount.bankIfsc}</span>
                  )}
                </div>

                <div className={styles.subStatCard}>
                  <span className={styles.subStatLabel}>Settlement Schedule</span>
                  <div className={styles.subStatValueGreen} style={{ fontSize: '0.85rem' }}>
                    Auto-Route T+1/T+2
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Direct to Bank Account</span>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>
                  <strong>Active Route Account:</strong> Online customer payments made from the menu/cart are automatically routed to your connected bank account after platform commission deduction.
                </span>
              </div>
            </div>
          ) : (
            /* Unconnected Form */
            <div>
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.78rem',
                color: '#1e40af'
              }}>
                <Info size={16} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Connect your Bank Account via Razorpay Route:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#1e3a8a', lineHeight: 1.4 }}>
                    Link your café's Razorpay Account ID to receive order payments directly. Each café operates its own linked account so customer payments are safely segregated and routed directly.
                  </p>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className={styles.routeTabGroup}>
                <button
                  type="button"
                  className={`${styles.routeTabBtn} ${routeFormMode === 'connect_id' ? styles.routeTabBtnActive : ''}`}
                  onClick={() => setRouteFormMode('connect_id')}
                >
                  <Zap size={13} />
                  <span>Connect Razorpay Account ID (Quick / Test Mode)</span>
                </button>
                <button
                  type="button"
                  className={`${styles.routeTabBtn} ${routeFormMode === 'register_api' ? styles.routeTabBtnActive : ''}`}
                  onClick={() => setRouteFormMode('register_api')}
                >
                  <Building2 size={13} />
                  <span>Register Linked Account via API</span>
                </button>
              </div>

              <form onSubmit={handleConnectRouteAccount}>
                {routeFormMode === 'connect_id' ? (
                  <div className={styles.inputGroup} style={{ marginBottom: '1.25rem' }}>
                    <label>Razorpay Route Linked Account ID</label>
                    <div className={styles.inputWrapper}>
                      <CreditCard size={14} className={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder="e.g. acc_K0xxxxxxxxx or acc_test_123"
                        value={routeForm.accountId}
                        onChange={(e) => setRouteForm({ ...routeForm, accountId: e.target.value })}
                        className={styles.textInput}
                        required
                      />
                    </div>
                    <small style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
                      Found in your Razorpay Dashboard under <strong>Route &gt; Accounts</strong> (e.g. acc_xxxxxxxxxxxxxx).
                    </small>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label>Business / Trade Name</label>
                        <div className={styles.inputWrapper}>
                          <Building2 size={14} className={styles.inputIcon} />
                          <input
                            type="text"
                            placeholder="e.g. Blue Tokai Coffee"
                            value={routeForm.businessName}
                            onChange={(e) => setRouteForm({ ...routeForm, businessName: e.target.value })}
                            className={styles.textInput}
                            required
                          />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Legal Business Entity Type</label>
                        <select
                          value={routeForm.businessType}
                          onChange={(e) => setRouteForm({ ...routeForm, businessType: e.target.value })}
                          className={styles.textInput}
                          style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="individual">Individual / Proprietorship</option>
                          <option value="partnership">Partnership</option>
                          <option value="private_limited">Private Limited</option>
                          <option value="llp">LLP</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label>Contact Email</label>
                        <div className={styles.inputWrapper}>
                          <Mail size={14} className={styles.inputIcon} />
                          <input
                            type="email"
                            placeholder="cafe@example.com"
                            value={routeForm.email}
                            onChange={(e) => setRouteForm({ ...routeForm, email: e.target.value })}
                            className={styles.textInput}
                            required
                          />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Contact Phone (10 digits)</label>
                        <div className={styles.inputWrapper}>
                          <Phone size={14} className={styles.inputIcon} />
                          <input
                            type="tel"
                            placeholder="9876543210"
                            value={routeForm.phone}
                            onChange={(e) => setRouteForm({ ...routeForm, phone: e.target.value })}
                            className={styles.textInput}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label>Bank Account Number</label>
                        <div className={styles.inputWrapper}>
                          <CreditCard size={14} className={styles.inputIcon} />
                          <input
                            type="text"
                            placeholder="e.g. 50100234567890"
                            value={routeForm.accountNumber}
                            onChange={(e) => setRouteForm({ ...routeForm, accountNumber: e.target.value })}
                            className={styles.textInput}
                          />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Bank IFSC Code</label>
                        <div className={styles.inputWrapper}>
                          <Building2 size={14} className={styles.inputIcon} />
                          <input
                            type="text"
                            placeholder="e.g. HDFC0000123"
                            value={routeForm.ifscCode}
                            onChange={(e) => setRouteForm({ ...routeForm, ifscCode: e.target.value.toUpperCase() })}
                            className={styles.textInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingRoute}
                    className={styles.routeBtnPrimary}
                  >
                    <CheckCircle size={14} />
                    <span>{isSubmittingRoute ? 'Connecting...' : 'Connect Payment Account'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    );
  };


  return (
    <div className={styles.settingsContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <Settings size={18} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Restaurant Settings</h1>
            <p className={styles.pageBreadcrumb}>
              Configure identity, operating hours, audio and store preferences
            </p>
          </div>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.discardBtn} onClick={handleDiscard}>
            <RefreshCw size={13} /> Discard Changes
          </button>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            <Check size={13} /> Save Configuration
          </button>
        </div>
      </div>

      <div className={styles.layoutBody}>
        {/* Left Sub-nav */}
        <aside className={styles.subSidebar}>
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>Settings</span>
            {SECTIONS.map(sec => {
              const Icon = sec.icon;
              const isSelected = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  className={`${styles.navItem} ${isSelected ? styles.activeNav : ''}`}
                  onClick={() => setActiveSection(sec.id)}
                >
                  <div className={styles.navItemContent}>
                    <Icon size={15} className={styles.navIcon} />
                    <span>{sec.label}</span>
                  </div>
                  {isSelected && <ChevronRight size={14} color="#4f46e5" />}
                </button>
              );
            })}
          </div>

          {/* Active Plan Card */}
          <div className={styles.planSidebarCard}>
            <div className={styles.planCardTop}>
              <span className={styles.planBadge}>ACTIVE</span>
              <ShieldCheck size={13} color="#059669" />
            </div>
            <h4 className={styles.planName}>
              {tenantInfo?.subscription?.plan === 'pro' || tenantInfo?.subscription?.plan === '1_year' ? 'Pro Plan (₹999)' :
               tenantInfo?.subscription?.plan === 'growth' || tenantInfo?.subscription?.plan === '6_months' ? 'Growth Plan (₹799)' :
               tenantInfo?.subscription?.plan === 'custom' ? 'Custom Plan' :
               tenantInfo?.subscription?.plan === 'free_trial' ? 'Free Trial' :
               'Starter Plan (₹499)'}
            </h4>
            <p className={styles.planExpiry}>
              Exp: {tenantInfo?.subscription?.endDate ? new Date(tenantInfo.subscription.endDate).toLocaleDateString('en-IN') : 'Lifetime'}
            </p>
            <button
              type="button"
              className={styles.planUpgradeBtn}
              onClick={() => {
                setPaymentStep('select');
                setShowUpgradeModal(true);
              }}
            >
              <Sparkles size={12} /> Upgrade Plan
            </button>
          </div>
        </aside>

        {/* Right Settings Cards Area */}
        <div className={styles.cardsArea}>
          <AnimatePresence mode="wait">
            {activeSection === 'all' && (
              <motion.div
                key="all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {renderGeneral()}
                {renderOperations()}
                {renderPayment()}
                {renderWhatsApp()}
                {renderLanguage()}
                {renderAudio()}
                {renderSubscription()}
              </motion.div>
            )}

            {activeSection === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderGeneral()}
              </motion.div>
            )}

            {activeSection === 'operations' && (
              <motion.div
                key="operations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderOperations()}
              </motion.div>
            )}

            {activeSection === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderPayment()}
              </motion.div>
            )}

            {activeSection === 'whatsapp' && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderWhatsApp()}
              </motion.div>
            )}

            {activeSection === 'language' && (
              <motion.div
                key="language"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderLanguage()}
              </motion.div>
            )}

            {activeSection === 'audio' && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderAudio()}
              </motion.div>
            )}

            {activeSection === 'subscription' && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderSubscription()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          <footer className={styles.settingsFooter}>
            <span>© 2026 DINEVIQ OS - Enterprise POS & Cafe Management Suite.</span>
            <div className={styles.footerLinks}>
              <a href="#privacy">Privacy Policy</a>
              <a href="#audit">Audit Logs</a>
              <a href="#system">System Health</a>
            </div>
          </footer>
        </div>
      </div>

      {/* ========================================================= */}
      {/* IN-APP PLAN UPGRADE & SECURE PAYMENT GATEWAY MODAL         */}
      {/* ========================================================= */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} onClick={() => { if (!isUpgrading) setShowUpgradeModal(false); }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: paymentStep === 'checkout' ? '640px' : '720px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '24px',
            maxHeight: '92vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#2563eb" />
                  {paymentStep === 'select' && 'Upgrade DINEVIQ Subscription'}
                  {paymentStep === 'checkout' && 'Secure Checkout & Payment Gateway'}
                  {paymentStep === 'verifying' && 'Payment Verification'}
                  {paymentStep === 'success' && 'Payment Verified & Plan Activated!'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {paymentStep === 'select' && 'Choose your plan to activate premium capabilities.'}
                  {paymentStep === 'checkout' && 'Complete payment via UPI QR, Cards, or NetBanking to activate.'}
                  {paymentStep === 'verifying' && 'Connecting to Razorpay & Banking Network...'}
                  {paymentStep === 'success' && 'Your subscription invoice and payment have been confirmed.'}
                </p>
              </div>
              {!isUpgrading && (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* STEP 1: SELECT PLAN */}
            {paymentStep === 'select' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  {AVAILABLE_PLANS.map(plan => {
                    const isSelected = selectedPlanToUpgrade.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanToUpgrade(plan)}
                        style={{
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          borderRadius: '14px',
                          padding: '16px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {plan.popular && (
                          <span style={{
                            position: 'absolute',
                            top: -10,
                            right: 12,
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '100px'
                          }}>
                            BEST VALUE
                          </span>
                        )}
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{plan.name}</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb', marginBottom: '10px' }}>
                          ₹{plan.price.toLocaleString()}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}> / {plan.period}</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {plan.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStep('checkout')}
                    style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Lock size={15} /> Proceed to Secure Payment (₹{selectedPlanToUpgrade.price})
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SECURE CHECKOUT GATEWAY */}
            {paymentStep === 'checkout' && (
              <div>
                {/* Order Summary Box */}
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: '#475569' }}>
                    <span>Selected Plan:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedPlanToUpgrade.name} ({selectedPlanToUpgrade.period})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: '#475569' }}>
                    <span>GST (18% inclusive):</span>
                    <strong style={{ color: '#0f172a' }}>₹{Math.round(selectedPlanToUpgrade.price * 0.18)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#16a34a', borderTop: '1px dashed #cbd5e1', paddingTop: 6, marginTop: 4 }}>
                    <span>Total Amount Payable:</span>
                    <span>₹{selectedPlanToUpgrade.price}</span>
                  </div>
                </div>

                {/* Gateway Method Selector Tabs */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                    Select Payment Mode:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setPayMethod('upi_qr')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: payMethod === 'upi_qr' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: payMethod === 'upi_qr' ? '#eff6ff' : '#ffffff',
                        color: payMethod === 'upi_qr' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <QrCode size={18} />
                      <span>UPI Dynamic QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('upi_vpa')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: payMethod === 'upi_vpa' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: payMethod === 'upi_vpa' ? '#eff6ff' : '#ffffff',
                        color: payMethod === 'upi_vpa' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Smartphone size={18} />
                      <span>UPI ID / VPA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('card')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: payMethod === 'card' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: payMethod === 'card' ? '#eff6ff' : '#ffffff',
                        color: payMethod === 'card' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <CreditCard size={18} />
                      <span>Card / NetBanking</span>
                    </button>
                  </div>
                </div>

                {/* Method Specific UI */}
                {payMethod === 'upi_qr' && (
                  <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <div style={{ display: 'inline-block', padding: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=dineviq.payments@icici&pn=DINEVIQ%20Cafe%20OS&am=${selectedPlanToUpgrade.price}&cu=INR&tn=Plan_${selectedPlanToUpgrade.id}`}
                        alt="UPI Payment QR Code"
                        style={{ width: '150px', height: '150px', display: 'block' }}
                      />
                    </div>
                    <div style={{ marginTop: 10, fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      Scan using Google Pay, PhonePe, Paytm, or any UPI App
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                      Merchant: DINEVIQ Enterprise Payments | VPA: <code>dineviq.payments@icici</code>
                    </div>
                  </div>
                )}

                {payMethod === 'upi_vpa' && (
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Enter your UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mobileNumber@upi / yourname@okaxis"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6 }}>
                      A collect request for ₹{selectedPlanToUpgrade.price} will be initiated to your UPI app.
                    </div>
                  </div>
                )}

                {payMethod === 'card' && (
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8921"
                        maxLength="19"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          maxLength="5"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>CVV / CVC</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength="4"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gateway Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentStep('select')}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleProcessSecurePayment}
                    disabled={isUpgrading}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    <Lock size={15} />
                    <span>Pay & Activate (₹{selectedPlanToUpgrade.price})</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFYING STATE */}
            {paymentStep === 'verifying' && (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 16 }}>
                  <RefreshCw size={40} color="#2563eb" />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Verifying Payment with Bank Gateway...
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Authenticating transaction of ₹{selectedPlanToUpgrade.price}. Please do not close this window.
                </p>
              </div>
            )}

            {/* STEP 4: PAYMENT SUCCESS & INVOICE RECEIPT */}
            {paymentStep === 'success' && paymentReceipt && (
              <div style={{ padding: '10px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Check size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Payment Verified & Activated!</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Your subscription has been successfully updated.
                  </p>
                </div>

                {/* Tax Invoice Breakdown */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 20, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 8, fontWeight: 700 }}>
                    <span style={{ color: '#64748b' }}>Tax Invoice No:</span>
                    <span style={{ color: '#0f172a' }}>{paymentReceipt.invoiceNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Transaction ID:</span>
                    <code style={{ color: '#2563eb', fontWeight: 700 }}>{paymentReceipt.paymentId}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{paymentReceipt.method}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Upgraded Plan:</span>
                    <strong style={{ color: '#0f172a' }}>{paymentReceipt.planName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Payment Date & Time:</span>
                    <span style={{ color: '#0f172a' }}>{paymentReceipt.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 8, fontSize: '0.95rem', fontWeight: 900, color: '#16a34a' }}>
                    <span>Amount Paid (Net):</span>
                    <span>₹{paymentReceipt.amount}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { window.print(); }}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
                  >
                    <Printer size={15} /> Print Tax Receipt
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setPaymentStep('select');
                      window.location.reload();
                    }}
                    style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Finish & Refresh Workspace
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* WhatsApp Link Modal */}
      <WhatsAppConnectModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        tenantInfo={tenantInfo}
      />

    </div>
  );
}

