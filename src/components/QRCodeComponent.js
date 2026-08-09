import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeComponent = ({ url, tableNumber }) => {
  const defaultUrl = 'https://cafe-application-fe.vercel.app/';
  const qrUrl = url || defaultUrl;

  const downloadQRCode = () => {
    const canvas = document.getElementById('qrCodeCanvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${tableNumber || 'cafe'}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '1.25rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ color: '#f7f2ec', marginBottom: '1rem', fontWeight: '800', fontSize: '1.2rem' }}>
        {tableNumber ? `Table ${tableNumber} QR Code` : 'Scan to Visit Cafe App'}
      </h3>
      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'inline-block' }}>
        <QRCodeCanvas
          id="qrCodeCanvas"
          value={qrUrl}
          size={220}
          fgColor="#120e0c"
          bgColor="#ffffff"
          level="L"
          includeMargin={false}
        />
      </div>
      <p style={{ marginTop: '1rem', color: '#b8a89a', fontSize: '0.85rem', fontWeight: '500' }}>
        Scan to order from {tableNumber ? `Table ${tableNumber}` : 'Cafe App'}
      </p>
      <button
        onClick={downloadQRCode}
        style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #c67c4e, #a05a2c)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '800',
          boxShadow: '0 4px 12px rgba(198, 124, 78, 0.3)'
        }}
      >
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeComponent;