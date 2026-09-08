import React, { useState, useEffect } from "react";
import { Sparkles, Utensils, X, Flame, CheckCircle2 } from "lucide-react";
import styles from "../../styles/LiveActivityToast.module.css";

const ACTIVITIES = [
  {
    id: "act-1",
    venue: "The Copper Chimney",
    action: "Turned Table 14 in 38 mins",
    metric: "Saved 14 mins dead time",
    icon: Sparkles,
    iconBg: "#fff7ed",
    iconColor: "#ea580c",
    iconBorder: "#fed7aa",
    timeAgo: "2m ago"
  },
  {
    id: "act-2",
    venue: "Smokehouse Bistro",
    action: "Grill Station marked Order #104 Ready",
    metric: "Prep time: 6m 20s (Target: <8m)",
    icon: Flame,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    iconBorder: "#fde68a",
    timeAgo: "4m ago"
  },
  {
    id: "act-3",
    venue: "Artisan Pizza Co.",
    action: "Guest added Truffle Aioli modifier",
    metric: "+₹180 check size increase",
    icon: Utensils,
    iconBg: "#ecfdf5",
    iconColor: "#059669",
    iconBorder: "#a7f3d0",
    timeAgo: "5m ago"
  },
  {
    id: "act-4",
    venue: "Blue Bay Lounge",
    action: "Table 8 paid tab instantly via UPI",
    metric: "Zero server bill wait delay",
    icon: CheckCircle2,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    iconBorder: "#bfdbfe",
    timeAgo: "7m ago"
  }
];

export default function LiveActivityToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setVisible(true);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const current = ACTIVITIES[index];
  const Icon = current.icon;

  return (
    <div
      className={`${styles.toastContainer} ${
        visible ? styles.toastVisible : styles.toastHidden
      }`}
    >
      <div className={styles.toastCard}>
        {/* Icon */}
        <div
          className={styles.iconWrapper}
          style={{
            backgroundColor: current.iconBg,
            color: current.iconColor,
            borderColor: current.iconBorder
          }}
        >
          <Icon style={{ width: 16, height: 16 }} />
        </div>

        {/* Content */}
        <div className={styles.contentWrapper}>
          <div className={styles.headerRow}>
            <span className={styles.venueName}>
              <span className={styles.liveDot} />
              {current.venue}
            </span>
            <span className={styles.timeAgo}>{current.timeAgo}</span>
          </div>
          <p className={styles.actionText}>
            {current.action}
          </p>
          <p className={styles.metricText}>
            {current.metric}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={styles.closeButton}
          title="Dismiss"
          aria-label="Dismiss notification"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
