const nodemailer = require('nodemailer');

/**
 * DISABLE_EMAILS=true  →  log the email to console only; do NOT send.
 * Useful in development to avoid accidental sends.
 */
const DISABLE_EMAILS = process.env.DISABLE_EMAILS === "true";

/**
 * Build the nodemailer transporter from SMTP env vars.
 * Falls back to the legacy OAuth2 config if SMTP_HOST is not set
 * (backward-compatible with the original Gmail OAuth2 setup).
 */
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: parseInt(process.env.SMTP_PORT ?? "587", 10) === 465, // true for port 465, false otherwise
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
if (!DISABLE_EMAILS) {
  transporter.verify((error) => {
    if (error) {
      console.error('[Email] ❌ Error connecting to email server:', error.message || error);
      if (error.message?.includes('invalid_grant') || error.message?.includes('Token')) {
        console.error('[Email] 💡 Your OAuth2 refresh token has likely EXPIRED.');
        console.error('[Email]    Google tokens expire after 7 days if the Cloud project is in "Testing" mode.');
        console.error('[Email]    FIX: Switch to Gmail App Password — add SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS to .env');
        console.error('[Email]    See: https://support.google.com/accounts/answer/185833');
      }
    } else {
      console.log('[Email] ✅ Email server is ready to send messages.');
      console.log(`[Email]    Sender: ${process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER}`);
      console.log(`[Email]    Admin:  ${process.env.ADMIN_EMAIL || '(not configured)'}`);
    }
  });
}

/**
 * sendEmail(to, subject, text, html?)
 * Core utility used by all notification helpers.
 * Respects DISABLE_EMAILS — safe to call unconditionally.
 */
const sendEmail = async (to, subject, text, html) => {
  if (DISABLE_EMAILS) {
    console.log(`[Email] DISABLED — would have sent to: ${to} | subject: ${subject}`);
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM
      || process.env.SMTP_USER
      || process.env.EMAIL_USER;

    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('[Email] Message sent:', info.messageId);
  } catch (error) {
    console.error('[Email] Error sending email:', error.message);
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