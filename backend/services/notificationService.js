import { Notification } from '../models/Notification.js';
import { Settings } from '../models/Settings.js';
import { sendEmail, emailTemplates } from './emailService.js';
import { emitToUser } from '../sockets/io.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Create a notification, persist it, push it over Socket.io and optionally email.
 * recipients: array of user ids (or single id).
 */
export const notify = async ({
  recipients,
  sender = null,
  type,
  title,
  message = '',
  task = null,
  link = '',
  email = null, // { template: 'taskAssigned', user, task } to trigger an email
}) => {
  const ids = (Array.isArray(recipients) ? recipients : [recipients])
    .filter(Boolean)
    .map((id) => id.toString());

  // de-duplicate and never notify the sender about their own action
  const unique = [...new Set(ids)].filter((id) => !sender || id !== sender.toString());
  if (unique.length === 0) return [];

  try {
    const docs = await Notification.insertMany(
      unique.map((recipient) => ({ recipient, sender, type, title, message, task, link }))
    );

    docs.forEach((doc) => {
      emitToUser(doc.recipient.toString(), SOCKET_EVENTS.NOTIFICATION, doc);
    });

    // best-effort email
    if (email && email.template && emailTemplates[email.template]) {
      const settings = await Settings.getSingleton();
      if (settings.notificationSettings.email && email.user?.email) {
        const tpl = emailTemplates[email.template](email.user, email.task || task || {});
        sendEmail({ to: email.user.email, ...tpl });
      }
    }

    return docs;
  } catch (err) {
    logger.error(`notify() failed: ${err.message}`);
    return [];
  }
};

export const markAllRead = (userId) =>
  Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, readAt: new Date() });

export default notify;
