import React, { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import DineviqLogo from "./brand/DineviqLogo";
import { buildAuthCallbackUrl } from "../utils/subdomain";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load Google SDK if client ID is configured
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (clientId && !window.google && !document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

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
    setIsPendingApproval(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
    if (generalError) setGeneralError("");
    setIsPendingApproval(false);
  };

  const handleLogoClick = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('dineviq.com')) {
      window.location.href = 'https://www.dineviq.com';
    } else {
      navigate('/');
    }
  };

  const handleLoginSuccess = (user, token) => {
    const targetPath = user.role === "super_admin" ? "/super-admin" : "/admin/dashboard";

    // Only handoff cross-origin if logging in from billing/admin subdomain
    if (typeof window !== "undefined" && isBillingOrAdminSubdomain()) {
      const storedToken = token || localStorage.getItem('token');
      window.location.href = buildAuthCallbackUrl(storedToken, user, targetPath);
      return;
    }

    // On www.dineviq.com or local origin, navigate directly within SPA
    navigate(targetPath);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setIsPendingApproval(false);

    if (!validateForm()) return;

    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result && result.success && result.user) {
      handleLoginSuccess(result.user, result.token);
    } else {
      const errorMsg = result?.error || "Invalid credentials. Please verify your email/phone and password.";
      setGeneralError(errorMsg);
      if (result?.pendingApproval) {
        setIsPendingApproval(true);
      }

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

  // Google OAuth Flow
  const handleGoogleSignIn = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!clientId) {
      // In dev or if Google Client ID not yet set in frontend environment
      toast("Google Client ID is not configured in environment. Please log in with email/password.", {
        icon: "ℹ️"
      });
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error("Google services are loading. Please try again in a few seconds.");
      return;
    }

    try {
      setGoogleLoading(true);
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse?.access_token) {
            try {
              let gEmail = "";
              let gName = "";
              let gPic = "";
              let gSub = "";

              try {
                const uInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (uInfoRes.ok) {
                  const uData = await uInfoRes.json();
                  gEmail = uData.email || "";
                  gName = uData.name || "";
                  gPic = uData.picture || "";
                  gSub = uData.sub || "";
                }
              } catch (fetchErr) {
                console.warn("Userinfo fetch fallback:", fetchErr);
              }

              const res = await googleLogin({
                accessToken: tokenResponse.access_token,
                email: gEmail,
                name: gName,
                picture: gPic,
                googleId: gSub
              });

              if (res.success && res.user) {
                handleLoginSuccess(res.user, res.token);
              } else if (res.pendingApproval) {
                setIsPendingApproval(true);
                setGeneralError(res.error || "Your onboarding application is under review by Super Admin.");
              } else if (res.isNewUser) {
                setGeneralError(res.error || "No registered cafe found for this Google email. Please register your restaurant first.");
                toast.error("No cafe found. Redirecting to onboarding...", { duration: 4000 });
                setTimeout(() => navigate(`/register?email=${encodeURIComponent(res.email || gEmail)}`), 1500);
              } else {
                setGeneralError(res.error || "Google sign-in failed. Please use email and password.");
              }
            } catch (err) {
              console.error("Google authentication error:", err);
              setGeneralError("Failed to authenticate with Google. Please try again.");
            } finally {
              setGoogleLoading(false);
            }
          } else {
            setGoogleLoading(false);
          }
        }
      });

      client.requestAccessToken();
    } catch (err) {
      console.error("Google Client Init error:", err);
      setGoogleLoading(false);
      toast.error("Unable to open Google sign-in. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.splitContainer}>

        {/* ── LEFT SIDE: Editorial Luxury Restaurant Photography ── */}
        <div className={styles.heroSide}>
          <img
            src="/login-premium.jpg"
            alt="DineviQ Restaurant Operating System"
            className={styles.fullArtImage}
          />
          <div className={styles.imageOverlayGradient} />
          <div className={styles.heroOverlayContent}>
            <div className={styles.heroBadge}>DINEVIQ RESTAURANT OS</div>
            <h2 className={styles.heroQuote}>
              "Everything you need to run high-volume service seamlessly."
            </h2>
            <p className={styles.heroSubquote}>
              Trusted by leading cafes, fine dining, and multi-outlet restaurants.
            </p>
          </div>
        </div>

        {/* ── RIGHT SIDE: Polished Enterprise SaaS Form ── */}
        <div className={styles.loginSide}>
          <div className={styles.formContainer}>

            {/* Top Brand Area */}
            <div className={styles.brandHeader}>
              <DineviqLogo size="md" showSubtitle={false} showBadge={true} onClick={handleLogoClick} />
              <div className={styles.headerText}>
                <h1 className={styles.title}>Sign In</h1>
                <p className={styles.subtitle}>Welcome back. Please enter your account details.</p>
              </div>
            </div>

            {/* Error / Approval Notice Banner */}
            {generalError && (
              <div 
                className={styles.errorBanner}
                style={isPendingApproval ? { background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' } : {}}
              >
                {isPendingApproval ? (
                  <ShieldAlert size={18} style={{ flexShrink: 0, color: '#b45309' }} />
                ) : (
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                )}
                <span>{generalError}</span>
              </div>
            )}

            {/* Google One-Click Login Button */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <div className={styles.spinner} style={{ borderColor: '#cbd5e1', borderTopColor: '#059669' }} />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className={styles.dividerRow}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or continue with email</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              {/* Email / Mobile Field */}
              <div className={styles.fieldWrapper}>
                <label className={styles.label}>Email or Phone Number</label>
                <div className={`${styles.inputGroup} ${fieldErrors.identifier ? styles.inputError : ''}`}>
                  <Mail className={styles.icon} size={18} />
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="name@restaurant.com"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    disabled={loading || googleLoading}
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
                <div className={styles.passwordHeaderRow}>
                  <label className={styles.label}>Password</label>
                </div>
                <div className={`${styles.inputGroup} ${fieldErrors.password ? styles.inputError : ''}`}>
                  <Lock className={styles.icon} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputField}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading || googleLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    disabled={loading || googleLoading}
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
              <button type="submit" className={styles.submitBtn} disabled={loading || googleLoading}>
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Terminal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

            </form>

            {/* Link to Registration & Onboarding Application */}
            <div className={styles.signupPrompt}>
              Don't have an onboarded cafe yet?
              <Link to="/register">Create Cafe Account</Link>
            </div>

            {/* Legal Links */}
            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
              By logging in, you agree to DINEVIQ's{" "}
              <Link to="/terms-of-service" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms</Link>
              {" "}and{" "}
              <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
