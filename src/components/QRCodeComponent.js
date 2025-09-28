import React from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Use named import

const QRCodeComponent = () => {
  const url = 'https://cafe-application-fe.vercel.app/';

  const downloadQRCode = () => {
    const canvas = document.getElementById('qrCodeCanvas');
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'cafe_app_qr.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Scan to Visit Cafe App</h2>
      <QRCodeCanvas
        id="qrCodeCanvas"
        value={url}
        size={256}
        fgColor="#000000"
        bgColor="#ffffff"
        level="L"
        includeMargin={true}
      />
      <p>Scan the QR code to visit the website!</p>
      <button
        onClick={downloadQRCode}
        style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}
      >
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeComponent;