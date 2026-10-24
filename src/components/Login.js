import React, { useState } from "react";
import styles from "./Login.module.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  UtensilsCrossed,
  Boxes,
  Users2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import DineviqLogo from "./brand/DineviqLogo";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = "Please enter your email or mobile number";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (fieldErrors.identifier) {
      setFieldErrors((prev) => ({ ...prev, identifier: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result && result.success && result.user) {
      const user = result.user;
      if (user.role === "super_admin") {
        navigate("/super-admin");
      } else {
        navigate("/admin/dashboard");
      }
    } else {
      const errorMsg = result?.error || "Invalid credentials. Please verify your email/phone and password.";
      setGeneralError(errorMsg);

      if (result?.errors && Array.isArray(result.errors)) {
        const newFieldErrors = {};
        result.errors.forEach((err) => {
          if (err.path === "email" || err.path === "identifier") {
            newFieldErrors.identifier = err.msg;
          }
          if (err.path === "password") {
            newFieldErrors.password = err.msg;
          }
        });
        if (Object.keys(newFieldErrors).length > 0) {
          setFieldErrors(newFieldErrors);
        }
      }
    }
  };

  const isNumericPhone = /^[0-9+\s]+$/.test(identifier.trim()) && identifier.trim().length > 3;

  return (
    <div className={styles.container}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.splitContainer}>
        
        {/* ── LEFT HERO SIDE: High-Converting Visual Suite ── */}
        <div className={styles.heroSide}>
          <div className={styles.heroContent}>
            <div className={styles.accentBar} />
            
            <h1 className={styles.heroHeading}>
              Simplify Your<br />
              <span style={{ color: "#6366f1" }}>Restaurant</span>{" "}
              <span style={{ color: "#f97316" }}>Business</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Manage orders, tables, inventory, staff and more — all in one powerful platform.
            </p>

            {/* 4 Feature Badges Row */}
            <div className={styles.featureBadgesRow}>
              {/* Badge 1: Orders */}
              <div className={styles.featureBadge}>
                <div className={styles.featureIconWrap} style={{ background: "#ede9fe", color: "#7c3aed" }}>
                  <UtensilsCrossed size={19} />
                </div>
                <div className={styles.featureTitle}>Orders</div>
                <div className={styles.featureDesc}>Faster service</div>
              </div>

              {/* Badge 2: Inventory */}
              <div className={styles.featureBadge}>
                <div className={styles.featureIconWrap} style={{ background: "#ffedd5", color: "#ea580c" }}>
                  <Boxes size={19} />
                </div>
                <div className={styles.featureTitle}>Inventory</div>
                <div className={styles.featureDesc}>Stay in control</div>
              </div>

              {/* Badge 3: Staff */}
              <div className={styles.featureBadge}>
                <div className={styles.featureIconWrap} style={{ background: "#dcfce7", color: "#16a34a" }}>
                  <Users2 size={19} />
                </div>
                <div className={styles.featureTitle}>Staff</div>
                <div className={styles.featureDesc}>Manage easily</div>
              </div>

              {/* Badge 4: Reports */}
              <div className={styles.featureBadge}>
                <div className={styles.featureIconWrap} style={{ background: "#e0f2fe", color: "#0284c7" }}>
                  <TrendingUp size={19} />
                </div>
                <div className={styles.featureTitle}>Reports</div>
                <div className={styles.featureDesc}>Grow smarter</div>
              </div>
            </div>
          </div>

          {/* High-Resolution Cafe Illustration */}
          <div className={styles.illustrationWrapper}>
            <img
              src="/login-hero-illustration.jpg"
              alt="Lively Modern Restaurant & Dining Room"
              className={styles.illustrationImg}
            />
          </div>
        </div>

        {/* ── RIGHT SIDE: Floating Login Form Card ── */}
        <div className={styles.loginSide}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={styles.loginCard}
          >
            {/* Centered Brand Logo */}
            <div className={styles.logoArea}>
              <DineviqLogo size="md" showSubtitle={false} showBadge={true} onClick={() => navigate('/')} />
            </div>

            {/* Header */}
            <div className={styles.cardHeader}>
              <h2>Welcome to DineviQ</h2>
              <p>Enter your credentials to continue</p>
            </div>

            {/* Error Banner */}
            {generalError && (
              <div className={styles.errorBanner}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              
              {/* Identifier Field (Email / Mobile) */}
              <div className={styles.fieldWrapper}>
                <div className={`${styles.inputGroup} ${fieldErrors.identifier ? styles.inputError : ''}`}>
                  {isNumericPhone ? (
                    <div className={styles.prefixPill}>
                      <span>🇮🇳 +91</span>
                    </div>
                  ) : (
                    <Mail className={styles.icon} size={17} />
                  )}
                  
                  <input
                    type="text"
                    className={`${styles.inputField} ${isNumericPhone ? styles.inputWithPrefix : ''}`}
                    placeholder="Enter your email or mobile number"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    disabled={loading}
                    autoComplete="username"
                    required
                  />
                </div>
                {fieldErrors.identifier && (
                  <span className={styles.errorText}>
                    <AlertCircle size={13} /> {fieldErrors.identifier}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className={styles.fieldWrapper}>
                <div className={`${styles.inputGroup} ${fieldErrors.password ? styles.inputError : ''}`}>
                  <Lock className={styles.icon} size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputField}
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

              {/* Purple Gradient Primary Action Button */}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>Signing in to OS...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to OS</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Helper Note */}
              <p className={styles.helperNote}>
                We'll securely sign you into your restaurant terminal.
              </p>

              {/* Trust Divider */}
              <div className={styles.trustDivider}>
                <span>🔒 Secure</span>
                <span>•</span>
                <span>⚡ Fast</span>
                <span>•</span>
                <span>🛡️ Reliable</span>
              </div>

              {/* Terms Footer */}
              <div className={styles.termsFooter}>
                By continuing, you agree to our{" "}
                <Link to="/contact" className={styles.termsLink}>Terms of Service</Link> and{" "}
                <Link to="/contact" className={styles.termsLink}>Privacy Policy</Link>
              </div>

              {/* Register Outlet CTA */}
              <div className={styles.registerLinkBox}>
                New food outlet?
                <Link to="/register" className={styles.registerLink}>
                  Register Restaurant →
                </Link>
              </div>

            </form>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Login;
