import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, CheckCircle2, ShieldCheck, User, Phone, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './CustomerVerificationModal.module.css';
import { API_URL as API } from '../config/api';

export default function CustomerVerificationModal({ isOpen, onClose, onVerified, initialName = '' }) {
  const [step, setStep] = useState('info'); // 'info' | 'otp'
  const [name, setName] = useState(initialName || localStorage.getItem('customer_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('customer_phone') || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [hasOtpError, setHasOtpError] = useState(false);

  const otpInputsRef = useRef([]);
  const hasGoogleClientId = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);

  // Reset & Prefill on Open
  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setIsLoading(false);
      setHasOtpError(false);
      setOtp(['', '', '', '', '', '']);
      const storedName = initialName || localStorage.getItem('customer_name') || '';
      const storedPhone = localStorage.getItem('customer_phone') || '';
      if (storedName) setName(storedName);
      if (storedPhone) setPhone(storedPhone);
    }
  }, [isOpen, initialName]);

  // Countdown Timer for OTP Resend
  useEffect(() => {
    let timer = null;
    if (isOpen && step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, step, countdown]);

  // Load Google Identity Services SDK if configured
  useEffect(() => {
    if (hasGoogleClientId && !window.google && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [hasGoogleClientId]);

  // 1. Send OTP to Mobile
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setHasOtpError(false);
    try {
      const res = await axios.post(`${API}/customer/send-otp`, {
        phone: cleanPhone,
        name: name.trim()
      });

      localStorage.setItem('customer_name', name.trim());
      localStorage.setItem('customer_phone', cleanPhone);

      toast.success(res.data.message || `OTP sent to +91 ${cleanPhone}`);

      // If in demo/dev mode (no SMS gateway active), show convenient demo toast
      if (res.data.devOtp) {
        toast(`Demo OTP: ${res.data.devOtp}`, { icon: '🔑', duration: 7000 });
      }

      setStep('otp');
      setCountdown(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 200);
    } catch (err) {
      console.error('Send OTP failed:', err);
      toast.error(err.response?.data?.error || 'Failed to send OTP. Please check your number.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    await handleSendOtp();
  };

  // 3. OTP Digit Input & Paste Handling
  const handleOtpChange = (idx, value) => {
    setHasOtpError(false);
    const clean = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (clean.length > 1) {
      // User pasted full 6-digit code
      const digits = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpInputsRef.current[nextIdx]?.focus();

      if (digits.length === 6) {
        triggerVerify(newOtp.join(''));
      }
      return;
    }

    newOtp[idx] = clean;
    setOtp(newOtp);

    // Auto-advance to next box
    if (clean && idx < 5) {
      otpInputsRef.current[idx + 1]?.focus();
    }

    // Auto-verify when 6th digit is typed
    if (clean && idx === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        triggerVerify(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputsRef.current[idx - 1]?.focus();
    }
  };

  // 4. Verify OTP Code
  const triggerVerify = async (otpCode) => {
    const fullOtp = otpCode || otp.join('');
    if (fullOtp.length < 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    setHasOtpError(false);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const tenantId = localStorage.getItem('tenantId') || '';
      const res = await axios.post(`${API}/customer/verify-otp`, {
        phone: cleanPhone,
        otp: fullOtp,
        name: name.trim(),
        tenantId
      });

      if (res.data?.verified) {
        const customerProfile = {
          name: name.trim() || res.data.customer?.name || 'Valued Guest',
          phone: cleanPhone,
          verified: true,
          authProvider: 'phone_otp'
        };

        localStorage.setItem('customer_name', customerProfile.name);
        localStorage.setItem('customer_phone', cleanPhone);
        localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
        localStorage.setItem('customer_user', JSON.stringify(customerProfile));

        toast.success(`Verified successfully! Placing order...`);
        if (onVerified) onVerified(customerProfile);
        onClose();
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      setHasOtpError(true);
      toast.error(err.response?.data?.error || 'Incorrect OTP code. Please check SMS and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Fallback
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
                localStorage.setItem('customer_name', customerProfile.name);
                if (customerProfile.phone) localStorage.setItem('customer_phone', customerProfile.phone);
                localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
                localStorage.setItem('customer_user', JSON.stringify(customerProfile));

                if (onVerified) onVerified(customerProfile);
                onClose();
              }
            } catch (err) {
              console.error('Google profile verification failed:', err);
              toast.error('Unable to verify Google profile. Please use mobile OTP.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      });
      client.requestAccessToken();
    } catch (e) {
      console.warn('Google client init failed:', e);
      toast.error('Google Sign-In failed. Please use mobile verification.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        
        {/* Step 1: Name & Mobile Number */}
        {step === 'info' && (
          <>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#f97316" />
                <h3 className={styles.modalTitle}>Customer Verification</h3>
              </div>
              <button type="button" onClick={onClose} className={styles.closeBtn} title="Close">
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
              Please enter your name and phone number to verify your table order via OTP.
            </p>

            <form onSubmit={handleSendOtp}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>
                  Full Name<span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className={styles.textInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Mobile Number with +91 Country Code */}
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>
                  Mobile Number (for SMS OTP)<span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.phoneInputWrapper}>
                  <span className={styles.countryCode}>+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
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

              {/* Google OAuth Option (if configured) */}
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

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={styles.primaryActionBtn}
                style={{ marginTop: '1rem' }}
              >
                {isLoading ? 'Sending SMS OTP...' : 'Get Verification OTP'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: 6-Digit OTP Verification Screen */}
        {step === 'otp' && (
          <>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className={styles.closeBtn}
                  style={{ background: '#f1f5f9', color: '#334155', marginRight: '4px' }}
                  title="Back to phone number"
                >
                  <ArrowLeft size={16} />
                </button>
                <h3 className={styles.modalTitle}>Enter 6-Digit OTP</h3>
              </div>
              <button type="button" onClick={onClose} className={styles.closeBtn} title="Close">
                <X size={16} />
              </button>
            </div>

            {/* Sent Status Banner */}
            <div className={styles.otpSentBanner}>
              <CheckCircle2 size={16} color="#15803d" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                Code sent to <strong>+91 {phone.slice(0, 2)}****{phone.slice(-4)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('info')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Change
              </button>
            </div>

            {/* Error Banner */}
            {hasOtpError && (
              <div className={styles.otpErrorBanner}>
                <span>Incorrect OTP. Please check your SMS or resend code.</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); triggerVerify(); }}>
              {/* 6 Digit Input Boxes */}
              <div className={styles.otpBoxesRow}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className={`${styles.otpBox} ${hasOtpError ? styles.otpBoxError : ''}`}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>

              {/* Resend & Timer Info */}
              <div className={styles.otpBottomRow}>
                {countdown > 0 ? (
                  <span className={styles.resendText}>
                    Resend code in <strong style={{ color: '#0f172a' }}>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className={styles.resendLink}
                    disabled={isLoading}
                  >
                    Resend OTP via SMS
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length < 6}
                  className={`${styles.confirmBtn} ${otp.join('').length === 6 && !isLoading ? styles.confirmBtnActive : ''}`}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Place Order'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
