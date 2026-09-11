import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X, Calendar, SlidersHorizontal, RotateCcw } from 'lucide-react';

export const TaskFilters: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const from = searchParams.get('from') || searchParams.get('dueFrom') || '';
  const to = searchParams.get('to') || searchParams.get('dueTo') || '';
  const search = searchParams.get('search') || '';

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
      if (key === 'from') newParams.delete('dueFrom');
      if (key === 'to') newParams.delete('dueTo');
    } else {
      newParams.delete(key);
      if (key === 'from') newParams.delete('dueFrom');
      if (key === 'to') newParams.delete('dueTo');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFiltersCount = [status, priority, from, to, search].filter(Boolean).length;

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '22px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 600 }}>
        <SlidersHorizontal size={15} color="var(--primary)" />
        <span>Filter Deliverables:</span>
        {activeFiltersCount > 0 && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.35)',
            }}
          >
            {activeFiltersCount} active
          </span>
        )}
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', minWidth: '190px', flex: '1 1 200px' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)',
          }}
        />
        <input
          type="text"
          placeholder="Search task title or description..."
          value={search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="form-input"
          style={{ paddingLeft: '36px', height: '38px', fontSize: '0.84rem' }}
        />
      </div>

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="form-input"
        style={{ width: 'auto', minWidth: '135px', height: '38px', fontSize: '0.84rem' }}
      >
        <option value="">All Statuses</option>
        <option value="TO_DO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="DONE">Done</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priority}
        onChange={(e) => updateFilter('priority', e.target.value)}
        className="form-input"
        style={{ width: 'auto', minWidth: '135px', height: '38px', fontSize: '0.84rem' }}
      >
        <option value="">All Priorities</option>
        <option value="CRITICAL">Critical Priority</option>
        <option value="HIGH">High Priority</option>
        <option value="MEDIUM">Medium Priority</option>
        <option value="LOW">Low Priority</option>
      </select>

      {/* Date Range: From */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500 }}>From:</span>
        <input
          type="date"
          value={from}
          onChange={(e) => updateFilter('from', e.target.value)}
          className="form-input"
          style={{ width: 'auto', height: '38px', fontSize: '0.82rem', padding: '4px 10px' }}
        />
      </div>

      {/* Date Range: To */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500 }}>To:</span>
        <input
          type="date"
          value={to}
          onChange={(e) => updateFilter('to', e.target.value)}
          className="form-input"
          style={{ width: 'auto', height: '38px', fontSize: '0.82rem', padding: '4px 10px' }}
        />
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="btn-secondary"
          style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem', gap: '6px' }}
          title="Reset all search parameters"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
