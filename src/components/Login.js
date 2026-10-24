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
      <div className={styles.splitContainer}>
        
        {/* ── LEFT SIDE: Full Height Beautiful Art Illustration ── */}
        <div className={styles.heroSide}>
          <img
            src="/login-art.jpg"
            alt="Modern DineviQ Restaurant Management Experience"
            className={styles.fullArtImage}
          />
        </div>

        {/* ── RIGHT SIDE: Clean Minimalist Login Form ── */}
        <div className={styles.loginSide}>
          <div className={styles.loginCard}>
            
            {/* Top Logo */}
            <div className={styles.logoArea}>
              <DineviqLogo size="md" showSubtitle={false} showBadge={false} onClick={() => navigate('/')} />
            </div>

            {/* Error Banner */}
            {generalError && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Form: Email, Password, Sign In Button */}
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              
              {/* Email / Mobile Field */}
              <div className={styles.fieldWrapper}>
                <div className={`${styles.inputGroup} ${fieldErrors.identifier ? styles.inputError : ''}`}>
                  <Mail className={styles.icon} size={18} />
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Email or Mobile Number"
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
                  <Lock className={styles.icon} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputField}
                    placeholder="Password"
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

              {/* Sign In Button */}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
