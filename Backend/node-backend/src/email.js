// src/email.js
// Email sending utility (Nodemailer, can swap for SendGrid)

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@eventnest.io",
    to,
    subject,
    text,
    html,
  });
  return info;
}

module.exports = { sendEmail };
