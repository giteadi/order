import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send bulk emails to all users
export const sendBulkEmail = async ({
  to,
  subject,
  html,
  text,
  from = process.env.FROM_EMAIL || 'noreply@restaurant.com',
}) => {
  try {
    const transporter = createTransporter();

    // If 'to' is an array, send to multiple recipients
    const recipients = Array.isArray(to) ? to : [to];

    const info = await transporter.sendMail({
      from,
      to: recipients.join(', '),
      subject,
      text,
      html,
    });

    logger.info('Bulk email sent', {
      messageId: info.messageId,
      recipients: recipients.length,
      subject,
    });

    return {
      success: true,
      messageId: info.messageId,
      recipients: recipients.length,
    };
  } catch (error) {
    logger.error('Failed to send bulk email', {
      error: error.message,
      recipients: to?.length || 1,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

// Send offer email to all users
export const sendOfferEmail = async ({ users, offerDetails }) => {
  const { title, description, discount, validUntil, code } = offerDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">${title}</h1>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="font-size: 18px; color: #666;">${description}</p>
        ${discount ? `<p style="font-size: 24px; color: #e74c3c; font-weight: bold;">🎉 ${discount} OFF</p>` : ''}
        ${code ? `<p style="font-size: 16px; background: #2ecc71; color: white; padding: 10px; text-align: center; border-radius: 5px;">Use Code: <strong>${code}</strong></p>` : ''}
        ${validUntil ? `<p style="color: #999;">Valid until: ${validUntil}</p>` : ''}
      </div>
      <p style="text-align: center; color: #999; font-size: 12px;">
        You're receiving this because you're a valued customer.
      </p>
    </div>
  `;

  const text = `
${title}

${description}
${discount ? `Discount: ${discount}` : ''}
${code ? `Use Code: ${code}` : ''}
${validUntil ? `Valid until: ${validUntil}` : ''}

You're receiving this because you're a valued customer.
  `;

  return sendBulkEmail({
    to: users.map(u => u.email),
    subject: `🎉 ${title}`,
    html,
    text,
  });
};

// Send order confirmation
export const sendOrderConfirmation = async ({ user, order }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Total:</strong> ₹${order.total}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
    </div>
  `;

  return sendBulkEmail({
    to: user.email,
    subject: `Order Confirmation #${order.id}`,
    html,
    text: `Order #${order.id} confirmed. Total: ₹${order.total}`,
  });
};
