import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle2, Sparkles, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import styles from './TenantRegister.module.css';
import BrandLogo from './BrandLogo';

const TenantRegister = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const { registerTenant } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Password validation rules
    const passwordCriteria = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password)
    };

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

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

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            // Strictly allow integers only and limit to 10 digits
            const sanitizedPhone = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, phone: sanitizedPhone }));
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
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            address: formData.address.trim()
        });
        setLoading(false);

        if (result && result.success) {
            navigate('/login');
        } else {
            const errorMsg = result?.error || "Registration failed. Please check your information.";
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

    return (
        <div className={styles.container}>
            {/* Ambient glows */}
            <div className={styles.glow1} />
            <div className={styles.glow2} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={styles.card}
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
                                    <span>24/7 WhatsApp & priority onboarding</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.testimonialMini}>
                            <span>“Slashed kitchen wait times by 50% in 1 week.”</span>
                            <small>— Urban Sourdough Bistro</small>
                        </div>
                    </div>
                </div>

                {/* Right Side: Streamlined Zero-Scroll Signup Form */}
                <div className={styles.formSide}>
                    <div className={styles.header}>
                        <h2>Create Cafe Account</h2>
                        <p>Join 500+ restaurants growing with SERVIQ</p>
                    </div>

                    {generalError && (
                        <div className={styles.errorBanner}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>{generalError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
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

                        <div className={styles.row}>
                            <div className={styles.fieldWrapper}>
                                <div className={`${styles.inputGroup} ${fieldErrors.email ? styles.inputError : ''}`}>
                                    <Mail className={styles.icon} size={16} />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={loading}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                {fieldErrors.email && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={12} /> {fieldErrors.email}
                                    </span>
                                )}
                            </div>

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
                                        required
                                    />
                                </div>
                                {fieldErrors.phone && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={12} /> {fieldErrors.phone}
                                    </span>
                                )}
                            </div>
                        </div>

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
                            
                            {/* Interactive Password Requirements Pills */}
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

                        <div className={styles.fieldWrapper}>
                            <div className={`${styles.inputGroup} ${fieldErrors.address ? styles.inputError : ''}`}>
                                <MapPin className={styles.icon} size={16} />
                                <input
                                    name="address"
                                    placeholder="City / Branch Location"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            {fieldErrors.address && (
                                <span className={styles.errorText}>
                                    <AlertCircle size={12} /> {fieldErrors.address}
                                </span>
                            )}
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <>
                                    <div className={styles.spinner} />
                                    <span>Setting up Cafe Account...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} /> Launch 14-Day Free Trial <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <span>Already registered?</span>
                        <Link to="/login" className={styles.link}>
                            Sign In to Portal
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TenantRegister;
