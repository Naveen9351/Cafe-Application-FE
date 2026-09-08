import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { PRICING_TIERS, PRICING_COMPARISON_CATEGORIES } from "../../data/pricingData";
import styles from "../../styles/Pricing.module.css";

export default function PricingCalculator({
  showComparison = true,
  onOpenDemoModal
}) {
  const [billingCycle, setBillingCycle] = useState("annual");
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const tiers = PRICING_TIERS || [];
  const comparisonCategories = PRICING_COMPARISON_CATEGORIES || [];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Billing Cycle Toggle */}
      <div className={styles.toggleContainer}>
        <div className={styles.toggleWrapper}>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`${styles.toggleBtn} ${billingCycle === "annual" ? styles.toggleBtnActive : ""}`}
          >
            <span>Annual Billing</span>
            <span style={{ fontSize: 9, fontWeight: 900, background: "var(--color-emerald)", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>
              Save 25%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`${styles.toggleBtn} ${billingCycle === "monthly" ? styles.toggleBtnActive : ""}`}
          >
            Monthly Billing
          </button>
        </div>
      </div>

      {/* Pricing Cards 3-Col Grid */}
      <div className={styles.pricingGrid}>
        {tiers.map((tier) => {
          const isAnnual = billingCycle === "annual";
          const displayPrice = isAnnual ? (tier?.priceAnnual || 0) : (tier?.priceMonthly || 0);
          const featureList = tier?.features || tier?.highlights || [];

          return (
            <div
              key={tier?.id || Math.random()}
              className={`${styles.priceCard} ${tier?.popular ? styles.popularCard : ""}`}
            >
              {tier?.popular && (
                <div className={styles.popularBadge}>
                  <Sparkles style={{ width: 12, height: 12 }} />
                  {tier?.badge || "Popular"}
                </div>
              )}

              <div>
                <div className={styles.cardHeader}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div className={styles.planName}>{tier?.name}</div>
                    {!tier?.popular && tier?.badge && (
                      <span className="badge-pill badge-blue" style={{ fontSize: 9 }}>
                        {tier?.badge}
                      </span>
                    )}
                  </div>
                  <div className={styles.planDesc}>{tier?.description}</div>
                </div>

                {/* Price Display */}
                <div className={styles.priceBox}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span className={styles.priceVal}>
                      ₹{displayPrice.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-subtle)", fontWeight: 700 }}>/ month</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 4 }}>
                    {isAnnual ? "Billed annually • Free onboarding" : "Billed monthly • Cancel anytime"}
                  </div>
                </div>

                {/* Highlights List */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Included in this plan:
                  </div>
                  <ul className={styles.featureList}>
                    {featureList.map((h, idx) => (
                      <li key={idx} className={styles.featureItem}>
                        <div className={styles.featureIcon}>
                          <Check style={{ width: 11, height: 11 }} />
                        </div>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom CTA Action */}
              <div style={{ paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
                {onOpenDemoModal ? (
                  <button
                    type="button"
                    onClick={onOpenDemoModal}
                    className={tier?.popular ? "btn-electric" : "btn-white"}
                    style={{ width: "100%", padding: "12px 16px", fontSize: 13 }}
                  >
                    <span>{tier?.ctaText || "Get Started"}</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                ) : (
                  <Link
                    to="/demo"
                    className={tier?.popular ? "btn-electric" : "btn-white"}
                    style={{ width: "100%", padding: "12px 16px", fontSize: 13 }}
                  >
                    <span>{tier?.ctaText || "Get Started"}</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      {showComparison && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setComparisonOpen(!comparisonOpen)}
            className="btn-white"
            style={{ borderRadius: "var(--radius-full)", padding: "10px 24px", fontSize: 13 }}
          >
            <span>{comparisonOpen ? "Hide Detailed Feature Matrix" : "Compare All Features & Modules"}</span>
            <ArrowRight style={{ width: 14, height: 14, transform: comparisonOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }} />
          </button>

          {comparisonOpen && (
            <div className="card-luxury" style={{ padding: 28, marginTop: 24, textAlign: "left", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--border-subtle)", color: "var(--text-muted)", fontWeight: 800 }}>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Feature Capability</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Starter</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--color-primary)" }}>Growth Pro</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonCategories.map((cat, cIdx) => (
                    <React.Fragment key={cIdx}>
                      <tr style={{ background: "var(--color-primary-light)" }}>
                        <td colSpan={4} style={{ padding: "10px 16px", fontWeight: 900, textTransform: "uppercase", fontSize: 11, color: "var(--color-primary)" }}>
                          {cat?.category}
                        </td>
                      </tr>
                      {(cat?.items || []).map((feat, fIdx) => (
                        <tr key={fIdx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "10px 16px", fontWeight: 600 }}>{feat?.name}</td>
                          <td style={{ padding: "10px 16px", textAlign: "center" }}>
                            {typeof feat?.starter === "boolean" ? (
                              feat?.starter ? <Check style={{ width: 16, height: 16, color: "var(--color-emerald)", margin: "0 auto" }} /> : <span style={{ color: "var(--text-light)" }}>—</span>
                            ) : <span>{feat?.starter}</span>}
                          </td>
                          <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: "var(--color-primary)" }}>
                            {typeof feat?.growth === "boolean" ? (
                              feat?.growth ? <Check style={{ width: 16, height: 16, color: "var(--color-emerald)", margin: "0 auto" }} /> : <span style={{ color: "var(--text-light)" }}>—</span>
                            ) : <span>{feat?.growth}</span>}
                          </td>
                          <td style={{ padding: "10px 16px", textAlign: "center" }}>
                            {typeof feat?.enterprise === "boolean" ? (
                              feat?.enterprise ? <Check style={{ width: 16, height: 16, color: "var(--color-emerald)", margin: "0 auto" }} /> : <span style={{ color: "var(--text-light)" }}>—</span>
                            ) : <span>{feat?.enterprise}</span>}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
