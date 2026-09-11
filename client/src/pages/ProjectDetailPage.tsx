import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Project, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { TaskCard } from '../components/TaskCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ArrowLeft, Plus, FolderKanban, User, Building, Radio, CheckCircle2, Calendar } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, joinProjectRoom, leaveProjectRoom } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      if (res.data?.success && res.data?.data) {
        setProject(res.data.data.project);
        setTasks(res.data.data.project.tasks || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      joinProjectRoom(id);
    }

    return () => {
      if (id) {
        leaveProjectRoom(id);
      }
    };
  }, [id, socket]);

  // Sync task status changes in real time for anyone viewing this project room
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (payload: any) => {
      if (payload.projectId === id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === payload.taskId ? { ...t, status: payload.toStatus } : t))
        );
      }
    };

    socket.on('task:status_updated', handleTaskUpdated);

    return () => {
      socket.off('task:status_updated', handleTaskUpdated);
    };
  }, [socket, id]);

  const canCreateTask =
    user?.role === 'ADMIN' ||
    (user?.role === 'PROJECT_MANAGER' && project?.ownerId === user.id);

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1rem' }}>Connecting to project live room...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ color: '#f87171', fontSize: '1.1rem', marginBottom: '20px' }}>
          {error || 'Project not found or unauthorized'}
        </div>
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '0.86rem',
          fontWeight: 600,
          marginBottom: '20px',
          transition: 'color 0.2s',
        }}
      >
        <ArrowLeft size={16} /> Back to Workspace
      </Link>

      {/* Project Banner Card */}
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderKanban size={20} color="#818cf8" />
              </div>

              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                {project.title}
              </h1>

              <span
                style={{
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 600,
                }}
              >
                <Radio size={12} color="#818cf8" /> Room: project-{project.id.slice(0, 8)}
              </span>
            </div>

            {project.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.55, maxWidth: '820px', marginBottom: '16px' }}>
                {project.description}
              </p>
            )}

            {/* Meta tags */}
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.84rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="var(--text-muted)" />
                <span>Client: <strong style={{ color: 'var(--text-main)' }}>{project.client?.name || 'Unassigned'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="var(--text-muted)" />
                <span>Project Manager: <strong style={{ color: 'var(--text-main)' }}>{project.owner?.name}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Completion: <strong style={{ color: 'var(--text-main)' }}>{progressPercent}%</strong> ({completedCount}/{tasks.length})</span>
              </div>
            </div>

            {/* Project Progress Gauge */}
            <div style={{ marginTop: '16px', maxWidth: '480px' }}>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'var(--primary-gradient)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          {canCreateTask && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="btn-primary"
            >
              <Plus size={16} /> Add Deliverable
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Deliverables Grid + Project Scoped Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Project Deliverables</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {tasks.length} total item{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

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
                <p style={{ fontSize: '0.94rem' }}>No deliverables have been added to this project yet</p>
                {canCreateTask && (
                  <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary" style={{ marginTop: '6px' }}>
                    <Plus size={14} /> Create First Deliverable
                  </button>
                )}
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={() => fetchProjectDetails()}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Project-Scoped Real-Time Activity Feed */}
        <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <ActivityFeed
            projectId={project.id}
            title={`${project.title} Stream`}
          />
        </div>
      </div>

      {canCreateTask && (
        <CreateTaskModal
          projectId={project.id}
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={fetchProjectDetails}
        />
      )}
    </div>
  );
};
