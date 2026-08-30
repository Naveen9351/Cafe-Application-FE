import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
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
            navigate('/admin');
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
                        <p>Join 500+ restaurants growing with RASTRORATO</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <Store className={styles.icon} size={16} />
                            <input
                                name="businessName"
                                placeholder="Restaurant / Cafe Name"
                                value={formData.businessName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <Mail className={styles.icon} size={16} />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Work Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <Phone className={styles.icon} size={16} />
                                <input
                                    name="phone"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <Lock className={styles.icon} size={16} />
                            <input
                                name="password"
                                type="password"
                                placeholder="Create Secure Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <MapPin className={styles.icon} size={16} />
                            <input
                                name="address"
                                placeholder="City / Branch Location"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? <div className={styles.spinner} /> : (
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
