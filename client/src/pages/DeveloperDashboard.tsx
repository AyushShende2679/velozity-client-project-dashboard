import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DeveloperMetrics, Task } from '../types';
import { useSearchParams } from 'react-router-dom';
import { TaskFilters } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { CheckSquare, Calendar, AlertTriangle, Code, Terminal } from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<DeveloperMetrics | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevData = async () => {
    try {
      setLoading(true);
      const [metricsRes, tasksRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get(`/tasks?${searchParams.toString()}`),
      ]);

      if (metricsRes.data?.success) setMetrics(metricsRes.data.data.metrics);
      if (tasksRes.data?.success) setTasks(tasksRes.data.data.tasks);
    } catch (err) {
      console.error('Failed to load developer dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevData();
  }, [searchParams]);

  return (
    <div style={{ padding: '32px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Code size={20} color="#34d399" />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Developer Taskboard
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your assigned engineering deliverables, sorted strictly by priority then due date.
        </p>
      </div>

      {/* Bento Grid Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Assigned Deliverables */}
        <div className="bento-card bento-card-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Assigned Deliverables</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.assignedCount ?? tasks.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Active tickets assigned directly to you
          </div>
        </div>

        {/* Due This Week */}
        <div className="bento-card bento-card-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Due This Week</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.dueThisWeekCount ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Approaching delivery milestone
          </div>
        </div>

        {/* Overdue Deliverables */}
        <div className="bento-card bento-card-danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Overdue Deliverables</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f87171', marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.overdueCount ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Flagged by automated overdue scheduler
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        <div>
          {/* Shareable Filter Bar */}
          <TaskFilters />

          {/* Sorted Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tasks.length === 0 ? (
              <div
                className="glass-card"
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Terminal size={32} color="var(--text-dim)" />
                <p style={{ fontSize: '0.94rem' }}>No assigned deliverables match current filters</p>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  All clear! Reset your filters above to verify all assignments.
                </span>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={() => fetchDevData()}
                />
              ))
            )}
          </div>
        </div>

        {/* Developer Scoped Feed */}
        <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <ActivityFeed title="My Task Activity Stream" />
        </div>
      </div>
    </div>
  );
};
