const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function requireField(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

app.post('/api/contact', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceAddress,
      quoteSummary,
      quoteTotal,
      customerMessage,
      companyWebsite
    } = req.body;

    if (companyWebsite) {
      return res.status(200).json({ ok: true });
    }

    if (!requireField(customerName) || !requireField(customerEmail) || !requireField(customerPhone)) {
      return res.status(400).json({ ok: false, message: 'Name, email, and phone are required.' });
    }

    const mailFrom = process.env.MAIL_FROM;
    const mailTo = process.env.MAIL_TO;

    if (!mailFrom || !mailTo) {
      return res.status(500).json({ ok: false, message: 'Server email settings are missing.' });
    }

    const transporter = getSmtpTransporter();

    if (!transporter) {
      return res.status(500).json({ ok: false, message: 'SMTP credentials are missing.' });
    }

    const safeName = escapeHtml(normalizeText(customerName));
    const safeEmail = escapeHtml(normalizeText(customerEmail));
    const safePhone = escapeHtml(normalizeText(customerPhone));
    const safeAddress = escapeHtml(normalizeText(serviceAddress));
    const safeMessage = escapeHtml(normalizeText(customerMessage));
    const safeQuoteSummary = escapeHtml(normalizeText(quoteSummary));
    const safeQuoteTotal = escapeHtml(normalizeText(quoteTotal));

    const subject = `New cleaning request from ${safeName}`;

    const html = `
      <h2>New Cleaning Request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Service Address:</strong> ${safeAddress || 'N/A'}</p>
      <p><strong>Quote Total:</strong> ${safeQuoteTotal || 'N/A'}</p>
      <p><strong>Message:</strong><br>${safeMessage ? safeMessage.replace(/\n/g, '<br>') : 'N/A'}</p>
      <h3>Quote Summary</h3>
      <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.5;">${safeQuoteSummary || 'No quote summary provided.'}</pre>

    `;

    await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      replyTo: normalizeText(customerEmail),
      subject,
      html
    });

    return res.status(200).json({ ok: true, message: 'Request sent successfully.' });
  } catch (error) {
    console.error('EMAIL_ERROR:', error);

    if (error && typeof error.message === 'string' && error.message.includes('Application-specific password required')) {
      return res.status(500).json({
        ok: false,
        message: 'SMTP authentication failed. Use a Google App Password for SMTP_PASS.'
      });
    }

    return res.status(500).json({ ok: false, message: 'Could not send request email right now.' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process or change PORT.`);
    process.exit(1);
    return;
  }

  console.error('Server startup error:', error);
  process.exit(1);
});
