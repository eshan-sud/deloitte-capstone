// src/email.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport(
  process.env.EMAIL_SERVICE
    ? {
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
        },
      }
    : {
        // Change to your SMTP server details or use .env variables for config
        host: process.env.EMAIL_HOST || "smtp.ethereal.email",
        port: process.env.EMAIL_PORT || 587,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
        },
      },
);

async function sendEmail({ to, subject, text, html, from = null }) {
  const info = await transporter.sendMail({
    // Use custom from if provided, otherwise use default EMAIL_FROM
    from: from || process.env.EMAIL_FROM || "your-commercial-email@gmail.com",
    to,
    subject,
    text,
    html,
  });
  return info;
}

module.exports = { sendEmail };
