import React, { useState, useEffect } from 'react';
import { TaskActivityLog } from '../types';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Radio, RefreshCw, Clock, ArrowRightCircle, PlusCircle, AlertCircle, Activity } from 'lucide-react';

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

function getActivityIcon(toStatus?: string, message?: string) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('overdue')) {
    return <AlertCircle size={13} color="#ef4444" />;
  }
  if (msg.includes('created') || msg.includes('assigned')) {
    return <PlusCircle size={13} color="#38bdf8" />;
  }
  switch (toStatus) {
    case 'DONE':
      return <ArrowRightCircle size={13} color="#10b981" />;
    case 'IN_REVIEW':
      return <ArrowRightCircle size={13} color="#a855f7" />;
    case 'IN_PROGRESS':
      return <ArrowRightCircle size={13} color="#f59e0b" />;
    default:
      return <Activity size={13} color="#6366f1" />;
  }
}

export const ActivityFeed: React.FC<{ projectId?: string; title?: string }> = ({
  projectId,
  title = 'Live Activity Feed',
}) => {
  const { liveActivities, setLiveActivities, isConnected } = useSocket();
  const [loading, setLoading] = useState(false);

  // Fetch recent missed events directly from PostgreSQL
  const fetchMissedActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity/missed');
      if (res.data?.success && res.data?.data) {
        setLiveActivities(res.data.data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch missed activity', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissedActivities();
  }, [projectId]);

  // Filter for specific project view if provided
  const displayedActivities = projectId
    ? liveActivities.filter((a) => a.projectId === projectId)
    : liveActivities;

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={15} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</h3>
            <span style={{ fontSize: '0.72rem', color: isConnected ? '#34d399' : '#f87171' }}>
              {isConnected ? 'Live WebSocket Stream' : 'Disconnected'}
            </span>
          </div>
        </div>

        <button
          onClick={fetchMissedActivities}
          className="btn-secondary"
          disabled={loading}
          style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
          title="Fetch last 20 missed events directly from PostgreSQL database"
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          {loading ? 'Catching up...' : 'Sync DB'}
        </button>
      </div>

      {/* Activity Item List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {displayedActivities.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-dim)',
              padding: '48px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Activity size={28} color="var(--text-dim)" />
            <p style={{ fontSize: '0.88rem' }}>No recent activity recorded</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Actions will appear here live in real-time.
            </span>
          </div>
        ) : (
          displayedActivities.map((act) => (
            <div
              key={act.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  marginTop: '2px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getActivityIcon(act.toStatus, act.message)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.45, marginBottom: '6px' }}>
                  {act.message}
                </p>

                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={11} />
                  <span>{timeAgo(act.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
