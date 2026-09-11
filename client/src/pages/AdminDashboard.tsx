import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AdminMetrics, Project, Task } from '../types';
import { useSocket } from '../context/SocketContext';
import { useSearchParams, Link } from 'react-router-dom';
import { TaskFilters } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { CreateProjectModal } from '../components/CreateProjectModal';
import {
  FolderKanban,
  CheckCircle2,
  AlertOctagon,
  Users,
  Plus,
  ExternalLink,
  Shield,
  Layers,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { onlineUserCount } = useSocket();
  const [searchParams] = useSearchParams();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, projectsRes, tasksRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/projects'),
        api.get(`/tasks?${searchParams.toString()}`),
      ]);

      if (metricsRes.data?.success) setMetrics(metricsRes.data.data.metrics);
      if (projectsRes.data?.success) setProjects(projectsRes.data.data.projects);
      if (tasksRes.data?.success) setTasks(tasksRes.data.data.tasks);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [searchParams]);

  const totalTasks = metrics?.totalTasks ?? 0;
  const doneTasks = metrics?.tasksByStatus?.DONE ?? 0;
  const inProgressTasks = metrics?.tasksByStatus?.IN_PROGRESS ?? 0;
  const inReviewTasks = metrics?.tasksByStatus?.IN_REVIEW ?? 0;
  const todoTasks = metrics?.tasksByStatus?.TO_DO ?? 0;

  return (
    <div style={{ padding: '32px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={20} color="#f43f5e" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              Admin Operations Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Global agency telemetry, client deliverables status, and live WebSocket stream.
          </p>
        </div>

        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={16} /> New Client Project
        </button>
      </div>

      {/* Bento Grid Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Total Projects Card */}
        <div className="bento-card bento-card-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Active Projects</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <FolderKanban size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.totalProjects ?? projects.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} /> Across all active clients
          </div>
        </div>

        {/* Total Tasks & Status Distribution Card */}
        <div className="bento-card bento-card-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Total Deliverables</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '10px', letterSpacing: '-0.03em' }}>
            {totalTasks}
          </div>

          {/* Segmented Status Progress Bar */}
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '10px', background: 'rgba(255, 255, 255, 0.08)' }}>
            {totalTasks > 0 ? (
              <>
                <div style={{ width: `${(doneTasks / totalTasks) * 100}%`, background: '#10b981' }} title={`Done: ${doneTasks}`} />
                <div style={{ width: `${(inReviewTasks / totalTasks) * 100}%`, background: '#a855f7' }} title={`In Review: ${inReviewTasks}`} />
                <div style={{ width: `${(inProgressTasks / totalTasks) * 100}%`, background: '#f59e0b' }} title={`In Progress: ${inProgressTasks}`} />
                <div style={{ width: `${(todoTasks / totalTasks) * 100}%`, background: '#64748b' }} title={`To Do: ${todoTasks}`} />
              </>
            ) : null}
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Done: {doneTasks}</span>
            <span>Review: {inReviewTasks}</span>
            <span>Prog: {inProgressTasks}</span>
            <span>To Do: {todoTasks}</span>
          </div>
        </div>

        {/* Overdue Tasks Card */}
        <div className="bento-card bento-card-danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Overdue Deliverables</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <AlertOctagon size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f87171', marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.overdueCount ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Auto-flagged by background cron job
          </div>
        </div>

        {/* Live Active Online Users Card */}
        <div className="bento-card bento-card-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Active Online Team</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onlineUserCount > 0 ? onlineUserCount : (metrics?.onlineUserCount ?? 1)}
            <span className="beacon-dot beacon-dot-live" />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Live presence stream via WebSocket
          </div>
        </div>
      </div>

      {/* Main Content Layout: Managed Projects + Filtered Deliverables + Sticky Activity Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column */}
        <div>
          {/* Projects Quick View */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Managed Client Projects</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Active client contracts with dedicated live event rooms.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {projects.map((proj) => (
                <Link
                  key={proj.id}
                  to={`/projects/${proj.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="glass-card-interactive"
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {proj.title}
                      </span>
                      <ExternalLink size={15} color="var(--primary)" />
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Client: <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{proj.client?.name || 'Enterprise Client'}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem',
                        color: 'var(--text-dim)',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <span>PM: {proj.owner?.name}</span>
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          padding: '1px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                        }}
                      >
                        {proj._count?.tasks ?? 0} tasks
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Shareable Filter Bar */}
          <TaskFilters />

          {/* Deliverables Task List */}
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
                <CheckCircle2 size={32} color="var(--text-dim)" />
                <p style={{ fontSize: '0.94rem' }}>No deliverables match the active filter criteria</p>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  Try resetting the filter toolbar above to view all tasks.
                </span>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={() => fetchDashboardData()}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Global Real-Time Activity Feed */}
        <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <ActivityFeed title="Global Activity Stream" />
        </div>
      </div>

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={fetchDashboardData}
      />
    </div>
  );
};
