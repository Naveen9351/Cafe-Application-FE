import { useState } from "react";
import styles from "./Login.module.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const user = await login(email, password);
        setLoading(false);

        if (user) {
            if (user.role === "super_admin") {
                navigate("/super-admin");
            } else if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/admin/dashboard");
            }
        }
    };

    return (
        <div className={styles.container}>
            {/* Ambient Background Glows */}
            <div className={styles.ambientGlow} />

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

                {/* Right Side: Compact Login Form (Fits comfortably in 80vh) */}
                <div className={styles.formSide}>
                    <div className={styles.header}>
                        <h2>Welcome Back</h2>
                        <p>Sign in to your restaurant dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <Mail className={styles.icon} size={17} />
                            <input
                                type="email"
                                placeholder="name@restaurant.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <Lock className={styles.icon} size={17} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? <div className={styles.spinner} /> : (
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
