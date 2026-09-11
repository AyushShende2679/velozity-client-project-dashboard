import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PMMetrics, Project, Task } from '../types';
import { useSearchParams, Link } from 'react-router-dom';
import { TaskFilters } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { CreateProjectModal } from '../components/CreateProjectModal';
import {
  FolderKanban,
  Flame,
  CalendarCheck,
  AlertTriangle,
  Plus,
  ExternalLink,
  Briefcase,
  Layers,
} from 'lucide-react';

export const PMDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<PMMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const fetchPMData = async () => {
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
      console.error('Failed to load PM dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPMData();
  }, [searchParams]);

  const critCount = metrics?.tasksByPriority?.CRITICAL ?? 0;
  const highCount = metrics?.tasksByPriority?.HIGH ?? 0;
  const medCount = metrics?.tasksByPriority?.MEDIUM ?? 0;
  const lowCount = metrics?.tasksByPriority?.LOW ?? 0;
  const totalPriorityTasks = critCount + highCount + medCount + lowCount;

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
            <Briefcase size={20} color="#38bdf8" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              Project Manager Workspace
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Oversee your owned client projects, track delivery milestones, and review engineering deliverables.
          </p>
        </div>

        <button onClick={() => setIsProjectModalOpen(true)} className="btn-primary">
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
        {/* Owned Projects */}
        <div className="bento-card bento-card-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>My Managed Projects</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <FolderKanban size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.totalProjects ?? projects.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} /> Owned and managed by you
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="bento-card bento-card-warning">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Priority Distribution</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Flame size={18} />
            </div>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '10px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ color: '#ef4444' }}>Crit: {critCount}</span>
            <span style={{ color: '#f97316' }}>High: {highCount}</span>
            <span style={{ color: '#38bdf8' }}>Med: {medCount}</span>
            <span style={{ color: '#94a3b8' }}>Low: {lowCount}</span>
          </div>

          {/* Segmented Priority Bar */}
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
            {totalPriorityTasks > 0 ? (
              <>
                <div style={{ width: `${(critCount / totalPriorityTasks) * 100}%`, background: '#ef4444' }} />
                <div style={{ width: `${(highCount / totalPriorityTasks) * 100}%`, background: '#f97316' }} />
                <div style={{ width: `${(medCount / totalPriorityTasks) * 100}%`, background: '#38bdf8' }} />
                <div style={{ width: `${(lowCount / totalPriorityTasks) * 100}%`, background: '#64748b' }} />
              </>
            ) : null}
          </div>
        </div>

        {/* Due This Week */}
        <div className="bento-card bento-card-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Due This Week</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '10px', letterSpacing: '-0.03em' }}>
            {metrics?.dueThisWeekCount ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Active deliverables scheduled this week
          </div>
        </div>

        {/* Overdue Tasks */}
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
            Past deadline in your assigned projects
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column */}
        <div>
          {/* Projects Quick View */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>My Active Projects</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Click on any project to manage deliverables, view live project rooms, and assign team members.
            </p>

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
                      <span>Owner: You</span>
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
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

          {/* Tasks Grid */}
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
                <FolderKanban size={32} color="var(--text-dim)" />
                <p style={{ fontSize: '0.94rem' }}>No deliverables match active criteria in your projects</p>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  Use the filter controls above or create a new deliverable inside a project.
                </span>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={() => fetchPMData()}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: PM Activity Feed */}
        <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <ActivityFeed title="PM Activity Feed" />
        </div>
      </div>

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={fetchPMData}
      />
    </div>
  );
};
