const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "SMTP not fully configured (SMTP_HOST / SMTP_USER / SMTP_PASS). Email alerts are disabled."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendAlertEmail = async (to, subject, text) => {
  const tx = getTransporter();
  if (!tx) {
    return;
  }

  const from = process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER;

  await tx.sendMail({
    from,
    to,
    subject,
    text,
  });
};

module.exports = {
  sendAlertEmail,
};
