const QRCode = require('qrcode');

exports.generateQR = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR generation error:', error);
    throw error;
  }
};
