import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, Briefcase, Code, ArrowRight, Lock, Mail, CheckCircle2, Zap, Clock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password123!');
    try {
      setLoading(true);
      setError('');
      await login(userEmail, 'Password123!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1020px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '32px',
          alignItems: 'center',
        }}
      >
        {/* Left Side: Product Showcase & Architecture Highlights */}
        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.28)',
              color: '#a5b4fc',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '20px',
            }}
          >
            <span className="beacon-dot beacon-dot-live" />
            Enterprise Real-Time Architecture
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Activity size={24} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              VELOZITY
            </h1>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
            Next-generation client project dashboard engineered with role-based access control, WebSocket-driven live activity streams, and automated overdue tracking.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', marginTop: '2px' }}>
                <Zap size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Strict WebSocket Telemetry</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  Zero HTTP polling overhead. Multiplexed rooms deliver instant status transitions, notifications, and presence metrics.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', marginTop: '2px' }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Strict RBAC Enforcement</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  Enforced at the API and database service layer. Distinct operational views for Admins, Project Managers, and Developers.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', marginTop: '2px' }}>
                <Clock size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Autonomous Background Scheduler</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  High-efficiency node-cron job checks deadlines, flags overdue deliverables, and broadcasts alert logs across active rooms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div
          className="glass-card"
          style={{
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Sign in with your workspace credentials or select a test role below.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@velozity.com"
                  className="form-input"
                  style={{ paddingLeft: '38px', height: '42px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                  }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '38px', height: '42px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: '44px', marginTop: '4px', fontSize: '0.92rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          {/* 1-Click Role Switcher for Fast Evaluation */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
                letterSpacing: '0.06em',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              Instant Test Role Switcher (1-Click)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => quickLogin('admin@velozity.com')}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '10px 12px', justifyContent: 'center', gap: '6px' }}
              >
                <Shield size={14} color="#f43f5e" /> Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('sarah.pm@velozity.com')}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '10px 12px', justifyContent: 'center', gap: '6px' }}
              >
                <Briefcase size={14} color="#38bdf8" /> Sarah (PM 1)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('marcus.pm@velozity.com')}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '10px 12px', justifyContent: 'center', gap: '6px' }}
              >
                <Briefcase size={14} color="#38bdf8" /> Marcus (PM 2)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('ravi.dev@velozity.com')}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '10px 12px', justifyContent: 'center', gap: '6px' }}
              >
                <Code size={14} color="#34d399" /> Ravi (Dev)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
