import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Package, Truck, AlertTriangle, Trash2, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './InventoryRecipes.module.css';

export default function InventoryRecipes({ tenantId, menuItems }) {
  const [activeSubTab, setActiveSubTab] = useState('ingredients');
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [wastages, setWastages] = useState([]);

  // Ingredient Form
  const [newIngredient, setNewIngredient] = useState({ itemName: '', quantity: 0, unit: 'g', threshold: 500, costPerUnit: 0 });
  
  // Recipe Form
  const [selectedMenuItem, setSelectedMenuItem] = useState(menuItems[0]?._id || '');
  const [recipeLines, setRecipeLines] = useState([]); // Array of { inventoryId, quantity }
  
  // PO Form
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poLines, setPoLines] = useState([{ inventoryId: '', quantity: 0, costPerUnit: 0 }]);
  
  // Wastage Form
  const [wasteLine, setWasteLine] = useState({ inventoryId: '', quantity: 0, reason: '' });

  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token };
    try {
      const [ingRes, supRes, poRes, wasteRes] = await Promise.all([
        axios.get(`${API}/petpooja/inventory`, { headers }),
        axios.get(`${API}/petpooja/suppliers`, { headers }),
        axios.get(`${API}/petpooja/purchase-orders`, { headers }),
        axios.get(`${API}/petpooja/wastage`, { headers })
      ]);
      setIngredients(ingRes.data);
      setSuppliers(supRes.data);
      setPurchaseOrders(poRes.data);
      setWastages(wasteRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading inventory data");
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/petpooja/inventory`, newIngredient, { headers: { 'x-auth-token': token } });
      toast.success("Ingredient added successfully!");
      setNewIngredient({ itemName: '', quantity: 0, unit: 'g', threshold: 500, costPerUnit: 0 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error adding ingredient");
    }
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuItem) return toast.error("Select a Menu Item");
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/petpooja/recipes/${selectedMenuItem}`, { recipe: recipeLines }, {
        headers: { 'x-auth-token': token }
      });
      toast.success("Recipe updated successfully!");
      fetchData();
    } catch (err) {
      toast.error("Error saving recipe");
    }
  };

  const handleAddPOLine = () => {
    setPoLines([...poLines, { inventoryId: '', quantity: 0, costPerUnit: 0 }]);
  };

  const handleCreatePO = async () => {
    if (!selectedSupplier) return toast.error("Select a Supplier");
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/petpooja/purchase-orders`, {
        supplierId: selectedSupplier,
        items: poLines
      }, { headers: { 'x-auth-token': token } });
      toast.success("Purchase Order Created!");
      setPoLines([{ inventoryId: '', quantity: 0, costPerUnit: 0 }]);
      fetchData();
    } catch (err) {
      toast.error("Failed to create PO");
    }
  };

  const handleReceivePO = async (poId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/petpooja/purchase-orders/${poId}/receive`, {}, {
        headers: { 'x-auth-token': token }
      });
      toast.success("Stock updated from PO!");
      fetchData();
    } catch (err) {
      toast.error("Error receiving PO");
    }
  };

  const handleLogWastage = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/petpooja/wastage`, wasteLine, {
        headers: { 'x-auth-token': token }
      });
      toast.success("Wastage logged successfully");
      setWasteLine({ inventoryId: '', quantity: 0, reason: '' });
      fetchData();
    } catch (err) {
      toast.error("Error logging wastage");
    }
  };

  return (
    <div className={styles.page}>
      {/* Sub Header tabs */}
      <div className={styles.subTabsContainer}>
        <button 
          onClick={() => setActiveSubTab('ingredients')}
          className={`${styles.tabBtn} ${activeSubTab === 'ingredients' ? styles.activeTabBtn : ''}`}
        >
          <Package size={16} /> Raw Ingredients
        </button>
        <button 
          onClick={() => setActiveSubTab('recipes')}
          className={`${styles.tabBtn} ${activeSubTab === 'recipes' ? styles.activeTabBtn : ''}`}
        >
          <Layers size={16} /> Recipe Mapping
        </button>
        <button 
          onClick={() => setActiveSubTab('purchases')}
          className={`${styles.tabBtn} ${activeSubTab === 'purchases' ? styles.activeTabBtn : ''}`}
        >
          <Truck size={16} /> Purchase Orders & Vendors
        </button>
        <button 
          onClick={() => setActiveSubTab('wastage')}
          className={`${styles.tabBtn} ${activeSubTab === 'wastage' ? styles.activeTabBtn : ''}`}
        >
          <AlertTriangle size={16} /> Wastage Tracker
        </button>
      </div>

      {/* 1. Raw Ingredients Sub Tab */}
      {activeSubTab === 'ingredients' && (
        <div className={styles.gridTwoCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Stock Ledger</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Ingredient</th>
                    <th className={styles.th}>In Stock</th>
                    <th className={styles.th}>Cost/Unit</th>
                    <th className={styles.th}>Alert Threshold</th>
                    <th className={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(ing => (
                    <tr key={ing._id}>
                      <td className={styles.td} style={{ fontWeight: '700' }}>{ing.itemName}</td>
                      <td className={styles.td}>{ing.quantity} {ing.unit}</td>
                      <td className={styles.td}>₹{ing.costPerUnit}</td>
                      <td className={styles.td}>{ing.threshold} {ing.unit}</td>
                      <td className={styles.td}>
                        {ing.quantity <= ing.threshold ? (
                          <span className={styles.lowStockBadge}>
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className={styles.optimalBadge}>Optimal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Ingredient Form */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <Plus size={18} color="#c67c4e" /> Add Ingredient
            </h3>
            <form onSubmit={handleAddIngredient}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ingredient Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cheese, Bun, Tomato Sauce"
                  value={newIngredient.itemName}
                  onChange={(e) => setNewIngredient({...newIngredient, itemName: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Qty</label>
                  <input 
                    type="number" 
                    required
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({...newIngredient, quantity: parseFloat(e.target.value) || 0})}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit</label>
                  <select 
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                    className={styles.select}
                  >
                    <option>g</option>
                    <option>kg</option>
                    <option>ml</option>
                    <option>ltr</option>
                    <option>pcs</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Alert Threshold</label>
                  <input 
                    type="number"
                    value={newIngredient.threshold}
                    onChange={(e) => setNewIngredient({...newIngredient, threshold: parseFloat(e.target.value) || 0})}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cost/Unit (₹)</label>
                  <input 
                    type="number"
                    value={newIngredient.costPerUnit}
                    onChange={(e) => setNewIngredient({...newIngredient, costPerUnit: parseFloat(e.target.value) || 0})}
                    className={styles.input}
                  />
                </div>
              </div>
              <button className={styles.submitBtn}>
                Create Raw Material
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Recipe Mapping Sub Tab */}
      {activeSubTab === 'recipes' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Recipe Linker</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className={styles.label}>Select Menu Item</label>
              <select 
                value={selectedMenuItem}
                onChange={(e) => {
                  setSelectedMenuItem(e.target.value);
                  const matched = menuItems.find(m => m._id === e.target.value);
                  if (matched && matched.recipe) {
                    setRecipeLines(matched.recipe.map(r => ({
                      inventoryId: r.inventoryId._id || r.inventoryId,
                      quantity: r.quantity
                    })));
                  } else {
                    setRecipeLines([]);
                  }
                }}
                className={styles.select}
              >
                <option value="">Select Item...</option>
                {menuItems.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '0.5rem', color: '#f7f2ec' }}>Ingredients in Recipe</h4>
              {recipeLines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={line.inventoryId}
                    onChange={(e) => {
                      const newLines = [...recipeLines];
                      newLines[idx].inventoryId = e.target.value;
                      setRecipeLines(newLines);
                    }}
                    className={styles.select}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Ingredient...</option>
                    {ingredients.map(ing => (
                      <option key={ing._id} value={ing._id}>{ing.itemName}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => {
                      const newLines = [...recipeLines];
                      newLines[idx].quantity = parseFloat(e.target.value) || 0;
                      setRecipeLines(newLines);
                    }}
                    className={styles.input}
                    style={{ width: '90px', textAlign: 'center' }}
                  />
                  <button 
                    onClick={() => setRecipeLines(recipeLines.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setRecipeLines([...recipeLines, { inventoryId: '', quantity: 0 }])}
                style={{ background: 'none', border: 'none', color: '#c67c4e', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}
              >
                <Plus size={14} /> Add Ingredient to Recipe
              </button>
              <button 
                onClick={handleSaveRecipe}
                className={styles.submitBtn}
                style={{ marginTop: '1.5rem' }}
              >
                Update Recipe Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Purchase Orders Sub Tab */}
      {activeSubTab === 'purchases' && (
        <div className={styles.gridTwoCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Incoming Purchases Ledger</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {purchaseOrders.map(po => (
                <div key={po._id} style={{ background: '#120e0c', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(198,124,78,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f7f2ec' }}>PO ID: ...{po._id.substring(po._id.length - 6)}</h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#b8a89a' }}>Supplier: {po.supplierId?.name || 'General Supplier'}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#c67c4e', fontWeight: '800' }}>Total Order Value: ₹{po.totalAmount}</p>
                  </div>
                  <div>
                    {po.status === 'pending' ? (
                      <button 
                        onClick={() => handleReceivePO(po._id)}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Receive & Update Stock
                      </button>
                    ) : (
                      <span className={styles.optimalBadge}>Received & Restocked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Draft PO Form */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Draft Purchase Order</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Supplier</label>
              <select 
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className={styles.select}
              >
                <option value="">Select Vendor...</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Order Items</label>
              {poLines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select 
                    value={line.inventoryId}
                    onChange={(e) => {
                      const newLines = [...poLines];
                      newLines[idx].inventoryId = e.target.value;
                      const match = ingredients.find(ing => ing._id === e.target.value);
                      if (match) newLines[idx].costPerUnit = match.costPerUnit;
                      setPoLines(newLines);
                    }}
                    className={styles.select}
                    style={{ flex: 1 }}
                  >
                    <option value="">Ingredient...</option>
                    {ingredients.map(ing => (
                      <option key={ing._id} value={ing._id}>{ing.itemName}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => {
                      const newLines = [...poLines];
                      newLines[idx].quantity = parseFloat(e.target.value) || 0;
                      setPoLines(newLines);
                    }}
                    className={styles.input}
                    style={{ width: '70px', textAlign: 'center' }}
                  />
                  <input 
                    type="number" 
                    placeholder="Price"
                    value={line.costPerUnit}
                    onChange={(e) => {
                      const newLines = [...poLines];
                      newLines[idx].costPerUnit = parseFloat(e.target.value) || 0;
                      setPoLines(newLines);
                    }}
                    className={styles.input}
                    style={{ width: '70px', textAlign: 'center' }}
                  />
                </div>
              ))}
              <button 
                onClick={handleAddPOLine}
                style={{ background: 'none', border: 'none', color: '#c67c4e', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', marginTop: '0.25rem' }}
              >
                + Add Line
              </button>
            </div>

            <button 
              onClick={handleCreatePO}
              className={styles.submitBtn}
            >
              Send Purchase Order
            </button>
          </div>
        </div>
      )}

      {/* 4. Wastage Tracker Sub Tab */}
      {activeSubTab === 'wastage' && (
        <div className={styles.gridTwoCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Wastage Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {wastages.map(w => (
                <div key={w._id} style={{ background: '#120e0c', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(198,124,78,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#f7f2ec' }}>{w.inventoryId?.itemName || 'Ingredient'}</h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#b8a89a' }}>Qty Wasted: {w.quantity} | Reason: {w.reason}</p>
                  </div>
                  <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.85rem' }}>Cost Loss: -₹{w.costLost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Log Food Wastage</h3>
            <form onSubmit={handleLogWastage}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Ingredient</label>
                <select 
                  value={wasteLine.inventoryId}
                  onChange={(e) => setWasteLine({...wasteLine, inventoryId: e.target.value})}
                  className={styles.select}
                >
                  <option value="">Select ingredient...</option>
                  {ingredients.map(ing => (
                    <option key={ing._id} value={ing._id}>{ing.itemName}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Quantity Wasted</label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  value={wasteLine.quantity}
                  onChange={(e) => setWasteLine({...wasteLine, quantity: parseFloat(e.target.value) || 0})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Reason for Wastage</label>
                <input 
                  type="text" 
                  placeholder="e.g. Expired, Spilled, Burnt"
                  value={wasteLine.reason}
                  onChange={(e) => setWasteLine({...wasteLine, reason: e.target.value})}
                  className={styles.input}
                />
              </div>
              <button className={styles.submitBtn} style={{ background: '#ef4444' }}>
                Log Loss Value
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
