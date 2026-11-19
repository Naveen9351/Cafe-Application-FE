/**
 * SERVIQ Cafe OS - Order Items Consolidation Utility
 * Merges identical order items (same name, price, variant/addons) across multiple dining rounds/tickets
 * into a single unified line item with aggregated quantity and total.
 */

export const consolidateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const map = [];

  items.forEach(it => {
    if (!it) return;
    const itName = String(it.name || it.item?.name || 'Dish Item').trim();
    const itPrice = Number(it.price || it.item?.price || 0);
    const itModifier = it.modifier || (it.variant?.name 
      ? `Size: ${it.variant.name}` 
      : (it.addons && it.addons.length > 0 ? it.addons.map(a => a.name).join(', ') : ''));

    const existing = map.find(m => 
      m.name.toLowerCase() === itName.toLowerCase() && 
      m.price === itPrice && 
      (m.modifier || '') === (itModifier || '')
    );

    const qty = Number(it.quantity) || 1;

    if (existing) {
      existing.quantity += qty;
      existing.total = existing.price * existing.quantity;
      if ((it.specialNotes || it.notes) && !existing.notes) {
        existing.notes = it.specialNotes || it.notes;
      }
    } else {
      map.push({
        ...it,
        name: itName,
        price: itPrice,
        quantity: qty,
        total: itPrice * qty,
        modifier: itModifier,
        notes: it.specialNotes || it.notes || ''
      });
    }
  });

  return map;
};

export default consolidateOrderItems;
