/**
 * Email Service — Nodemailer bulk sender
 * Used by admin to send offers/announcements to all users
 */
import nodemailer from 'nodemailer'
import { getDB } from '../database/connection.js'
import { Logger } from '../utils/logger.js'

const logger = Logger.getInstance()

// Create transporter — configure via .env
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * Send bulk email to all users of a restaurant (or all restaurants for super admin)
 *
 * @param {Object} options
 * @param {string} options.subject
 * @param {string} options.htmlBody
 * @param {number|null} options.restaurantId  — null = all restaurants (super admin)
 * @param {string} options.senderName
 * @returns {Promise<{sent: number, failed: number, errors: string[]}>}
 */
export async function sendBulkEmail({ subject, htmlBody, restaurantId = null, senderName = 'Vishnu Hastkala Kendra' }) {
  const db = getDB()
  const transporter = createTransporter()

  // Fetch target emails
  let query = `SELECT DISTINCT email FROM users WHERE email IS NOT NULL AND email != '' AND is_active = 1`
  const params = []

  if (restaurantId) {
    query += ` AND restaurant_id = ?`
    params.push(restaurantId)
  }

  const users = db.prepare(query).all(...params)
  const emails = users.map(u => u.email).filter(Boolean)

  if (emails.length === 0) {
    return { sent: 0, failed: 0, errors: ['No email addresses found'] }
  }

  logger.info('Starting bulk email send', { count: emails.length, subject, restaurantId })

  let sent = 0
  let failed = 0
  const errors = []

  // Send in batches of 10 to avoid rate limits
  const BATCH_SIZE = 10
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: `"${senderName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject,
            html: htmlBody,
          })
          sent++
        } catch (err) {
          failed++
          errors.push(`${email}: ${err.message}`)
          logger.warn('Email send failed', { email, error: err.message })
        }
      })
    )

    // Small delay between batches
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  logger.info('Bulk email complete', { sent, failed, total: emails.length })
  return { sent, failed, errors, total: emails.length }
}

/**
 * Send a single email
 */
export async function sendSingleEmail({ to, subject, htmlBody, senderName = 'Vishnu Hastkala Kendra' }) {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: `"${senderName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlBody,
  })
}

/**
 * Build a nice HTML email template
 */
export function buildEmailTemplate({ title, body, restaurantName, ctaText, ctaUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#111827;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">${restaurantName || 'Vishnu Hastkala Kendra'}</h1>
    </div>
    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:22px;margin:0 0 16px;">${title}</h2>
      <div style="color:#374151;font-size:16px;line-height:1.6;">${body}</div>
      ${ctaText && ctaUrl ? `
      <div style="text-align:center;margin-top:32px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#111827;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">${ctaText}</a>
      </div>` : ''}
    </div>
    <!-- Footer -->
    <div style="background:#f3f4f6;padding:24px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:13px;margin:0;">You received this email because you are a registered customer.</p>
    </div>
  </div>
</body>
</html>`
}
