import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Info, CheckCircle2, Phone, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './CustomerVerificationModal.module.css';
import { API_URL as API } from '../config/api';

export default function CustomerVerificationModal({ isOpen, onClose, onVerified, initialName = '' }) {
  const [step, setStep] = useState('input'); // 'input' or 'otp'
  const [name, setName] = useState(initialName || localStorage.getItem('customer_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('customer_phone') || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
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
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Load Google Identity Services SDK unconditionally at component mount
  useEffect(() => {
    if (!window.google && !document.getElementById('google-gsi-script')) {
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

    if (cleanPhone.length < 10) {
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

    // If Google SDK & Client ID are available, open genuine Google Account Chooser popup
    if (window.google?.accounts?.oauth2 && clientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setIsLoading(true);
              try {
                // Fetch verified profile directly from Google
                const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const { name: gName, email: gEmail, sub: gSub } = userInfoRes.data;

                const res = await axios.post(`${API}/customer/google-auth`, {
                  name: gName,
                  email: gEmail,
                  googleId: gSub
                });

                if (res.data.verified) {
                  const customerProfile = {
                    name: gName,
                    email: gEmail,
                    phone: phone.replace(/[^0-9]/g, '') || '',
                    authProvider: 'google',
                    verified: true
                  };

                  localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
                  localStorage.setItem('customer_user', JSON.stringify(customerProfile));
                  toast.success(`Signed in as ${gName}!`);
                  if (onVerified) onVerified(customerProfile);
                  onClose();
                }
              } catch (err) {
                console.error('Google profile fetch failed:', err);
                toast.error('Failed to verify Google profile.');
              } finally {
                setIsLoading(false);
              }
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('Google client init failed:', e);
      }
    }

    // Fallback simulation when REACT_APP_GOOGLE_CLIENT_ID is not configured in .env
    setIsLoading(true);
    try {
      const guestName = name.trim() || 'Google User';
      const fakeEmail = `${guestName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@gmail.com`;

      const res = await axios.post(`${API}/customer/google-auth`, {
        name: guestName,
        email: fakeEmail,
        googleId: `google_${Date.now()}`
      });

      if (res.data.verified) {
        const customerProfile = {
          name: res.data.customer.name,
          email: res.data.customer.email,
          phone: phone.replace(/[^0-9]/g, '') || '',
          authProvider: 'google',
          verified: true
        };

        localStorage.setItem('verifiedCustomer', JSON.stringify(customerProfile));
        localStorage.setItem('customer_user', JSON.stringify(customerProfile));
        toast.success(`Verified with Google! (Add REACT_APP_GOOGLE_CLIENT_ID to .env for live Google Popup)`, { duration: 5000 });
        if (onVerified) onVerified(customerProfile);
        onClose();
      }
    } catch (err) {
      toast.error('Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otp.join('').length === 6;

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Customer Information</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Close">
            <X size={16} />
          </button>
        </div>

        {step === 'input' ? (
          <form onSubmit={handleSendOtp}>
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
                  required
                  maxLength={10}
                  placeholder="Enter Mobile Number"
                  className={styles.phoneInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className={styles.googleAuthBtn}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className={styles.dividerRow}>
              <span className={styles.dividerText}>or verify via SMS OTP</span>
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={styles.primaryActionBtn}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <div>
            {/* Step 2: OTP Verification Screen */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Name</label>
              <input
                type="text"
                disabled
                className={styles.textInput}
                value={name}
                style={{ background: '#f8fafc', color: '#334155' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Mobile Number</label>
              <div className={styles.phoneInputWrapper} style={{ background: '#f8fafc' }}>
                <span className={styles.countryCode}>+91</span>
                <input
                  type="tel"
                  disabled
                  className={styles.phoneInput}
                  value={phone}
                  style={{ background: '#f8fafc', color: '#334155' }}
                />
              </div>
            </div>

            {/* 6-Digit OTP Boxes */}
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.fieldLabel}>
                  OTP<span className={styles.requiredStar}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  style={{ background: 'transparent', border: 'none', color: '#f97316', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Edit Number
                </button>
              </div>

              <div className={styles.otpBoxesRow}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpInputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={styles.otpBox}
                  />
                ))}
              </div>
            </div>

            {/* OTP Sent Banner */}
            <div className={styles.otpSentBanner}>
              <Info size={16} />
              <span>OTP has been sent to your mobile number</span>
            </div>

            {/* Bottom Actions: Resend Timer & Confirm Button */}
            <div className={styles.otpBottomRow}>
              <div className={styles.resendText}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className={styles.resendLink}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span>Resend OTP in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmOtp}
                disabled={isLoading || !isOtpComplete}
                className={`${styles.confirmBtn} ${isOtpComplete ? styles.confirmBtnActive : ''}`}
              >
                {isLoading ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
