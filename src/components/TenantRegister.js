import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import styles from './TenantRegister.module.css';
import logo from '../assets/logo.png'; // Assuming logo is in src/assets/logo.png

const TenantRegister = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const { registerTenant } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await registerTenant(formData);
        setLoading(false);
        if (success) {
            navigate('/login');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.splitLayout}>
                {/* Left Side - Promotional */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className={styles.promoSide}
                >
                    <div className={styles.brand}>
                        <img src={logo} alt="RestroCloud Logo" className={styles.logo} />
                        <span>RestroCloud<span className={styles.accent}>OS</span></span>
                    </div>

                    <h1 className={styles.promoTitle}>Start Your Digital Journey Today.</h1>
                    <p className={styles.promoText}>
                        Join thousands of cafes and restaurants transforming their operations.
                    </p>

                    <ul className={styles.benefitsList}>
                        <li><CheckCircle size={20} className={styles.checkIcon} /> Free 14-day trial</li>
                        <li><CheckCircle size={20} className={styles.checkIcon} /> No credit card required</li>
                        <li><CheckCircle size={20} className={styles.checkIcon} /> Instant setup</li>
                    </ul>

                    <div className={styles.testimonial}>
                        <p>"Changed the way we handle orders. Simply amazing!"</p>
                        <span>- The Coffee House</span>
                    </div>
                </motion.div>

                {/* Right Side - Form */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={styles.formSide}
                >
                    <div className={styles.formCard}>
                        <h2>Create your account</h2>
                        <p className={styles.subHeader}>Get started with your free account</p>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <Store className={styles.inputIcon} size={18} />
                                <input name="businessName" placeholder="Restaurant / Cafe Name" onChange={handleChange} required />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.inputGroup}>
                                    <Mail className={styles.inputIcon} size={18} />
                                    <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <Phone className={styles.inputIcon} size={18} />
                                    <input name="phone" placeholder="Phone Number" onChange={handleChange} required />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input name="password" type="password" placeholder="Create Password" onChange={handleChange} required />
                            </div>

                            <div className={styles.inputGroup}>
                                <MapPin className={styles.inputIcon} size={18} />
                                <textarea name="address" placeholder="Business Address" onChange={handleChange} rows="2" />
                            </div>

                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Creating Account...' : (
                                    <>Get Started <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <p className={styles.loginLink}>
                            Already have an account? <Link to="/login">Log in</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TenantRegister;
