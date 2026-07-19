import React, { useMemo } from 'react';
import useStore from '../store/useStore';
import {
  BarChart2, AlertTriangle, CheckCircle, Users,
  BookOpen, Clock, TrendingUp, AlertCircle, Zap
} from 'lucide-react';
import { DAY_NAMES } from '../utils/generator';

/* ─── Bar component ─── */
function Bar({ value, max, color = 'var(--color-primary)', label, sublabel, warning }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = value > max;
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</span>
          {sublabel && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{sublabel}</span>}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isOver ? 'var(--color-danger)' : color }}>
          {value}{max ? ` / ${max}` : ''}
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--color-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: isOver ? 'var(--color-danger)' : color,
          borderRadius: 4,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      {warning && (
        <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={11} /> {warning}
        </div>
      )}
    </div>
  );
}

/* ─── Alert badge ─── */
function Alert({ type = 'warning', children }) {
  const styles = {
    warning: { bg: 'var(--color-warning-bg)', border: '#fcd34d', color: '#92400e', icon: <AlertTriangle size={15} color="#d97706" /> },
    danger:  { bg: 'var(--color-danger-bg)',  border: '#fca5a5', color: '#991b1b', icon: <AlertCircle size={15} color="var(--color-danger)" /> },
    success: { bg: 'var(--color-success-bg)', border: '#6ee7b7', color: '#065f46', icon: <CheckCircle size={15} color="var(--color-success)" /> },
  };
  const s = styles[type];
  return (
    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: s.bg, border: `1px solid ${s.border}`, fontSize: '0.8125rem', color: s.color, fontWeight: 600 }}>
      <span style={{ flexShrink: 0 }}>{s.icon}</span>
      <span>{children}</span>
    </div>
  );
}

export default function ReportsPage() {
  const { teachers, classes, subjects, timetables, settings } = useStore();

  const classTimetables   = timetables.classTimetables   || {};
  const teacherTimetables = timetables.teacherTimetables || {};
  const hasGenerated = Object.keys(classTimetables).length > 0;

  /* ── Compute teacher workloads ── */
  const teacherStats = useMemo(() => {
    return teachers.map((t) => {
      const assignedSubjects = subjects.filter((s) => s.teacherId === t.id);
      const requiredPeriods  = assignedSubjects.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);
      const distinctClasses  = [...new Set(assignedSubjects.map((s) => s.classId))];

      // Scheduled periods from timetable
      let scheduledPeriods = 0;
      if (hasGenerated && teacherTimetables[t.id]) {
        Object.values(teacherTimetables[t.id]).forEach((day) => {
          Object.values(day).forEach((slot) => {
            if (slot && slot !== '__break__' && slot.subjectId) scheduledPeriods++;
          });
        });
      }

      const utilization = t.maxPeriods > 0 ? Math.round((requiredPeriods / t.maxPeriods) * 100) : 0;
      const overloaded   = requiredPeriods > t.maxPeriods;

      return {
        ...t,
        requiredPeriods,
        scheduledPeriods,
        distinctClasses: distinctClasses.length,
        assignedSubjectCount: assignedSubjects.length,
        utilization,
        overloaded,
      };
    }).sort((a, b) => b.requiredPeriods - a.requiredPeriods);
  }, [teachers, subjects, timetables]);

  /* ── Compute class stats ── */
  const classStats = useMemo(() => {
    return classes.map((cls) => {
      const clsSubjects    = subjects.filter((s) => s.classId === cls.id);
      const totalPeriods   = clsSubjects.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);
      const missingTeacher = clsSubjects.filter((s) => !s.teacherId).length;
      const electiveCount  = clsSubjects.filter((s) => s.isElective).length;

      const schedulablePerWeek = settings.workingDays.length * (settings.periodsPerDay - (settings.breakPeriods || []).length);
      const scheduled = hasGenerated && classTimetables[cls.id]
        ? Object.values(classTimetables[cls.id]).reduce((sum, day) =>
            sum + Object.values(day).filter((v) => v && v !== '__break__').length, 0)
        : null;

      const coverage = schedulablePerWeek > 0 ? Math.round((totalPeriods / schedulablePerWeek) * 100) : 0;

      return {
        ...cls,
        subjectCount: clsSubjects.length,
        totalPeriods,
        missingTeacher,
        electiveCount,
        schedulablePerWeek,
        scheduled,
        coverage,
      };
    }).sort((a, b) => b.totalPeriods - a.totalPeriods);
  }, [classes, subjects, settings, timetables]);

  /* ── Global alerts ── */
  const alerts = useMemo(() => {
    const list = [];
    const overloadedTeachers = teacherStats.filter((t) => t.overloaded);
    if (overloadedTeachers.length > 0)
      list.push({ type: 'danger', msg: `${overloadedTeachers.length} teacher(s) are overloaded (required periods exceed their maximum): ${overloadedTeachers.map((t) => t.name).join(', ')}` });

    const noTeacherSubjects = subjects.filter((s) => !s.teacherId);
    if (noTeacherSubjects.length > 0)
      list.push({ type: 'warning', msg: `${noTeacherSubjects.length} subject(s) have no teacher assigned. They won't be scheduled.` });

    const emptyClasses = classes.filter((cls) => subjects.filter((s) => s.classId === cls.id).length === 0);
    if (emptyClasses.length > 0)
      list.push({ type: 'warning', msg: `${emptyClasses.length} class(es) have no subjects: ${emptyClasses.map((c) => `${c.name}${c.section ? `-${c.section}` : ''}`).join(', ')}` });

    const coverageIssues = classStats.filter((c) => c.coverage > 95);
    if (coverageIssues.length > 0)
      list.push({ type: 'warning', msg: `${coverageIssues.length} class(es) have >95% period coverage — may be hard to schedule without conflicts.` });

    if (list.length === 0 && teachers.length > 0 && classes.length > 0 && subjects.length > 0)
      list.push({ type: 'success', msg: 'No issues detected! Your setup looks good. Ready to generate timetables.' });

    return list;
  }, [teacherStats, classStats, subjects, classes, teachers]);

  /* ── Unscheduled subjects (after generation) ── */
  const unscheduledSubjects = useMemo(() => {
    if (!hasGenerated) return [];
    return subjects.filter((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      if (!cls || !classTimetables[cls.id]) return false;
      let count = 0;
      Object.values(classTimetables[cls.id]).forEach((day) => {
        Object.values(day).forEach((v) => {
          if (v === s.id) {
            count++;
          } else if (v && typeof v === 'string' && v.startsWith('__group__:') && s.combinedGroupId) {
            const groupId = v.split(':')[1];
            if (s.combinedGroupId === groupId) {
              count++;
            }
          }
        });
      });
      return count < (s.requiredPeriods || 0);
    });
  }, [subjects, classTimetables, classes, timetables]);

  /* ── Summary numbers ── */
  const totalRequiredPeriods = subjects.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);
  const schedulableSlots = settings.workingDays.length * (settings.periodsPerDay - (settings.breakPeriods || []).length) * classes.length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports &amp; Analytics</h1>
          <p className="page-subtitle">Workload analysis, scheduling conflicts, and coverage reports</p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {alerts.map((a, i) => (
            <Alert key={i} type={a.type}>{a.msg}</Alert>
          ))}
        </div>
      )}

      {/* ── Summary stats ── */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Weekly Periods Required', value: totalRequiredPeriods, icon: Clock, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
          { label: 'Total Schedulable Slots', value: schedulableSlots, icon: BarChart2, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
          { label: 'Overloaded Teachers', value: teacherStats.filter((t) => t.overloaded).length, icon: AlertTriangle, color: teacherStats.some((t) => t.overloaded) ? 'var(--color-danger)' : 'var(--color-success)', bg: teacherStats.some((t) => t.overloaded) ? 'var(--color-danger-bg)' : 'var(--color-success-bg)' },
          { label: 'Subjects w/o Teacher', value: subjects.filter((s) => !s.teacherId).length, icon: AlertCircle, color: subjects.some((s) => !s.teacherId) ? 'var(--color-warning)' : 'var(--color-success)', bg: subjects.some((s) => !s.teacherId) ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ '--stat-color': s.color, '--stat-bg': s.bg }}>
              <div className="stat-icon-wrap"><Icon size={20} /></div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ── Teacher Workload ── */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Users size={18} color="var(--color-primary)" />
              <span className="card-title">Teacher Workload</span>
            </div>
            <span className="badge badge-neutral">{teachers.length} teachers</span>
          </div>
          <div className="card-body">
            {teachers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No teachers added yet.</p>
            ) : (
              teacherStats.map((t) => (
                <Bar
                  key={t.id}
                  label={t.name}
                  sublabel={`${t.distinctClasses} class${t.distinctClasses !== 1 ? 'es' : ''} · ${t.assignedSubjectCount} subject${t.assignedSubjectCount !== 1 ? 's' : ''}`}
                  value={t.requiredPeriods}
                  max={t.maxPeriods}
                  color={t.color || 'var(--color-primary)'}
                  warning={t.overloaded ? `Exceeds max by ${t.requiredPeriods - t.maxPeriods} periods` : null}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Class Coverage ── */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <BookOpen size={18} color="var(--color-success)" />
              <span className="card-title">Class Period Coverage</span>
            </div>
            <span className="badge badge-neutral">{classes.length} classes</span>
          </div>
          <div className="card-body">
            {classes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No classes added yet.</p>
            ) : (
              classStats.map((cls) => (
                <Bar
                  key={cls.id}
                  label={`${cls.name}${cls.section ? ` – ${cls.section}` : ''}`}
                  sublabel={`${cls.subjectCount} subjects · ${cls.totalPeriods} periods/week`}
                  value={cls.totalPeriods}
                  max={cls.schedulablePerWeek}
                  color={
                    cls.coverage > 95 ? 'var(--color-danger)' :
                    cls.coverage > 80 ? 'var(--color-warning)' :
                    'var(--color-success)'
                  }
                  warning={cls.missingTeacher > 0 ? `${cls.missingTeacher} subject(s) have no teacher` : null}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Subject Distribution ── */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <TrendingUp size={18} color="#8b5cf6" />
              <span className="card-title">Subject Distribution</span>
            </div>
          </div>
          <div className="card-body">
            {subjects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No subjects added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Unique subject names */}
                {[...new Set(subjects.map((s) => s.name))].map((name) => {
                  const subs = subjects.filter((s) => s.name === name);
                  const totalPeriods = subs.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);
                  const sampleColor = subs[0]?.color || '#6366f1';
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: sampleColor, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{subs.length} class{subs.length !== 1 ? 'es' : ''}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: sampleColor }}>{totalPeriods} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>periods/wk</span></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Post-generation: Unscheduled subjects ── */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Zap size={18} color="var(--color-warning)" />
              <span className="card-title">Schedule Quality</span>
            </div>
            {hasGenerated && (
              <span className={`badge ${unscheduledSubjects.length === 0 ? 'badge-success' : 'badge-warning'}`}>
                {unscheduledSubjects.length === 0 ? '100% scheduled' : `${unscheduledSubjects.length} issues`}
              </span>
            )}
          </div>
          <div className="card-body">
            {!hasGenerated ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <BarChart2 size={32} style={{ opacity: 0.3, marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                Generate timetables first to see quality metrics.
              </div>
            ) : unscheduledSubjects.length === 0 ? (
              <Alert type="success">All subjects were successfully scheduled! Every required period is covered.</Alert>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Alert type="warning">{unscheduledSubjects.length} subject(s) could not be fully scheduled. Consider reducing required periods or checking teacher availability.</Alert>
                <div style={{ marginTop: '0.5rem' }}>
                  {unscheduledSubjects.map((s) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    const teacher = teachers.find((t) => t.id === s.teacherId);
                    let scheduled = 0;
                    if (classTimetables[s.classId]) {
                      Object.values(classTimetables[s.classId]).forEach((day) => {
                        Object.values(day).forEach((v) => {
                          if (v === s.id) {
                            scheduled++;
                          } else if (v && typeof v === 'string' && v.startsWith('__group__:') && s.combinedGroupId) {
                            const groupId = v.split(':')[1];
                            if (s.combinedGroupId === groupId) {
                              scheduled++;
                            }
                          }
                        });
                      });
                    }
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-bg)', border: '1px solid #fcd34d', fontSize: '0.8125rem' }}>
                        <div>
                          <span style={{ fontWeight: 700 }}>{s.name}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            {cls ? `${cls.name}${cls.section ? `-${cls.section}` : ''}` : ''}
                          </span>
                        </div>
                        <span style={{ color: '#92400e', fontWeight: 700 }}>{scheduled}/{s.requiredPeriods} scheduled</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Schedule config summary */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Schedule Configuration</div>
              {[
                { label: 'Working Days', value: settings.workingDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') || '—' },
                { label: 'Periods per Day', value: settings.periodsPerDay },
                { label: 'Break Slots', value: (settings.breakPeriods || []).length },
                { label: 'Effective Slots/Day', value: settings.periodsPerDay - (settings.breakPeriods || []).length },
                { label: 'Total Weekly Slots/Class', value: settings.workingDays.length * (settings.periodsPerDay - (settings.breakPeriods || []).length) },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
