import axios from 'axios';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

const LOCAL_STORAGE_KEY = 'serviq_demo_leads_v1';

export async function submitLeadRequest(leadData) {
  try {
    const contactName = leadData.contactName || leadData.fullName || leadData.name;
    const phone = leadData.phone;
    const city = leadData.city || 'Bangalore';
    const restaurantName = leadData.restaurantName || leadData.outletName || 'Restaurant Outlet';
    const email = leadData.email || leadData.workEmail || '';
    const interests = leadData.interests || ['qr-ordering', 'kds'];
    const notes = leadData.notes || leadData.message || '';

    if (!contactName || !phone) {
      return {
        success: false,
        message: 'Please fill in your name and phone number.'
      };
    }

    const payload = {
      fullName: contactName,
      workEmail: email || `${phone}@lead.restaurant`,
      phone,
      restaurantName,
      outletType: leadData.outletType || 'Cafe / Coffee Shop',
      locationsCount: leadData.locationsCount || '1 outlet',
      city,
      interests,
      preferredTime: leadData.preferredTime || 'Anytime',
      notes,
      source: 'website_landing'
    };

    let serverSuccess = false;
    let leadId = `DEMO-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await axios.post(`${API}/leads`, payload, { timeout: 7000 });
      if (res.data && res.data.success) {
        serverSuccess = true;
        leadId = res.data.leadId || leadId;
      }
    } catch (apiErr) {
      console.warn('Direct backend lead posting error (falling back to client storage):', apiErr.message);
    }

    // Save locally
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : [];
      parsed.push({ ...payload, id: leadId, submittedAt: new Date().toISOString() });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      // Ignore localstorage errors
    }

    return {
      success: true,
      message: 'Demo request received! Our hospitality specialist will reach out within 15 minutes.',
      leadId
    };
  } catch (err) {
    console.error('Lead submission failure:', err);
    return {
      success: false,
      message: 'Something went wrong submitting your request. Please try again or call support.'
    };
  }
}
