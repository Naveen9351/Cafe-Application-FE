import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRICING_TIERS, PRICING_COMPARISON_CATEGORIES } from "../../data/pricingData";
import { CUSTOM_ADDONS } from "../../config/subscriptionPlans";
import styles from "../../styles/Pricing.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function PricingCalculator({
  showComparison = true,
  onOpenDemoModal
}) {
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const gridRef = useRef(null);

  const tiers = PRICING_TIERS || [];
  const comparisonCategories = PRICING_COMPARISON_CATEGORIES || [];

  const customPlanPrice = useMemo(() => {
    return 499 + selectedAddons.reduce((sum, key) => {
      const addon = CUSTOM_ADDONS.find(a => a.id === key);
      return sum + (addon?.price || 0);
    }, 0);
  }, [selectedAddons]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (gridRef.current?.children) {
        gsap.fromTo(
          gridRef.current.children,
          { opacity: 0, y: 28, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 88%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={styles.calculatorWrap}>
      {/* Duration Header Pills */}
      <div className={styles.toggleContainer}>
        <div className={styles.toggleWrapper}>
          <div style={{ padding: "8px 16px", fontSize: 13, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
            <span>Dineviq Cafe OS: Starter (₹499) • Growth (₹799) • Pro (₹999) • Custom Add-ons</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards 3-Col Grid */}
      <div ref={gridRef} className={styles.pricingGrid}>
        {tiers.map((tier) => {
          const featureList = tier?.features || [];
          const hasDiscount = tier?.savings > 0;

          return (
            <div
              key={tier?.id || tier?.name}
              className={`${styles.priceCard} ${tier?.popular ? styles.popularCard : ""}`}
            >
              {tier?.badge && (
                <div className={styles.popularBadge}>
                  <Sparkles style={{ width: 12, height: 12 }} />
                  {tier?.badge}
                </div>
              )}

              <div>
                <div className={styles.cardHeader}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div className={styles.planName}>{tier?.name}</div>
                    <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>
                      {tier?.duration}
                    </span>
                  </div>
                  <div className={styles.planDesc}>{tier?.description}</div>
                </div>

                {/* Price Display */}
                <div className={styles.priceBox}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span className={styles.priceVal}>
                      ₹{tier?.price?.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-subtle)", fontWeight: 700 }}>
                      {tier?.periodText}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through", fontWeight: 600 }}>
                        ₹{tier?.originalPrice?.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {hasDiscount ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 100 }}>
                        {tier?.savingsText}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 600 }}>
                        (₹{tier?.effectiveMonthly}/mo)
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 6 }}>
                      {tier?.billingNote}
                    </div>
                  )}
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
                    <span>{tier?.ctaText}</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                ) : (
                  <Link
                    to="/demo"
                    className={tier?.popular ? "btn-electric" : "btn-white"}
                    style={{ width: "100%", padding: "12px 16px", fontSize: 13 }}
                  >
                    <span>{tier?.ctaText}</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Custom Plan Configurator */}
      <div style={{
        marginTop: 36,
        padding: "24px 28px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1.5px dashed var(--border-subtle, #cbd5e1)",
        background: "var(--bg-card, #ffffff)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 100, marginBottom: 6 }}>
              <Sparkles size={11} /> CUSTOM TAILORED STACK
            </div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 900, color: "var(--text-main)" }}>
              Build Your Custom Plan (Starter Base: ₹499/mo)
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Pick only the operational modules your restaurant needs. Cancel or adjust anytime.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--color-primary, #2563eb)" }}>
              ₹{customPlanPrice.toLocaleString("en-IN")}
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}> / month</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 600 }}>
              Base ₹499 + {selectedAddons.length} Selected Add-on{selectedAddons.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, marginTop: 16 }}>
          {CUSTOM_ADDONS.map(addon => {
            const isChecked = selectedAddons.includes(addon.id);
            return (
              <label
                key={addon.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: isChecked ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  background: isChecked ? "#f0f7ff" : "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedAddons([...selectedAddons, addon.id]);
                    else setSelectedAddons(selectedAddons.filter(k => k !== addon.id));
                  }}
                  style={{ marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{addon.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#2563eb" }}>+₹{addon.price}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{addon.description}</div>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          {onOpenDemoModal ? (
            <button
              type="button"
              onClick={onOpenDemoModal}
              className="btn-electric"
              style={{ padding: "10px 20px", fontSize: 13 }}
            >
              <span>Request Custom Plan @ ₹{customPlanPrice}/mo</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <Link
              to="/demo"
              className="btn-electric"
              style={{ padding: "10px 20px", fontSize: 13 }}
            >
              <span>Request Custom Plan @ ₹{customPlanPrice}/mo</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          )}
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      {showComparison && (
        <div className={styles.comparisonToggleWrap}>
          <button
            type="button"
            onClick={() => setComparisonOpen(!comparisonOpen)}
            className="btn-white"
            style={{ borderRadius: "var(--radius-full)", padding: "10px 24px", fontSize: 13 }}
          >
            <span>{comparisonOpen ? "Hide Detailed Feature Matrix" : "Compare All 16 Modules & Feature Matrix"}</span>
            <ArrowRight style={{ width: 14, height: 14, transform: comparisonOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }} />
          </button>

          {comparisonOpen && (
            <div className="card-luxury" style={{ padding: 28, marginTop: 24, textAlign: "left", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--border-subtle)", color: "var(--text-muted)", fontWeight: 800 }}>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Module & Operational Scope</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Starter (₹499)</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--color-primary)" }}>Growth ★ (₹799)</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Pro ■ (₹999)</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b" }}>Custom Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonCategories.map((cat, cIdx) => (
                    <React.Fragment key={cIdx}>
                      <tr style={{ background: "var(--color-primary-light)" }}>
                        <td colSpan={5} style={{ padding: "10px 16px", fontWeight: 900, textTransform: "uppercase", fontSize: 11, color: "var(--color-primary)" }}>
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
                          <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                            {feat?.custom || "—"}
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
