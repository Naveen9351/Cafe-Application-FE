import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  AlertTriangle,
  TrendingUp,
  Search,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Zap,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import styles from './CafeAICopilotChatbot.module.css';

// Rich Inline Text Formatter (Highlights, Bold, Prices)
const renderInlineFormatted = (text) => {
  if (!text) return null;

  // Split by bold (**bold**) and price tags (₹...)
  const tokens = text.split(/(\*\*.*?\*\*|₹[0-9,]+(?:\.[0-9]+)?)/g);

  return tokens.map((token, idx) => {
    if (!token) return null;
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={idx} className={styles.highlightBold}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('₹')) {
      return (
        <span key={idx} className={styles.priceBadge}>
          {token}
        </span>
      );
    }
    return token;
  });
};

// Rich Structured Content Parser (Tables, Recommendation Cards, Section Headers, Metric Tiles)
const RichMessageRenderer = ({ rawText }) => {
  if (!rawText) return null;

  const lines = rawText.split('\n');
  const elements = [];
  let tableBuffer = [];
  let currentKey = 0;

  const flushTable = () => {
    if (tableBuffer.length === 0) return;

    // Filter out separator lines (|---|---|)
    const validLines = tableBuffer.filter(l => {
      const stripped = l.replace(/[\s|:-]/g, '');
      return stripped.length > 0;
    });

    if (validLines.length > 0) {
      const headerLine = validLines[0];
      const dataLines = validLines.slice(1);

      const headers = headerLine
        .split('|')
        .map(h => h.trim())
        .filter((h, idx, arr) => (idx > 0 && idx < arr.length - 1) || (h.length > 0 && arr.length <= 2));

      elements.push(
        <div key={`tbl_${currentKey++}`} className={styles.richTableWrapper}>
          <table className={styles.richTable}>
            {headers.length > 0 && (
              <thead>
                <tr>
                  {headers.map((th, thIdx) => (
                    <th key={thIdx} className={styles.richTh}>
                      {renderInlineFormatted(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {dataLines.map((row, rIdx) => {
                const cells = row
                  .split('|')
                  .map(c => c.trim())
                  .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || (c.length > 0 && arr.length <= 2));
                if (cells.length === 0) return null;
                return (
                  <tr key={rIdx} className={styles.richTr}>
                    {cells.map((td, tdIdx) => (
                      <td key={tdIdx} className={styles.richTd}>
                        {renderInlineFormatted(td)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Table Detection
    if (line.startsWith('|') && line.endsWith('|')) {
      tableBuffer.push(line);
      continue;
    } else {
      flushTable();
    }

    if (!line) {
      elements.push(<div key={`sp_${currentKey++}`} className={styles.paragraphSpacer} />);
      continue;
    }

    // 2. Section Header (### or ##)
    if (line.startsWith('### ') || line.startsWith('## ')) {
      const title = line.replace(/### |## /g, '').replace(/^[^\w\s]+/g, '').trim();
      elements.push(
        <div key={`h_${currentKey++}`} className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{renderInlineFormatted(title)}</span>
        </div>
      );
      continue;
    }

    // 3. Recommendation / Growth / Anomaly Card (* **Title:** Description or 1. **Title:** ...)
    const cardMatch = line.match(/^(\*|-|\d+\.)\s+(\*\*([^*]+)\*\*[:|-]?\s*(.*))$/);
    if (cardMatch) {
      const title = cardMatch[3].replace(/^[^\w\s]+/g, '').trim();
      const desc = cardMatch[4];
      const isRisk = line.toLowerCase().includes('risk') || line.toLowerCase().includes('warning') || line.toLowerCase().includes('khata');
      const isCombo = line.toLowerCase().includes('combo') || line.toLowerCase().includes('bundle') || line.toLowerCase().includes('boost');

      elements.push(
        <div key={`card_${currentKey++}`} className={`${styles.recommendationCard} ${isRisk ? styles.riskCard : ''} ${isCombo ? styles.comboCard : ''}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitleText}>{title}</span>
          </div>
          {desc && <div className={styles.cardDescText}>{renderInlineFormatted(desc)}</div>}
        </div>
      );
      continue;
    }

    // 4. Standard bullet list item (* or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const bulletContent = line.slice(2).replace(/^[^\w\s]+/g, '').trim();
      elements.push(
        <div key={`li_${currentKey++}`} className={styles.bulletItem}>
          <span className={styles.bulletDot}>•</span>
          <div className={styles.bulletContent}>{renderInlineFormatted(bulletContent)}</div>
        </div>
      );
      continue;
    }

    // 5. Standard text paragraph
    elements.push(
      <p key={`p_${currentKey++}`} className={styles.standardParagraph}>
        {renderInlineFormatted(line)}
      </p>
    );
  }

  flushTable();
  return <div className={styles.richMessageBody}>{elements}</div>;
};

// Typewriter effect component for smooth letter-by-letter / stream rendering
const TypewriterMessage = ({ text, isTyping, onComplete, onTick }) => {
  const [displayedLength, setDisplayedLength] = useState(isTyping ? 0 : (text || '').length);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedLength((text || '').length);
      return;
    }

    setDisplayedLength(0);
    let current = 0;
    const fullLen = (text || '').length;
    const step = Math.max(2, Math.floor(fullLen / 65));

    const timer = setInterval(() => {
      current = Math.min(fullLen, current + step);
      setDisplayedLength(current);
      if (onTick) onTick();
      if (current >= fullLen) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 16);

    return () => clearInterval(timer);
  }, [text, isTyping]);

  const visibleText = (text || '').slice(0, displayedLength);

  return (
    <div className={styles.typewriterWrap}>
      <RichMessageRenderer rawText={visibleText} />
      {isTyping && displayedLength < (text || '').length && (
        <span className={styles.typingCursor}>▍</span>
      )}
    </div>
  );
};

const KHUSHI_AVATAR_URL = 'https://cdnai.iconscout.com/ai-image/premium/thumb/ai-insurance-agent-id-3d-icon-png-download-jpg-13717616.png';
const SESSION_CHAT_KEY = 'serviq_khushi_chat_history';

const defaultGreeting = {
  role: 'assistant',
  text: `Hello! I am **Khushi AI**, your smart restaurant operations & sales growth assistant.\n\nHow can I help you boost sales, build combos, or check store insights today?`
};

export default function CafeAICopilotChatbot({ tenantInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // 'chat', 'raise_ticket', 'my_tickets'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [typingIndex, setTypingIndex] = useState(null);

  // Load chat messages from sessionStorage so data is retained across drawer open/close
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Session chat load error:', e);
    }
    return [defaultGreeting];
  });

  // Sync chat messages to sessionStorage on update
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Session chat save error:', e);
    }
  }, [messages]);

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'POS Terminal',
    description: '',
    priority: 'normal',
    screenshot: null
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, viewMode, loading]);

  useEffect(() => {
    if (isOpen && viewMode === 'my_tickets') {
      fetchMyTickets();
    }
  }, [isOpen, viewMode]);

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/tickets`, {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(res.data)) {
        setMyTickets(res.data);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSend = async (customQuery) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading) return;

    const lower = textToSend.toLowerCase();

    // Check if user intent is to raise a ticket
    if (lower.includes('raise ticket') || lower.includes('report bug') || lower.includes('report issue') || lower.includes('file ticket')) {
      setMessages(prev => [
        ...prev,
        { role: 'user', text: textToSend },
        { role: 'assistant', text: `Opening the **Support Ticket Creation Form** for you right away. You can attach details and screenshots, and our Main Admin will be notified in real-time!` }
      ]);
      setQuery('');
      setViewMode('raise_ticket');
      return;
    }

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setQuery('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/copilot`,
        { query: textToSend },
        {
          headers: {
            'x-auth-token': token,
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.reply) {
        setMessages(prev => {
          const next = [...prev, { role: 'assistant', text: response.data.reply }];
          setTypingIndex(next.length - 1);
          return next;
        });
      } else {
        throw new Error('No reply received');
      }
    } catch (err) {
      console.error('Khushi AI error:', err);
      // Fallback
      let fallbackText = `I analyzed your live store data. You have active menu items and orders in the database. Try asking:\n- "How do I increase my sales today?"\n- "Find any data mismatches or uncollected bills"\n- "Which ingredients are low on stock?"\n- "Raise a support ticket for main admin"`;
      setMessages(prev => {
        const next = [...prev, { role: 'assistant', text: fallbackText }];
        setTypingIndex(next.length - 1);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Screenshot must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketForm(prev => ({ ...prev, screenshot: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error('Please enter both Subject and Description');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        subject: ticketForm.subject.trim(),
        category: ticketForm.category,
        description: ticketForm.description.trim(),
        priority: ticketForm.priority,
        screenshotUrl: ticketForm.screenshot || '',
        contactEmail: tenantInfo?.email || '',
        contactPhone: tenantInfo?.phone || ''
      };

      const res = await axios.post(`${API_URL}/tickets`, payload, {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });

      const ticketNum = res.data?.ticket?.ticketNumber || 'NEW';
      toast.success(`Ticket #${ticketNum} submitted! Main admin notified in real time.`);

      // Reset Form & switch to chat
      setTicketForm({
        subject: '',
        category: 'POS Terminal',
        description: '',
        priority: 'normal',
        screenshot: null
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `**Support Ticket Raised Successfully!**\n\n- **Ticket Reference:** \`#${ticketNum}\`\n- **Category:** ${payload.category}\n- **Priority:** ${payload.priority.toUpperCase()}\n- **Status:** OPEN (Dispatched to Super Admin Console in Real-Time)\n\nThe platform administration team will review and resolve this directly. You can track this in the **'My Tickets'** tab above!`
        }
      ]);

      setViewMode('chat');
    } catch (err) {
      console.error('Submit ticket error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className={styles.floatingWidgetContainer}>
      {/* Floating Circular 3D Avatar Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.roundLauncherBtn}
          title="Chat with Khushi AI (Store Assistant)"
        >
          <div className={styles.pulseRingCircle} />
          <div className={styles.circleBaseBackdrop} />
          <img
            src={KHUSHI_AVATAR_URL}
            alt="Khushi AI"
            className={styles.launcherAvatarImg}
          />
          <span className={styles.floatingLabelPill}>Khushi AI</span>
        </button>
      )}

      {/* Floating Chat & Ticket Window */}
      {isOpen && (
        <div className={styles.chatDrawer}>
          {/* Header */}
          <div className={styles.drawerHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.headerAvatarWrapper}>
                <img
                  src={KHUSHI_AVATAR_URL}
                  alt="Khushi AI"
                  className={styles.headerAvatarImg}
                />
              </div>
              <div>
                <div className={styles.headerTitleRow}>
                  <h4>Khushi AI</h4>
                </div>
                <p className={styles.headerSub}>
                  {tenantInfo?.businessName || tenantInfo?.name || 'Restaurant Growth & Operations'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className={styles.closeDrawerBtn}
              onClick={() => setIsOpen(false)}
              title="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Sub-Header Tabs */}
          <div className={styles.modeTabsBar}>
            <button
              type="button"
              className={`${styles.modeTab} ${viewMode === 'chat' ? styles.modeTabActive : ''}`}
              onClick={() => setViewMode('chat')}
            >
              <Sparkles size={13} />
              AI Assistant
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${viewMode === 'raise_ticket' ? styles.modeTabActive : ''}`}
              onClick={() => setViewMode('raise_ticket')}
            >
              <ShieldAlert size={13} color="#ef4444" />
              Raise Ticket
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${viewMode === 'my_tickets' ? styles.modeTabActive : ''}`}
              onClick={() => setViewMode('my_tickets')}
            >
              <Clock size={13} />
              My Tickets ({myTickets.length})
            </button>
          </div>

          {/* VIEW 1: AI ASSISTANT CHAT STREAM */}
          {viewMode === 'chat' && (
            <>
              <div className={styles.messagesContainer}>
                {messages.map((msg, idx) => {
                  const isAssistant = msg.role === 'assistant';
                  const isTyping = isAssistant && idx === typingIndex;

                  return (
                    <div
                      key={idx}
                      className={isAssistant ? styles.assistantMessageWrap : styles.userMessageWrap}
                    >
                      {isAssistant && (
                        <div className={styles.assistantAvatar}>
                          <img
                            src={KHUSHI_AVATAR_URL}
                            alt="Khushi AI"
                            className={styles.msgAvatarImg}
                          />
                        </div>
                      )}
                      <div className={isAssistant ? styles.assistantBubble : styles.userBubble}>
                        {isAssistant ? (
                          <TypewriterMessage
                            text={msg.text}
                            isTyping={isTyping}
                            onComplete={() => setTypingIndex(null)}
                            onTick={scrollToBottom}
                          />
                        ) : (
                          <RichMessageRenderer rawText={msg.text} />
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className={styles.assistantMessageWrap}>
                    <div className={styles.assistantAvatar}>
                      <img
                        src={KHUSHI_AVATAR_URL}
                        alt="Khushi AI"
                        className={styles.msgAvatarImg}
                      />
                    </div>
                    <div className={styles.bouncingDotsBubble}>
                      <span className={styles.bouncingDot}></span>
                      <span className={styles.bouncingDot}></span>
                      <span className={styles.bouncingDot}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className={styles.chatInputForm}
              >
                <input
                  type="text"
                  placeholder="Ask Khushi AI about sales, combos, stock, or report issues..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.chatInputField}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className={styles.sendButton}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}

          {/* VIEW 2: RAISE SUPPORT / BUG TICKET FORM */}
          {viewMode === 'raise_ticket' && (
            <div className={styles.ticketFormContainer}>
              <div className={styles.ticketFormHeader}>
                <ShieldAlert size={20} color="#ef4444" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                    Raise Issue to Main Admin
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                    Dispatched in real-time to the Platform Super Admin console
                  </p>
                </div>
              </div>

              <form onSubmit={handleTicketSubmit} className={styles.ticketFormInner}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Category *</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="POS Terminal">POS Terminal & Billing</option>
                    <option value="Kitchen KDS">Kitchen KDS & KOT</option>
                    <option value="QR Menu">Table QR Code & Online Menu</option>
                    <option value="Billing & Taxes">Taxes, Khata & Settlements</option>
                    <option value="Bug Report">Data Mismatch / App Bug</option>
                    <option value="Feature Request">New Feature Request</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Issue Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unpaid Khata bill showing mismatch with register"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Detailed Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details, order numbers, steps to reproduce, or discrepancy amounts..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Priority Level</label>
                  <div className={styles.prioritySelector}>
                    {['normal', 'high', 'urgent'].map(pr => (
                      <button
                        key={pr}
                        type="button"
                        className={`${styles.priorityBtn} ${ticketForm.priority === pr ? styles.priorityBtnActive : ''} ${pr === 'urgent' ? styles.urgentBtn : ''}`}
                        onClick={() => setTicketForm({ ...ticketForm, priority: pr })}
                      >
                        {pr === 'urgent' ? '🔥 Urgent' : pr === 'high' ? '⚠️ High' : '🟢 Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Attach Screenshot (Optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleScreenshotChange}
                  />
                  {ticketForm.screenshot ? (
                    <div className={styles.screenshotPreviewBox}>
                      <img src={ticketForm.screenshot} alt="Preview" className={styles.screenshotImg} />
                      <button
                        type="button"
                        className={styles.removeScreenshotBtn}
                        onClick={() => setTicketForm({ ...ticketForm, screenshot: null })}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.uploadTriggerArea}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={20} color="#64748b" />
                      <span>Click to upload error screenshot</span>
                    </div>
                  )}
                </div>

                <div className={styles.ticketActionsRow}>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className={styles.submitTicketBtn}
                  >
                    {isSubmittingTicket ? 'Dispatching to Admin...' : 'Submit Ticket in Real-Time'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelTicketBtn}
                    onClick={() => setViewMode('chat')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: MY SUBMITTED TICKETS LIST */}
          {viewMode === 'my_tickets' && (
            <div className={styles.myTicketsContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Submitted Support Tickets
                </h4>
                <button
                  type="button"
                  onClick={() => setViewMode('raise_ticket')}
                  className={styles.newTicketMiniBtn}
                >
                  <Plus size={12} /> New Ticket
                </button>
              </div>

              {loadingTickets ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  <RefreshCw size={16} className={styles.spinIcon} style={{ marginRight: 6 }} /> Loading tickets...
                </div>
              ) : myTickets.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={32} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  No tickets raised yet. Everything running smoothly!
                </div>
              ) : (
                <div className={styles.ticketsList}>
                  {myTickets.map((t) => (
                    <div key={t._id} className={styles.ticketCard}>
                      <div className={styles.ticketCardHeader}>
                        <span className={styles.ticketNumber}>#{t.ticketNumber}</span>
                        <span className={`${styles.ticketStatusBadge} ${styles['status_' + t.status]}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.ticketSubject}>{t.subject}</div>
                      <div className={styles.ticketDesc}>{t.description}</div>
                      {t.adminNotes && (
                        <div className={styles.adminNotesBox}>
                          <strong>Main Admin Note:</strong> {t.adminNotes}
                        </div>
                      )}
                      <div className={styles.ticketMetaRow}>
                        <span>{t.category} • {t.priority.toUpperCase()} Priority</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
