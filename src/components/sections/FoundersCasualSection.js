import React, { useEffect, useRef } from 'react';
import { Coffee, MessageCircle, Heart, Code2, ShieldCheck, Users } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/FoundersCasualSection.module.css';

gsap.registerPlugin(ScrollTrigger);

const TEAM_MEMBERS = [
  {
    name: "Naveen",
    avatarClass: styles.avatarNaveen,
    initials: "N",
    casualTag: "Developer & Deployer",
    tagColor: "var(--color-primary)",
    icon: Code2,
    desc: "Writes the core code, builds new features, and manages cloud deployments to make sure the platform stays lightning-fast and online 24/7.",
    vibe: "Coding, deploying & scaling the platform"
  },
  {
    name: "Deepak",
    avatarClass: styles.avatarDeepak,
    initials: "D",
    casualTag: "Tester & System Designer",
    tagColor: "var(--color-indigo)",
    icon: ShieldCheck,
    desc: "Designs the overall system architecture and rigorously tests every table order, KOT, and billing workflow to ensure zero bugs during peak cafe rushes.",
    vibe: "Architecting & edge-case testing"
  },
  {
    name: "Lakshay",
    avatarClass: styles.avatarLakshya,
    initials: "L",
    casualTag: "Sales & Support",
    tagColor: "var(--color-amber)",
    icon: Users,
    desc: "Connects with cafe owners, runs hands-on walkthroughs, and stays on call to ensure every outlet onboarding is smooth and well-supported.",
    vibe: "Demos & 24/7 cafe support"
  }
];

export default function FoundersCasualSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true
            }
          }
        );
      }

      if (cardsRef.current && cardsRef.current.children) {
        gsap.fromTo(
          cardsRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 85%",
              once: true
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="team" className={styles.teamSection}>
      <div className="container">

        {/* Section Header */}
        <div ref={headerRef} className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Coffee style={{ width: 14, height: 14 }} />
            <span>Built by Cafe Lovers</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Built by Naveen, Deepak & Lakshay
          </h2>
          <p className={styles.sectionSubtitle}>
            No corporate suits or buzzwords. Just three friends who spent countless hours in local cafes.
          </p>
        </div>

        {/* 3 Casual Cards */}
        <div ref={cardsRef} className={styles.cardsGrid}>
          {TEAM_MEMBERS.map((member, idx) => {
            return (
              <div key={idx} className={styles.memberCard}>
                <div>
                  <div className={styles.cardHeader}>
                    <div className={`${styles.avatarBox} ${member.avatarClass}`}>
                      {member.initials}
                    </div>
                    <div className={styles.memberMeta}>
                      <h3 className={styles.memberName}>{member.name}</h3>
                      <span className={styles.casualTag} style={{ color: member.tagColor }}>
                        {member.casualTag}
                      </span>
                    </div>
                  </div>

                  <p className={styles.memberDesc}>
                    {member.desc}
                  </p>
                </div>

                <div className={styles.bottomVibePill}>
                  <span>{member.vibe}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Casual Friendly Banner */}
        <div ref={bannerRef} className={styles.friendlyBanner}>
          <div className={styles.friendlyText}>
            <Heart style={{ width: 18, height: 18, color: "var(--color-rose)", flexShrink: 0 }} />
            <span>
              We believe in honest software and direct relationships with cafe operators. Need custom tweaks or have ideas?
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
