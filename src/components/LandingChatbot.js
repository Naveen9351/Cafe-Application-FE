import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, X, Send, Bot, MessageSquare, ArrowRight, CornerDownLeft, CheckCircle2, Phone, Zap } from 'lucide-react';
import styles from '../styles/Chatbot.module.css';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

export default function LandingChatbot({ onOpenDemo }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! 👋 Welcome to **SARVIQ**.\n\nI am your AI Restaurant Growth Specialist. Ask me anything about our **Zero-Latency QR Menus**, **Real-Time KDS Displays**, **Indian UPI Payments**, or **Pricing Plans (₹)**!`
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

    try {
      const response = await axios.post(`${API}/ai/public-copilot`, { query: textToSend });
      if (response.data && response.data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: response.data.reply }]);
      } else {
        throw new Error('No reply');
      }
    } catch (err) {
      // Intelligent fallback responses based on intent
      const lower = textToSend.toLowerCase();
      let reply = '';
      if (lower.includes('price') || lower.includes('cost') || lower.includes('rupee') || lower.includes('plan')) {
        reply = `**SARVIQ Pricing Plans (in ₹ INR)**:\n\n• **Starter (₹1,499/mo)**: Digital QR Menu, Live Kitchen KDS, UPI Instant Payments, up to 10 tables.\n• **Growth Pro (₹2,999/mo)**: Multi-station line routing, Recipe-level Inventory, Real-Time Analytics, unlimited tables.\n• **Enterprise (₹5,999/mo)**: Multi-location Franchise OS, Central Menu Sync, 24/7 SLA.\n\nWould you like to book a 1-on-1 walkthrough?`;
      } else if (lower.includes('qr') || lower.includes('menu') || lower.includes('order')) {
        reply = `**SARVIQ QR Dining** allows guests to scan table-specific QR codes with zero app downloads. They can view high-res visual menus, customize toppings/variants, and order with instant UPI payments. Orders route immediately to the kitchen KDS in < 50ms!`;
      } else if (lower.includes('kds') || lower.includes('kitchen') || lower.includes('kot')) {
        reply = `**SARVIQ Kitchen Display System (KDS)** replaces paper tickets completely! Orders appear instantly with color-coded SLA timers. Chefs can filter by station (Grill, Bar, Fryer, Bakery) and tap to notify floor staff when plated.`;
      } else if (lower.includes('demo') || lower.includes('trial') || lower.includes('book')) {
        reply = `We'd love to show you SARVIQ in action! Click the **'Schedule Demo'** button below or choose a preferred date/time on our demo booking page.`;
      } else {
        reply = `Thank you for asking! SARVIQ provides an autonomous operating system for modern restaurants in India — uniting QR digital ordering, multi-station KDS, recipe inventory depletion, and UPI billing into a single cloud console. Would you like to schedule a 15-minute live demo?`;
      }
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "How does QR Table Ordering work?",
    "What are the pricing plans in ₹?",
    "Does it support Kitchen KDS?",
    "How do I book a live demo?"
  ];

  return (
    <div className={styles.floatingContainer}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.triggerBtn}
          aria-label="Open SARVIQ AI Concierge"
        >
          <div className={styles.pulseRing} />
          <Bot style={{ width: 17, height: 17 }} />
          <span>SARVIQ AI Concierge</span>
          <Sparkles style={{ width: 13, height: 13, opacity: 0.8 }} />
        </button>
      )}

      {/* Interactive Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className={styles.chatWindow}>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>SARVIQ AI Concierge</span>
                    <span style={{ fontSize: 9, fontWeight: 900, background: 'var(--color-emerald)', color: '#ffffff', padding: '1px 5px', borderRadius: 4 }}>ONLINE</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                    Ask about QR, KDS, Stock & Pricing
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close Chat"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Message Stream */}
            <div className={styles.messageStream}>
              {messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={isAssistant ? styles.msgBubbleAssistant : styles.msgBubbleUser}
                  >
                    {msg.text}
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-subtle)', padding: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                  <span>SARVIQ AI is typing...</span>
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
                placeholder="Ask anything about SARVIQ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.inputField}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className={styles.sendBtn}
              >
                <Send style={{ width: 15, height: 15 }} />
              </button>
            </form>

            {/* Book Demo Shortcut Footer */}
            {onOpenDemo && (
              <div style={{ padding: '8px 14px', background: 'var(--color-primary-light)', borderTop: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                  Ready to see SARVIQ in action?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenDemo();
                  }}
                  className="btn-electric"
                  style={{ padding: '4px 10px', fontSize: 10 }}
                >
                  Schedule Demo →
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
