import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, User, Plus, Minus, CreditCard, IndianRupee, Trash, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getValidFoodImage } from '../AdminPanel';
import styles from './POSTerminal.module.css';

export default function POSTerminal({ tenantId, menuItems, onOrderPlaced }) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  
  // Customization dialog state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Split bill states
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splits, setSplits] = useState([]);

  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleOpenCustomize = (item) => {
    setCustomizingItem(item);
    setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
    setSelectedAddons([]);
  };

  const handleAddToCart = () => {
    if (!customizingItem) return;

    let finalPrice = customizingItem.price;
    if (selectedVariant) {
      finalPrice = selectedVariant.price;
    }

    const addonPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    const totalPrice = finalPrice + addonPrice;

    // Check if duplicate exists
    const existingIndex = cart.findIndex(c => 
      c.id === customizingItem._id && 
      JSON.stringify(c.variant) === JSON.stringify(selectedVariant) &&
      JSON.stringify(c.addons) === JSON.stringify(selectedAddons)
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: customizingItem._id,
        name: customizingItem.name,
        price: totalPrice,
        quantity: 1,
        variant: selectedVariant,
        addons: selectedAddons
      }]);
    }

    setCustomizingItem(null);
    toast.success(`${customizingItem.name} added to cart`);
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getTax = () => getSubtotal() * 0.05;
  const getTotal = () => getSubtotal() + getTax();

  const handleQuickAdd = (item) => {
    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      handleOpenCustomize(item);
    } else {
      const existingIndex = cart.findIndex(c => c.id === item._id && !c.variant && c.addons.length === 0);
      if (existingIndex > -1) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      } else {
        setCart([...cart, {
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          variant: null,
          addons: []
        }]);
      }
      toast.success(`${item.name} added`);
    }
  };

  const triggerSplitBill = () => {
    const total = getTotal();
    const splitAmount = (total / splitCount).toFixed(2);
    const initialSplits = Array.from({ length: splitCount }, (_, i) => ({
      customerName: `Guest ${i + 1}`,
      amount: parseFloat(splitAmount),
      paymentStatus: 'pending',
      paymentMethod: 'Cash'
    }));
    setSplits(initialSplits);
    setShowSplitModal(true);
  };

  const handleSplitPayment = (index) => {
    const newSplits = [...splits];
    newSplits[index].paymentStatus = 'paid';
    setSplits(newSplits);
    toast.success(`${newSplits[index].customerName} paid successfully`);
  };

  const checkoutOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const token = localStorage.getItem('token');

    const orderData = {
      tenantId,
      tableNumber,
      items: cart,
      customerDetails: {
        name: customerName || 'Walk-in Customer',
        phone: customerPhone
      },
      paymentStatus: showSplitModal ? 'paid' : 'paid',
      status: 'completed',
      isSplit: showSplitModal,
      splits: showSplitModal ? splits : []
    };

    try {
      await axios.post(`${API}/orders`, orderData, {
        headers: { 'x-auth-token': token }
      });
      toast.success("Order Placed & Settled Successfully!");
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowSplitModal(false);
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Checkout failed");
    }
  };

  return (
    <div className={styles.container}>
      
      {/* Items Section */}
      <div className={styles.itemsSection}>
        {/* Category Pills */}
        <div className={styles.categoryBar}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.catPill} ${selectedCategory === cat ? styles.activeCatPill : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className={styles.menuGrid}>
          {filteredItems.map(item => (
            <div 
              key={item._id} 
              onClick={() => handleQuickAdd(item)}
              className={styles.menuCard}
            >
              <div>
                <div className={styles.cardHeader}>
                  <img 
                    src={getValidFoodImage(item)} 
                    alt={item.name} 
                    className={styles.cardImg}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500'; }}
                  />
                  <div className={styles.ratingTag}>
                    <span>★</span> 4.8
                  </div>
                </div>
                <h3 className={styles.itemTitle}>{item.name}</h3>
                <p className={styles.itemDesc}>{item.description}</p>
              </div>

              <div className={styles.cardFooter}>
                <div>
                  <span className={styles.priceTag}>₹{item.price}</span>
                  {((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) && (
                    <span className={styles.customBadge}>Customizable</span>
                  )}
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                  className={styles.addBtn}
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Panel */}
      <div className={styles.cartPanel}>
        <div>
          <div className={styles.cartHeader}>
            <h2>
              <ShoppingCart size={20} color="#c67c4e" /> POS Cart
            </h2>
            <div>
              <span className={styles.tableBadge}>Table {tableNumber}</span>
            </div>
          </div>

          {/* Customer info & table selection */}
          <div className={styles.formGrid}>
            <div>
              <label className={styles.fieldLabel}>Table</label>
              <input 
                type="text" 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)} 
                className={styles.fieldInput}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Phone (CRM)</label>
              <input 
                type="text" 
                placeholder="Phone"
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
                className={styles.fieldInput}
              />
            </div>
          </div>
          <div>
            <label className={styles.fieldLabel} style={{ marginTop: '0.5rem' }}>Customer Name</label>
            <input 
              type="text" 
              placeholder="Walk-in Customer"
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              className={styles.fieldInput}
            />
          </div>

          {/* Item List */}
          <div className={styles.cartList}>
            {cart.map((item, index) => (
              <div key={index} className={styles.cartItemRow}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f7f2ec' }}>{item.name}</h4>
                  {item.variant && <p style={{ margin: 0, fontSize: '0.72rem', color: '#c67c4e' }}>Variant: {item.variant.name}</p>}
                  {item.addons && item.addons.length > 0 && (
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#10b981' }}>Addons: {item.addons.map(a => a.name).join(', ')}</p>
                  )}
                  <span style={{ fontSize: '0.8rem', color: '#b8a89a' }}>₹{item.price} each</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={styles.qtyStepper}>
                    <button onClick={() => updateQuantity(index, -1)} className={styles.stepperBtn}><Minus size={14} /></button>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(index, 1)} className={styles.stepperBtn}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash size={16} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8c7d70', fontSize: '0.9rem' }}>
                Your bag is empty
              </div>
            )}
          </div>
        </div>

        {/* Footer & Checkout */}
        <div className={styles.checkoutBox}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{getSubtotal().toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>GST (5%)</span>
            <span>₹{getTax().toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total Amount</span>
            <span style={{ color: '#c67c4e' }}>₹{getTotal().toFixed(2)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button 
              onClick={triggerSplitBill}
              disabled={cart.length === 0}
              style={{ background: 'rgba(198,124,78,0.15)', color: '#c67c4e', border: '1px solid rgba(198,124,78,0.3)', borderRadius: '12px', padding: '0.6rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Split Bill
            </button>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.fieldInput}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <button 
            onClick={checkoutOrder}
            disabled={cart.length === 0}
            className={styles.checkoutBtn}
          >
            <CreditCard size={18} /> Charge ₹{getTotal().toFixed(2)}
          </button>
        </div>
      </div>

      {/* Customize Dialog */}
      {customizingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: '#f7f2ec' }}>Customize {customizingItem.name}</h3>
            
            {/* Variants */}
            {customizingItem.variants && customizingItem.variants.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#b8a89a', marginBottom: '0.5rem', fontWeight: '700' }}>Select Variant</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {customizingItem.variants.map((v, i) => (
                    <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#120e0c', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(198,124,78,0.2)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="radio" 
                          name="variant" 
                          checked={selectedVariant?.name === v.name}
                          onChange={() => setSelectedVariant(v)}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#f7f2ec', fontWeight: '600' }}>{v.name}</span>
                      </div>
                      <span style={{ fontWeight: '800', color: '#c67c4e' }}>₹{v.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {customizingItem.addons && customizingItem.addons.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#b8a89a', marginBottom: '0.5rem', fontWeight: '700' }}>Select Addons</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {customizingItem.addons.map((a, i) => {
                    const isSelected = selectedAddons.some(add => add.name === a.name);
                    return (
                      <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#120e0c', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(198,124,78,0.2)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedAddons(selectedAddons.filter(add => add.name !== a.name));
                              } else {
                                setSelectedAddons([...selectedAddons, a]);
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.9rem', color: '#f7f2ec', fontWeight: '600' }}>{a.name}</span>
                        </div>
                        <span style={{ fontWeight: '800', color: '#10b981' }}>+₹{a.price || 0}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setCustomizingItem(null)} 
                style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#b8a89a', border: '1px solid rgba(198,124,78,0.2)', cursor: 'pointer', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddToCart}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #c67c4e, #a05a2c)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '800' }}
              >
                Add Custom Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem', color: '#f7f2ec' }}>Split Billing</h3>
            <p style={{ color: '#b8a89a', fontSize: '0.85rem', marginBottom: '1rem' }}>Total Amount: ₹{getTotal().toFixed(2)}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', background: '#120e0c', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(198,124,78,0.2)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Split between</span>
              <input 
                type="number" 
                value={splitCount} 
                min="2"
                onChange={(e) => {
                  setSplitCount(parseInt(e.target.value) || 2);
                }}
                style={{ width: '60px', background: '#1e1814', border: '1px solid rgba(198,124,78,0.3)', borderRadius: '8px', padding: '0.25rem', textAlign: 'center', color: '#f7f2ec', fontWeight: '800' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>guests</span>
              <button 
                onClick={triggerSplitBill}
                style={{ marginLeft: 'auto', background: '#c67c4e', color: 'white', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
              >
                Calculate
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {splits.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#120e0c', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(198,124,78,0.2)' }}>
                  <div>
                    <input 
                      type="text" 
                      value={s.customerName}
                      onChange={(e) => {
                        const newSplits = [...splits];
                        newSplits[i].customerName = e.target.value;
                        setSplits(newSplits);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f7f2ec', fontSize: '0.88rem', fontWeight: '700', outline: 'none' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#c67c4e', marginTop: '0.1rem' }}>₹{s.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    {s.paymentStatus === 'paid' ? (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '0.25rem 0.65rem', borderRadius: '100px', fontWeight: '800' }}>Paid</span>
                    ) : (
                      <button 
                        onClick={() => handleSplitPayment(i)}
                        style={{ background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: '800', padding: '0.35rem 0.75rem', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Settle Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setShowSplitModal(false)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#b8a89a', border: '1px solid rgba(198,124,78,0.2)', cursor: 'pointer', fontWeight: '700' }}
              >
                Close
              </button>
              <button 
                onClick={checkoutOrder}
                disabled={splits.some(s => s.paymentStatus !== 'paid')}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '800', opacity: splits.some(s => s.paymentStatus !== 'paid') ? 0.5 : 1 }}
              >
                Complete Split Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
