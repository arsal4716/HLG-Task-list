import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn('SMTP not configured — emails will be logged instead of sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const baseTemplate = (title, body) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#f4f5f7;padding:24px">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#4f46e5;color:#fff;padding:20px 24px;font-size:18px;font-weight:600">HLG Tasks</div>
      <div style="padding:24px;color:#111827">
        <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
        <div style="font-size:14px;line-height:1.6;color:#374151">${body}</div>
      </div>
      <div style="padding:16px 24px;background:#f9fafb;color:#9ca3af;font-size:12px">
        This is an automated message from the HLG Task Management System.
      </div>
    </div>
  </div>`;

/** Core send function — never throws (email failures shouldn't break requests). */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const tx = getTransporter();
    if (!tx) {
      logger.info(`[EMAIL:fallback] to=${to} subject="${subject}"`);
      return { queued: false };
    }
    const info = await tx.sendMail({
      from: process.env.EMAIL_FROM || 'HLG Tasks <no-reply@hlg.com>',
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent to ${to} (${info.messageId})`);
    return { queued: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    return { queued: false, error: err.message };
  }
};

export const emailTemplates = {
  taskAssigned: (user, task) => ({
    subject: `New task assigned: ${task.title}`,
    html: baseTemplate(
      'You have a new task',
      `Hi ${user.name},<br/><br/>You have been assigned <b>${task.title}</b>.<br/>
       Priority: <b>${task.priority}</b><br/>
       ${task.dueDate ? `Due: <b>${new Date(task.dueDate).toLocaleDateString()}</b><br/>` : ''}`
    ),
  }),
  taskUpdated: (user, task) => ({
    subject: `Task updated: ${task.title}`,
    html: baseTemplate('A task was updated', `Hi ${user.name},<br/><br/><b>${task.title}</b> was updated. Current status: <b>${task.status}</b>.`),
  }),
  deadlineReminder: (user, task) => ({
    subject: `Deadline approaching: ${task.title}`,
    html: baseTemplate('Deadline reminder', `Hi ${user.name},<br/><br/><b>${task.title}</b> is due on <b>${new Date(task.dueDate).toLocaleString()}</b>.`),
  }),
  taskCompleted: (user, task) => ({
    subject: `Task completed: ${task.title}`,
    html: baseTemplate('Task completed', `Hi ${user.name},<br/><br/><b>${task.title}</b> has been marked as completed.`),
  }),
  passwordReset: (user, resetUrl) => ({
    subject: 'Reset your HLG Tasks password',
    html: baseTemplate(
      'Password reset request',
      `Hi ${user.name},<br/><br/>Click the link below to reset your password (valid 1 hour):<br/><br/>
       <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset Password</a>`
    ),
  }),
};

export default sendEmail;
