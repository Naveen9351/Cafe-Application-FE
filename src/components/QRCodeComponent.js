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
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <h3 style={{ color: '#333', marginBottom: '10px' }}>
        {tableNumber ? `Table ${tableNumber} QR Code` : 'Scan to Visit Cafe App'}
      </h3>
      <QRCodeCanvas
        id="qrCodeCanvas"
        value={qrUrl}
        size={256}
        fgColor="#000000"
        bgColor="#ffffff"
        level="L"
        includeMargin={true}
      />
      <p style={{ marginTop: '10px', color: '#666' }}>
        Scan to order from {tableNumber ? `Table ${tableNumber}` : 'Cafe App'}
      </p>
      <button
        onClick={downloadQRCode}
        style={{
          marginTop: '15px',
          padding: '10px 20px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeComponent;