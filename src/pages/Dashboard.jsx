import React from 'react';
import useStore from '../store/useStore';
import {
  Users, BookOpen, Calendar, GraduationCap,
  ArrowRight, CheckCircle, Clock, AlertCircle, BarChart2
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const { teachers, classes, subjects, timetables, settings } = useStore();

  const timetableCount = Object.keys(timetables).length;
  const totalPeriods = subjects.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);

  const stats = [
    {
      label: 'Teachers',
      value: teachers.length,
      icon: Users,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-bg)',
      nav: 'teachers',
    },
    {
      label: 'Classes',
      value: classes.length,
      icon: GraduationCap,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      nav: 'classes',
    },
    {
      label: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: '#7c3aed',
      bg: '#ede9fe',
      nav: 'classes',
    },
    {
      label: 'Schedules Generated',
      value: timetableCount,
      icon: Calendar,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      nav: 'timetable',
    },
  ];

  const steps = [
    {
      step: 1,
      title: 'Configure Settings',
      desc: 'Set your institution name, working days, period times, and break slots.',
      nav: 'settings',
      done: settings.institutionName !== 'My Institution',
    },
    {
      step: 2,
      title: 'Add Teachers',
      desc: 'Add teaching staff with their subject specializations and workload limits.',
      nav: 'teachers',
      done: teachers.length > 0,
    },
    {
      step: 3,
      title: 'Setup Classes & Subjects',
      desc: 'Create classes with sections, assign subjects with teachers and periods per week.',
      nav: 'classes',
      done: classes.length > 0 && subjects.length > 0,
    },
    {
      step: 4,
      title: 'Check Reports',
      desc: 'Review workload distribution and fix any conflicts before generating.',
      nav: 'reports',
      done: classes.length > 0 && subjects.length > 0 && teachers.length > 0,
    },
    {
      step: 5,
      title: 'Generate Timetables',
      desc: 'Auto-generate conflict-free timetables and export them as PDF.',
      nav: 'timetable',
      done: timetableCount > 0,
    },
  ];

  const allDone = steps.every((s) => s.done);
  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Welcome to TimeForge</h1>
          <p className="page-subtitle">
            {settings.institutionName} &nbsp;·&nbsp; {settings.academicYear}
            {settings.semester ? ` · ${settings.semester}` : ''}
          </p>
        </div>
        {timetableCount > 0 && (
          <button className="btn btn-primary" onClick={() => onNavigate('timetable')}>
            <Calendar size={16} /> View Timetables
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="stat-card"
              style={{ '--stat-color': s.color, '--stat-bg': s.bg, cursor: 'pointer' }}
              onClick={() => onNavigate(s.nav)}
            >
              <div className="stat-icon-wrap">
                <Icon size={22} />
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress + Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Setup Steps */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Getting Started</span>
            <span className="badge badge-primary">{completedSteps}/{steps.length} Complete</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {steps.map((s) => (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: s.done ? 'var(--color-success-bg)' : 'var(--color-surface-2)',
                  border: `1px solid ${s.done ? '#a7f3d0' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => onNavigate(s.nav)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate(s.nav)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.done ? 'var(--color-success)' : 'var(--color-white)',
                  border: `2px solid ${s.done ? 'var(--color-success)' : 'var(--color-border)'}`,
                  color: s.done ? 'white' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.8125rem',
                }}>
                  {s.done ? <CheckCircle size={16} /> : s.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary Card */}
          <div className="card card-body">
            <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9375rem' }}>
              Schedule Summary
            </div>
            {[
              { label: 'Working Days / Week', value: settings.workingDays.length },
              { label: 'Periods per Day', value: settings.periodsPerDay },
              { label: 'Period Duration', value: `${settings.periodDuration} min` },
              { label: 'Total Weekly Periods', value: totalPeriods },
              { label: 'Break Slots', value: settings.breakPeriods.length },
            ].map((row) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Status alert */}
          {!allDone && (
            <div style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-bg)', border: '1px solid #fcd34d',
            }}>
              <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e', marginBottom: '0.25rem' }}>
                  Setup Incomplete
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                  Complete all {steps.length} steps to generate timetables.
                </div>
              </div>
            </div>
          )}

          {allDone && (
            <div style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-bg)', border: '1px solid #6ee7b7',
            }}>
              <CheckCircle size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#065f46', marginBottom: '0.25rem' }}>
                  All Set!
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                  Your setup is complete. You can now generate and export timetables.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
