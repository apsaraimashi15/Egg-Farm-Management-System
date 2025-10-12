const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // 465 නම් true
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function verifyTransport() {
  await transporter.verify(); // SMTP OK ද කියලා check
}

async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: `${process.env.APP_NAME || "Egg Farm"} <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

module.exports = { sendMail, verifyTransport };
