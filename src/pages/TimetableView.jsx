import React, { useState } from 'react';
import useStore from '../store/useStore';
import { generateTimetable, DAY_NAMES, formatPeriodTime } from '../utils/generator';
import { exportToPDF, exportAllTimetablesPDF } from '../utils/pdfExport';
import { Play, Download, Printer, Users, BookOpen, FileDown, RefreshCw, Coffee, Zap } from 'lucide-react';
import { showToast } from '../components/Toast';

/* ─── Helpers ─── */
function hexToRgb(hex) {
  if (!hex || hex.length < 7) return { r: 99, g: 102, b: 241 };
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return { r, g, b };
}

function colorCell(hex, alpha = 0.13) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex, f = 0.75) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
}

/* ── Timetable theme helpers ── */
function applyTheme(color, timetableTheme) {
  switch (timetableTheme) {
    case 'mono':   return { bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a' };
    case 'pastel':
      return { bg: colorCell(color, 0.08), border: colorCell(color, 0.25), text: darken(color, 0.8) };
    default:
      return { bg: colorCell(color, 0.15), border: colorCell(color, 0.45), text: darken(color, 0.75) };
  }
}

/* ── Non-class period cell ── */
function NonClassCell({ period }) {
  const styles = {
    break:    { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#fbbf24', text: '#92400e', emoji: '☕', label: period?.name || 'Break' },
    lunch:    { bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)', border: '#fb923c', text: '#9a3412', emoji: '🍽️', label: period?.name || 'Lunch' },
    assembly: { bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#86efac', text: '#166534', emoji: '🎓', label: period?.name || 'Assembly' },
    free:     { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8', emoji: '—', label: period?.name || 'Free' },
  };
  const type = period?.type || 'break';
  const s = styles[type] || styles.break;
  return (
    <div className="timetable-cell" style={{
      background: s.bg, border: `1.5px solid ${s.border}`,
      color: s.text, fontWeight: 800, fontSize: '0.72rem',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.1rem',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{s.emoji}</span>
      <span>{s.label}</span>
    </div>
  );
}

/* ── Class Timetable Grid ── */
function ClassTimetableGrid({ timetable, subjects, teachers, settings, gridId }) {
  const { workingDays, periods = [], showPeriodTimes, showPeriodNames, showTeacherInCell, timetableTheme } = settings;
  const NON_CLASS = new Set(['break','lunch','assembly','free']);

  return (
    <div id={gridId} style={{ overflowX: 'auto', background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
      <table className="timetable-grid" style={{ minWidth: workingDays.length * 120 + 130 }}>
        <thead>
          <tr>
            <th className="period-header">
              {showPeriodNames ? 'Period' : 'Slot'}
            </th>
            {workingDays.map((dayIdx) => (
              <th key={dayIdx}>{DAY_NAMES[dayIdx]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period, p) => {
            const isNonClass = NON_CLASS.has(period.type);
            const timeStr = showPeriodTimes ? formatPeriodTime(period) : null;

            return (
              <tr key={p}>
                <td>
                  <div className="period-label-col">
                    {showPeriodNames && (
                      <div className="period-name">{period.name}</div>
                    )}
                    {timeStr && (
                      <div className="period-time-row">{timeStr}</div>
                    )}
                    {!showPeriodNames && !timeStr && (
                      <div className="period-name">Slot {p+1}</div>
                    )}
                  </div>
                </td>
                {workingDays.map((_, di) => {
                  const val = timetable?.[di]?.[p];
                  if (isNonClass || val?.startsWith?.('__')) {
                    return (
                      <td key={di}><NonClassCell period={period} /></td>
                    );
                  }
                  const sub = val ? subjects.find((s) => s.id === val) : null;
                  const teacher = sub ? teachers.find((t) => t.id === sub.teacherId) : null;
                  const colors = applyTheme(sub?.color || '#6366f1', timetableTheme);

                  return (
                    <td key={di}>
                      {sub ? (
                        <div
                          className="timetable-cell filled"
                          style={{
                            background: colors.bg,
                            border: `1.5px solid ${colors.border}`,
                          }}
                        >
                          <div className="cell-subject" style={{ color: colors.text }}>
                            {sub.name}
                            {sub.code && <span style={{ fontWeight: 500, opacity: 0.7, fontSize: '0.65rem', marginLeft: 3 }}>({sub.code})</span>}
                          </div>
                          {showTeacherInCell && teacher && (
                            <div className="cell-teacher" style={{ color: colors.text }}>
                              {teacher.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="timetable-cell empty">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Teacher Timetable Grid ── */
function TeacherTimetableGrid({ teacherTimetable, subjects, classes, settings, gridId }) {
  const { workingDays, periods = [], showPeriodTimes, showPeriodNames, timetableTheme } = settings;
  const NON_CLASS = new Set(['break','lunch','assembly','free']);

  return (
    <div id={gridId} style={{ overflowX: 'auto', background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
      <table className="timetable-grid" style={{ minWidth: workingDays.length * 130 + 130 }}>
        <thead>
          <tr>
            <th className="period-header">Period</th>
            {workingDays.map((dayIdx) => <th key={dayIdx}>{DAY_NAMES[dayIdx]}</th>)}
          </tr>
        </thead>
        <tbody>
          {periods.map((period, p) => {
            const isNonClass = NON_CLASS.has(period.type);
            const timeStr = showPeriodTimes ? formatPeriodTime(period) : null;

            return (
              <tr key={p}>
                <td>
                  <div className="period-label-col">
                    {showPeriodNames && <div className="period-name">{period.name}</div>}
                    {timeStr && <div className="period-time-row">{timeStr}</div>}
                    {!showPeriodNames && !timeStr && <div className="period-name">Slot {p+1}</div>}
                  </div>
                </td>
                {workingDays.map((_, di) => {
                  const val = teacherTimetable?.[di]?.[p];
                  if (isNonClass || val?.startsWith?.('__')) {
                    return <td key={di}><NonClassCell period={period} /></td>;
                  }
                  const { subjectId, classId } = val || {};
                  const sub = subjectId ? subjects.find((s) => s.id === subjectId) : null;
                  const cls = classId ? classes.find((c) => c.id === classId) : null;
                  const colors = applyTheme(sub?.color || '#6366f1', timetableTheme);

                  return (
                    <td key={di}>
                      {sub ? (
                        <div className="timetable-cell filled" style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}>
                          <div className="cell-subject" style={{ color: colors.text }}>{sub.name}</div>
                          {cls && <div className="cell-teacher" style={{ color: colors.text }}>
                            {cls.name}{cls.section ? ` – ${cls.section}` : ''}
                          </div>}
                        </div>
                      ) : (
                        <div className="timetable-cell empty">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function TimetableView() {
  const { classes, subjects, teachers, settings, timetables, setTimetables, clearTimetables } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting,  setIsExporting]  = useState(false);
  const [viewMode,     setViewMode]     = useState('class');
  const [activeId,     setActiveId]     = useState(null);

  const classTimetables   = timetables.classTimetables   || {};
  const teacherTimetables = timetables.teacherTimetables || {};
  const hasData = Object.keys(classTimetables).length > 0;

  const defaultId = viewMode === 'class' ? classes[0]?.id : teachers[0]?.id;
  const effectiveId = activeId || defaultId;

  const activeClass   = classes.find((c) => c.id === effectiveId);
  const activeTeacher = teachers.find((t) => t.id === effectiveId);

  /* ── Generate ── */
  const handleGenerate = () => {
    if (!classes.length)  { showToast('Add classes first', 'error'); return; }
    if (!subjects.length) { showToast('Add subjects first', 'error'); return; }
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateTimetable(classes, subjects, teachers, settings);
      setTimetables(result);
      setActiveId(classes[0]?.id || null);
      setIsGenerating(false);
      showToast('Timetables generated!', 'success');
    }, 800);
  };

  /* ── PDF ── */
  const handleExportPDF = async () => {
    if (!effectiveId) return;
    setIsExporting(true);
    try {
      let elementId, title, fileName;
      if (viewMode === 'class') {
        elementId = `grid-class-${effectiveId}`;
        title = `Class ${activeClass?.name || ''}${activeClass?.section ? ` – ${activeClass.section}` : ''} Timetable`;
        fileName = `${(activeClass?.name||'class').replace(/\s+/g,'_')}_timetable.pdf`;
      } else {
        elementId = `grid-teacher-${effectiveId}`;
        title = `${activeTeacher?.name || ''}'s Timetable`;
        fileName = `${(activeTeacher?.name||'teacher').replace(/\s+/g,'_')}_timetable.pdf`;
      }
      await exportToPDF(elementId, {
        fileName, title,
        institutionName: settings.institutionName,
        academicYear: settings.academicYear,
        semester: settings.semester,
      });
      showToast('PDF exported!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await exportAllTimetablesPDF(
        classes.map((c) => ({ classId: c.id, className: `${c.name}${c.section ? ` – ${c.section}` : ''}` })),
        (id) => `grid-class-${id}`,
        { institutionName: settings.institutionName, academicYear: settings.academicYear, semester: settings.semester }
      );
      showToast('All timetables exported!', 'success');
    } catch (e) { showToast('Export failed', 'error'); }
    finally { setIsExporting(false); }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Timetables</h1>
          <p className="page-subtitle">Generate conflict-free schedules and export as PDF</p>
        </div>
        <div className="page-header-actions">
          {hasData && (
            <>
              <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16}/> Print</button>
              <button className="btn btn-outline" onClick={handleExportPDF} disabled={isExporting || !effectiveId}>
                {isExporting ? <><div className="spinner" style={{width:15,height:15,border:'2px solid rgba(79,70,229,0.3)',borderTopColor:'var(--color-primary)'}}/> Exporting…</> : <><Download size={16}/> Export PDF</>}
              </button>
              {viewMode === 'class' && (
                <button className="btn btn-secondary" onClick={handleExportAll} disabled={isExporting}>
                  <FileDown size={16}/> Export All
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => { clearTimetables(); setActiveId(null); }}>
                <RefreshCw size={16}/> Regenerate
              </button>
            </>
          )}
          <button
            id="generate-btn"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !classes.length}
          >
            {isGenerating
              ? <><div className="spinner" style={{width:15,height:15}}/> Generating…</>
              : <><Zap size={16}/> Generate Timetables</>}
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasData ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ width: 72, height: 72 }}><BookOpen size={34}/></div>
            <h3>No Timetables Generated</h3>
            <p>
              {!classes.length ? 'Add classes and subjects first.' :
               !subjects.length ? 'Add subjects to your classes.' :
               'Click Generate to create conflict-free timetables.'}
            </p>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating || !classes.length} style={{ marginTop: '0.75rem' }}>
              <Zap size={16}/> Generate Now
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* View mode */}
          <div className="tabs-bar">
            <button className={`tab-btn ${viewMode==='class'?'active':''}`} onClick={() => { setViewMode('class'); setActiveId(null); }}>
              <BookOpen size={16}/> Class View
            </button>
            <button className={`tab-btn ${viewMode==='teacher'?'active':''}`} onClick={() => { setViewMode('teacher'); setActiveId(null); }}>
              <Users size={16}/> Teacher View
            </button>
          </div>

          {/* Class / Teacher pills */}
          <div className="class-tabs">
            {viewMode === 'class'
              ? classes.map((c) => (
                <button
                  key={c.id}
                  className={`class-tab ${effectiveId===c.id?'active':''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  {c.name}{c.section?` – ${c.section}`:''}
                </button>
              ))
              : teachers.map((t) => (
                <button
                  key={t.id}
                  className={`class-tab ${effectiveId===t.id?'active':''}`}
                  onClick={() => setActiveId(t.id)}
                  style={ effectiveId === t.id ? { background: t.color, borderColor: 'transparent' } : { borderColor: t.color, color: t.color } }
                >
                  {t.name}
                </button>
              ))}
          </div>

          {/* Title bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.875rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.125rem' }}>
                {viewMode === 'class'
                  ? `Class ${activeClass?.name||''}${activeClass?.section?` – ${activeClass.section}`:''}`
                  : `${activeTeacher?.name||''}'s Schedule`}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {settings.institutionName} · {settings.academicYear}
                {settings.semester ? ` · ${settings.semester}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{settings.periods?.length || 0} slots/day</span>
              <span>·</span>
              <span>{settings.workingDays?.length || 5} days/week</span>
            </div>
          </div>

          {/* Grids */}
          {viewMode === 'class'
            ? classes.map((cls) => (
              <div key={cls.id} style={{ display: cls.id === effectiveId ? 'block' : 'none' }}>
                <ClassTimetableGrid
                  timetable={classTimetables[cls.id]}
                  subjects={subjects}
                  teachers={teachers}
                  settings={settings}
                  gridId={`grid-class-${cls.id}`}
                />
              </div>
            ))
            : teachers.map((t) => (
              <div key={t.id} style={{ display: t.id === effectiveId ? 'block' : 'none' }}>
                <TeacherTimetableGrid
                  teacherTimetable={teacherTimetables[t.id]}
                  subjects={subjects}
                  classes={classes}
                  settings={settings}
                  gridId={`grid-teacher-${t.id}`}
                />
              </div>
            ))}

          {/* Subject legend */}
          {viewMode === 'class' && effectiveId && (() => {
            const clsSubjects = subjects.filter((s) => s.classId === effectiveId);
            if (!clsSubjects.length) return null;
            return (
              <div className="card" style={{ marginTop: '1.25rem' }}>
                <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    Subject Legend
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {clsSubjects.map((s) => {
                      const teacher = teachers.find((t) => t.id === s.teacherId);
                      return (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.325rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          background: colorCell(s.color || '#6366f1', 0.1),
                          border: `1.5px solid ${colorCell(s.color || '#6366f1', 0.35)}`,
                          fontSize: '0.8125rem',
                        }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color || '#6366f1', flexShrink: 0 }} />
                          <span style={{ fontWeight: 800, color: darken(s.color || '#6366f1', 0.8) }}>{s.name}</span>
                          {s.code && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{s.code}</span>}
                          {teacher && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>· {teacher.name}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
