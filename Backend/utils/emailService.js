const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendResetEmail = async (to, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword?token=${token}`;
    console.log('📧 Attempting to send email to:', to);
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD);
  console.log('📧 sendResetEmail called with:', to); // ADD THIS
  console.log('ENV check:', {
    user: process.env.GMAIL_USER,
    passSet: !!process.env.GMAIL_APP_PASSWORD,
    frontendUrl: process.env.FRONTEND_URL,
  });

  await transporter.sendMail({
    from: `"FiftySense" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Reset your FiftySense password',
    html: `
      <h2>Password Reset</h2>
      <p>Click below to reset your password. Expires in 1 hour.</p>
      <a href="${resetUrl}" style="
        display:inline-block;padding:12px 24px;
        background:#4CAF50;color:white;
        text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
    `,
  });
};

module.exports = { sendResetEmail };