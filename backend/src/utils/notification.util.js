const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create a notification for a user
 * @param {Number} userId - User ID
 * @param {String} message - Notification message
 */
const createNotification = async (userId, message) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
        status: 'Unread'
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {String} message - Notification message
 */
const createBulkNotifications = async (userIds, message) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      message,
      status: 'Unread'
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
};

module.exports = {
  createNotification,
  createBulkNotifications
};

