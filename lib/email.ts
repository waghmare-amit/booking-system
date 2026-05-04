/**
 * EMAIL HELPERS (Nodemailer)
 *
 * Uses lazy initialisation — the transporter is only created when an email
 * is actually sent, not at module load time. This prevents startup crashes
 * when EMAIL_USER / EMAIL_PASS are not configured.
 *
 * For local development, use Ethereal: https://ethereal.email/
 * Create a free account, paste the credentials into .env, then every email
 * sent by the app appears in your Ethereal inbox instead of a real inbox.
 */

import nodemailer from 'nodemailer';

interface BookingEmailData {
  userEmail: string;
  userName: string;
  slotTitle: string;
  slotDate: string;
  slotStart: string;
  slotEnd: string;
}

// Lazy-create the transporter so missing credentials don't crash the app on startup
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    ...(process.env.EMAIL_USER
      ? { auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS || '' } }
      : {}),
  });
}

/**
 * Sends a booking confirmation email.
 * Silently logs and swallows errors — a failed email must never fail a booking.
 */
export async function sendBookingConfirmation(data: BookingEmailData) {
  if (!process.env.EMAIL_USER) {
    console.log('📧 Email skipped — no EMAIL_USER set in .env');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4f46e5; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #374151;">Hi <strong>${data.userName}</strong>,</p>
        <p style="color: #374151;">Your appointment has been successfully booked:</p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #111827; font-size: 18px; font-weight: bold;">${data.slotTitle}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />
          <p style="margin: 4px 0; color: #374151;">📅 <strong>Date:</strong> ${new Date(data.slotDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 4px 0; color: #374151;">🕐 <strong>Time:</strong> ${data.slotStart} – ${data.slotEnd}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">To cancel, log in to your account.</p>
        <p style="color: #374151;">See you soon! — The Booking Team</p>
      </div>
    </div>`;

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'BookEasy <noreply@bookeasy.com>',
      to: data.userEmail,
      subject: `✅ Booking Confirmed — ${data.slotTitle}`,
      html,
    });
    console.log('📧 Confirmation email sent:', info.messageId);
  } catch (err) {
    console.error('⚠️  Email send failed (booking still succeeded):', err);
  }
}

/**
 * Sends a booking cancellation email.
 */
export async function sendBookingCancellation(data: BookingEmailData) {
  if (!process.env.EMAIL_USER) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Cancelled</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #374151;">Hi <strong>${data.userName}</strong>, your booking has been cancelled:</p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #111827; font-weight: bold;">${data.slotTitle}</p>
          <p style="margin: 4px 0; color: #374151;">📅 ${new Date(data.slotDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 4px 0; color: #374151;">🕐 ${data.slotStart} – ${data.slotEnd}</p>
        </div>
        <p style="color: #374151;">— The Booking Team</p>
      </div>
    </div>`;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'BookEasy <noreply@bookeasy.com>',
      to: data.userEmail,
      subject: `❌ Booking Cancelled — ${data.slotTitle}`,
      html,
    });
  } catch (err) {
    console.error('⚠️  Cancellation email failed:', err);
  }
}
