import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import styles from './LegalPage.module.css';
import {
  ShieldCheck,
  Lock,
  Database,
  CreditCard,
  UserCheck,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocItems = [
    { id: 'overview', title: '1. Overview & Commitment' },
    { id: 'data-collected', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Process Data' },
    { id: 'statutory', title: '4. IT Act & SPDI Compliance' },
    { id: 'payments', title: '5. Payment Security & Gateways' },
    { id: 'storage', title: '6. Multi-Tenant Cloud & Storage' },
    { id: 'retention', title: '7. Retention & Deletion Rights' },
    { id: 'security', title: '8. 256-Bit SSL & Safeguards' },
    { id: 'grievance', title: '9. Grievance Officer & Contact' }
  ];

  const handleTocClick = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.legalContainer}>
      <div className={styles.ambientGlow1} />
      <div className={styles.ambientGlow2} />

      <Navbar />

      {/* Hero Header */}
      <header className={styles.heroSection}>
        <div className={styles.badge}>
          <ShieldCheck size={15} />
          <span>Legally Certified & Privacy-First</span>
        </div>
        <h1 className={styles.heroTitle}>Privacy Policy</h1>
        <p className={styles.heroSubtitle}>
          How DINEVIQ protects the sensitive data of cafe owners, operational staff, and dining guests under Indian Information Technology laws and global privacy standards.
        </p>
        <div className={styles.metaInfo}>
          <span className={styles.metaItem}>
            <Calendar size={14} />
            <span>Effective Date: November 1, 2026</span>
          </span>
          <span className={styles.metaItem}>
            <Clock size={14} />
            <span>Version: 3.4 (Production Standard)</span>
          </span>
          <span className={styles.metaItem}>
            <FileText size={14} />
            <span>Applicable to: DINEVIQ POS, QR Menus & SaaS APIs</span>
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className={styles.layoutGrid}>
        {/* Sticky Table of Contents */}
        <aside className={styles.tocSidebar}>
          <div className={styles.tocTitle}>Table of Contents</div>
          <ul className={styles.tocList}>
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTocClick(item.id);
                  }}
                  className={`${styles.tocItem} ${activeSection === item.id ? styles.activeTocItem : ''}`}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>

          <div className={styles.sidebarActionBox}>
            <Link to="/terms-of-service" className={styles.supportLink}>
              <span>View Terms of Service</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </aside>

        {/* Legal Text Content */}
        <main className={styles.contentArea}>
          {/* Section 1 */}
          <section id="overview" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <ShieldCheck className={styles.sectionIcon} size={22} />
              1. Overview & Commitment to Privacy
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ Technologies India Private Limited (<strong>"DINEVIQ"</strong>, <strong>"we"</strong>, <strong>"our"</strong>, or <strong>"us"</strong>) operates an enterprise restaurant operating system comprising cloud point-of-sale (POS) billing, interactive table QR menus, kitchen display systems (KDS), and inventory automation.
            </p>
            <p className={styles.paragraph}>
              This Privacy Policy explains how we collect, store, process, and safeguard personal and business data when you visit our website (<strong>dineviq.com</strong>), onboard your restaurant, access administrative portals, or dine at a partner establishment using our QR table-ordering interface.
            </p>
            <div className={styles.calloutBox}>
              <div className={styles.calloutTitle}>
                <Lock size={16} />
                Strict Non-Monetization Policy
              </div>
              <p className={styles.calloutText}>
                We do <strong>not</strong> sell, rent, or lease your personal information, restaurant customer lists, sales records, or diner contact details to third-party advertising networks, data brokers, or marketing intermediaries under any circumstances.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="data-collected" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Database className={styles.sectionIcon} size={22} />
              2. Information We Collect
            </h2>
            <p className={styles.paragraph}>
              To provide multi-tenant cloud restaurant operations, DINEVIQ gathers information categorized into two distinct user groups:
            </p>
            <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: '20px 0 10px' }}>A. Restaurant Owners, Managers & Staff</h3>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>Identity & Onboarding Data:</strong> Business name, legal registered entity, owner/manager full name, business email address, phone number, physical branch address, and GSTIN/VAT numbers.
              </li>
              <li className={styles.bulletItem}>
                <strong>Authentication & Security:</strong> Passwords hashed using industry-standard salted bcrypt algorithms, role permissions (Cashier, Chef, Waiter, Manager), and OAuth tokens if authenticated via Google.
              </li>
              <li className={styles.bulletItem}>
                <strong>Operational Data:</strong> Menu items, pricing, inventory stock logs, floor tables, printer configurations, and discount rules.
              </li>
            </ul>

            <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: '20px 0 10px' }}>B. Dining Guests & End Customers (QR Ordering)</h3>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>Contact Information:</strong> Phone number and guest name provided voluntarily to receive live digital kitchen notifications, WhatsApp digital invoices, and loyalty rewards.
              </li>
              <li className={styles.bulletItem}>
                <strong>Order Specifications:</strong> Dishes ordered, dietary notes, table number, timestamps, and order settlement status.
              </li>
              <li className={styles.bulletItem}>
                <strong>Payment Method Snapshot:</strong> Method utilized (e.g., UPI, Cash, Credit Card, or Customer Khata borrow ledger). We do <strong>not</strong> collect or store raw 16-digit debit/credit card numbers or CVVs.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="usage" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Eye className={styles.sectionIcon} size={22} />
              3. How We Process and Utilize Your Data
            </h2>
            <p className={styles.paragraph}>
              Collected data is processed strictly for legitimate operational and technical needs:
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>Live Order Routing:</strong> Transmitting table orders directly to kitchen display systems (KDS) and waiter handheld POS devices in real-time via secure WebSockets.
              </li>
              <li className={styles.bulletItem}>
                <strong>Billing & Legal GST Invoicing:</strong> Generating compliant digital tax invoices, calculating applicable CGST/SGST/IGST, and recording electronic transaction receipts.
              </li>
              <li className={styles.bulletItem}>
                <strong>Customer Khata Ledger Management:</strong> Maintaining accurate digital credit/borrow records between participating cafes and their frequent patrons with instant settlement balance updates.
              </li>
              <li className={styles.bulletItem}>
                <strong>Predictive Analytics & Inventory Alerts:</strong> Aggregating day-wise, week-wise, and yearly sales volume to assist restaurant management with ingredient restocking and menu optimization.
              </li>
              <li className={styles.bulletItem}>
                <strong>Super Admin Governance:</strong> Authenticating cafe onboarding applications, preventing duplicate fraudulent registrations, and verifying plan subscriptions.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="statutory" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} size={22} />
              4. IT Act & SPDI Compliance (Indian Law)
            </h2>
            <p className={styles.paragraph}>
              This Privacy Policy strictly aligns with Section 43A of the <strong>Information Technology Act, 2000</strong>, and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules)</strong>.
            </p>
            <p className={styles.paragraph}>
              Under Indian law, sensitive personal data (such as login credentials and financial transaction logs) is encrypted both in transit (TLS 1.3) and at rest (AES-256). Consent is explicitly obtained prior to collecting contact details during QR self-ordering or tenant onboarding.
            </p>
          </section>

          {/* Section 5 */}
          <section id="payments" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <CreditCard className={styles.sectionIcon} size={22} />
              5. Payment Security & Payment Gateways
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ integrates with RBI-authorized payment aggregators (such as Razorpay, PhonePe, and UPI QR standards) for electronic settlements.
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>Zero Card Storage:</strong> DINEVIQ servers never store, process, or view full payment card numbers, CVVs, or NetBanking PINs. All online payments are handled directly by PCI-DSS Level 1 compliant gateway partners.
              </li>
              <li className={styles.bulletItem}>
                <strong>Dynamic Dynamic UPI QR Code:</strong> Table QR payments dynamically bind the exact invoice bill amount and cafe VPA address, eliminating accidental manual overcharging or payment mismatch.
              </li>
              <li className={styles.bulletItem}>
                <strong>Subscription Billing:</strong> Cafe SaaS subscription fees (Starter, Saver, Ultimate Pro) are securely debited and verified via tamper-proof payment webhooks.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="storage" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Lock className={styles.sectionIcon} size={22} />
              6. Multi-Tenant Cloud Architecture & Data Isolation
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ utilizes a modern <strong>Multi-Tenant Database Architecture</strong>. Each cafe is assigned a unique tenant identifier (<code>tenantId</code>) that partitions and isolates all menu data, inventory records, staff logins, and guest order history from other establishments.
            </p>
            <p className={styles.paragraph}>
              Our cloud infrastructure is hosted on enterprise-grade data centers located in India (Mumbai/Central region), ensuring low latency, domestic data residency compliance, and 99.9% operational uptime.
            </p>
          </section>

          {/* Section 7 */}
          <section id="retention" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <UserCheck className={styles.sectionIcon} size={22} />
              7. Data Retention & Deletion Rights
            </h2>
            <p className={styles.paragraph}>
              We retain cafe operational data for the duration of your active subscription and as required by Indian accounting and taxation regulations (e.g., maintaining sales invoices for tax compliance for 8 years).
            </p>
            <p className={styles.paragraph}>
              <strong>Your Rights:</strong>
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>Access & Correction:</strong> Cafe owners can update their restaurant profiles, tax percentages, staff credentials, and menu items at any time through the Settings panel.
              </li>
              <li className={styles.bulletItem}>
                <strong>Account Termination & Data Purge:</strong> Upon written request to our support desk or account closure, all associated tenant data (menu, orders, staff records) can be permanently purged within 30 days, subject to mandatory statutory tax retention obligations.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="security" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <ShieldCheck className={styles.sectionIcon} size={22} />
              8. Security Safeguards & Encryption
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ maintains rigorous technical and organizational measures to prevent unauthorized access, loss, or manipulation of records:
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>End-to-End Transport Encryption:</strong> All web and mobile communication is encrypted using 256-bit SSL / TLS 1.3 certificates.
              </li>
              <li className={styles.bulletItem}>
                <strong>Strict Role-Based Access Control (RBAC):</strong> Waitstaff, Chefs, Cashiers, and Admins are restricted by granular permissions. Cashiers cannot modify historical pricing; waiters cannot alter admin configurations.
              </li>
              <li className={styles.bulletItem}>
                <strong>Super Admin Approval Barrier:</strong> No new cafe account can access platform operational tools or process customer data until approved by our verified governance team.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="grievance" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Mail className={styles.sectionIcon} size={22} />
              9. Grievance Officer & Contact Information
            </h2>
            <p className={styles.paragraph}>
              In accordance with the Information Technology Act 2000 and rules made thereunder, the contact details of the Grievance Redressal Officer are provided below:
            </p>
            
            <div className={styles.contactCard}>
              <h4 style={{ margin: '0 0 12px 0', color: '#34d399', fontSize: '16px' }}>
                DINEVIQ Data Protection & Grievance Cell
              </h4>
              <div className={styles.contactGrid}>
                <div className={styles.contactInfoItem}>
                  <span className={styles.contactLabel}>Officer Name</span>
                  <span className={styles.contactValue}>Naveen Kumar Sharma</span>
                </div>
                <div className={styles.contactInfoItem}>
                  <span className={styles.contactLabel}>Designation</span>
                  <span className={styles.contactValue}>Chief Compliance Officer</span>
                </div>
                <div className={styles.contactInfoItem}>
                  <span className={styles.contactLabel}>Email Address</span>
                  <span className={styles.contactValue}>
                    <a href="mailto:support@dineviq.com">support@dineviq.com</a>
                  </span>
                </div>
                <div className={styles.contactInfoItem}>
                  <span className={styles.contactLabel}>Direct Indian Tech Support</span>
                  <span className={styles.contactValue}>+91 96801 32562</span>
                </div>
                <div className={styles.contactInfoItem} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.contactLabel}>Registered Office</span>
                  <span className={styles.contactValue}>
                    DINEVIQ Technologies India Pvt. Ltd., Tech Corridor, Bangalore & Delhi NCR, India.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

