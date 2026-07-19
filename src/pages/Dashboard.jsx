import React from 'react';
import useStore from '../store/useStore';
import {
  Users, BookOpen, Calendar, GraduationCap,
  ArrowRight, CheckCircle, Clock, AlertCircle, BarChart2,
  Zap, Settings, ChevronRight
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function Dashboard({ onNavigate }) {
  const { teachers, classes, subjects, timetables, settings, loadSampleData } = useStore();

  const classTimetables = timetables.classTimetables || {};
  const timetableCount  = Object.keys(classTimetables).length;
  const totalPeriods    = subjects.reduce((sum, s) => sum + (Number(s.requiredPeriods) || 0), 0);
  const missingTeachers = subjects.filter((s) => !s.teacherId).length;
  const schedulablePeriods = (settings.periods || []).filter((p) => ['class'].includes(p.type)).length;
  const completionPct = (() => {
    let done = 0, total = 5;
    if (settings.institutionName && settings.institutionName !== 'My Institution' && settings.institutionName !== '') done++;
    if (teachers.length > 0) done++;
    if (classes.length > 0 && subjects.length > 0) done++;
    if (timetableCount > 0) done++;
    if ((settings.periods || []).length > 0) done++;
    return Math.round((done / total) * 100);
  })();

  const stats = [
    { label: 'Teachers',    value: teachers.length, icon: Users,          color: '#4f46e5', bg: '#eef2ff', nav: 'teachers' },
    { label: 'Classes',     value: classes.length,  icon: GraduationCap,  color: '#059669', bg: '#d1fae5', nav: 'classes' },
    { label: 'Subjects',    value: subjects.length, icon: BookOpen,        color: '#7c3aed', bg: '#f5f3ff', nav: 'classes' },
    { label: 'Period Slots',value: schedulablePeriods, icon: Clock,        color: '#d97706', bg: '#fef3c7', nav: 'settings' },
  ];

  const steps = [
    {
      step: 1, title: 'Configure Settings',
      desc: 'Set institution name, working days, period times, and break slots.',
      nav: 'settings', icon: Settings,
      done: !!(settings.institutionName && settings.institutionName !== 'My Institution' && settings.institutionName !== ''),
    },
    {
      step: 2, title: 'Set Up Periods',
      desc: 'Name each period, set start/end times, and mark breaks. Use presets for quick setup.',
      nav: 'settings', icon: Clock,
      done: (settings.periods || []).length > 0,
    },
    {
      step: 3, title: 'Add Teachers',
      desc: 'Add staff with their workload limits and color tags.',
      nav: 'teachers', icon: Users,
      done: teachers.length > 0,
    },
    {
      step: 4, title: 'Add Classes & Subjects',
      desc: 'Create classes with sections, assign subjects and teachers.',
      nav: 'classes', icon: BookOpen,
      done: classes.length > 0 && subjects.length > 0,
    },
    {
      step: 5, title: 'Check Reports',
      desc: 'Review workload distribution and fix conflicts.',
      nav: 'reports', icon: BarChart2,
      done: !missingTeachers && classes.length > 0 && subjects.length > 0,
    },
    {
      step: 6, title: 'Generate Timetables',
      desc: 'Auto-generate conflict-free timetables and export as PDF.',
      nav: 'timetable', icon: Zap,
      done: timetableCount > 0,
    },
  ];

  const doneSteps = steps.filter((s) => s.done).length;
  const nextStep  = steps.find((s) => !s.done);

  const alerts = [];
  if (missingTeachers > 0) alerts.push({ type: 'warning', msg: `${missingTeachers} subject(s) have no teacher — they won't be scheduled.` });
  const overloaded = teachers.filter((t) => subjects.filter((s) => s.teacherId === t.id).reduce((sum, s) => sum + (s.requiredPeriods||0), 0) > t.maxPeriods);
  if (overloaded.length > 0) alerts.push({ type: 'danger', msg: `${overloaded.length} teacher(s) are overloaded: ${overloaded.map((t) => t.name).join(', ')}` });

  return (
    <div>
      {/* ── Demo Data Banner ── */}
      {teachers.length === 0 && classes.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
          border: '1.5px dashed var(--color-primary-light)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }}>👋 Get Started with Sample Data</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '600px', fontWeight: 600 }}>
              TimeForge is currently empty. Click the button to instantly preload sample teachers, classes, subjects, and periods so you can test features like substitution coverage planner and automated generation.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              loadSampleData();
              showToast('Sample data loaded successfully!', 'success');
            }}
            style={{ padding: '0.625rem 1.25rem' }}
          >
            <Zap size={16} /> Load Demo Data
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, #13103d 0%, #1e1560 50%, #2d1b69 100%)',
        padding: '2rem 2.5rem',
        marginBottom: '1.875rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decoration */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 120, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '1.875rem', marginBottom: '0.375rem' }}>
                Welcome to <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TimeForge</span> ⚡
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', fontWeight: 500, maxWidth: 480 }}>
                {settings.institutionName
                  ? `${settings.institutionName} · ${settings.academicYear}${settings.semester ? ` · ${settings.semester}` : ''}`
                  : 'Professional Timetable Management for Schools & Colleges'}
              </p>
            </div>

            {/* Progress ring */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(#a78bfa ${completionPct * 3.6}deg, rgba(255,255,255,0.1) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#1e1560', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>{completionPct}%</span>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.375rem', fontWeight: 700 }}>Setup Progress</div>
            </div>
          </div>

          {nextStep && (
            <button
              onClick={() => onNavigate?.(nextStep.nav)}
              style={{
                marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-full)',
                background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)',
                color: '#c4b5fd', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all var(--transition-fast)', fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(167,139,250,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(167,139,250,0.2)'}
            >
              <Zap size={15} /> Next: {nextStep.title}
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-cols-4" style={{ marginBottom: '1.875rem' }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="stat-card"
              style={{ '--stat-color': s.color, '--stat-bg': s.bg, cursor: 'pointer' }}
              onClick={() => onNavigate?.(s.nav)}
            >
              <div className="stat-icon-wrap"><Icon size={22} /></div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)', opacity: 0.5, position: 'relative', zIndex: 1 }} />
            </div>
          );
        })}
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.625rem', alignItems: 'center',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: a.type === 'danger' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
              border: `1px solid ${a.type === 'danger' ? '#fca5a5' : '#fcd34d'}`,
              fontSize: '0.8125rem', fontWeight: 600,
              color: a.type === 'danger' ? '#991b1b' : '#92400e',
            }}>
              <AlertCircle size={15} />
              <span>{a.msg}</span>
              <button onClick={() => onNavigate?.('reports')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                View Reports →
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* ── Setup Steps ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Getting Started</span>
            <span className="badge badge-primary">{doneSteps}/{steps.length} complete</span>
          </div>
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isNext = !step.done && steps.slice(0, idx).every((s) => s.done);
                return (
                  <div
                    key={step.step}
                    onClick={() => onNavigate?.(step.nav)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '1rem',
                      padding: '0.875rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: isNext ? 'var(--color-primary-bg)' : 'transparent',
                      border: isNext ? '1px solid var(--color-primary-soft)' : '1px solid transparent',
                      transition: 'all var(--transition-fast)',
                      marginBottom: '0.25rem',
                    }}
                    onMouseEnter={(e) => { if (!isNext) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                    onMouseLeave={(e) => { if (!isNext) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Step icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: step.done ? 'var(--color-success-bg)' : isNext ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'all var(--transition-base)',
                    }}>
                      {step.done
                        ? <CheckCircle size={18} color="var(--color-success)" />
                        : <Icon size={18} color={isNext ? 'white' : 'var(--text-muted)'} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 800, fontSize: '0.9375rem',
                        color: step.done ? 'var(--text-muted)' : isNext ? 'var(--color-primary)' : 'var(--text-primary)',
                        textDecoration: step.done ? 'line-through' : 'none',
                        marginBottom: '0.15rem',
                      }}>
                        {step.title}
                        {isNext && <span className="badge badge-gradient" style={{ marginLeft: '0.5rem', fontSize: '0.62rem' }}>Next</span>}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{step.desc}</div>
                    </div>
                    <ArrowRight size={16} color={isNext ? 'var(--color-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0, opacity: 0.6 }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Period preview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's Schedule Config</span>
            </div>
            <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
              {(settings.periods || []).length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  No periods configured. <button onClick={() => onNavigate?.('settings')} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Set up periods →</button>
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(settings.periods || []).slice(0, 8).map((p, i) => {
                    const type = p.type || 'class';
                    const colors = {
                      class:    { bg: 'var(--color-primary-bg)',  dot: 'var(--color-primary)' },
                      break:    { bg: 'var(--color-warning-bg)',  dot: 'var(--color-warning)' },
                      lunch:    { bg: '#fff7ed',                   dot: '#f97316' },
                      assembly: { bg: 'var(--color-success-bg)',  dot: 'var(--color-success)' },
                      free:     { bg: 'var(--color-surface-2)',   dot: 'var(--text-muted)' },
                    };
                    const c = colors[type] || colors.class;
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.4rem 0.625rem', borderRadius: 'var(--radius-sm)',
                        background: c.bg, fontSize: '0.8rem',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, flex: 1 }}>{p.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>
                          {p.startTime}–{p.endTime}
                        </span>
                      </div>
                    );
                  })}
                  {(settings.periods || []).length > 8 && (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.25rem' }}>
                      +{(settings.periods || []).length - 8} more periods
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="card">
            <div className="card-header"><span className="card-title">Quick Actions</span></div>
            <div className="card-body" style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { nav: 'teachers',  label: 'Manage Teachers',       icon: Users,         color: '#4f46e5' },
                { nav: 'classes',   label: 'Classes & Subjects',     icon: BookOpen,      color: '#7c3aed' },
                { nav: 'timetable', label: 'View Timetables',        icon: Calendar,      color: '#059669' },
                { nav: 'reports',   label: 'Analytics & Reports',    icon: BarChart2,     color: '#d97706' },
                { nav: 'settings',  label: 'Settings & Periods',     icon: Settings,      color: '#0284c7' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.nav}
                    onClick={() => onNavigate?.(item.nav)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
                      border: 'none', background: 'var(--color-surface-2)',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)',
                      transition: 'all var(--transition-fast)', textAlign: 'left', width: '100%',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}12`; e.currentTarget.style.color = item.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    <Icon size={16} color={item.color} />
                    {item.label}
                    <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
