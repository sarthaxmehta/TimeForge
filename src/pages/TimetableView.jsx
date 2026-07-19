import React, { useState, useRef } from 'react';
import useStore from '../store/useStore';
import { generateTimetable, getPeriodTime, DAY_NAMES } from '../utils/generator';
import { exportToPDF, exportAllTimetablesPDF } from '../utils/pdfExport';
import { Play, Download, Printer, Users, BookOpen, Loader2, FileDown, RefreshCw } from 'lucide-react';
import { showToast } from '../components/Toast';

/* ─── Helpers ─── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lightenHex(hex, alpha = 0.12) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex, alpha = 0.85) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * alpha)},${Math.round(g * alpha)},${Math.round(b * alpha)})`;
}

/* ─── Timetable Grid Component ─── */
function TimetableGrid({ timetable, subjects, teachers, settings, gridId }) {
  const { workingDays, periodsPerDay, breakPeriods = [], startTime, periodDuration, showPeriodTimes, showTeacherInCell } = settings;
  const breakSet = new Set(breakPeriods.map(Number));
  const numDays  = workingDays.length;

  return (
    <div
      id={gridId}
      style={{ overflowX: 'auto', background: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)' }}
    >
      <table className="timetable-grid" style={{ minWidth: numDays * 120 + 100 }}>
        <thead>
          <tr>
            <th className="period-header">Period</th>
            {workingDays.map((dayIdx) => (
              <th key={dayIdx}>{DAY_NAMES[dayIdx]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: periodsPerDay }, (_, p) => {
            const isBreak = breakSet.has(p);
            const timeLabel = showPeriodTimes ? getPeriodTime(p, startTime, periodDuration, breakPeriods) : null;

            return (
              <tr key={p}>
                <td style={{ paddingLeft: '0.5rem' }}>
                  <div className="period-label">{isBreak ? '☕' : `P${p + 1}`}</div>
                  {timeLabel && <div className="period-time">{timeLabel}</div>}
                </td>
                {workingDays.map((_, di) => {
                  const cellValue = timetable?.[di]?.[p];

                  if (isBreak || cellValue === '__break__') {
                    return (
                      <td key={di}>
                        <div className="timetable-cell break-cell">
                          ☕ Break
                        </div>
                      </td>
                    );
                  }

                  const sub     = cellValue ? subjects.find((s) => s.id === cellValue) : null;
                  const teacher = sub ? teachers.find((t) => t.id === sub.teacherId) : null;
                  const color   = sub?.color || '#6366f1';

                  return (
                    <td key={di}>
                      {sub ? (
                        <div
                          className="timetable-cell filled"
                          style={{
                            background: lightenHex(color, 0.15),
                            borderColor: lightenHex(color, 0.5),
                            border: `1.5px solid ${lightenHex(color, 0.4)}`,
                          }}
                        >
                          <div className="cell-subject" style={{ color: darkenHex(color, 0.75) }}>
                            {sub.name}
                            {sub.code ? <span style={{ fontWeight: 500, opacity: 0.75, fontSize: '0.65rem', marginLeft: 3 }}>({sub.code})</span> : null}
                          </div>
                          {showTeacherInCell && teacher && (
                            <div className="cell-teacher" style={{ color: darkenHex(color, 0.65) }}>
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

/* ─── Teacher Timetable Grid ─── */
function TeacherTimetableGrid({ teacherTimetable, subjects, classes, settings, gridId }) {
  const { workingDays, periodsPerDay, breakPeriods = [], startTime, periodDuration, showPeriodTimes } = settings;
  const breakSet = new Set(breakPeriods.map(Number));

  return (
    <div
      id={gridId}
      style={{ overflowX: 'auto', background: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)' }}
    >
      <table className="timetable-grid" style={{ minWidth: workingDays.length * 130 + 100 }}>
        <thead>
          <tr>
            <th className="period-header">Period</th>
            {workingDays.map((dayIdx) => (
              <th key={dayIdx}>{DAY_NAMES[dayIdx]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: periodsPerDay }, (_, p) => {
            const isBreak = breakSet.has(p);
            const timeLabel = showPeriodTimes ? getPeriodTime(p, startTime, periodDuration, breakPeriods) : null;

            return (
              <tr key={p}>
                <td style={{ paddingLeft: '0.5rem' }}>
                  <div className="period-label">{isBreak ? '☕' : `P${p + 1}`}</div>
                  {timeLabel && <div className="period-time">{timeLabel}</div>}
                </td>
                {workingDays.map((_, di) => {
                  const cellValue = teacherTimetable?.[di]?.[p];

                  if (isBreak || cellValue === '__break__') {
                    return (
                      <td key={di}>
                        <div className="timetable-cell break-cell">☕ Break</div>
                      </td>
                    );
                  }

                  const { subjectId, classId } = cellValue || {};
                  const sub = subjectId ? subjects.find((s) => s.id === subjectId) : null;
                  const cls = classId  ? classes.find((c) => c.id === classId)    : null;
                  const color = sub?.color || '#6366f1';

                  return (
                    <td key={di}>
                      {sub ? (
                        <div
                          className="timetable-cell filled"
                          style={{
                            background: lightenHex(color, 0.15),
                            borderColor: lightenHex(color, 0.4),
                            border: `1.5px solid ${lightenHex(color, 0.4)}`,
                          }}
                        >
                          <div className="cell-subject" style={{ color: darkenHex(color, 0.75) }}>{sub.name}</div>
                          {cls && (
                            <div className="cell-teacher" style={{ color: darkenHex(color, 0.65) }}>
                              {cls.name}{cls.section ? ` – ${cls.section}` : ''}
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

/* ─── Main Page ─── */
export default function TimetableView() {
  const { classes, subjects, teachers, settings, timetables, setTimetables, clearTimetables } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting,  setIsExporting]  = useState(false);
  const [viewMode, setViewMode]         = useState('class');   // 'class' | 'teacher'
  const [activeId, setActiveId]         = useState(null);

  const classTimetables   = timetables.classTimetables   || {};
  const teacherTimetables = timetables.teacherTimetables || {};

  const hasData = Object.keys(classTimetables).length > 0;

  // Set default active item when data appears
  const defaultClassId   = classes[0]?.id;
  const defaultTeacherId = teachers[0]?.id;
  const effectiveActiveId = activeId
    || (viewMode === 'class' ? defaultClassId : defaultTeacherId);

  /* ── Generate ── */
  const handleGenerate = () => {
    if (classes.length === 0) { showToast('Add classes before generating', 'error'); return; }
    if (subjects.length === 0) { showToast('Add subjects before generating', 'error'); return; }
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateTimetable(classes, subjects, teachers, settings);
      setTimetables(result);
      setActiveId(classes[0]?.id || null);
      setIsGenerating(false);
      showToast('Timetables generated successfully!', 'success');
    }, 900);
  };

  /* ── Export single ── */
  const handleExportPDF = async () => {
    if (!effectiveActiveId) return;
    setIsExporting(true);
    try {
      let elementId, title, fileName;
      if (viewMode === 'class') {
        const cls = classes.find((c) => c.id === effectiveActiveId);
        elementId = `grid-class-${effectiveActiveId}`;
        title = `Class ${cls?.name}${cls?.section ? ` – ${cls.section}` : ''} Timetable`;
        fileName = `${cls?.name || 'class'}_timetable.pdf`;
      } else {
        const teacher = teachers.find((t) => t.id === effectiveActiveId);
        elementId = `grid-teacher-${effectiveActiveId}`;
        title = `${teacher?.name || 'Teacher'} Timetable`;
        fileName = `${(teacher?.name || 'teacher').replace(/\s+/g, '_')}_timetable.pdf`;
      }
      await exportToPDF(elementId, {
        fileName,
        institutionName: settings.institutionName,
        title,
        academicYear: settings.academicYear,
        semester: settings.semester,
      });
      showToast('PDF exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('PDF export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Export all classes ── */
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const classIds = classes.map((c) => ({ classId: c.id, className: `${c.name}${c.section ? ` – ${c.section}` : ''}` }));
      await exportAllTimetablesPDF(classIds, (id) => `grid-class-${id}`, {
        institutionName: settings.institutionName,
        academicYear: settings.academicYear,
        semester: settings.semester,
      });
      showToast('All timetables exported!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Print ── */
  const handlePrint = () => window.print();

  const activeClass   = classes.find((c) => c.id === effectiveActiveId);
  const activeTeacher = teachers.find((t) => t.id === effectiveActiveId);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Timetables</h1>
          <p className="page-subtitle">Generate and export conflict-free schedules</p>
        </div>
        <div className="page-header-actions">
          {hasData && (
            <>
              <button className="btn btn-secondary" onClick={handlePrint} title="Print current view">
                <Printer size={16} /> Print
              </button>
              <button
                className="btn btn-outline"
                onClick={handleExportPDF}
                disabled={isExporting || !effectiveActiveId}
                title="Export current timetable as PDF"
              >
                {isExporting ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Exporting…</> : <><Download size={16} /> Export PDF</>}
              </button>
              {viewMode === 'class' && (
                <button
                  className="btn btn-secondary"
                  onClick={handleExportAll}
                  disabled={isExporting}
                  title="Export all class timetables"
                >
                  <FileDown size={16} /> Export All
                </button>
              )}
            </>
          )}
          {hasData && (
            <button className="btn btn-secondary" onClick={() => { clearTimetables(); setActiveId(null); }} title="Regenerate">
              <RefreshCw size={16} /> Regenerate
            </button>
          )}
          <button
            id="generate-btn"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || classes.length === 0}
          >
            {isGenerating
              ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Generating…</>
              : <><Play size={16} /> Generate Timetables</>}
          </button>
        </div>
      </div>

      {/* No data state */}
      {!hasData ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ width: 64, height: 64 }}>
              <BookOpen size={32} />
            </div>
            <h3>No Timetables Generated Yet</h3>
            <p>
              {classes.length === 0
                ? 'Add classes and subjects first, then click Generate.'
                : subjects.length === 0
                ? 'Add subjects to your classes, then click Generate.'
                : 'Click the "Generate Timetables" button to create conflict-free schedules.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || classes.length === 0}
              style={{ marginTop: '0.75rem' }}
            >
              {isGenerating ? 'Generating…' : <><Play size={16} /> Generate Timetables</>}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* View mode tabs */}
          <div className="tabs-bar">
            <button
              className={`tab-btn ${viewMode === 'class' ? 'active' : ''}`}
              onClick={() => { setViewMode('class'); setActiveId(null); }}
            >
              <BookOpen size={16} /> Class View
            </button>
            <button
              className={`tab-btn ${viewMode === 'teacher' ? 'active' : ''}`}
              onClick={() => { setViewMode('teacher'); setActiveId(null); }}
            >
              <Users size={16} /> Teacher View
            </button>
          </div>

          {/* Selector pills */}
          <div className="class-tabs">
            {viewMode === 'class'
              ? classes.map((c) => (
                <button
                  key={c.id}
                  className={`class-tab ${effectiveActiveId === c.id ? 'active' : ''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  {c.name}{c.section ? ` – ${c.section}` : ''}
                </button>
              ))
              : teachers.map((t) => (
                <button
                  key={t.id}
                  className={`class-tab ${effectiveActiveId === t.id ? 'active' : ''}`}
                  onClick={() => setActiveId(t.id)}
                  style={{
                    '--class-tab-color': t.color,
                    borderColor: effectiveActiveId === t.id ? t.color : undefined,
                    background: effectiveActiveId === t.id ? t.color : undefined,
                  }}
                >
                  {t.name}
                </button>
              ))}
          </div>

          {/* Grid title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.125rem' }}>
                {viewMode === 'class'
                  ? `Class ${activeClass?.name || ''}${activeClass?.section ? ` – ${activeClass.section}` : ''}`
                  : `${activeTeacher?.name || ''}'s Schedule`}
              </h3>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {settings.institutionName} &nbsp;·&nbsp; {settings.academicYear}
                {settings.semester ? ` · ${settings.semester}` : ''}
              </span>
            </div>
          </div>

          {/* The timetable grid(s) */}
          {viewMode === 'class' ? (
            /* Render ALL class grids but only display the active one (for PDF export of all) */
            classes.map((cls) => (
              <div
                key={cls.id}
                style={{ display: cls.id === effectiveActiveId ? 'block' : 'none' }}
              >
                <TimetableGrid
                  timetable={classTimetables[cls.id]}
                  subjects={subjects}
                  teachers={teachers}
                  settings={settings}
                  gridId={`grid-class-${cls.id}`}
                />
              </div>
            ))
          ) : (
            teachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{ display: teacher.id === effectiveActiveId ? 'block' : 'none' }}
              >
                <TeacherTimetableGrid
                  teacherTimetable={teacherTimetables[teacher.id]}
                  subjects={subjects}
                  classes={classes}
                  settings={settings}
                  gridId={`grid-teacher-${teacher.id}`}
                />
              </div>
            ))
          )}

          {/* Subject Legend */}
          {viewMode === 'class' && effectiveActiveId && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  SUBJECT LEGEND
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                  {subjects.filter((s) => s.classId === effectiveActiveId).map((s) => {
                    const teacher = teachers.find((t) => t.id === s.teacherId);
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          background: lightenHex(s.color || '#6366f1', 0.15),
                          border: `1.5px solid ${lightenHex(s.color || '#6366f1', 0.4)}`,
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: s.color || '#6366f1',
                        }} />
                        <span style={{ fontWeight: 700, color: darkenHex(s.color || '#6366f1', 0.8) }}>{s.name}</span>
                        {teacher && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>· {teacher.name}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
