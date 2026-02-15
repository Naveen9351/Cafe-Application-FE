import { useState } from "react";
import styles from "./Login.module.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import logo from '../assets/logo.png'; // Import the logo

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
                navigate("/admin/dashboard"); // Corrected: Business Admin Dashboard
            } else {
                navigate("/admin/dashboard"); // Staff also goes to dashboard usually
            }
        }
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <img src={logo} alt="RestroCloud Logo" className={styles.logo} />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to manage your cafe empire</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <Mail className={styles.icon} size={18} />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock className={styles.icon} size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <div className={styles.spinner} /> : (
                            <>
                                Login <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>Don't have an account?</p>
                    <Link to="/register-business" className={styles.link}>
                        Register your Business
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
