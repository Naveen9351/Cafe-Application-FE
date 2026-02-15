import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, BarChart3, Globe, Heart, Rocket, Smartphone, Sparkles, Layout, MousePointer2, ChevronDown, Clock, Palette, Star, MessageSquare, Quote } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import dashboard from '../assets/dashbord.png';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid #f1f5f9', padding: '1rem 0' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
                <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{question}</span>
                <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="faq-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();

    const plans = [
        {
            name: "Free Trial",
            price: "₹0",
            duration: "First Month",
            description: "Perfect for exploring our platform and setting up your first digital menu.",
            features: ["1 Branch", "Digital Menu QR", "Basic Orders Tracking", "50 Orders/month", "Community Support"],
            recommended: false,
            color: "#94a3b8"
        },
        {
            name: "Standard",
            price: "₹100",
            duration: "/month",
            description: "Ideal for growing cafes looking to streamline operations and view growth.",
            features: ["Everything in Free", "Advanced Analytics", "200 Orders/month", "Priority Support", "Sales Reports"],
            recommended: true,
            color: "#3b82f6"
        },
        {
            name: "Premium",
            price: "₹500",
            duration: "/month",
            description: "Enterprise level power for businesses that want zero limits and deep branding.",
            features: ["Everything in Standard", "Unlimited Orders", "Custom Business Logo", "Branded Menu Hero", "Order Timer & KDS Tracking"],
            recommended: false,
            color: "#8b5cf6"
        }
    ];

    const detailedFeatures = [
        {
            icon: <Smartphone size={24} />,
            title: "Contactless QR Menu",
            desc: "Eliminate physical menus. Your customers scan, browse, and order directly from their phone. Safer for them, cheaper for you.",
            color: "#3b82f6"
        },
        {
            icon: <Clock size={24} />,
            title: "Live Order Timer",
            desc: "Keep customers happy by showing exactly when their food will be ready. Live progress bars reduce perceived wait times.",
            color: "#f59e0b"
        },
        {
            icon: <BarChart3 size={24} />,
            title: "Advanced Analytics",
            desc: "Understand your best-selling items, peak hours, and revenue trends with professional-grade data visualization.",
            color: "#10b981"
        },
        {
            icon: <Palette size={24} />,
            title: "Enterprise Branding",
            desc: "Your business, your brand. Upload your logo and transform the digital menu to match your cafe's unique identity.",
            color: "#8b5cf6"
        }
    ];

    const testimonials = [
        {
            name: "Rahul Sharma",
            role: "Owner, The Coffee Bean",
            text: "RestroCloud changed how we handle rushes. The QR ordering reduced our table turn time by 15 minutes!",
            avatar: "RS"
        },
        {
            name: "Priya Patel",
            role: "Manager, Bistro 24",
            text: "The analytics section is a goldmine. I now know exactly which dishes to promote on weekends.",
            avatar: "PP"
        },
        {
            name: "Amit Verma",
            role: "Owner, Urban Tadka",
            text: "Setting up was incredibly easy. We were taking digital orders in less than 30 minutes of signing up.",
            avatar: "AV"
        }
    ];

    const steps = [
        { icon: <Layout size={20} />, title: "Create Menu", desc: "Upload your dishes and prices." },
        { icon: <MousePointer2 size={20} />, title: "Generate QR", desc: "Print table-specific codes." },
        { icon: <Sparkles size={20} />, title: "Take Orders", desc: "Sit back and manage live orders." }
    ];

    const faqs = [
        { question: "How long does it take to set up?", answer: "You can be up and running in less than 10 minutes. Just sign up, add your items, and generate your QR codes." },
        { question: "Do customers need to download an app?", answer: "No! Customers simply scan the QR code and the menu opens directly in their phone's browser." },
        { question: "Can I use my own logo?", answer: "Yes, our Premium plan allows for full business branding, including your logo and custom menu header." }
    ];

    const sectionAnimation = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: 0.7, ease: "easeOut" }
    };

    return (
        <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", overflowX: 'hidden' }}>

            {/* Navbar */}
            <nav style={{
                padding: '0.75rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1100px',
                margin: '0.75rem auto',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                position: 'sticky',
                top: '0.75rem',
                zIndex: 1000,
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    <img src={logo} alt="Logo" style={{ width: '28px', height: '28px' }} />
                    <span>RestroCloud<span style={{ color: '#3b82f6' }}>OS</span></span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>Login</button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/register-business')}
                        style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
                    >
                        Join Now
                    </motion.button>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{ textAlign: 'center', padding: '6rem 1rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.08)', color: '#2563eb', padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                        <Rocket size={14} /> Powering 500+ Local Cafes
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: '900', margin: '0.5rem 0 1rem', lineHeight: '1.1', letterSpacing: '-0.04em' }}>
                        The Future of Food <br /> <span style={{ color: '#3b82f6' }}>Business is Digital.</span>
                    </h1>

                    <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.5', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        The all-in-one cloud platform for contactless ordering, AI-powered insights, and automated kitchen management.
                    </p>

                    <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            onClick={() => navigate('/register-business')}
                            style={{ background: '#3b82f6', color: 'white', padding: '1.1rem 2.5rem', borderRadius: '16px', fontSize: '1.05rem', fontWeight: '750', cursor: 'pointer', border: 'none', boxShadow: '0 15px 30px -10px rgba(59, 130, 246, 0.4)' }}
                        >
                            Get Started Free
                        </motion.button>
                        <button style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '1.1rem 2.5rem', borderRadius: '16px', fontSize: '1.05rem', fontWeight: '750', cursor: 'pointer' }}>
                            View Demo
                        </button>
                    </div>
                </motion.div>
            </header>

            {/* Dashboard Preview Section */}
            <motion.section {...sectionAnimation} style={{ maxWidth: '1000px', margin: '0 auto 6rem', padding: '0 1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '40px', display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontSize: '0.85rem' }}>Efficiency Matters</div>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '1.25rem', lineHeight: '1.2' }}>Everything you need to <span style={{ color: '#3b82f6' }}>Scale.</span></h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                            Take full control of your business. Monitor sales, manage inventory, and track staff performance from one premium viewport.
                        </p>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {['Auto-generated Table QR Codes', 'Real-time Item Availability', 'Live Analytics'].map((item, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1rem' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle size={14} color="#10b981" />
                                    </div>
                                    {item}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <img src={dashboard} alt="Dashboard" style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }} />
                    </div>
                </div>
            </motion.section>

            {/* Plan Features Detailed Section - NEW */}
            <section style={{ maxWidth: '1100px', margin: '8rem auto', padding: '0 1.5rem' }}>
                <motion.div {...sectionAnimation} style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem' }}>Premium Features for Everyone</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>We've automated the hard part of running a cafe, so you can focus on the coffee.</p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {detailedFeatures.map((f, i) => (
                        <motion.div
                            key={i}
                            {...sectionAnimation}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            style={{ padding: '2.5rem', background: 'white', borderRadius: '32px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `${f.color}08`, borderRadius: '0 0 0 100%' }} />
                            <div style={{ background: `${f.color}15`, color: f.color, width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: '850', marginBottom: '1rem', color: 'var(--text-primary)' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section style={{ background: '#0f172a', color: 'white', padding: '8rem 1.5rem', margin: '4rem 0' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <motion.h2 {...sectionAnimation} style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '4rem' }}>Digitize your business in <span style={{ color: '#3b82f6' }}>3 Steps.</span></motion.h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
                        {steps.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                    {s.icon}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>{s.title}</h3>
                                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6' }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials - NEW */}
            <section style={{ maxWidth: '1100px', margin: '8rem auto', padding: '0 1.5rem' }}>
                <motion.div {...sectionAnimation} style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontSize: '0.85rem' }}>Testimonials</div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900' }}>Loved by 500+ Cafe Owners</h2>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            {...sectionAnimation}
                            transition={{ delay: i * 0.15 }}
                            style={{ padding: '2.5rem', background: 'white', borderRadius: '32px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                        >
                            <Quote size={40} style={{ color: '#e2e8f0', marginBottom: '1.5rem' }} />
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '2rem' }}>"{t.text}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>{t.avatar}</div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '1rem' }}>{t.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section style={{ maxWidth: '1000px', margin: '8rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
                <motion.div {...sectionAnimation} style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.75rem', fontWeight: '900' }}>Simple, Honest <span style={{ color: '#3b82f6' }}>Pricing.</span></h2>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            {...sectionAnimation}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            style={{
                                background: 'white',
                                padding: '3rem 2rem',
                                borderRadius: '40px',
                                border: plan.recommended ? `2px solid ${plan.color}` : '1px solid var(--border-color)',
                                textAlign: 'left',
                                position: 'relative',
                                boxShadow: plan.recommended ? '0 30px 60px -15px rgba(59, 130, 246, 0.2)' : 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{ color: plan.color, marginBottom: '0.5rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{plan.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '3rem', fontWeight: '900' }}>{plan.price}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600' }}>{plan.duration}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '500' }}>{plan.description}</p>
                            <div style={{ marginBottom: '2.5rem' }}>
                                {plan.features.map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', fontSize: '0.95rem', fontWeight: '600', color: '#475569' }}>
                                        <CheckCircle size={16} style={{ color: plan.color }} /> {feature}
                                    </div>
                                ))}
                            </div>
                            <button style={{ width: '100%', background: plan.recommended ? plan.color : '#f1f5f9', color: plan.recommended ? 'white' : 'var(--text-primary)', border: 'none', padding: '1.25rem', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}>
                                Choose {plan.name}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <motion.section {...sectionAnimation} style={{ maxWidth: '700px', margin: '8rem auto', padding: '0 1.5rem' }}>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '3rem', textAlign: 'center' }}>Questions? We have answers.</h2>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
                    {faqs.map((f, i) => <FAQItem key={i} {...f} />)}
                </div>
            </motion.section>

            {/* Footer */}
            <footer style={{ padding: '6rem 2rem', background: '#f8fafc', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>
                            <img src={logo} alt="Logo" style={{ width: '36px', height: '36px' }} />
                            <span>RestroCloud<span style={{ color: '#3b82f6' }}>OS</span></span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '350px', lineHeight: '1.7' }}>The next generation of restaurant management. Cloud-native, digital-first hospitality.</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Product</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600' }}>
                            <li>Features</li><li>Pricing</li><li>Demo</li><li>Release Notes</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Support</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600' }}>
                            <li>Help Center</li><li>Contact Us</li><li>API Docs</li><li>Terms of Service</li>
                        </ul>
                    </div>
                </div>
                <div style={{ maxWidth: '1100px', margin: '4rem auto 0', paddingTop: '2.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>
                    <div>© {new Date().getFullYear()} RestroCloud OS. All rights reserved.</div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <span>Privacy Policy</span><span>Terms & Conditions</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
