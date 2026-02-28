const nodemailer = require('nodemailer');

/**
 * DISABLE_EMAILS=true  →  log the email to console only; do NOT send.
 * Recommended for new deployments until SMTP credentials are verified.
 *
 * EMAIL SETUP (choose one):
 *   Option A — Gmail App Password (RECOMMENDED — no token expiry issues):
 *     SMTP_HOST=smtp.gmail.com  SMTP_PORT=587
 *     SMTP_USER=you@gmail.com   SMTP_PASS=<16-char app password>
 *     EMAIL_FROM=you@gmail.com  ADMIN_EMAIL=admin@example.com
 *
 *   Option B — Legacy Gmail OAuth2 (tokens expire every 7 days in Testing mode):
 *     EMAIL_USER=...  CLIENT_ID=...  CLIENT_SECRET=...  REFRESH_TOKEN=...
 *
 *   Option C — Disable entirely:
 *     DISABLE_EMAILS=true
 *
 * WHY emails appear with 14-17hr delay:
 *   OAuth2 refresh tokens granted by Google Testing-mode projects expire every
 *   7 days. Once expired, nodemailer authentication fails silently and Gmail's
 *   SMTP server queues the rejected messages for retry (default retry window:
 *   up to 72 hours, first retry burst ~14-17 hrs). Switch to Option A to
 *   eliminate this entirely.
 */

/** Static DISABLE flag — set at startup, never changes at runtime */
const DISABLE_EMAILS = process.env.DISABLE_EMAILS === "true";

/**
 * Runtime circuit breaker — set to true if startup verify fails.
 * Prevents sending emails when we know credentials are invalid,
 * which would otherwise queue messages on Gmail's SMTP for retries.
 */
let _credentialsVerified = false;
let _verifyAttempted = false;

/**
 * Build the nodemailer transporter from SMTP env vars (preferred) or
 * fall back to the legacy Gmail OAuth2 config.
 */
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: parseInt(process.env.SMTP_PORT ?? "587", 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });

// Verify connection only when emails are enabled.
// IMPORTANT: If verify fails we set _credentialsVerified=false so no emails
// are attempted — this prevents Gmail from receiving partial auth requests
// that it then queues and retries over 14-17 hours.
if (!DISABLE_EMAILS) {
  _verifyAttempted = true;
  transporter.verify((error) => {
    if (error) {
      _credentialsVerified = false;
      console.error('[Email] ❌ Could not connect to email server. Emails are DISABLED for this session.');
      console.error('[Email]    Error:', error.message);
      if (error.message?.includes('invalid_grant') || error.message?.includes('Token')) {
        console.error('[Email] 💡 OAuth2 refresh token has expired (Google Testing-mode tokens expire every 7 days).');
        console.error('[Email]    FIX: Switch to Gmail App Password:');
        console.error('[Email]      SMTP_HOST=smtp.gmail.com  SMTP_PORT=587');
        console.error('[Email]      SMTP_USER=you@gmail.com   SMTP_PASS=<16-char app password>');
        console.error('[Email]    See: https://support.google.com/accounts/answer/185833');
      } else if (!process.env.SMTP_HOST && !process.env.EMAIL_USER) {
        console.error('[Email] 💡 No email credentials configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or DISABLE_EMAILS=true.');
      }
    } else {
      _credentialsVerified = true;
      const sender = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || '(not set)';
      const admin  = process.env.ADMIN_EMAIL || '(not configured — set ADMIN_EMAIL to receive transaction alerts)';
      console.log('[Email] ✅ Email server is ready to send messages.');
      console.log(`[Email]    Sender: ${sender}`);
      console.log(`[Email]    Admin:  ${admin}`);
    }
  });
} else {
  console.log('[Email] ℹ️  Emails disabled (DISABLE_EMAILS=true). Notification calls will be no-ops.');
}

/**
 * sendEmail(to, subject, text, html?)
 * Core utility used by all notification helpers.
 * Respects DISABLE_EMAILS and credential circuit-breaker.
 * Safe to call unconditionally — will never throw.
 */
const sendEmail = async (to, subject, text, html) => {
  if (DISABLE_EMAILS) {
    console.log(`[Email] DISABLED — skipping send to: ${to} | subject: ${subject}`);
    return;
  }

  // Circuit breaker: if verify already ran and failed, skip sending.
  // This prevents queuing messages on Gmail's SMTP when credentials are bad.
  if (_verifyAttempted && !_credentialsVerified) {
    console.warn(`[Email] SKIPPED (credentials not verified) — to: ${to} | subject: ${subject}`);
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM
      || process.env.SMTP_USER
      || process.env.EMAIL_USER;

    const info = await transporter.sendMail({
      from: `"Bank Transaction System" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('[Email] Message sent:', info.messageId);
  } catch (error) {
    console.error('[Email] Error sending email:', error.message);
    // Mark credentials as unverified to stop future attempts this session
    if (error.message?.includes('invalid_grant') || error.message?.includes('Authentication')) {
      _credentialsVerified = false;
      console.error('[Email] ❌ Auth failure — disabling email sends for this session.');
    }
  }
};

async function sendRegistrationEmail(userEmail, name){
    const subject = "Welcome to Backend Ledger!";
    const text = `Hi ${name},\n\nThank you for registering with Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>Thank you for registering with Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount){
    const subject = "Transaction Alert from Backend Ledger";
    const text = `Hi ${name},\n\nA transaction of ₹${amount} has been made to account ${toAccount}.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>A transaction of <strong>₹${amount}</strong> has been made to account <strong>${toAccount}</strong>.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    // Send to user
    await sendEmail(userEmail, subject, text, html);

    // Send to admin if ADMIN_EMAIL is configured
    await sendAdminTransactionAlert({ type: 'SUCCESS', userEmail, name, amount, toAccount });
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount){
    const subject = "Transaction Failed Alert from Backend Ledger";
    const text = `Hi ${name},\n\nA transaction of ₹${amount} to account ${toAccount} has failed.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>A transaction of <strong>₹${amount}</strong> to account <strong>${toAccount}</strong> has failed.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    // Send to user
    await sendEmail(userEmail, subject, text, html);

    // Send to admin if ADMIN_EMAIL is configured
    await sendAdminTransactionAlert({ type: 'FAILED', userEmail, name, amount, toAccount });
}

/**
 * Send a transaction notification to the admin email.
 * Requires ADMIN_EMAIL in .env. Silently skips if not set.
 */
async function sendAdminTransactionAlert({ type, userEmail, name, amount, toAccount }) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('[Email] ADMIN_EMAIL not configured — skipping admin notification.');
        return;
    }

    const statusLabel = type === 'SUCCESS' ? 'Completed' : 'Failed';
    const subject = `[Admin] Transaction ${statusLabel} — ₹${amount} by ${name}`;
    const text = `Admin Notification\n\nTransaction ${statusLabel}\nUser: ${name} (${userEmail})\nAmount: ₹${amount}\nTo Account: ${toAccount}\nStatus: ${statusLabel}\n\n— Backend Ledger System`;
    const html = `
        <h3>Admin Transaction Notification</h3>
        <table style="border-collapse:collapse;">
            <tr><td style="padding:4px 12px;font-weight:bold;">Status</td><td style="padding:4px 12px;">${statusLabel}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">User</td><td style="padding:4px 12px;">${name} (${userEmail})</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Amount</td><td style="padding:4px 12px;">₹${amount}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">To Account</td><td style="padding:4px 12px;">${toAccount}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;">— Backend Ledger System</p>
    `;

    try {
        await sendEmail(adminEmail, subject, text, html);
    } catch (err) {
        console.error('[Email] Failed to send admin notification:', err.message);
    }
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
    sendAdminTransactionAlert
};