import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, X, Send, Bot, MessageSquare, ArrowRight, CornerDownLeft } from 'lucide-react';
import BrandLogo from './BrandLogo';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

export default function LandingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! 👋 I'm the **RASTRORATO AI Concierge**.\n\nI'm here to help you understand how RASTRORATO can power your restaurant, cafe, or cloud kitchen.\n\nAsk me anything about features, pricing plans, hardware support, or booking a live demo!`
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
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting right now. Please try again!" }]);
      }
    } catch (err) {
      console.error("Chatbot request error:", err);
      // Fallback local response
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `RASTRORATO is the all-in-one operating system for high-growth dining! It includes fast POS billing, live kitchen KDS, recipe inventory & POs, and 0% commission QR ordering. You can launch a 14-day free trial on the top right!`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What is RASTRORATO?",
    "Show me pricing plans",
    "Does it work with my thermal printer?",
    "How does the KDS kitchen screen work?",
  ];

  return (
    <div style={{ position: 'fixed', bottom: 'clamp(12px, 3vw, 24px)', right: 'clamp(12px, 3vw, 24px)', zIndex: 999 }}>
      
      {/* ── 1. FLOATING TRIGGER BUTTON ── */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '100px',
            padding: 'clamp(0.65rem, 2vw, 0.85rem) clamp(1rem, 3vw, 1.4rem)',
            fontWeight: '800',
            fontSize: 'clamp(0.82rem, 2vw, 0.92rem)',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(5, 150, 105, 0.4), 0 0 20px rgba(5, 150, 105, 0.2)',
            outline: 'none',
          }}
        >
          <Sparkles size={16} color="#fde68a" />
          <span>Ask RASTRORATO AI</span>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#34d399',
            boxShadow: '0 0 8px #34d399',
          }} />
        </motion.button>
      )}

      {/* ── 2. EXPANDED CHATBOT WINDOW ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: 'min(390px, calc(100vw - 24px))',
              height: 'min(560px, calc(100vh - 70px))',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 35px rgba(5, 150, 105, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: "'Outfit', 'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <BrandLogo theme="light" size="sm" showText={false} />
                <div>
                  <div style={{ fontWeight: '900', fontSize: '0.98rem', color: '#0f172a', lineHeight: 1.2 }}>
                    RASTRORATO AI
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                    Product Concierge
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{
              padding: '0.6rem 0.85rem',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              gap: '0.45rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}>
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  style={{
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    borderRadius: '100px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    color: '#059669',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.08)'; e.currentTarget.style.color = '#059669'; }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Message Log */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              backgroundColor: '#fafbfc',
            }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: m.role === 'user' ? '#059669' : '#ffffff',
                    color: m.role === 'user' ? '#ffffff' : '#1e293b',
                    fontSize: '0.84rem',
                    lineHeight: '1.55',
                    border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
              ))}

              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.65rem 1rem',
                  borderRadius: '16px 16px 16px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: '#64748b',
                }}>
                  <Sparkles size={14} color="#059669" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="Ask anything about RASTRORATO..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  backgroundColor: query.trim() ? '#059669' : '#e2e8f0',
                  color: query.trim() ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  cursor: query.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={15} />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
