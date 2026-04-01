/**
 * Email Service
 *
 * Sends transactional emails via SMTP (nodemailer).
 * When SMTP is not configured, content is logged to the server log instead of failing.
 *
 * Required environment variables (all optional — emails are logged when absent):
 *   SMTP_HOST   e.g. smtp.gmail.com
 *   SMTP_PORT   e.g. 587 (default)
 *   SMTP_SECURE e.g. false (true for port 465)
 *   SMTP_USER   SMTP username / email address
 *   SMTP_PASS   SMTP password or app-specific password
 *   SMTP_FROM   Sender address, defaults to noreply@awyad-mes.org
 *   APP_URL     Public base URL, defaults to https://awyad.3bs.ltd
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.configured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );

    if (this.configured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    this.from = process.env.SMTP_FROM || 'AWYAD MES <noreply@awyad-mes.org>';
    this.appUrl = (process.env.APP_URL || 'https://awyad.3bs.ltd').replace(/\/$/, '');
  }

  /**
   * Low-level send. Logs the email if SMTP is not configured.
   */
  async _send({ to, subject, html }) {
    if (!this.configured) {
      logger.info(`[EMAIL-NO-SMTP] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      logger.info(`Email sent → ${to}: ${subject}`);
    } catch (err) {
      logger.error(`Email send failed → ${to}: ${err.message}`);
      // Do not re-throw — email failure must never crash a user-facing operation
    }
  }

  /**
   * Send welcome email to a newly admin-created user.
   * @param {{ email, first_name, username }} user
   * @param {string} tempPassword - Plain-text temporary password (shown once)
   */
  async sendWelcomeEmail(user, tempPassword) {
    await this._send({
      to: user.email,
      subject: 'Welcome to AWYAD MES — Your Account Details',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#0d6efd">Welcome to AWYAD MES, ${user.first_name}!</h2>
          <p>Your account has been created. Use the credentials below to log in.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr>
              <td style="padding:8px;font-weight:bold">Username</td>
              <td style="padding:8px">${user.username}</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:8px;font-weight:bold">Temporary Password</td>
              <td style="padding:8px;font-family:monospace">${tempPassword}</td>
            </tr>
          </table>
          <p style="margin-top:16px">
            <a href="${this.appUrl}/login.html"
               style="background:#0d6efd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">
              Login to AWYAD MES
            </a>
          </p>
          <p style="color:#6c757d;font-size:0.875rem;margin-top:16px">
            You will be required to set a permanent password on your first login.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send self-service password reset link.
   * @param {{ email, first_name }} user
   * @param {string} resetToken - Secure URL-safe reset token
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${this.appUrl}/login.html?reset=${resetToken}`;
    await this._send({
      to: user.email,
      subject: 'AWYAD MES — Password Reset Request',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#0d6efd">Password Reset Request</h2>
          <p>Hello ${user.first_name},</p>
          <p>We received a request to reset the password for your AWYAD MES account.</p>
          <p>
            <a href="${resetUrl}"
               style="background:#0d6efd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">
              Reset My Password
            </a>
          </p>
          <p style="color:#6c757d;font-size:0.875rem;margin-top:16px">
            This link expires in 1 hour. If you did not request a password reset, please ignore this email.
          </p>
        </div>
      `,
    });
  }

  /**
   * Notify the user that an admin has reset their password.
   * @param {{ email, first_name }} user
   * @param {string} tempPassword
   */
  async sendAdminPasswordResetEmail(user, tempPassword) {
    await this._send({
      to: user.email,
      subject: 'AWYAD MES — Your Password Has Been Reset',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#fd7e14">Password Reset by Administrator</h2>
          <p>Hello ${user.first_name},</p>
          <p>An administrator has reset your AWYAD MES password.</p>
          <p style="font-family:monospace;font-size:1.1rem;background:#f8f9fa;padding:12px;border-radius:4px">
            New temporary password: <strong>${tempPassword}</strong>
          </p>
          <p>
            <a href="${this.appUrl}/login.html"
               style="background:#0d6efd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">
              Login to AWYAD MES
            </a>
          </p>
          <p style="color:#6c757d;font-size:0.875rem;margin-top:16px">
            You will be asked to set a new password immediately after login.
          </p>
        </div>
      `,
    });
  }

  /**
   * Confirm to the user that their password was changed.
   * @param {{ email, first_name }} user
   */
  async sendPasswordChangedEmail(user) {
    await this._send({
      to: user.email,
      subject: 'AWYAD MES — Password Changed Successfully',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#198754">Password Changed</h2>
          <p>Hello ${user.first_name},</p>
          <p>Your AWYAD MES password was successfully changed on
             <strong>${new Date().toUTCString()}</strong>.</p>
          <p style="color:#dc3545">
            If you did not make this change, contact your system administrator immediately.
          </p>
        </div>
      `,
    });
  }
}

const emailService = new EmailService();
export default emailService;
