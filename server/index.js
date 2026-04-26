require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const emailjs = require('@emailjs/nodejs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Validate env vars
const requiredEnv = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(`[WARN] Missing env vars: ${missing.join(', ')} — SMS/WhatsApp will run in MOCK mode`);
}

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Setup SMTP transporter if credentials provided
let smtpTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[EMAIL] SMTP transporter configured for:', process.env.SMTP_FROM || process.env.SMTP_USER);
} else {
  console.warn('[WARN] Missing SMTP credentials — Email will use EmailJS or MOCK mode');
}

/**
 * Helper: format Indian mobile numbers to E.164
 */
function formatPhone(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return '+' + cleaned;
  if (cleaned.startsWith('+')) return cleaned;
  return '+' + cleaned;
}

/**
 * POST /api/send-sms
 */
app.post('/api/send-sms', async (req, res) => {
  const { to, message, jobId } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'Missing to or message' });

  if (!twilioClient) {
    console.log(`[SMS MOCK] To: ${to} | Msg: ${message}`);
    return res.json({ success: true, mock: true, sid: 'mock-sms-' + Date.now() });
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatPhone(to),
    });
    console.log(`[SMS SENT] SID: ${result.sid} To: ${to}`);
    res.json({ success: true, sid: result.sid });
  } catch (err) {
    console.error('[SMS ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/send-whatsapp
 * Uses Twilio WhatsApp API (sandbox or approved template required for outbound)
 */
app.post('/api/send-whatsapp', async (req, res) => {
  const { to, message, jobId } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'Missing to or message' });

  if (!twilioClient) {
    console.log(`[WHATSAPP MOCK] To: ${to} | Msg: ${message}`);
    return res.json({ success: true, mock: true, sid: 'mock-wa-' + Date.now() });
  }

  try {
    // Twilio WhatsApp requires "whatsapp:" prefix
    const waFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${waFrom}`,
      to: `whatsapp:${formatPhone(to)}`,
    });
    console.log(`[WHATSAPP SENT] SID: ${result.sid} To: ${to}`);
    res.json({ success: true, sid: result.sid });
  } catch (err) {
    console.error('[WHATSAPP ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/send-email
 * Tries SMTP first, then EmailJS, then mock
 */
app.post('/api/send-email', async (req, res) => {
  const { to, subject, message, templateData } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'Missing to or message' });

  // 1. Try SMTP (real email)
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"Wobble One Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: subject || 'Wobble One Update',
        text: message,
        html: message.replace(/\n/g, '<br>'),
      });
      console.log(`[EMAIL SENT via SMTP] To: ${to} | MessageId: ${info.messageId}`);
      return res.json({ success: true, messageId: info.messageId });
    } catch (smtpErr) {
      console.error('[SMTP ERROR]', smtpErr.message);
      // fall through to EmailJS
    }
  }

  // 2. Try EmailJS
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: to,
          subject: subject || 'Wobble One Update',
          message,
          ...templateData,
        },
        { publicKey, privateKey }
      );
      console.log(`[EMAIL SENT via EmailJS] To: ${to}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('[EmailJS ERROR]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // 3. Mock mode
  console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | Msg: ${message}`);
  return res.json({ success: true, mock: true });
});

/**
 * Health check
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    twilio: !!twilioClient,
    emailjs: !!process.env.EMAILJS_SERVICE_ID,
    smtp: !!smtpTransporter,
    mockMode: {
      sms: !twilioClient,
      email: !smtpTransporter && !process.env.EMAILJS_SERVICE_ID,
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Wobble CRM Server running on http://localhost:${PORT}`);
  console.log(`📡 Twilio SMS/WhatsApp: ${twilioClient ? 'ENABLED' : 'MOCK MODE (add Twilio credentials to .env)'}`);
  console.log(`📧 SMTP Email: ${smtpTransporter ? 'ENABLED' : 'MOCK MODE (add SMTP credentials to .env)'}`);
  console.log(`📧 EmailJS: ${process.env.EMAILJS_SERVICE_ID ? 'ENABLED' : 'NOT CONFIGURED'}`);
  console.log('');
  console.log('💡 To send REAL messages, add your credentials to wobble-crm/server/.env and restart the server.');
});

