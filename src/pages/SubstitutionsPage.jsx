import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import {
  Calendar, UserX, AlertTriangle, CheckCircle, Clock, Search,
  ArrowRight, RefreshCw, Plus, X, UserCheck, ShieldAlert
} from 'lucide-react';
import { showToast } from '../components/Toast';

// Weekdays matching the generator
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SubstitutionsPage() {
  const {
    teachers,
    classes,
    subjects,
    timetables,
    absences,
    substitutions,
    addAbsence,
    removeAbsence,
    addSubstitution,
    removeSubstitution,
    clearSubstitutionsForDate
  } = useStore();

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [searchTeacher, setSearchTeacher] = useState('');

  // Calculate weekday index (0 = Mon, 6 = Sun) from selectedDate
  const dayIdx = useMemo(() => {
    if (!selectedDate) return 0;
    const day = new Date(selectedDate).getDay(); // 0 = Sun, 1 = Mon...
    return day === 0 ? 6 : day - 1;
  }, [selectedDate]);

  const weekdayName = WEEKDAYS[dayIdx];

  // List of teachers marked absent on selectedDate
  const absentTeachersToday = useMemo(() => {
    return absences
      .filter((a) => a.date === selectedDate)
      .map((a) => a.teacherId);
  }, [absences, selectedDate]);

  // Handle marking teacher absent / present
  const handleToggleAbsence = (teacherId) => {
    if (absentTeachersToday.includes(teacherId)) {
      removeAbsence(selectedDate, teacherId);
      showToast('Teacher marked as present', 'success');
    } else {
      addAbsence(selectedDate, teacherId);
      showToast('Teacher marked as absent. See slots to substitute below.', 'info');
    }
  };

  // Find all class periods affected by absent teachers on this weekday
  const affectedSlots = useMemo(() => {
    if (!timetables || !timetables.classTimetables) return [];

    const slots = [];
    const classTimetables = timetables.classTimetables;

    // Loop through each class and find if any period is taught by an absent teacher
    Object.keys(classTimetables).forEach((classId) => {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;

      const daySchedule = classTimetables[classId][dayIdx] || {};
      Object.keys(daySchedule).forEach((periodIdxStr) => {
        const periodIdx = parseInt(periodIdxStr);
        const subjectId = daySchedule[periodIdx];

        if (subjectId && !subjectId.startsWith('__')) {
          const subject = subjects.find((s) => s.id === subjectId);
          if (subject && absentTeachersToday.includes(subject.teacherId)) {
            const originalTeacher = teachers.find((t) => t.id === subject.teacherId);
            // Check if there is an existing substitution for this slot
            const subRecord = substitutions.find(
              (sub) => sub.date === selectedDate && sub.classId === classId && sub.periodIdx === periodIdx
            );

            slots.push({
              classId,
              className: `${cls.name}${cls.section ? `-${cls.section}` : ''}`,
              roomNo: cls.roomNo,
              periodIdx,
              subjectId,
              subjectName: subject.name,
              originalTeacherId: subject.teacherId,
              originalTeacherName: originalTeacher ? originalTeacher.name : 'Unknown',
              department: originalTeacher ? originalTeacher.department : '',
              substitution: subRecord,
            });
          }
        }
      });
    });

    // Sort by period index
    return slots.sort((a, b) => a.periodIdx - b.periodIdx);
  }, [timetables, classes, subjects, absentTeachersToday, substitutions, selectedDate, dayIdx, teachers]);

  // Find eligible substitute teachers for a specific period
  const getEligibleSubstitutes = (periodIdx, originalTeacherId, department) => {
    if (!timetables || !timetables.teacherTimetables) return [];

    return teachers
      .filter((t) => {
        // Must not be absent
        if (absentTeachersToday.includes(t.id)) return false;
        // Must not be the original teacher
        if (t.id === originalTeacherId) return false;

        // Must be free during this period on this weekday
        const teacherSchedule = timetables.teacherTimetables[t.id]?.[dayIdx] || {};
        const schedSlot = teacherSchedule[periodIdx];

        // Check if scheduled to teach something else in base timetable
        if (schedSlot) {
          if (typeof schedSlot === 'object') return false; // scheduled class
          if (typeof schedSlot === 'string' && !schedSlot.startsWith('__')) return false; // other class
        }

        // Also check if already assigned as a substitute in another class at this same period
        const isAlreadySubbing = substitutions.some(
          (sub) => sub.date === selectedDate && sub.periodIdx === periodIdx && sub.substituteTeacherId === t.id
        );
        if (isAlreadySubbing) return false;

        return true;
      })
      .map((t) => {
        // Calculate dynamic period count (regular + substitutions today)
        const regularCount = Object.values(timetables.teacherTimetables[t.id] || {})
          .reduce((sum, day) => sum + Object.values(day).filter(slot => slot && !slot.startsWith('__')).length, 0);

        const subCount = substitutions.filter(sub => sub.substituteTeacherId === t.id).length;
        const totalLoad = regularCount + subCount;

        return {
          ...t,
          isSameDept: t.department === department,
          currentLoad: totalLoad,
        };
      })
      // Prioritize same department, then lower workload
      .sort((a, b) => {
        if (a.isSameDept && !b.isSameDept) return -1;
        if (!a.isSameDept && b.isSameDept) return 1;
        return a.currentLoad - b.currentLoad;
      });
  };

  const handleAssignSubstitute = (slot, substituteTeacherId) => {
    if (!substituteTeacherId) return;
    addSubstitution({
      date: selectedDate,
      periodIdx: slot.periodIdx,
      classId: slot.classId,
      originalTeacherId: slot.originalTeacherId,
      substituteTeacherId,
      subjectId: slot.subjectId,
    });
    showToast('Substitute teacher assigned successfully', 'success');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all substitutions and absences for this date?')) {
      clearSubstitutionsForDate(selectedDate);
      showToast('All cleared for this date', 'info');
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTeacher.toLowerCase()) ||
    t.department?.toLowerCase().includes(searchTeacher.toLowerCase())
  );

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Substitution Planner</h1>
          <p className="page-subtitle">Manage teacher absences and allocate quick substitution coverage</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <Calendar size={16} className="text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', fontWeight: 700, outline: 'none', fontSize: '0.875rem' }}
            />
            <span className="badge badge-primary">{weekdayName}</span>
          </div>
          {(absentTeachersToday.length > 0 || substitutions.some(s => s.date === selectedDate)) && (
            <button className="btn btn-secondary btn-sm" onClick={handleClearAll}>
              <RefreshCw size={14} /> Clear Daily Adjustments
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Left Side: Absence Tracker ── */}
        <div className="card">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserX size={18} color="var(--color-danger)" />
                Absence Tracker
              </span>
              <span className="badge badge-danger">{absentTeachersToday.length} Absent</span>
            </div>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                placeholder="Search teachers..."
                value={searchTeacher}
                onChange={(e) => setSearchTeacher(e.target.value)}
                style={{ paddingLeft: '2rem', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
            {filteredTeachers.map((t) => {
              const isAbsent = absentTeachersToday.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => handleToggleAbsence(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', background: isAbsent ? '#fef2f2' : 'transparent',
                    border: isAbsent ? '1px solid #fee2e2' : '1px solid transparent',
                    transition: 'all var(--transition-fast)', marginBottom: '0.25rem'
                  }}
                  onMouseEnter={(e) => { if (!isAbsent) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  onMouseLeave={(e) => { if (!isAbsent) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isAbsent ? 'var(--color-danger)' : 'var(--color-success)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isAbsent ? 'var(--color-danger)' : 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.department || 'General'}</div>
                  </div>
                  <span className={`badge ${isAbsent ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                    {isAbsent ? 'Absent' : 'Present'}
                  </span>
                </div>
              );
            })}
            {filteredTeachers.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.8125rem' }}>No teachers found</p>
            )}
          </div>
        </div>

        {/* ── Right Side: Affected Slots and Substitutions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {absentTeachersToday.length === 0 ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div className="empty-state">
                <div className="empty-state-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'none' }}>
                  <CheckCircle size={32} />
                </div>
                <h3>All Systems Operational</h3>
                <p>No teachers are marked absent for this date. Select teachers on the left to plan coverage slots.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Affected Classes & Coverage Slots</span>
                <span className="badge badge-warning">{affectedSlots.length} Slots Need Cover</span>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {affectedSlots.map((slot, index) => {
                  const eligibleSubs = getEligibleSubstitutes(slot.periodIdx, slot.originalTeacherId, slot.department);
                  const subTeacher = slot.substitution ? teachers.find(t => t.id === slot.substitution.substituteTeacherId) : null;

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                        border: '1.5px solid var(--color-border)',
                        background: slot.substitution ? '#f0fdf4' : '#fffbeb',
                        borderColor: slot.substitution ? '#bbf7d0' : '#fef3c7',
                        display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: '1rem',
                        alignItems: 'center'
                      }}
                    >
                      {/* Class and slot detail */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="badge badge-primary" style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-primary-soft)' }}>
                            Slot {slot.periodIdx + 1}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Class {slot.className}</span>
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {timetables.classTimetables && Object.keys(timetables.classTimetables).length > 0 ? (
                            <span>Period {slot.periodIdx + 1}</span>
                          ) : null}
                          {slot.roomNo && <span>· Room {slot.roomNo}</span>}
                        </div>
                      </div>

                      {/* Absent details */}
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent Teacher</div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-danger)', marginTop: '0.15rem' }}>{slot.originalTeacherName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{slot.subjectName} ({slot.department})</div>
                      </div>

                      {/* Substitution selection / status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        {slot.substitution ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase' }}>Assigned Substitute</div>
                              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#166534' }}>{subTeacher ? subTeacher.name : 'Assigned'}</div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{subTeacher?.department || ''}</span>
                            </div>
                            <button
                              className="btn btn-danger btn-icon btn-sm"
                              onClick={() => removeSubstitution(slot.substitution.id)}
                              title="Remove substitution"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                              className="form-control"
                              style={{ flex: 1, fontSize: '0.8125rem', padding: '0.4rem 0.5rem' }}
                              onChange={(e) => handleAssignSubstitute(slot, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>Select Substitute...</option>
                              {eligibleSubs.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name} ({sub.department || 'General'}) {sub.isSameDept ? '⭐' : ''} [Load: {sub.currentLoad}]
                                </option>
                              ))}
                            </select>
                            {eligibleSubs.length === 0 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                <ShieldAlert size={12} /> No free teachers
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {affectedSlots.length === 0 && (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'none' }}>
                      <CheckCircle size={24} />
                    </div>
                    <h3>Coverage Complete!</h3>
                    <p>All affected class slots are fully covered with substitute teachers.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
