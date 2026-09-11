import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Calendar, User as UserIcon, AlertTriangle, Clock, Loader2, ArrowRight } from 'lucide-react';

function formatDueDate(dateString: string): { label: string; isPast: boolean } {
  const due = new Date(dateString);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const formatted = due.toLocaleDateString('en-US', options);

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: `${formatted} (${daysAgo}d overdue)`,
      isPast: true,
    };
  } else if (diffDays === 0) {
    return { label: `${formatted} (Due today)`, isPast: false };
  } else if (diffDays === 1) {
    return { label: `${formatted} (Due tomorrow)`, isPast: false };
  } else {
    return { label: `${formatted} (${diffDays}d left)`, isPast: false };
  }
}

export const TaskCard: React.FC<{
  task: Task;
  onStatusUpdated?: (updatedTask: Task) => void;
}> = ({ task, onStatusUpdated }) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const canEditStatus =
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
    (user?.role === 'DEVELOPER' && task.assignedToId === user.id);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === status || !canEditStatus) return;

    try {
      setUpdating(true);
      const res = await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
      if (res.data?.success && res.data?.data) {
        setStatus(newStatus);
        onStatusUpdated?.(res.data.data.task);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)' };
      case 'HIGH':
        return { background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.35)' };
      case 'MEDIUM':
        return { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)' };
      case 'LOW':
        return { background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.35)' };
    }
  };

  const getStatusBadgeClass = (s: TaskStatus) => {
    switch (s) {
      case 'TO_DO':
        return 'badge-todo';
      case 'IN_PROGRESS':
        return 'badge-inprogress';
      case 'IN_REVIEW':
        return 'badge-inreview';
      case 'DONE':
        return 'badge-done';
    }
  };

  const isDueDatePassed = new Date(task.dueDate) < new Date() && status !== 'DONE';
  const showOverdueBadge = task.isOverdue || isDueDatePassed;
  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      className="glass-card glass-card-interactive"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: showOverdueBadge ? '4px solid #ef4444' : '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--text-dim)',
              letterSpacing: '0.04em',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            #{task.taskNumber}
          </span>

          <span className={`badge ${getStatusBadgeClass(status)}`}>
            {status.replace('_', ' ')}
          </span>

          <span className="badge" style={getPriorityConfig(task.priority)}>
            {task.priority}
          </span>
        </div>

        {showOverdueBadge && (
          <span className="badge badge-overdue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Overdue
          </span>
        )}
      </div>

      {/* Task Title & Description */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35, marginBottom: '4px' }}>
          {task.title}
        </h4>
        {task.description && (
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom Action / Meta Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Assignee */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserIcon size={12} color="var(--text-dim)" />
            </div>
            <span>{task.assignedTo ? task.assignedTo.name : 'Unassigned'}</span>
          </div>

          {/* Due Date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: showOverdueBadge ? '#f87171' : 'var(--text-muted)',
              fontWeight: showOverdueBadge ? 600 : 400,
            }}
          >
            <Calendar size={13} />
            <span>{dueInfo.label}</span>
          </div>
        </div>

        {/* Status Transition Selector for authorized users */}
        {canEditStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {updating && <Loader2 size={14} className="spin" color="var(--primary)" />}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500 }}>Update:</span>
            <select
              value={status}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="form-input"
              style={{
                padding: '4px 8px',
                height: '30px',
                fontSize: '0.78rem',
                width: 'auto',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <option value="TO_DO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
