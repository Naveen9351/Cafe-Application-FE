import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { PRICING_TIERS, PRICING_COMPARISON_CATEGORIES } from "../../data/pricingData";

export default function PricingCalculator({
  onSelectPlan,
  showComparison = true,
  onOpenDemoModal
}) {
  const [billingCycle, setBillingCycle] = useState("annual");
  const [comparisonOpen, setComparisonOpen] = useState(false);

  return (
    <div className="w-full space-y-10">
      {/* Billing Cycle Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
              Save 25%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
              billingCycle === "monthly"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly Billing
          </button>
        </div>
      </div>

      {/* Pricing Cards 3-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PRICING_TIERS.map((tier) => {
          const isAnnual = billingCycle === "annual";
          const displayPrice = isAnnual ? tier.priceAnnual : tier.priceMonthly;

          return (
            <div
              key={tier.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                tier.popular
                  ? "bg-white border-2 border-orange-500 shadow-xl shadow-orange-500/10 lg:-translate-y-1 ring-2 ring-orange-500/10"
                  : "bg-white border border-slate-200 shadow-md shadow-slate-200/50 hover:border-slate-300"
              }`}
            >
              {/* Popular Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[9px] font-black tracking-widest uppercase shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{tier.badge}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 m-0">{tier.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 min-h-[28px] font-medium m-0">{tier.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="pt-2 pb-3 border-y border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                      ₹{displayPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ month</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium m-0">
                    {isAnnual ? "Billed annually • Free onboarding" : "Billed monthly • Cancel anytime"}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Included in this plan:
                  </div>
                  <ul className="space-y-2 list-none p-0 m-0">
                    {tier.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <div className="w-3.5 h-3.5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="leading-tight">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom CTA Action */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                {onOpenDemoModal ? (
                  <button
                    type="button"
                    onClick={onOpenDemoModal}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                      tier.popular
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/25 hover:scale-[1.01]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                    }`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    to="/demo"
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 no-underline ${
                      tier.popular
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/25 hover:scale-[1.01]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                    }`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Full Feature Comparison Table */}
      {showComparison && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setComparisonOpen(!comparisonOpen)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <span>{comparisonOpen ? "Hide Detailed Feature Matrix" : "Compare All Features & Modules"}</span>
            <ArrowRight className={`w-3.5 h-3.5 transition-transform ${comparisonOpen ? "-rotate-90" : "rotate-90"}`} />
          </button>

          {comparisonOpen && (
            <div className="mt-6 rounded-3xl p-5 sm:p-7 border border-slate-200 bg-white overflow-x-auto text-left shadow-xl animate-in fade-in slide-in-from-top-3 duration-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3 text-left w-1/3">Feature Capability</th>
                    <th className="pb-3 text-center w-1/5 text-slate-900">Starter</th>
                    <th className="pb-3 text-center w-1/5 text-orange-600 font-black">Growth</th>
                    <th className="pb-3 text-center w-1/5 text-slate-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PRICING_COMPARISON_CATEGORIES.map((cat, cIdx) => (
                    <React.Fragment key={cIdx}>
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="py-2.5 px-3 font-bold uppercase tracking-wider text-orange-700 text-[10px]">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.items.map((feat, fIdx) => (
                        <tr key={fIdx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-800 font-medium">{feat.name}</td>
                          <td className="py-2.5 px-3 text-center text-slate-700">
                            {typeof feat.starter === "boolean" ? (
                              feat.starter ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto font-bold" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="font-semibold">{feat.starter}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-orange-700 font-bold">
                            {typeof feat.growth === "boolean" ? (
                              feat.growth ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto font-bold" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span>{feat.growth}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700">
                            {typeof feat.enterprise === "boolean" ? (
                              feat.enterprise ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto font-bold" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="font-semibold">{feat.enterprise}</span>
                            )}
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
