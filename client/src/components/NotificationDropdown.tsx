import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Notification } from '../types';
import { useSocket } from '../context/SocketContext';
import { CheckCheck, Bell, Clock, BellOff } from 'lucide-react';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const NotificationDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { setUnreadNotificationsCount, latestNotification } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success && res.data?.data) {
        setNotifications(res.data.data.notifications);
        setUnreadNotificationsCount(res.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Prepend new real-time notification pushed over WebSocket
  useEffect(() => {
    if (latestNotification) {
      setNotifications((prev) => [latestNotification, ...prev]);
    }
  }, [latestNotification]);

  const markAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success && res.data?.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadNotificationsCount(res.data.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '10px',
        width: '380px',
        maxHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-medium)',
      }}
      className="glass-card"
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--primary)" />
          <h4 style={{ fontSize: '0.94rem', fontWeight: 700 }}>Notifications</h4>
        </div>
        <button
          onClick={markAllAsRead}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s',
          }}
        >
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-dim)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <BellOff size={24} color="var(--text-dim)" />
            <span style={{ fontSize: '0.86rem' }}>No notifications at this time</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                backgroundColor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                cursor: n.isRead ? 'default' : 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              {!n.isRead && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)',
                    lineHeight: 1.45,
                    marginBottom: '4px',
                    fontWeight: n.isRead ? 400 : 500,
                  }}
                >
                  {n.message}
                </p>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} /> {timeAgo(n.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
