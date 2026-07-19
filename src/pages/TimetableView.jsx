import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import { generateTimetable, validateTimetable, DAY_NAMES, formatPeriodTime } from '../utils/generator';
import { exportToPDF, exportAllTimetablesPDF } from '../utils/pdfExport';
import { Play, Download, Printer, Users, BookOpen, FileDown, RefreshCw, Coffee, Zap, Calendar as CalendarIcon, ClipboardList, AlertTriangle, AlertCircle } from 'lucide-react';
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
function ClassTimetableGrid({ classId, timetable, subjects, teachers, settings, gridId, isDailyView, selectedDate, absences = [], substitutions = [] }) {
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
                  let val = timetable?.[di]?.[p];
                  let isSubstituted = false;
                  let isAbsentWithoutSub = false;
                  let substituteTeacher = null;

                  // ── Daily adjustments resolution ──
                  if (isDailyView && selectedDate) {
                    const baseDate = new Date(selectedDate);
                    const day = baseDate.getDay();
                    const baseDayIdx = day === 0 ? 6 : day - 1;
                    const diff = di - baseDayIdx;
                    const colDateObj = new Date(baseDate);
                    colDateObj.setDate(baseDate.getDate() + diff);
                    const colDate = colDateObj.toISOString().split('T')[0];

                    const subRecord = substitutions.find(
                      (s) => s.date === colDate && s.classId === classId && s.periodIdx === p
                    );

                    if (subRecord) {
                      val = subRecord.subjectId;
                      isSubstituted = true;
                      substituteTeacher = teachers.find((t) => t.id === subRecord.substituteTeacherId);
                    } else if (val && !val.startsWith('__')) {
                      const regularSub = subjects.find((s) => s.id === val);
                      if (regularSub && absences.some((a) => a.date === colDate && a.teacherId === regularSub.teacherId)) {
                        isAbsentWithoutSub = true;
                      }
                    }
                  }

                  const isHomeroom = val?.startsWith?.('__homeroom__');
                  const isGroup = val?.startsWith?.('__group__');

                  if (isGroup) {
                    const groupId = val.split(':')[1];
                    const groupSubs = subjects.filter(
                      (s) => s.combinedGroupId === groupId && s.classId === classId
                    );
                    return (
                      <td key={di} style={{ padding: '2px' }}>
                        <div
                          className="timetable-cell filled combined-period-cell"
                          style={{
                            padding: 0,
                            overflow: 'hidden',
                            minHeight: 68,
                            height: 68,
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 0,
                            border: '1.5px solid #c7d2fe',
                            background: 'linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%)',
                            borderRadius: 10,
                            position: 'relative',
                          }}
                        >
                          {/* combined badge */}
                          <div style={{
                            position: 'absolute',
                            top: 4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#4f46e5',
                            color: '#fff',
                            fontSize: '0.47rem',
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            padding: '1px 5px',
                            borderRadius: 99,
                            textTransform: 'uppercase',
                            zIndex: 2,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 4px rgba(79,70,229,0.25)',
                          }}>⚡ Parallel Period</div>

                          {groupSubs.map((sub, idx) => {
                            const subTeacher = teachers.find((t) => t.id === sub.teacherId);
                            const subColors = applyTheme(sub.color || '#6366f1', timetableTheme);
                            const isLast = idx === groupSubs.length - 1;
                            return (
                              <div
                                key={sub.id}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  paddingTop: '14px',
                                  paddingBottom: '4px',
                                  paddingLeft: '4px',
                                  paddingRight: '4px',
                                  background: subColors.bg,
                                  borderRight: isLast ? 'none' : `1.5px solid ${subColors.border}`,
                                  gap: '2px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{
                                  fontWeight: 900,
                                  fontSize: '0.75rem',
                                  color: subColors.text,
                                  lineHeight: 1.2,
                                  textAlign: 'center',
                                }}>
                                  {sub.name}
                                </div>
                                {subTeacher && (
                                  <div style={{
                                    fontSize: '0.62rem',
                                    color: subColors.text,
                                    opacity: 0.8,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%',
                                  }}>
                                    {subTeacher.name}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  }

                  if (isNonClass || (val?.startsWith?.('__') && !isHomeroom)) {
                    return (
                      <td key={di}><NonClassCell period={period} /></td>
                    );
                  }

                  // ── Homeroom cell ──
                  if (isHomeroom) {
                    const teacherId = val.split(':')[1];
                    const teacher = teachers.find((t) => t.id === teacherId);

                    let hrTeacherAbsent = false;
                    let hrSubstitute = null;

                    if (isDailyView && selectedDate) {
                      const baseDate = new Date(selectedDate);
                      const day = baseDate.getDay();
                      const baseDayIdx = day === 0 ? 6 : day - 1;
                      const diff = di - baseDayIdx;
                      const colDateObj = new Date(baseDate);
                      colDateObj.setDate(baseDate.getDate() + diff);
                      const colDate = colDateObj.toISOString().split('T')[0];

                      const subRecord = substitutions.find(
                        (s) => s.date === colDate && s.classId === classId && s.periodIdx === p
                      );

                      if (subRecord) {
                        hrSubstitute = teachers.find(t => t.id === subRecord.substituteTeacherId);
                      } else if (teacher && absences.some((a) => a.date === colDate && a.teacherId === teacher.id)) {
                        hrTeacherAbsent = true;
                      }
                    }

                    const hrColor = hrTeacherAbsent ? '#dc2626' : hrSubstitute ? '#059669' : '#4f46e5';
                    const colors = applyTheme(hrColor, timetableTheme);

                    return (
                      <td key={di}>
                        <div className="timetable-cell filled" style={{
                          background: colors.bg,
                          border: `1.5px solid ${colors.border}`,
                          animation: hrTeacherAbsent ? 'pulse 2s infinite' : 'none'
                        }}>
                          <div className="cell-subject" style={{ color: colors.text }}>Homeroom</div>
                          {hrSubstitute ? (
                            <div className="cell-teacher" style={{ color: colors.text, fontWeight: 700 }}>
                              Cover: {hrSubstitute.name}
                            </div>
                          ) : teacher ? (
                            <div className="cell-teacher" style={{ color: colors.text, textDecoration: hrTeacherAbsent ? 'line-through' : 'none' }}>
                              {teacher.name}
                            </div>
                          ) : null}
                          {hrTeacherAbsent && (
                            <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 800, marginTop: 2 }}>⚠️ ABSENT</div>
                          )}
                          {hrSubstitute && (
                            <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginTop: 2 }}>🔄 SUBSTITUTED</div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // ── Regular cell ──
                  const sub = val ? subjects.find((s) => s.id === val) : null;
                  const teacher = isSubstituted ? substituteTeacher : (sub ? teachers.find((t) => t.id === sub.teacherId) : null);
                  let cellBg = sub?.color || '#6366f1';
                  if (isAbsentWithoutSub) {
                    cellBg = '#dc2626';
                  } else if (isSubstituted) {
                    cellBg = '#059669';
                  }
                  const colors = applyTheme(cellBg, timetableTheme);

                  return (
                    <td key={di}>
                      {sub ? (
                        <div
                          className="timetable-cell filled"
                          style={{
                            background: colors.bg,
                            border: `1.5px solid ${colors.border}`,
                            animation: isAbsentWithoutSub ? 'pulse 2s infinite' : 'none'
                          }}
                        >
                          <div className="cell-subject" style={{ color: colors.text }}>
                            {sub.name}
                            {sub.code && <span style={{ fontWeight: 500, opacity: 0.7, fontSize: '0.65rem', marginLeft: 3 }}>({sub.code})</span>}
                          </div>
                          {sub.mergedWithSubjectId && (() => {
                            const partner = subjects.find(o => o.id === sub.mergedWithSubjectId);
                            const partnerCls = partner ? classes.find(c => c.id === partner.classId) : null;
                            if (!partnerCls) return null;
                            return (
                              <div style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 700, marginTop: '0.05rem', color: colors.text, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                <span>🔗 {partnerCls.name}{partnerCls.section ? `-${partnerCls.section}` : ''}</span>
                              </div>
                            );
                          })()}
                          {showTeacherInCell && teacher && (
                            <div className="cell-teacher" style={{ color: colors.text, textDecoration: isAbsentWithoutSub ? 'line-through' : 'none' }}>
                              {isSubstituted ? `Cover: ${teacher.name}` : teacher.name}
                            </div>
                          )}
                          {isAbsentWithoutSub && (
                            <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 800, marginTop: 2 }}>⚠️ ABSENT</div>
                          )}
                          {isSubstituted && (
                            <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginTop: 2 }}>🔄 COVER ASSIGNED</div>
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
function TeacherTimetableGrid({ teacherId, teacherTimetable, subjects, classes, teachers, settings, gridId, isDailyView, selectedDate, absences = [], substitutions = [] }) {
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
                  let subjectId = null;
                  let classId = null;
                  let isSubstituteAssignedHere = false;
                  let isAbsentCol = false;
                  let isNormalSubstitutedAway = false;

                  if (isDailyView && selectedDate) {
                    const baseDate = new Date(selectedDate);
                    const day = baseDate.getDay();
                    const baseDayIdx = day === 0 ? 6 : day - 1;
                    const diff = di - baseDayIdx;
                    const colDateObj = new Date(baseDate);
                    colDateObj.setDate(baseDate.getDate() + diff);
                    const colDate = colDateObj.toISOString().split('T')[0];

                    isAbsentCol = absences.some((a) => a.date === colDate && a.teacherId === teacherId);

                    // Check if this teacher is assigned as a substitute in ANY class at this slot
                    const subRecord = substitutions.find(
                      (s) => s.date === colDate && s.substituteTeacherId === teacherId && s.periodIdx === p
                    );

                    if (subRecord) {
                      subjectId = subRecord.subjectId;
                      classId = subRecord.classId;
                      isSubstituteAssignedHere = true;
                    } else {
                      const normalVal = teacherTimetable?.[di]?.[p];
                      if (normalVal && typeof normalVal === 'object') {
                        // Check if normal class slot was substituted away due to this teacher being absent
                        if (isAbsentCol) {
                          isNormalSubstitutedAway = true;
                        } else {
                          subjectId = normalVal.subjectId;
                          classId = normalVal.classId;
                        }
                      }
                    }
                  } else {
                    const normalVal = teacherTimetable?.[di]?.[p];
                    if (normalVal && typeof normalVal === 'object') {
                      subjectId = normalVal.subjectId;
                      classId = normalVal.classId;
                    }
                  }

                  const isHomeroom = subjectId?.startsWith?.('__homeroom__');

                  if (isNonClass) {
                    return <td key={di}><NonClassCell period={period} /></td>;
                  }

                  // ── Homeroom cell ──
                  if (isHomeroom) {
                    const cls = classId ? classes.find((c) => c.id === classId) : null;
                    const colors = applyTheme(isSubstituteAssignedHere ? '#059669' : '#4f46e5', timetableTheme);
                    return (
                      <td key={di}>
                        <div className="timetable-cell filled" style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}>
                          <div className="cell-subject" style={{ color: colors.text }}>Homeroom</div>
                          {cls && <div className="cell-teacher" style={{ color: colors.text }}>
                            Class {cls.name}{cls.section ? `-${cls.section}` : ''}
                          </div>}
                          {isSubstituteAssignedHere && (
                            <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginTop: 2 }}>🔄 COVERAGE SLOT</div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  const sub = (subjectId && !isHomeroom) ? subjects.find((s) => s.id === subjectId) : null;
                  const cls = classId ? classes.find((c) => c.id === classId) : null;

                  let cellColor = sub?.color || '#6366f1';
                  if (isSubstituteAssignedHere) {
                    cellColor = '#059669'; // Green for substitution coverage
                  }

                  const colors = applyTheme(cellColor, timetableTheme);

                  return (
                    <td key={di}>
                      {sub ? (() => {
                        let partnerClsLabel = '';
                        if (sub.combinedGroupId) {
                          const groupPartners = subjects.filter(
                            (s) => s.combinedGroupId === sub.combinedGroupId && s.teacherId === sub.teacherId && s.id !== sub.id
                          );
                          const pClasses = groupPartners.map((s) => classes.find((c) => c.id === s.classId)).filter(Boolean);
                          if (pClasses.length > 0) {
                            partnerClsLabel = ' + ' + pClasses.map((c) => `${c.name}${c.section ? `-${c.section}` : ''}`).join(' + ');
                          }
                        } else if (sub.mergedWithSubjectId) {
                          const partnerSub = subjects.find(o => o.id === sub.mergedWithSubjectId);
                          const partnerCls = partnerSub ? classes.find(c => c.id === partnerSub.classId) : null;
                          if (partnerCls) {
                            partnerClsLabel = ` + ${partnerCls.name}${partnerCls.section ? `-${partnerCls.section}` : ''}`;
                          }
                        }
                        return (
                          <div className="timetable-cell filled" style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}>
                            <div className="cell-subject" style={{ color: colors.text }}>{sub.name}</div>
                            {cls && (
                              <div className="cell-teacher" style={{ color: colors.text }}>
                                {cls.name}{cls.section ? `-${cls.section}` : ''}{partnerClsLabel}
                              </div>
                            )}
                            {isSubstituteAssignedHere && (
                              <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginTop: 2 }}>🔄 COVERAGE ASSIGNED</div>
                            )}
                          </div>
                        );
                      })() : isNormalSubstitutedAway ? (
                        <div className="timetable-cell empty" style={{ background: '#fef2f2', border: '1px dashed #fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                          ABSENT (COVERED)
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
  const { classes, subjects, teachers, settings, timetables, absences, substitutions, setTimetables, clearTimetables, combinedGroups = [] } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting,  setIsExporting]  = useState(false);
  const [viewMode,     setViewMode]     = useState('class');
  const [activeId,     setActiveId]     = useState(null);

  // Daily Schedule state
  const [timetableMode, setTimetableMode] = useState('base'); // 'base' | 'daily'
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const classTimetables   = timetables.classTimetables   || {};
  const teacherTimetables = timetables.teacherTimetables || {};
  const hasData = Object.keys(classTimetables).length > 0;

  const conflicts = useMemo(() => {
    if (!hasData) return [];
    return validateTimetable(classTimetables, teacherTimetables, classes, subjects, teachers, settings);
  }, [classTimetables, teacherTimetables, classes, subjects, teachers, settings, hasData]);

  const defaultId = viewMode === 'class' ? classes[0]?.id : teachers[0]?.id;
  const effectiveId = activeId || defaultId;

  const activeClass   = classes.find((c) => c.id === effectiveId);
  const activeTeacher = teachers.find((t) => t.id === effectiveId);

  const weekdayName = DAY_NAMES[(() => {
    const day = new Date(selectedDate).getDay();
    return day === 0 ? 6 : day - 1;
  })()];

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
        ...settings,
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
        { ...settings }
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
          {/* ── Conflict / Success Audit Panel ── */}
          {conflicts.length > 0 ? (
            <div className="card shadow-sm animate-fade-in" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--color-warning)', background: '#fffbeb' }}>
              <div className="card-body" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e' }}>
                    Scheduling Audit: {conflicts.length} Period Shortfall{conflicts.length > 1 ? 's' : ''} Detected
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#78350f', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  The timetable was successfully generated without double-bookings. However, some subjects could not be fully scheduled because of resource constraints (e.g., teachers at their workload caps or class slots fully occupied).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
                  {conflicts.map((c, i) => {
                    const sub = subjects.find(s => s.id === c.subjectId);
                    const teacher = sub ? teachers.find(t => t.id === sub.teacherId) : null;
                    
                    let assignedPeriods = 0;
                    if (teacher) {
                      const teacherSubjects = subjects.filter(s => s.teacherId === teacher.id);
                      const nonGroup = teacherSubjects.filter(s => !s.combinedGroupId).reduce((sum, s) => sum + (Number(s.requiredPeriods) || 0), 0);
                      const uniqueGids = [...new Set(teacherSubjects.filter(s => s.combinedGroupId).map(s => s.combinedGroupId))];
                      const groupSum = uniqueGids.reduce((sum, gid) => {
                        const group = combinedGroups.find(g => g.id === gid);
                        return sum + (group ? Number(group.requiredPeriods) : 0);
                      }, 0);
                      assignedPeriods = nonGroup + groupSum;
                    }

                    let scheduledPeriods = 0;
                    if (teacher && teacherTimetables[teacher.id]) {
                      Object.values(teacherTimetables[teacher.id]).forEach((day) => {
                        Object.values(day).forEach((slot) => {
                          if (slot && typeof slot === 'object' && slot.subjectId) {
                            scheduledPeriods++;
                          }
                        });
                      });
                    }

                    let tip = '';
                    if (teacher && assignedPeriods > (teacher.maxPeriods || 0)) {
                      tip = `Teacher ${teacher.name} is overloaded (${assignedPeriods} periods assigned, limit is ${teacher.maxPeriods}). Increase their max periods in Teachers page.`;
                    } else if (teacher && scheduledPeriods >= (teacher.maxPeriods || 0)) {
                      tip = `Teacher ${teacher.name} has hit their max periods limit (${teacher.maxPeriods}) in this schedule.`;
                    } else {
                      tip = `The teacher is busy at other classes or class slots are fully filled. Adjust required periods or period slots.`;
                    }

                    return (
                      <div key={i} style={{ padding: '0.75rem 1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '0.375rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#1e293b' }}>
                              Class {c.className}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {c.subjectName} {teacher ? `· ${teacher.name}` : ''}
                            </span>
                          </div>
                          <span className="badge badge-warning" style={{ fontWeight: 800, fontSize: '0.68rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
                            Shortfall: -{c.missing} ({c.scheduled}/{c.required})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#fef3c7', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                          <AlertCircle size={12} style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{tip}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm animate-fade-in" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--color-success)', background: '#ecfdf5' }}>
              <div className="card-body" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#d1fae5', flexShrink: 0 }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 900, fontSize: '0.95rem' }}>✓</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#065f46' }}>100% Conflict-Free & Fully Scheduled!</div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '1px' }}>All classes, subjects, and teachers have been successfully placed without any period shortfalls.</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Mode selector bar ── */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '1.25rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn btn-sm ${timetableMode === 'base' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTimetableMode('base')}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <ClipboardList size={14} /> Base Weekly Schedule
              </button>
              <button
                className={`btn btn-sm ${timetableMode === 'daily' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTimetableMode('daily')}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <CalendarIcon size={14} /> Daily View & Substitutions
              </button>
            </div>

            {timetableMode === 'daily' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '0.35rem 0.625rem', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)', fontWeight: 700,
                    fontSize: '0.8125rem', outline: 'none'
                  }}
                />
                <span className="badge badge-primary">{weekdayName}</span>
              </div>
            )}
          </div>

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
                {timetableMode === 'daily' && ` · Daily Log: ${selectedDate}`}
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
                  classId={cls.id}
                  timetable={classTimetables[cls.id]}
                  subjects={subjects}
                  teachers={teachers}
                  settings={settings}
                  gridId={`grid-class-${cls.id}`}
                  isDailyView={timetableMode === 'daily'}
                  selectedDate={selectedDate}
                  absences={absences}
                  substitutions={substitutions}
                />
              </div>
            ))
            : teachers.map((t) => (
              <div key={t.id} style={{ display: t.id === effectiveId ? 'block' : 'none' }}>
                <TeacherTimetableGrid
                  teacherId={t.id}
                  teacherTimetable={teacherTimetables[t.id]}
                  subjects={subjects}
                  classes={classes}
                  teachers={teachers}
                  settings={settings}
                  gridId={`grid-teacher-${t.id}`}
                  isDailyView={timetableMode === 'daily'}
                  selectedDate={selectedDate}
                  absences={absences}
                  substitutions={substitutions}
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
