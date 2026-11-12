// utils/translations.js
// Bilingual (English & Hindi) Translation Dictionary & Custom Hook

import { useState, useEffect } from 'react';

export const DICTIONARY = {
  en: {
    // Navigation Tabs
    'nav.dashboard': 'Dashboard',
    'nav.pos': 'POS Terminal',
    'nav.kds': 'Live Orders',
    'nav.orders': 'Orders',
    'nav.menu': 'Menu Management',
    'nav.qrcodes': 'Table QR Codes',
    'nav.crm': 'Customer CRM',
    'nav.staff': 'Staff Management',
    'nav.reports': 'Reports Suite',
    'nav.salesSummary': 'Item Summary',
    'nav.khata': 'Khata Ledger',
    'nav.settings': 'Settings',

    // Top Bar & Global Header
    'header.search': 'Search screens (e.g. menu, pos, staff) or dishes...',
    'header.support': 'Support',
    'header.signOut': 'Sign Out',
    'header.sound': 'Order Sound',
    'header.soundActive': 'Active',
    'header.soundMuted': 'Muted',
    'header.volume': 'Volume',
    'header.testSound': 'Test Sound',
    'header.allSettings': 'All Settings',
    'header.copilot': 'DineviQ AI Bot',
    'header.copilotSub': 'Store Assistant',
    'header.downloadApp': 'Download App',
    'header.language': 'Language',

    // Common Actions
    'action.accept': 'Accept',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.refresh': 'Refresh',
    'action.print': 'Print',
    'action.download': 'Download',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.viewBill': 'View Bill',
    'action.add': 'Add',

    // Order & KDS Statuses
    'status.pending': 'New Orders',
    'status.confirmed': 'Confirmed',
    'status.preparing': 'In Kitchen',
    'status.ready': 'Ready for Pass',
    'status.served': 'Served',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.paid': 'Paid',
    'status.unpaid': 'Unpaid',
    'status.partial': 'Partial',

    // KDS Board Specific
    'kds.prepItems': 'Prep Items',
    'kds.itemCounter': 'Item Counter',
    'kds.livePrepItems': 'Live Prep Items',
    'kds.emptyQueue': 'Kitchen Queue is Empty',
    'kds.emptyQueueSub': 'No active items in "New Orders" or "In Kitchen".',
    'kds.distinctDishes': 'Distinct Dishes',
    'kds.totalPortions': 'Total Portions',
    'kds.markReady': 'Mark Ready',
    'kds.servedGuest': 'Served to Guest ✓',

    // POS Terminal
    'pos.orderSlip': 'Order Slip',
    'pos.emptySlip': 'Order Slip is Empty',
    'pos.emptySlipSub': 'Click dishes on the menu to take order',
    'pos.guestName': 'Guest Name (Required)',
    'pos.guestPhone': '10-digit Phone No (Required)',
    'pos.balanceDue': 'Balance Due',
    'pos.grossTotal': 'Gross Total',
    'pos.charge': 'Charge',
    'pos.clearDraft': 'Clear Draft',
    'pos.allDishes': 'All Dishes',
    'pos.nightMenu': '🌙 Night Specials',
    'pos.nightModeActive': 'Night Mode Active',

    // Khata Ledger
    'khata.title': 'Customer Khata & Udhar Ledger',
    'khata.newEntry': '+ Add Customer Udhar',
    'khata.customerName': 'Customer Name',
    'khata.phone': 'Phone Number',
    'khata.totalAmount': 'Total Purchase',
    'khata.paidNow': 'Paid Now',
    'khata.balanceUdhar': 'Udhar Balance (Credit)',
    'khata.settle': 'Record Payment',
    'khata.viewHistory': 'Transaction History',
    'khata.sendWhatsapp': 'WhatsApp Statement',
    'khata.totalOutstanding': 'Total Outstanding Udhar',
    'khata.activeCustomers': 'Customers with Credit',

    // Settings
    'settings.title': 'Restaurant Settings & Preferences',
    'settings.audio': 'Audio & Chimes',
    'settings.general': 'General Identity',
    'settings.operations': 'Features & Timings',
    'settings.nightMenu': 'Open / Night Menu (POS Only)',
    'settings.nightMenuDesc': 'Enable special night dishes and pricing visible only on POS terminal during configured night hours.',
    'settings.languageSelect': 'Interface Language (भाषा)',
    'settings.languageDesc': 'Convert entire dashboard, POS, and KDS into Hindi or English for your store and staff.',
  },

  hi: {
    // Navigation Tabs
    'nav.dashboard': 'डैशबोर्ड',
    'nav.pos': 'बिलिंग (पीओएस)',
    'nav.kds': 'लाइव ऑर्डर्स',
    'nav.orders': 'सभी ऑर्डर्स',
    'nav.menu': 'मेन्यू प्रबंधन',
    'nav.qrcodes': 'टेबल क्यूआर कोड',
    'nav.crm': 'ग्राहक CRM',
    'nav.staff': 'स्टाफ प्रबंधन',
    'nav.reports': 'रिपोर्ट्स एवं लाभ',
    'nav.salesSummary': 'आइटम समरी',
    'nav.khata': 'खाता लेजर (उधारी)',
    'nav.settings': 'सेटिंग्स',

    // Top Bar & Global Header
    'header.search': 'स्क्रीन (मेन्यू, पीओएस, स्टाफ) या व्यंजन खोजें...',
    'header.support': 'सहायता',
    'header.signOut': 'लॉग आउट',
    'header.sound': 'ऑर्डर ध्वनि',
    'header.soundActive': 'सक्रिय',
    'header.soundMuted': 'म्यूट',
    'header.volume': 'आवाज स्तर',
    'header.testSound': 'ध्वनि परीक्षण',
    'header.allSettings': 'सभी सेटिंग्स',
    'header.copilot': 'डाइनविक AI बोट',
    'header.copilotSub': 'स्टोर सहायक',
    'header.downloadApp': 'ऐप डाउनलोड करें',
    'header.language': 'भाषा',

    // Common Actions
    'action.accept': 'स्वीकार करें',
    'action.cancel': 'रद्द करें',
    'action.save': 'सुरक्षित करें',
    'action.delete': 'हटाएं',
    'action.edit': 'संपादित करें',
    'action.refresh': 'ताज़ा करें',
    'action.print': 'प्रिंट करें',
    'action.download': 'डाउनलोड करें',
    'action.close': 'बंद करें',
    'action.confirm': 'पुष्टि करें',
    'action.search': 'खोजें',
    'action.filter': 'फ़िल्टर',
    'action.viewBill': 'बिल देखें',
    'action.add': 'जोड़ें',

    // Order & KDS Statuses
    'status.pending': 'नए ऑर्डर्स',
    'status.confirmed': 'पुष्ट ऑर्डर्स',
    'status.preparing': 'किचन में तैयारी',
    'status.ready': 'परोसने हेतु तैयार',
    'status.served': 'परोसा गया',
    'status.completed': 'सम्पन्न',
    'status.cancelled': 'रद्द किया गया',
    'status.paid': 'भुगतान हुआ',
    'status.unpaid': 'बकाया',
    'status.partial': 'आंशिक भुगतान',

    // KDS Board Specific
    'kds.prepItems': 'तैयार होने वाले आइटम',
    'kds.itemCounter': 'आइटम काउंटर',
    'kds.livePrepItems': 'लाइव तैयारी व्यंजन',
    'kds.emptyQueue': 'किचन में कोई ऑर्डर नहीं है',
    'kds.emptyQueueSub': 'नए ऑर्डर्स या किचन में अभी कोई पेंडिंग व्यंजन नहीं है।',
    'kds.distinctDishes': 'कुल अलग व्यंजन',
    'kds.totalPortions': 'कुल प्लेट्स/हिस्से',
    'kds.markReady': 'तैयार मार्क करें',
    'kds.servedGuest': 'ग्राहक को परोसा गया ✓',

    // POS Terminal
    'pos.orderSlip': 'ऑर्डर पर्ची',
    'pos.emptySlip': 'ऑर्डर पर्ची खाली है',
    'pos.emptySlipSub': 'ऑर्डर लेने के लिए मेन्यू में से व्यंजन चुनें',
    'pos.guestName': 'ग्राहक का नाम (आवश्यक)',
    'pos.guestPhone': '10-अंकीय फ़ोन नंबर (आवश्यक)',
    'pos.balanceDue': 'कुल देय राशि',
    'pos.grossTotal': 'सकल योग',
    'pos.charge': 'भुगतान लें',
    'pos.clearDraft': 'पर्ची साफ़ करें',
    'pos.allDishes': 'सभी व्यंजन',
    'pos.nightMenu': '🌙 रात्रि स्पेशल मेन्यू',
    'pos.nightModeActive': 'नाइट मोड सक्रिय',

    // Khata Ledger
    'khata.title': 'ग्राहक खाता बही (उधारी लेजर)',
    'khata.newEntry': '+ नया ग्राहक उधार जोड़ें',
    'khata.customerName': 'ग्राहक का नाम',
    'khata.phone': 'फ़ोन नंबर',
    'khata.totalAmount': 'कुल खरीदारी',
    'khata.paidNow': 'अभी भुगतान किया',
    'khata.balanceUdhar': 'उधार शेष (खाते में जुड़ा)',
    'khata.settle': 'भुगतान दर्ज करें',
    'khata.viewHistory': 'लेन-देन इतिहास',
    'khata.sendWhatsapp': 'व्हाट्सएप विवरण भेजें',
    'khata.totalOutstanding': 'कुल बकाया उधारी',
    'khata.activeCustomers': 'उधार वाले ग्राहक',

    // Settings
    'settings.title': 'रेस्टोरेंट सेटिंग्स एवं प्राथमिकताएं',
    'settings.audio': 'ध्वनि एवं अलर्ट',
    'settings.general': 'सामान्य पहचान',
    'settings.operations': 'सुविधाएं एवं समय',
    'settings.nightMenu': 'ओपन / रात्रि मेन्यू (केवल पीओएस)',
    'settings.nightMenuDesc': 'विशेष रात्रि व्यंजन और रात्रि मूल्य निर्धारण चालू करें, जो केवल पीओएस पर दिखता है।',
    'settings.languageSelect': 'इंटरफ़ेस भाषा (Language)',
    'settings.languageDesc': 'अपने स्टोर और सभी स्टाफ के लिए पूरे डैशबोर्ड, पीओएस और केडीएस को हिंदी में बदलें।',
  }
};

export const getLanguage = () => {
  try {
    const saved = localStorage.getItem('serviq_language');
    if (saved === 'hi' || saved === 'en') return saved;
    return 'en';
  } catch (e) {
    return 'en';
  }
};

export const setLanguage = (lang) => {
  try {
    const validLang = lang === 'hi' ? 'hi' : 'en';
    localStorage.setItem('serviq_language', validLang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('serviq_language_changed', { detail: validLang }));
    }
  } catch (e) {
    console.warn('Failed to set language in localStorage', e);
  }
};

export const t = (key, fallback = '') => {
  const lang = getLanguage();
  const dict = DICTIONARY[lang] || DICTIONARY.en;
  return dict[key] || DICTIONARY.en[key] || fallback || key;
};

// React Hook for dynamic translation with auto-rerender on change
export const useTranslation = () => {
  const [lang, setLangState] = useState(() => getLanguage());

  useEffect(() => {
    const handleLangChange = (e) => {
      setLangState(e.detail || getLanguage());
    };
    window.addEventListener('serviq_language_changed', handleLangChange);
    return () => window.removeEventListener('serviq_language_changed', handleLangChange);
  }, []);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    setLangState(newLang);
  };

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    changeLanguage(next);
  };

  const translate = (key, fallback = '') => {
    const dict = DICTIONARY[lang] || DICTIONARY.en;
    return dict[key] || DICTIONARY.en[key] || fallback || key;
  };

  return {
    t: translate,
    lang,
    isHindi: lang === 'hi',
    setLanguage: changeLanguage,
    toggleLanguage
  };
};

