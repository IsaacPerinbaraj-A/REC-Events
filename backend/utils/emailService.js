const nodemailer = require('nodemailer');

// Create transporter (only if email is configured)
const transporter = process.env.EMAIL_USER ? nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  } // ✅ FIXED: Added closing brace
}) : null;

exports.sendEmail = async (options) => {
  if (!transporter) {
    console.log('Email not configured. Skipping email send.');
    return;
  } // ✅ FIXED: Added closing brace

  try {
    const mailOptions = {
      from: `REC Events <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  } // ✅ FIXED: Added closing brace
};
