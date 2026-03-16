const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || undefined, // e.g., 'gmail'
  host: process.env.EMAIL_SERVICE ? undefined : process.env.EMAIL_HOST,
  port: process.env.EMAIL_SERVICE ? undefined : (process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'FLOO'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // On ne bloque pas le flux principal si le mail échoue
    return null;
  }
};

module.exports = { sendEmail };
