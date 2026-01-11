import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { notifications } = await notificationService.getNotifications();
      setNotifications(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.notificationId === notificationId ? { ...n, status: 'Read' } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(
        notifications.map((n) => ({ ...n, status: 'Read' }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(
        notifications.filter((n) => n.notificationId !== notificationId)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'Unread').length;

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>🔔 Notifications</h1>
          <p style={styles.subtitle}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification(s)`
              : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn btn-primary btn-sm">
            Mark All as Read
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div style={styles.notificationList}>
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                style={{
                  ...styles.notificationItem,
                  backgroundColor:
                    notification.status === 'Unread' ? '#eff6ff' : 'white',
                }}
              >
                <div style={styles.notificationContent}>
                  {notification.status === 'Unread' && (
                    <div style={styles.unreadDot} />
                  )}
                  <div style={styles.notificationMessage}>
                    {notification.message}
                  </div>
                  <div style={styles.notificationTime}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={styles.notificationActions}>
                  {notification.status === 'Unread' && (
                    <button
                      onClick={() => handleMarkAsRead(notification.notificationId)}
                      className="btn btn-sm btn-outline"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.notificationId)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  notificationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  notificationContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    flexShrink: 0,
  },
  notificationMessage: {
    flex: 1,
    fontSize: '14px',
    color: '#1f2937',
  },
  notificationTime: {
    fontSize: '12px',
    color: '#6b7280',
    marginLeft: '16px',
  },
  notificationActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '16px',
  },
};

