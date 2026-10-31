import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Store, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle2, Sparkles,
    AlertCircle, Eye, EyeOff, Check, X, User, KeyRound, ShieldCheck, Clock,
    Home
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './TenantRegister.module.css';
import BrandLogo from './BrandLogo';
import { API_URL as API } from '../config/api';

const TenantRegister = ({ embedded = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { registerTenant } = useAuth();

    // Invite token from URL
    const queryParams = new URLSearchParams(location.search);
    const inviteParam = queryParams.get('invite') || queryParams.get('token') || '';

    const [inviteToken, setInviteToken] = useState(inviteParam);
    const [isInviteValid, setIsInviteValid] = useState(false);
    const [verifyingInvite, setVerifyingInvite] = useState(Boolean(inviteParam));

    // Form fields
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        otp: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);

    // Email OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [isEmailOtpVerified, setIsEmailOtpVerified] = useState(false);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const otpInputsRef = React.useRef([]);

    // Keep otpDigits synchronized if formData.otp changes externally
    useEffect(() => {
        if (formData.otp) {
            const digits = formData.otp.slice(0, 6).split('');
            setOtpDigits(prev => {
                const next = ['', '', '', '', '', ''];
                digits.forEach((d, i) => { next[i] = d; });
                return next;
            });
        }
    }, [formData.otp]);

    // Terms checkbox
    const [agreedTerms, setAgreedTerms] = useState(true);

    // Post-submission state
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedApplication, setSubmittedApplication] = useState(null);

    // 1. If an invitation token is in URL, verify and pre-fill details
    useEffect(() => {
        if (!inviteToken) return;

        const verifyInvite = async () => {
            try {
                setVerifyingInvite(true);
                const res = await axios.get(`${API}/auth/verify-invite/${inviteToken}`);
                if (res.data && res.data.valid) {
                    setIsInviteValid(true);
                    setIsEmailOtpVerified(false);

                    // Sanitize address/city so emails are never populated into address field
                    const rawAddress = res.data.address || res.data.city || '';
                    const safeAddress = (rawAddress && !rawAddress.includes('@')) ? rawAddress : '';

                    setFormData(prev => ({
                        ...prev,
                        email: res.data.email || prev.email,
                        businessName: res.data.businessName || prev.businessName,
                        phone: res.data.phone && res.data.phone !== '0000000000' ? res.data.phone : prev.phone,
                        address: safeAddress || prev.address
                    }));
                    toast.success('Invitation link verified! Please verify your email via OTP to continue.');
                }
            } catch (err) {
                console.warn('Invite token invalid:', err.response?.data?.error);
                toast.error(err.response?.data?.error || 'Invitation link is invalid or expired.');
                setInviteToken('');
            } finally {
                setVerifyingInvite(false);
            }
        };

        verifyInvite();
    }, [inviteToken]);

    // Timer for OTP resend countdown
    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    // Password criteria check
    const passwordCriteria = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password)
    };
    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    // Send OTP to email
    const handleSendOtp = async () => {
        const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
        if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
            setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address first.' }));
            return;
        }

        try {
            setSendingOtp(true);
            setGeneralError('');
            const res = await axios.post(`${API}/auth/send-register-otp`, {
                email: formData.email.trim(),
                businessName: formData.businessName.trim()
            });

            if (res.data && res.data.success) {
                setOtpSent(true);
                setOtpCountdown(60);
                setOtpDigits(['', '', '', '', '', '']);
                setFormData(prev => ({ ...prev, otp: '' }));
                toast.success(res.data.message || 'Verification code sent! Please check your Inbox and Spam/Junk folder.');
                setTimeout(() => {
                    otpInputsRef.current[0]?.focus();
                }, 100);
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to send verification code. Please check your email.';
            setGeneralError(msg);
            toast.error(msg);
        } finally {
            setSendingOtp(false);
        }
    };

    // Verify 6-digit OTP
    const handleVerifyOtp = async (codeToVerify) => {
        const otpCode = (typeof codeToVerify === 'string' ? codeToVerify : formData.otp || otpDigits.join('')).trim();
        if (!otpCode || otpCode.length !== 6) {
            setFieldErrors(prev => ({ ...prev, otp: 'Please enter the complete 6-digit verification code.' }));
            return;
        }

        try {
            setVerifyingOtp(true);
            setFieldErrors(prev => ({ ...prev, otp: '', email: '' }));
            const res = await axios.post(`${API}/auth/verify-register-otp`, {
                email: formData.email.trim(),
                otp: otpCode
            });

            if (res.data?.success) {
                setIsEmailOtpVerified(true);
                toast.success('Email verified successfully! ✓');
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Invalid or expired OTP code.';
            setFieldErrors(prev => ({ ...prev, otp: msg }));
            toast.error(msg);
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Handle individual OTP digit box changes
    const handleOtpDigitChange = (index, value) => {
        if (fieldErrors.otp) {
            setFieldErrors(prev => ({ ...prev, otp: '' }));
        }

        const cleanVal = value.replace(/[^0-9]/g, '');
        const newDigits = [...otpDigits];

        if (cleanVal.length > 1) {
            // User pasted multi-digit string into one box
            const pasted = cleanVal.slice(0, 6).split('');
            for (let i = 0; i < 6; i++) {
                newDigits[i] = pasted[i] || '';
            }
            setOtpDigits(newDigits);
            const fullCode = newDigits.join('');
            setFormData(prev => ({ ...prev, otp: fullCode }));
            const nextIdx = Math.min(pasted.length, 5);
            otpInputsRef.current[nextIdx]?.focus();

            if (fullCode.length === 6) {
                handleVerifyOtp(fullCode);
            }
            return;
        }

        newDigits[index] = cleanVal;
        setOtpDigits(newDigits);
        const fullCode = newDigits.join('');
        setFormData(prev => ({ ...prev, otp: fullCode }));

        // Auto-advance to next box
        if (cleanVal && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }

        // Auto-verify when 6th digit entered
        if (cleanVal && index === 5 && fullCode.length === 6) {
            handleVerifyOtp(fullCode);
        }
    };

    // Handle backspace / navigation between OTP boxes
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                otpInputsRef.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    };

    // Handle clipboard paste across all 6 boxes
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (!pastedData) return;

        const newDigits = ['', '', '', '', '', ''];
        const chars = pastedData.split('');
        for (let i = 0; i < 6; i++) {
            newDigits[i] = chars[i] || '';
        }
        setOtpDigits(newDigits);
        const fullCode = newDigits.join('');
        setFormData(prev => ({ ...prev, otp: fullCode }));

        const nextFocus = Math.min(chars.length, 5);
        otpInputsRef.current[nextFocus]?.focus();

        if (fullCode.length === 6) {
            handleVerifyOtp(fullCode);
        }
    };

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;

        if (!formData.businessName.trim()) {
            errors.businessName = "Cafe / Business name is required";
        }

        if (!formData.email.trim()) {
            errors.email = "Email address is required";
        } else if (!emailRegex.test(formData.email.trim())) {
            errors.email = "Please enter a valid email address";
        }

        if (!isEmailOtpVerified) {
            if (!formData.otp.trim()) {
                errors.otp = "Email verification OTP code is required";
            } else {
                errors.otp = "Please click 'Confirm OTP' to verify your code before submitting.";
            }
            errors.email = "Please verify your email address via OTP";
        }

        if (!formData.phone.trim()) {
            errors.phone = "Mobile number is required";
        } else if (!phoneRegex.test(formData.phone.trim())) {
            errors.phone = "Mobile number must be exactly 10 digits";
        }

        if (!formData.password) {
            errors.password = "Password is required";
        } else if (!isPasswordValid) {
            errors.password = "Password must satisfy all security requirements below";
        }

        if (!formData.address.trim()) {
            errors.address = "Branch location / City is required";
        }

        if (!agreedTerms) {
            errors.terms = "You must agree to the Terms of Service and Privacy Policy";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const sanitizedPhone = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, phone: sanitizedPhone }));
        } else if (name === 'otp') {
            const sanitizedOtp = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, otp: sanitizedOtp }));
            setFieldErrors(prev => ({ ...prev, otp: '', email: '' }));
        } else if (name === 'address') {
            // Prevent browser autofill from dumping email into city/address
            if (value.includes('@')) return;
            setFormData(prev => ({ ...prev, address: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: "" }));
        }
        if (generalError) setGeneralError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const result = await registerTenant({
            businessName: formData.businessName.trim(),
            ownerName: formData.ownerName.trim() || formData.businessName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            address: formData.address.trim(),
            city: formData.address.trim(),
            otp: formData.otp.trim(),
            inviteToken: inviteToken || undefined
        });
        setLoading(false);

        if (result && result.success) {
            setSubmittedApplication({
                businessName: formData.businessName.trim(),
                ownerName: formData.ownerName.trim() || formData.businessName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim()
            });
            setIsSubmitted(true);
        } else {
            const errorMsg = result?.error || "Registration submission failed. Please review your details.";
            setGeneralError(errorMsg);
            if (result?.errors && Array.isArray(result.errors)) {
                const newFieldErrors = {};
                result.errors.forEach(err => {
                    if (err.path) newFieldErrors[err.path] = err.msg;
                });
                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(newFieldErrors);
                }
            }
        }
    };

    // If submitted, show the dedicated "Application Under Review" screen
    if (isSubmitted) {
        return (
            <div className={embedded ? styles.embeddedContainer : styles.container}>
                {!embedded && (
                    <header className={styles.topNav}>
                        <div className={styles.topNavBrand}>
                            <BrandLogo theme="light" size="sm" showSubtitle={false} onClick={() => navigate('/')} />
                            <span className={styles.portalBadge}>Application Confirmation</span>
                        </div>
                    </header>
                )}

                <div className={styles.glow1} />
                <div className={styles.glow2} />

                <div className={styles.mainWrapper}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={embedded ? styles.embeddedCard : styles.card}
                        style={{ maxWidth: '640px', minHeight: 'auto' }}
                    >
                        <div className={styles.submittedView}>
                            <div className={styles.submittedIconGlow}>
                                <ShieldCheck size={36} color="#059669" />
                            </div>

                            <div className={styles.submittedStatusBadge}>
                                <Clock size={13} />
                                <span>Pending Super Admin Approval</span>
                            </div>

                            <h2 className={styles.submittedTitle}>Application Received Successfully!</h2>
                            
                            <p className={styles.submittedText}>
                                Thank you for submitting your onboarding details for <strong>{submittedApplication?.businessName}</strong>. Our platform administrators review and activate every establishment to maintain operational excellence.
                            </p>

                            <div className={styles.submittedSummaryCard}>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Establishment:</span>
                                    <span className={styles.summaryVal}>{submittedApplication?.businessName}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Owner / Contact:</span>
                                    <span className={styles.summaryVal}>{submittedApplication?.ownerName}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Registered Email:</span>
                                    <span className={styles.summaryVal}>{submittedApplication?.email}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Phone:</span>
                                    <span className={styles.summaryVal}>+91 {submittedApplication?.phone}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Review SLA:</span>
                                    <span className={styles.summaryVal} style={{ color: '#059669' }}>Within 2 to 6 business hours</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.5rem', maxWidth: '440px' }}>
                                You will receive an official activation email with your login credentials as soon as the Super Admin approves your application.
                            </p>

                            <div className={styles.submittedActions}>
                                <button
                                    type="button"
                                    className={styles.homeActionBtn}
                                    onClick={() => navigate('/')}
                                >
                                    <Home size={15} /> Return to Home
                                </button>
                                <button
                                    type="button"
                                    className={styles.portalActionBtn}
                                    onClick={() => navigate('/login')}
                                >
                                    Portal Sign-In <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className={embedded ? styles.embeddedContainer : styles.container}>
            {/* Dedicated Top Brand Navigation (Only on full-screen route) */}
            {!embedded && (
                <header className={styles.topNav}>
                    <div className={styles.topNavBrand}>
                        <BrandLogo theme="light" size="sm" showSubtitle={false} onClick={() => navigate('/')} />
                        <span className={styles.portalBadge}>Partner Onboarding</span>
                    </div>
                    <div className={styles.topNavRight}>
                        <span className={styles.topNavHint}>Already running a restaurant on DINEVIQ?</span>
                        <Link to="/login" className={styles.topNavLoginBtn}>
                            Portal Sign In <ArrowRight size={14} />
                        </Link>
                    </div>
                </header>
            )}

            <div className={styles.glow1} />
            <div className={styles.glow2} />

            <div className={styles.mainWrapper}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className={embedded ? styles.embeddedCard : styles.card}
                >
                    {/* Left Side: Gourmet Visual Banner */}
                    <div className={styles.visualSide}>
                        <img 
                            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80" 
                            alt="Modern Cafe Dining Room" 
                            className={styles.bgImage}
                        />
                        <div className={styles.visualOverlay} />
                        
                        <div className={styles.visualContent}>
                            <div style={{ marginBottom: '1rem' }}>
                                <BrandLogo theme="dark" size="sm" showSubtitle={true} onClick={() => navigate('/')} />
                            </div>

                            <div className={styles.visualCenter}>
                                <h2>Power Your Restaurant With Next-Gen AI</h2>
                                <p>Get started with your 14-day free trial. Setup takes under 2 minutes.</p>

                                <div className={styles.perksList}>
                                    <div className={styles.perkItem}>
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>Instant QR menu & live KOT kitchen sync</span>
                                    </div>
                                    <div className={styles.perkItem}>
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>No credit card required • Cancel anytime</span>
                                    </div>
                                    <div className={styles.perkItem}>
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>Super Admin verified onboarding & direct WhatsApp help</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.visualFooter}>
                                <div className={styles.testimonialMini}>
                                    <span>"Slashed kitchen wait times by 50% in 1 week."</span>
                                    <small>— Urban Sourdough Bistro</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form Container */}
                    <div className={styles.formSide}>
                        <div className={styles.header}>
                            <h2>Create Cafe Account</h2>
                            <p>
                                {isInviteValid 
                                    ? '✨ Complete your details to activate your Super Admin invitation' 
                                    : 'Join 500+ restaurants growing with DINEVIQ'}
                            </p>
                        </div>

                        {isInviteValid && (
                            <div className={styles.inviteHeaderNotice}>
                                <Sparkles size={15} color="#059669" />
                                <span>You are onboarding with an official Super Admin invitation</span>
                            </div>
                        )}

                        {generalError && (
                            <div className={styles.errorBanner}>
                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                <span>{generalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form} noValidate>
                            {/* Cafe / Business Name */}
                            <div className={styles.fieldWrapper}>
                                <div className={`${styles.inputGroup} ${fieldErrors.businessName ? styles.inputError : ''}`}>
                                    <Store className={styles.icon} size={16} />
                                    <input
                                        name="businessName"
                                        placeholder="Restaurant / Cafe Name"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                {fieldErrors.businessName && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={12} /> {fieldErrors.businessName}
                                    </span>
                                )}
                            </div>

                            {/* Owner / Admin Name */}
                            <div className={styles.fieldWrapper}>
                                <div className={styles.inputGroup}>
                                    <User className={styles.icon} size={16} />
                                    <input
                                        name="ownerName"
                                        placeholder="Owner / Manager Full Name"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Email Address with OTP Trigger */}
                            <div className={styles.fieldWrapper}>
                                <div className={styles.otpWrapper}>
                                    <div className={`${styles.inputGroup} ${fieldErrors.email ? styles.inputError : ''}`} style={{ flex: 1 }}>
                                        <Mail className={styles.icon} size={16} />
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="Business Email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={loading || isInviteValid}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                    {isEmailOtpVerified ? (
                                        <span className={styles.verifiedBadge}>
                                            <CheckCircle2 size={13} color="#059669" /> Verified
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.otpBtn}
                                            onClick={handleSendOtp}
                                            disabled={sendingOtp || otpCountdown > 0 || !formData.email.trim()}
                                        >
                                            {sendingOtp 
                                                ? 'Sending...' 
                                                : otpCountdown > 0 
                                                    ? `Resend in ${otpCountdown}s` 
                                                    : (otpSent ? 'Resend Code' : 'Verify via OTP')}
                                        </button>
                                    )}
                                </div>
                                {fieldErrors.email && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={12} /> {fieldErrors.email}
                                    </span>
                                )}
                            </div>

                            {/* Dedicated OTP Input Card (Shown when OTP sent and not yet verified) */}
                            {(!isEmailOtpVerified && (otpSent || formData.otp)) && (
                                <div className={styles.otpCard}>
                                    <div className={styles.otpHeader}>
                                        <KeyRound size={16} color="#059669" />
                                        <span>Enter Verification Code</span>
                                    </div>
                                    <p className={styles.otpSubtext}>
                                        We sent a 6-digit code to <strong>{formData.email}</strong>. Please check your <strong>Inbox</strong> and <strong>Spam/Junk folder</strong>.
                                    </p>

                                    {/* 6 Individual Box Inputs for OTP */}
                                    <div className={styles.otpBoxesRow} onPaste={handleOtpPaste}>
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => (otpInputsRef.current[idx] = el)}
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={1}
                                                value={digit}
                                                className={`${styles.otpBox} ${fieldErrors.otp ? styles.otpBoxError : ''} ${digit ? styles.otpBoxFilled : ''}`}
                                                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                disabled={verifyingOtp || loading}
                                                autoComplete={idx === 0 ? "one-time-code" : "off"}
                                            />
                                        ))}
                                    </div>

                                    <div className={styles.otpActionsRow}>
                                        <button
                                            type="button"
                                            className={styles.verifyOtpBtn}
                                            onClick={() => handleVerifyOtp()}
                                            disabled={verifyingOtp || otpDigits.join('').length !== 6}
                                        >
                                            {verifyingOtp ? 'Verifying...' : 'Confirm OTP'}
                                        </button>
                                    </div>

                                    {fieldErrors.otp && (
                                        <span className={styles.errorText}>
                                            <AlertCircle size={12} /> {fieldErrors.otp}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Phone and City / Branch in 2 Columns */}
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldWrapper}>
                                    <div className={`${styles.inputGroup} ${fieldErrors.phone ? styles.inputError : ''}`}>
                                        <Phone className={styles.icon} size={16} />
                                        <input
                                            name="phone"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="10-digit Mobile"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={loading}
                                            maxLength={10}
                                            autoComplete="tel-national"
                                            required
                                        />
                                    </div>
                                    {fieldErrors.phone && (
                                        <span className={styles.errorText}>
                                            <AlertCircle size={12} /> {fieldErrors.phone}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.fieldWrapper}>
                                    <div className={`${styles.inputGroup} ${fieldErrors.address ? styles.inputError : ''}`}>
                                        <MapPin className={styles.icon} size={16} />
                                        <input
                                            name="address"
                                            placeholder="City / Branch Location"
                                            value={formData.address}
                                            onChange={handleChange}
                                            disabled={loading}
                                            autoComplete="address-level2"
                                            required
                                        />
                                    </div>
                                    {fieldErrors.address && (
                                        <span className={styles.errorText}>
                                            <AlertCircle size={12} /> {fieldErrors.address}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className={styles.fieldWrapper}>
                                <div className={`${styles.inputGroup} ${fieldErrors.password ? styles.inputError : ''}`}>
                                    <Lock className={styles.icon} size={16} />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create Secure Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                
                                {/* Clean Password Requirements Indicator */}
                                <div className={styles.passwordRequirements}>
                                    <span className={`${styles.rulePill} ${passwordCriteria.length ? styles.ruleMet : styles.rulePending}`}>
                                        {passwordCriteria.length ? <Check size={11} /> : <X size={11} />} 8+ Chars
                                    </span>
                                    <span className={`${styles.rulePill} ${passwordCriteria.uppercase ? styles.ruleMet : styles.rulePending}`}>
                                        {passwordCriteria.uppercase ? <Check size={11} /> : <X size={11} />} Uppercase (A-Z)
                                    </span>
                                    <span className={`${styles.rulePill} ${passwordCriteria.lowercase ? styles.ruleMet : styles.rulePending}`}>
                                        {passwordCriteria.lowercase ? <Check size={11} /> : <X size={11} />} Lowercase (a-z)
                                    </span>
                                    <span className={`${styles.rulePill} ${passwordCriteria.number ? styles.ruleMet : styles.rulePending}`}>
                                        {passwordCriteria.number ? <Check size={11} /> : <X size={11} />} Number (0-9)
                                    </span>
                                    <span className={`${styles.rulePill} ${passwordCriteria.special ? styles.ruleMet : styles.rulePending}`}>
                                        {passwordCriteria.special ? <Check size={11} /> : <X size={11} />} Special (!@#$)
                                    </span>
                                </div>

                                {fieldErrors.password && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={12} /> {fieldErrors.password}
                                    </span>
                                )}
                            </div>

                            {/* Terms and Conditions Checkbox */}
                            <div className={styles.termsRow}>
                                <input
                                    type="checkbox"
                                    id="agreeTerms"
                                    checked={agreedTerms}
                                    onChange={(e) => setAgreedTerms(e.target.checked)}
                                    disabled={loading}
                                />
                                <label htmlFor="agreeTerms">
                                    I agree to DINEVIQ's <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>. My cafe application is subject to Super Admin approval.
                                </label>
                            </div>
                            {fieldErrors.terms && (
                                <span className={styles.errorText}>
                                    <AlertCircle size={12} /> {fieldErrors.terms}
                                </span>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading || verifyingInvite}
                            >
                                {loading ? (
                                    <span>Submitting Application...</span>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        <span>Submit Onboarding Application</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className={styles.loginFooter}>
                            Already have an active account?
                            <Link to="/login" className={styles.loginLink}>Sign In to Portal</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TenantRegister;
