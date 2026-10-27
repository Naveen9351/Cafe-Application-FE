import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, X, Send, Bot, MessageSquare, ArrowRight, CornerDownLeft, CheckCircle2, Phone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Chatbot.module.css';
import { API_URL as API } from '../config/api';

export const KHUSHI_AVATAR_URL = 'https://cdnai.iconscout.com/ai-image/premium/thumb/ai-insurance-agent-id-3d-icon-png-download-jpg-13717616.png';

const renderFormattedText = (rawText) => {
  if (!rawText) return null;

  const lines = rawText.split('\n');

  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const lineContent = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <React.Fragment key={lIdx}>
        {lIdx > 0 && <br />}
        {lineContent}
      </React.Fragment>
    );
  });
};

function TypewriterMessage({ text, isLatest, onScroll }) {
  const [displayedText, setDisplayedText] = useState(isLatest ? "" : text);
  const [isTyping, setIsTyping] = useState(isLatest);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);

    let idx = 0;
    const speed = 15;
    const step = 2;

    const timer = setInterval(() => {
      idx += step;
      if (idx >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(timer);
        if (onScroll) onScroll();
      } else {
        setDisplayedText(text.slice(0, idx));
        if (onScroll) onScroll();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isLatest]);

  return (
    <span>
      {renderFormattedText(displayedText)}
      {isTyping && <span className={styles.typeCursor}>▌</span>}
    </span>
  );
}

export default function LandingChatbot({ onOpenDemo }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! 👋 I'm **Khushi**, your AI Restaurant Specialist at **DINEVIQ**.\n\nAsk me anything about our **Zero-Latency QR Table Menus**, **Kitchen KDS Displays**, **Cloud POS Billing**, or **Pricing Plans (₹)**!`
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customQuery) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setQuery('');
    setLoading(true);

    const lower = textToSend.toLowerCase();
    const isPricingQuery = lower.includes('price') || lower.includes('pricing') || lower.includes('cost') || lower.includes('plan') || lower.includes('charge') || lower.includes('rate') || lower.includes('billing') || lower.includes('rupee') || lower.includes('kitna') || lower.includes('paisa');

    // If asking about pricing, give answer and navigate to pricing/billing page
    if (isPricingQuery) {
      const pricingReply = `**DINEVIQ Transparent Pricing Plans (in ₹ INR)**:\n\n• **1 Month Plan (₹199)**: Dynamic QR Menu, Live KDS, UPI Payments, unlimited tables.\n• **6 Months Plan (₹999)**: Save 16% (₹166/mo effective rate), Multi-station KDS & Recipe Inventory.\n• **1 Year Plan (₹1,999)**: Best Value (2 Months FREE!), Central Menu Hub & Priority SLA.\n\n🚀 **Navigating you to our Pricing & Billing page now...**`;
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: pricingReply, isPricing: true }]);
        setLoading(false);
      }, 300);

      // Navigate to /pricing page
      setTimeout(() => {
        navigate('/pricing');
      }, 1500);

      return;
    }

    try {
      const response = await axios.post(`${API}/ai/public-copilot`, { query: textToSend });
      if (response.data && response.data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: response.data.reply }]);
      } else {
        throw new Error('No reply');
      }
    } catch (err) {
      // Intelligent fallback responses based on intent
      let reply = '';
      if (lower.includes('qr') || lower.includes('menu') || lower.includes('order')) {
        reply = `**DINEVIQ QR Dining** allows guests to scan table-specific QR codes with zero app downloads. They can view high-res visual menus, customize toppings/variants, and order with instant UPI payments. Orders route immediately to the kitchen KDS in < 50ms!`;
      } else if (lower.includes('kds') || lower.includes('kitchen') || lower.includes('kot')) {
        reply = `**DINEVIQ Kitchen Display System (KDS)** replaces paper tickets completely! Orders appear instantly with color-coded SLA timers. Chefs can filter by station (Grill, Bar, Fryer, Bakery) and tap to notify floor staff when plated.`;
      } else if (lower.includes('demo') || lower.includes('trial') || lower.includes('book')) {
        reply = `We'd love to show you DINEVIQ in action! Click the **'Schedule Demo'** button below or choose a preferred date/time on our demo booking page.`;
      } else {
        reply = `Thank you for asking! DINEVIQ provides an autonomous operating system for modern restaurants in India — uniting QR digital ordering, multi-station KDS, recipe inventory depletion, and UPI billing into a single cloud console. Would you like to schedule a 15-minute live demo?`;
      }
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What are the pricing plans in ₹?",
    "How does QR Table Ordering work?",
    "Does it support Kitchen KDS?",
    "How do I book a live demo?"
  ];

  return (
    <div className={styles.floatingContainer}>
      {/* Floating Circular 3D Avatar Launcher Button (Simple & Small) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.roundLauncherBtn}
          title="Chat with Khushi AI (DineviQ Assistant)"
          aria-label="Open Khushi AI Copilot"
        >
          <div className={styles.pulseRingCircle} />
          <div className={styles.circleBaseBackdrop} />
          <img
            src={KHUSHI_AVATAR_URL}
            alt="Khushi AI"
            className={styles.launcherAvatarImg}
          />
          <span className={styles.onlineDot} />
          <span className={styles.floatingLabelPill}>Khushi AI</span>
        </button>
      )}

      {/* Interactive Khushi Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className={styles.chatWindow}>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={styles.khushiAvatarWrapper} style={{ width: 30, height: 30 }}>
                  <img
                    src={KHUSHI_AVATAR_URL}
                    alt="Khushi AI"
                    className={styles.khushiAvatarImg}
                  />
                  <span className={styles.khushiOnlineDot} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>Khushi AI</span>
                    <span style={{ fontSize: 8.5, fontWeight: 900, background: 'var(--color-emerald)', color: '#ffffff', padding: '1px 4px', borderRadius: 3 }}>ONLINE</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
                    DineviQ Smart Copilot & Assistant
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close Chat"
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            {/* Message Stream */}
            <div className={styles.messageStream}>
              {messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                const isLatestAssistant = isAssistant && index === messages.length - 1;

                return (
                  <div
                    key={index}
                    className={isAssistant ? styles.msgBubbleAssistant : styles.msgBubbleUser}
                  >
                    {isAssistant ? (
                      <div>
                        <TypewriterMessage
                          text={msg.text}
                          isLatest={isLatestAssistant}
                          onScroll={scrollToBottom}
                        />
                        {/* Direct Navigation Button if message is about pricing */}
                        {msg.isPricing && (
                          <div className={styles.pricingActionCard}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>
                                DineviQ Pricing & Billing
                              </span>
                              <span style={{ fontSize: 10, color: '#64748b' }}>
                                Plans start at ₹199/mo with full POS & KDS
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/pricing');
                              }}
                              className={styles.pricingActionBtn}
                            >
                              <span>Go to Pricing</span>
                              <ArrowRight style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-subtle)', padding: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                  <span>Khushi AI is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className={styles.quickPromptsBar}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className={styles.promptChip}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className={styles.inputBar}
            >
              <input
                type="text"
                placeholder="Ask Khushi about pricing, QR menus, KDS, billing..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.inputField}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className={styles.sendBtn}
              >
                <Send style={{ width: 13, height: 13 }} />
              </button>
            </form>

            {/* Book Demo Shortcut Footer */}
            <div style={{ padding: '6px 10px', background: 'var(--color-primary-light)', borderTop: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                Ready to see DINEVIQ in action?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (typeof onOpenDemo === 'function') {
                    onOpenDemo();
                  } else {
                    navigate('/demo');
                  }
                }}
                className="btn-electric"
                style={{ padding: '3px 8px', fontSize: 9.5, cursor: 'pointer' }}
              >
                Schedule Demo →
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
