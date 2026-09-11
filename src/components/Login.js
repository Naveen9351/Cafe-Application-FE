import { useState } from "react";
import styles from "./Login.module.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email.trim()) {
            errors.email = "Email address is required";
        } else if (!emailRegex.test(email.trim())) {
            errors.email = "Please enter a valid email address";
        }

        if (!password) {
            errors.password = "Password is required";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (fieldErrors.email) {
            setFieldErrors(prev => ({ ...prev, email: "" }));
        }
        if (generalError) setGeneralError("");
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (fieldErrors.password) {
            setFieldErrors(prev => ({ ...prev, password: "" }));
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
        const result = await login(email.trim(), password);
        setLoading(false);

        if (result && result.success && result.user) {
            const user = result.user;
            if (user.role === "super_admin") {
                navigate("/super-admin");
            } else if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/admin/dashboard");
            }
        } else {
            const errorMsg = result?.error || "Invalid email or password. Please try again.";
            setGeneralError(errorMsg);
            
            // Map server validation errors to fields if any
            if (result?.errors && Array.isArray(result.errors)) {
                const newFieldErrors = {};
                result.errors.forEach(err => {
                    if (err.path === 'email') newFieldErrors.email = err.msg;
                    if (err.path === 'password') newFieldErrors.password = err.msg;
                });
                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(newFieldErrors);
                }
            }
        }
    };

    return (
        <div className={styles.container}>
            {/* Ambient Background Glows */}
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
                        src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80" 
                        alt="Artisan Cafe Counter" 
                        className={styles.bgImage}
                    />
                    <div className={styles.visualOverlay} />
                    
                    <div className={styles.visualContent}>
                        <div style={{ marginBottom: '1rem' }}>
                            <BrandLogo theme="dark" size="sm" showSubtitle={true} onClick={() => navigate('/')} />
                        </div>

                        <div className={styles.visualBottom}>
                            <div className={styles.livePill}>
                                <span className={styles.pulseDot} /> Real-time Restaurant Sync
                            </div>
                            <h3>The Intelligent OS for High-Growth Dining</h3>
                            <p>Fast POS billing, live kitchen KOTs & AI demand forecasting in one console.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Compact Login Form */}
                <div className={styles.formSide}>
                    <div className={styles.header}>
                        <h2>Welcome Back</h2>
                        <p>Sign in to your restaurant dashboard</p>
                    </div>

                    {generalError && (
                        <div className={styles.errorBanner}>
                            <AlertCircle size={17} style={{ flexShrink: 0 }} />
                            <span>{generalError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        <div className={styles.fieldWrapper}>
                            <div className={`${styles.inputGroup} ${fieldErrors.email ? styles.inputError : ''}`}>
                                <Mail className={styles.icon} size={17} />
                                <input
                                    type="email"
                                    placeholder="name@restaurant.com"
                                    value={email}
                                    onChange={handleEmailChange}
                                    disabled={loading}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            {fieldErrors.email && (
                                <span className={styles.errorText}>
                                    <AlertCircle size={13} /> {fieldErrors.email}
                                </span>
                            )}
                        </div>

                        <div className={styles.fieldWrapper}>
                            <div className={`${styles.inputGroup} ${fieldErrors.password ? styles.inputError : ''}`}>
                                <Lock className={styles.icon} size={17} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    disabled={loading}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <span className={styles.errorText}>
                                    <AlertCircle size={13} /> {fieldErrors.password}
                                </span>
                            )}
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <>
                                    <div className={styles.spinner} />
                                    <span>Signing in to OS...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} /> Sign In to OS <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <span>Don't have a cafe account?</span>
                        <Link to="/register" className={styles.link}>
                            Start 14-Day Free Trial
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
