import api from '../config/api';
import type { Notification } from '../types';

export const notificationService = {
  async getNotifications(
    limit?: number
  ): Promise<{ notifications: Notification[] }> {
    const response = await api.get('/notifications', {
      params: { limit },
    });
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  async markAsRead(notificationId: number): Promise<{ message: string }> {
    const response = await api.patch(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  async deleteNotification(notificationId: number): Promise<{ message: string }> {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

