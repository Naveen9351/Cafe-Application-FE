import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, ShieldCheck, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './CustomerVerificationModal.module.css';
import { API_URL as API } from '../config/api';

export default function CustomerVerificationModal({ isOpen, onClose, onVerified, initialName = '' }) {
  const [name, setName] = useState(initialName || localStorage.getItem('customer_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('customer_phone') || '');
  const [isLoading, setIsLoading] = useState(false);

  const hasGoogleClientId = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      const storedName = initialName || localStorage.getItem('customer_name') || '';
      const storedPhone = localStorage.getItem('customer_phone') || '';
      if (storedName) setName(storedName);
      if (storedPhone) setPhone(storedPhone);
    }
  }, [isOpen, initialName]);

  // Load Google Identity Services SDK only if a real client ID is configured
  useEffect(() => {
    if (hasGoogleClientId && !window.google && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10 || !/^[0-9]{10}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/customer/send-otp`, {
        phone: cleanPhone,
        name: name.trim()
      });

      localStorage.setItem('customer_name', name.trim());
      localStorage.setItem('customer_phone', cleanPhone);

      toast.success(res.data.message || 'OTP sent to mobile number');

      if (res.data.devOtp) {
        // Helpful dev preview
        toast(`Demo OTP: ${res.data.devOtp}`, { icon: '🔑', duration: 6000 });
      }

      setStep('otp');
      setCountdown(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err) {
      console.error('Send OTP failed:', err);
      toast.error(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (idx, value) => {
    // Only accept numeric input
    const clean = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (clean.length > 1) {
      // Pasted full 6-digit code
      const digits = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    newOtp[idx] = clean;
    setOtp(newOtp);

    // Auto-advance to next box if filled
    if (clean && idx < 5) {
      otpInputsRef.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputsRef.current[idx - 1]?.focus();
    }
  };

  const handleConfirmOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const res = await axios.post(`${API}/customer/verify-otp`, {
        phone: cleanPhone,
        otp: fullOtp,
        name: name.trim()
      });

      if (res.data.verified) {
        const customerProfile = {
          name: name.trim() || res.data.customer?.name || 'Valued Guest',
          phone: cleanPhone,
          verified: true
        };

        localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
        toast.success(`Welcome, ${customerProfile.name}! Verified successfully.`);
        if (onVerified) onVerified(customerProfile);
        onClose();
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      toast.error(err.response?.data?.error || 'Incorrect OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth / Google Identity Services Integration
  const handleGoogleLogin = async () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!window.google?.accounts?.oauth2 || !clientId) return;

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse?.access_token) {
            setIsLoading(true);
            try {
              let gName = '';
              let gEmail = '';
              let gSub = '';
              let gPic = '';

              // Try native fetch to get profile (native fetch is immune to Axios auth interceptors)
              try {
                const uInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (uInfoRes.ok) {
                  const uData = await uInfoRes.json();
                  gName = uData.name || '';
                  gEmail = uData.email || '';
                  gSub = uData.sub || '';
                  gPic = uData.picture || '';
                }
              } catch (fetchErr) {
                console.warn('Native userinfo fetch fallback:', fetchErr);
              }

              // Send accessToken + extracted profile to backend
              const res = await axios.post(`${API}/customer/google-auth`, {
                accessToken: tokenResponse.access_token,
                name: gName || name || (gEmail ? gEmail.split('@')[0] : ''),
                email: gEmail,
                googleId: gSub,
                picture: gPic,
                phone: phone.replace(/[^0-9]/g, '') || ''
              });

              if (res.data?.verified && res.data.customer) {
                const customerProfile = res.data.customer;
                if (customerProfile.name) setName(customerProfile.name);
                if (customerProfile.phone) setPhone(customerProfile.phone);

                localStorage.setItem('customer_name', customerProfile.name);
                if (customerProfile.phone) localStorage.setItem('customer_phone', customerProfile.phone);
                localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
                localStorage.setItem('customer_user', JSON.stringify(customerProfile));

                if (onVerified) onVerified(customerProfile);
                onClose();
              }
            } catch (err) {
              console.error('Google profile verification failed:', err);
              toast.error(err.response?.data?.error || 'Unable to verify Google profile. Please try again or use mobile.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      });
      client.requestAccessToken();
    } catch (e) {
      console.warn('Google client init failed:', e);
      toast.error('Google Sign-In initialization failed. Please use mobile verification.');
    }
  };

  // Direct Free Customer Verification (Zero SMS fee, Instant checkout)
  const handleDirectVerify = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const tenantId = localStorage.getItem('tenantId') || '';
      const res = await axios.post(`${API}/customer/quick-verify`, {
        phone: cleanPhone,
        name: name.trim(),
        tenantId
      });

      const customerProfile = {
        name: name.trim(),
        phone: cleanPhone,
        verified: true,
        authProvider: 'instant'
      };

      localStorage.setItem('customer_name', name.trim());
      localStorage.setItem('customer_phone', cleanPhone);
      localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
      localStorage.setItem('customer_user', JSON.stringify(customerProfile));

      if (onVerified) onVerified(customerProfile);
      onClose();
    } catch (err) {
      console.error('Customer verification error:', err);
      // Fallback: If network or server error, still allow dine-in guest to place order seamlessly
      const fallbackProfile = {
        name: name.trim(),
        phone: cleanPhone,
        verified: true,
        authProvider: 'offline_guest'
      };
      localStorage.setItem('customer_name', name.trim());
      localStorage.setItem('customer_phone', cleanPhone);
      localStorage.setItem('verifiedCustomer', JSON.stringify(fallbackProfile));
      localStorage.setItem('customer_user', JSON.stringify(fallbackProfile));
      if (onVerified) onVerified(fallbackProfile);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className={styles.modalTitle} style={{ margin: 0 }}>Customer Information</h3>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleDirectVerify}>
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>
              Name<span className={styles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter Name"
              className={styles.textInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Mobile Number with +91 Country Code */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>
              Mobile Number<span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.countryCode}>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                placeholder="10-digit Mobile Number"
                className={styles.phoneInput}
                value={phone}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              />
            </div>
          </div>

          {/* Real Google OAuth Button (Only shown if client ID is configured) */}
          {hasGoogleClientId && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className={styles.googleAuthBtn}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className={styles.dividerRow}>
                <span className={styles.dividerText}>or continue with mobile</span>
              </div>
            </>
          )}

          {/* Confirm & Place Order Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.primaryActionBtn}
            style={{ marginTop: '0.85rem' }}
          >
            {isLoading ? 'Confirming...' : 'Confirm & Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
