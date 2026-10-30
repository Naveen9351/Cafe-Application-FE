import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import styles from './LegalPage.module.css';
import {
  FileCheck,
  Building,
  CreditCard,
  AlertTriangle,
  Scale,
  Shield,
  HelpCircle,
  Clock,
  Calendar,
  FileText,
  ArrowRight,
  Server,
  CheckCircle2
} from 'lucide-react';

const TermsOfService = () => {
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocItems = [
    { id: 'acceptance', title: '1. Acceptance of SaaS Terms' },
    { id: 'approval-policy', title: '2. Onboarding & Approval Rights' },
    { id: 'subscriptions', title: '3. Subscription Plans & Free Trial' },
    { id: 'refunds', title: '4. Refund & Cancellation Terms' },
    { id: 'owner-duties', title: '5. FSSAI, GST & Legal Duties' },
    { id: 'khata-ledger', title: '6. Khata Credit Ledger Terms' },
    { id: 'hardware-network', title: '7. Hardware & Network Scope' },
    { id: 'sla-uptime', title: '8. 99.9% Uptime & Maintenance' },
    { id: 'ip-rights', title: '9. IP & Data Ownership' },
    { id: 'liability', title: '10. Limitation of Liability' },
    { id: 'disputes', title: '11. Governing Law & Jurisdiction' }
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
          <FileCheck size={15} />
          <span>SaaS Service Level Agreement</span>
        </div>
        <h1 className={styles.heroTitle}>Terms of Service</h1>
        <p className={styles.heroSubtitle}>
          The legal agreement governing restaurant account onboarding, POS software usage, subscription billing, and multi-tenant operations on the DINEVIQ platform.
        </p>
        <div className={styles.metaInfo}>
          <span className={styles.metaItem}>
            <Calendar size={14} />
            <span>Last Updated: November 1, 2026</span>
          </span>
          <span className={styles.metaItem}>
            <Clock size={14} />
            <span>Revision: 4.1</span>
          </span>
          <span className={styles.metaItem}>
            <FileText size={14} />
            <span>Governed by: Indian Contract Act, 1872</span>
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
            <Link to="/privacy-policy" className={styles.supportLink}>
              <span>Read Privacy Policy</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </aside>

        {/* Legal Text Content */}
        <main className={styles.contentArea}>
          {/* Section 1 */}
          <section id="acceptance" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileCheck className={styles.sectionIcon} size={22} />
              1. Acceptance of Terms & Master SaaS Agreement
            </h2>
            <p className={styles.paragraph}>
              By accessing, registering an account on <strong>DINEVIQ</strong> (whether via dineviq.com, our desktop application, or our waiter/chef mobile interfaces), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a restaurant, cafe, franchise, or commercial business entity, you represent and warrant that you possess the full legal authority to bind that entity to these conditions.
            </p>
            <p className={styles.paragraph}>
              If you do not agree with any part of these terms, you must not access or utilize the DINEVIQ POS billing software, QR table ordering system, or related cloud services.
            </p>
          </section>

          {/* Section 2 */}
          <section id="approval-policy" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building className={styles.sectionIcon} size={22} />
              2. Cafe Account Onboarding & Super Admin Approval Rights
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ operates as an invite-only and verified cloud POS network. To preserve the highest security standards and protect dining guests from unverified commercial activities:
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>Mandatory Super Admin Approval:</strong> Submitting a registration form does not immediately activate an operational store. Every application enters an administrative verification queue and must be formally verified and approved by the DINEVIQ Super Admin team.
              </li>
              <li className={styles.bulletItem}>
                <strong>Email Verification Requirement:</strong> All cafe owners must verify ownership of their registered email address via a one-time password (OTP) or an authentic Super Admin invitation token.
              </li>
              <li className={styles.bulletItem}>
                <strong>Right to Reject or Deactivate:</strong> DINEVIQ reserves the unambiguous right to reject any application or deactivate any account that provides fraudulent credentials, infringes upon trademarks, or violates food safety regulations.
              </li>
            </ul>

            <div className={styles.calloutBox}>
              <div className={styles.calloutTitle}>
                <CheckCircle2 size={16} />
                Approval Notification Guarantee
              </div>
              <p className={styles.calloutText}>
                Once your cafe application is reviewed by our administration team, you will receive an official notification email in English detailing your store status, allocated subscription plan, and login instructions.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="subscriptions" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <CreditCard className={styles.sectionIcon} size={22} />
              3. Subscription Plans, 14-Day Free Trial & Renewals
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ provides modular subscription tiers customized for Indian F&B businesses:
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>14-Day Full-Featured Free Trial:</strong> Newly approved cafes are granted a 14-day zero-cost trial with complete access to QR menus, live KDS, thermal billing, and inventory tracking without requiring credit card pre-authorization.
              </li>
              <li className={styles.bulletItem}>
                <strong>Standard Commercial Plans:</strong>
                <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                  <li><strong>1 Month Starter Plan:</strong> ₹999 / month — Single outlet, unlimited orders, thermal print & QR menus.</li>
                  <li><strong>6 Months Saver Plan:</strong> ₹4,999 / 6 months — Priority WhatsApp support & multi-device KDS.</li>
                  <li><strong>1 Year Ultimate Pro Plan:</strong> ₹10,999 / year — Complete AI sales copilot, custom branding & franchise sync.</li>
                </ul>
              </li>
              <li className={styles.bulletItem}>
                <strong>Service Continuation:</strong> If a subscription expires without renewal, active POS operations and QR dining sessions will be temporarily paused until the plan is renewed or extended by Super Admin.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="refunds" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Scale className={styles.sectionIcon} size={22} />
              4. Refund, Cancellation & Fair Use Policy
            </h2>
            <p className={styles.paragraph}>
              Because DINEVIQ provides an extensive 14-day risk-free trial prior to commercial payment, paid subscription purchases are generally non-refundable once activated.
            </p>
            <p className={styles.paragraph}>
              <strong>Exceptions:</strong> If an unforeseen cloud service outage caused directly by DINEVIQ infrastructure exceeds our SLA guarantees (downtime {'>'} 24 hours continuously), affected restaurants are eligible for pro-rated subscription credit extensions upon review by platform administrators.
            </p>
          </section>

          {/* Section 5 */}
          <section id="owner-duties" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Shield className={styles.sectionIcon} size={22} />
              5. Cafe Owner Compliance (FSSAI, GST & Pricing Truth)
            </h2>
            <p className={styles.paragraph}>
              The cafe owner and management bear sole legal responsibility for:
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <strong>FSSAI Licensing:</strong> Maintaining a valid Food Safety and Standards Authority of India (FSSAI) license for food preparation, hygiene, and distribution.
              </li>
              <li className={styles.bulletItem}>
                <strong>Menu Pricing & GST Collection:</strong> Accurately configuring Goods and Services Tax (GST) percentages (e.g., 5% composite or 18% restaurant dining) and depositing collected taxes with the Government of India. DINEVIQ acts solely as a technological calculation tool and is not responsible for tax defaults.
              </li>
              <li className={styles.bulletItem}>
                <strong>Allergen Disclaimers:</strong> Informing dining patrons about common allergens (nuts, dairy, gluten) via special notes or dish descriptions.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="khata-ledger" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} size={22} />
              6. Customer Khata (Credit Ledger) Disclaimers
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ includes a specialized <strong>Customer Khata (Digital Udhari)</strong> ledger allowing restaurants to log credit granted to frequent patrons.
            </p>
            <div className={styles.calloutBoxWarning}>
              <div className={styles.calloutTitleWarning}>
                <AlertTriangle size={16} />
                Financial Liability Notice
              </div>
              <p className={styles.calloutText}>
                The Khata feature is strictly an internal electronic record-keeping tool. DINEVIQ does <strong>not</strong> act as a credit provider, guarantor, debt collector, or financial underwriter. Any unsettled customer dues remain solely between the cafe and the individual customer.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="hardware-network" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Server className={styles.sectionIcon} size={22} />
              7. Hardware, Thermal Printers & Local Network Scope
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ supports standard USB, Bluetooth, and LAN/Network thermal receipt printers (80mm & 58mm ESC/POS standards). While our platform is designed to be hardware-agnostic:
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                The cafe must provide stable local Wi-Fi / 4G / 5G connectivity for real-time WebSocket order synchronization between tables and the kitchen.
              </li>
              <li className={styles.bulletItem}>
                DINEVIQ is not liable for kitchen printing failures caused by faulty physical printer cables, damaged thermal paper, or local router disconnection.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="sla-uptime" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Clock className={styles.sectionIcon} size={22} />
              8. 99.9% Cloud Uptime & Scheduled Maintenance
            </h2>
            <p className={styles.paragraph}>
              DINEVIQ targets <strong>99.9% service availability</strong> across our cloud API clusters, database replicas, and QR routing microservices. Routine system upgrades are scheduled during off-peak Indian hours (typically 2:00 AM – 4:00 AM IST) with prior dashboard notice.
            </p>
          </section>

          {/* Section 9 */}
          <section id="ip-rights" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileCheck className={styles.sectionIcon} size={22} />
              9. Intellectual Property & Customer Data Ownership
            </h2>
            <p className={styles.paragraph}>
              <strong>You Own Your Data:</strong> You retain full, exclusive ownership of your restaurant's logo, trademarks, menu items, recipe configurations, and customer order history.
            </p>
            <p className={styles.paragraph}>
              <strong>DINEVIQ Owns the Software:</strong> The DINEVIQ brand name, visual design, source code, AI algorithms, and layout architecture are the proprietary intellectual property of DINEVIQ Technologies India Pvt. Ltd. You may not reverse-engineer, decompile, or create derivative copies of the software.
            </p>
          </section>

          {/* Section 10 */}
          <section id="liability" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <AlertTriangle className={styles.sectionIcon} size={22} />
              10. Limitation of Liability & Indemnification
            </h2>
            <p className={styles.paragraph}>
              To the maximum extent permitted under applicable law, DINEVIQ and its officers shall not be liable for any indirect, incidental, punitive, or consequential damages (including loss of profits, dining interruption, or spoiled inventory) arising out of the use or inability to use the service.
            </p>
            <p className={styles.paragraph}>
              In any event, our total aggregate liability for all claims related to the software shall not exceed the total subscription fees paid by you to DINEVIQ in the preceding three (3) months.
            </p>
          </section>

          {/* Section 11 */}
          <section id="disputes" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Scale className={styles.sectionIcon} size={22} />
              11. Governing Law & Dispute Resolution
            </h2>
            <p className={styles.paragraph}>
              These Terms shall be governed by, interpreted, and construed in accordance with the substantive <strong>laws of the Republic of India</strong>.
            </p>
            <p className={styles.paragraph}>
              Any legal dispute, claim, or proceeding arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bangalore, Karnataka, India</strong>.
            </p>

            <div className={styles.contactCard} style={{ marginTop: '32px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
                Questions Regarding These Terms?
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>
                Contact our legal counsel and customer success team directly:
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>
                <div><strong>Email:</strong> <a href="mailto:support@dineviq.com" style={{ color: '#10b981' }}>support@dineviq.com</a></div>
                <div><strong>WhatsApp Tech Support:</strong> <span style={{ color: '#f1f5f9' }}>+91 96801 32562</span></div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;

