import React, { useState } from 'react';
import useStore, { SUBJECT_COLORS } from '../store/useStore';
import {
  Plus, Trash2, Pencil, BookOpen, Hash, ChevronRight,
  Grid3x3, List, Copy, Layers, CheckSquare, Square,
  Users, Home, Zap, AlertCircle, Check, ChevronsRight
} from 'lucide-react';
import Modal from '../components/Modal';
import ColorPicker from '../components/ColorPicker';
import { showToast } from '../components/Toast';

/* ─── Constants ─── */
const STREAMS = ['General', 'Science', 'Commerce', 'Arts', 'Humanities', 'Vocational', 'Engineering', 'Medical'];
const EMPTY_CLASS = { name: '', section: '', grade: '', roomNo: '', strength: '', stream: '', classTeacherId: '' };
const EMPTY_SUBJ  = { name: '', code: '', teacherId: '', requiredPeriods: 5, color: SUBJECT_COLORS[0], isElective: false };

/* ─── Overview Card per class ─── */
function ClassCard({ cls, subjectCount, isSelected, onClick, onEdit, onDelete, onSelectSubjects }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-white)',
        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.125rem',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        boxShadow: isSelected ? '0 0 0 3px rgba(79,70,229,0.12)' : 'var(--shadow-sm)',
        position: 'relative',
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--color-primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={12} color="white" />
        </div>
      )}

      {/* Class Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-md)',
        background: isSelected ? 'var(--color-primary)' : 'var(--color-primary-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1rem', color: isSelected ? 'white' : 'var(--color-primary)',
        marginBottom: '0.75rem',
      }}>
        {cls.name.slice(0, 3)}
      </div>

      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        {cls.name}
        {cls.section && (
          <span style={{
            marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 700,
            background: 'var(--color-primary-soft)', color: 'var(--color-primary)',
            padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)',
          }}>
            {cls.section}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.875rem' }}>
        {cls.stream && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{cls.stream}</span>}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {cls.roomNo && <span>🚪 Room {cls.roomNo}</span>}
          {cls.strength && <span>👥 {cls.strength} students</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.8125rem', fontWeight: 700,
          color: subjectCount > 0 ? 'var(--color-success)' : 'var(--text-muted)',
        }}>
          {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit class">
            <Pencil size={13} />
          </button>
          <button className="btn btn-danger btn-icon btn-sm" onClick={onDelete} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <button
        className="btn btn-outline btn-sm"
        style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
        onClick={(e) => { e.stopPropagation(); onSelectSubjects(); }}
      >
        <BookOpen size={13} /> Assign Subjects
      </button>
    </div>
  );
}

/* ─── Subject Toggle Card ─── */
function SubjectToggleCard({ subject, isAssigned, assignedData, onToggle, onUpdate, teachers }) {
  const teacher = teachers.find((t) => t.id === assignedData?.teacherId);

  return (
    <div style={{
      border: `2px solid ${isAssigned ? subject.color || 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-lg)',
      background: isAssigned ? `${subject.color}12` : 'var(--color-white)',
      overflow: 'hidden',
      transition: 'all var(--transition-fast)',
    }}>
      {/* Header */}
      <div
        style={{
          padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={onToggle}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isAssigned ? (subject.color || 'var(--color-primary)') : 'var(--color-surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all var(--transition-fast)',
        }}>
          {isAssigned
            ? <CheckSquare size={15} color="white" />
            : <Square size={15} color="var(--text-muted)" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isAssigned ? (subject.color || 'var(--color-primary)') : 'var(--text-primary)' }}>
            {subject.name}
          </div>
          {subject.code && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subject.code}</div>}
        </div>
        {subject.isElective && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem',
            background: 'var(--color-warning-bg)', color: 'var(--color-warning)',
            borderRadius: 'var(--radius-full)', border: '1px solid #fcd34d',
          }}>ELECTIVE</span>
        )}
      </div>

      {/* Expanded config when assigned */}
      {isAssigned && (
        <div style={{
          padding: '0.75rem 1rem', borderTop: `1px solid ${subject.color}30`,
          background: `${subject.color}08`, display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap',
        }}>
          <div className="form-group" style={{ flex: 2, minWidth: 140, marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Teacher</label>
            <select
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              value={assignedData?.teacherId || ''}
              onChange={(e) => onUpdate({ teacherId: e.target.value })}
            >
              <option value="">Select Teacher…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ width: 90, marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Periods/Wk</label>
            <input
              className="form-control"
              type="number" min="1" max="30"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              value={assignedData?.requiredPeriods || 5}
              onChange={(e) => onUpdate({ requiredPeriods: parseInt(e.target.value) || 1 })}
            />
          </div>
          {!assignedData?.teacherId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)', fontSize: '0.75rem', fontWeight: 600 }}>
              <AlertCircle size={13} /> Assign a teacher
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ClassesPage() {
  const {
    classes, addClass, addClassWithSections, updateClass, removeClass,
    subjects, addSubject, updateSubject, removeSubject, copySubjectsToClass,
    teachers, subjectTemplates,
  } = useStore();

  const [activeTab, setActiveTab] = useState('overview');   // 'overview' | 'subjects'
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');         // 'grid' | 'list'

  // Class modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [editClassId, setEditClassId]       = useState(null);
  const [classForm, setClassForm]           = useState(EMPTY_CLASS);
  const [batchSections, setBatchSections]   = useState('');
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(null);

  // Subject modal (for adding brand-new catalogue subject)
  const [showSubjectCatalogueModal, setShowSubjectCatalogueModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJ);

  // Copy modal
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetId, setCopyTargetId]   = useState('');

  // ── Class CRUD ──────────────────────────────────────────
  const openAddClass = () => {
    setEditClassId(null);
    setClassForm(EMPTY_CLASS);
    setBatchSections('');
    setShowClassModal(true);
  };

  const openEditClass = (cls) => {
    setEditClassId(cls.id);
    setClassForm({
      name: cls.name, section: cls.section || '', grade: cls.grade || '',
      roomNo: cls.roomNo || '', strength: cls.strength || '',
      stream: cls.stream || '', classTeacherId: cls.classTeacherId || '',
    });
    setBatchSections('');
    setShowClassModal(true);
  };

  const handleClassSubmit = (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    if (editClassId) {
      updateClass(editClassId, classForm);
      showToast('Class updated', 'success');
      setShowClassModal(false);
      return;
    }

    // Batch sections mode
    const sections = batchSections
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (sections.length > 1) {
      addClassWithSections(classForm, sections);
      showToast(`${sections.length} sections added`, 'success');
    } else if (sections.length === 1) {
      addClass({ ...classForm, section: sections[0] });
      showToast('Class added', 'success');
    } else {
      addClass(classForm);
      showToast('Class added', 'success');
    }
    setShowClassModal(false);
  };

  const handleDeleteClass = (id) => {
    removeClass(id);
    if (selectedClassId === id) setSelectedClassId(null);
    setConfirmDeleteClass(null);
    showToast('Class removed', 'info');
  };

  // ── Subject Toggle (assign/unassign from selected class) ──
  // "catalogue" = master list of subject definitions per class
  // Each class has its own subjects in the store already
  // The toggle UX: show all subjects for this class as toggles
  // plus an "Add new subject" card

  const classSubjects = subjects.filter((s) => s.classId === selectedClassId);

  const handleAddNewSubject = (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;
    addSubject({ ...subjectForm, classId: selectedClassId });
    showToast('Subject added', 'success');
    setSubjectForm({ ...EMPTY_SUBJ, color: SUBJECT_COLORS[classSubjects.length % SUBJECT_COLORS.length] });
    setShowSubjectCatalogueModal(false);
  };

  const handleCopySubjects = () => {
    if (!copyTargetId || !selectedClassId) return;
    copySubjectsToClass(selectedClassId, copyTargetId);
    showToast('Subjects copied!', 'success');
    setShowCopyModal(false);
    setCopyTargetId('');
  };

  const sf = (key) => ({
    value: subjectForm[key],
    onChange: (e) => setSubjectForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const cf = (key) => ({
    value: classForm[key],
    onChange: (e) => setClassForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const activeClass = classes.find((c) => c.id === selectedClassId);
  const totalPeriods = classSubjects.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);
  const missingTeachers = classSubjects.filter((s) => !s.teacherId).length;

  // Grouped by stream for overview
  const streams = [...new Set(classes.map((c) => c.stream || 'General'))];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Classes &amp; Subjects</h1>
          <p className="page-subtitle">
            {classes.length} classes · {subjects.length} subjects across all classes
          </p>
        </div>
        <div className="page-header-actions">
          {activeTab === 'overview' && (
            <>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                title={viewMode === 'grid' ? 'List view' : 'Grid view'}
              >
                {viewMode === 'grid' ? <List size={18} /> : <Grid3x3 size={18} />}
              </button>
              <button id="add-class-btn" className="btn btn-primary" onClick={openAddClass}>
                <Plus size={16} /> Add Class
              </button>
            </>
          )}
          {activeTab === 'subjects' && selectedClassId && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowCopyModal(true)} title="Copy subjects to another class">
                <Copy size={16} /> Copy to Class
              </button>
              <button className="btn btn-primary" onClick={() => { setSubjectForm({ ...EMPTY_SUBJ, color: SUBJECT_COLORS[classSubjects.length % SUBJECT_COLORS.length] }); setShowSubjectCatalogueModal(true); }}>
                <Plus size={16} /> Add Subject
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Grid3x3 size={16} /> All Classes
        </button>
        <button
          className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <BookOpen size={16} /> Subject Assignment
          {selectedClassId && (
            <span className="badge badge-primary" style={{ marginLeft: 6, padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
              {activeClass?.name}{activeClass?.section ? ` – ${activeClass.section}` : ''}
            </span>
          )}
        </button>
      </div>

      {/* ══════════ TAB: OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <div>
          {classes.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Layers size={28} /></div>
                <h3>No classes yet</h3>
                <p>Add your first class. You can batch-create multiple sections at once (e.g. 10A, 10B, 10C).</p>
                <button className="btn btn-primary" onClick={openAddClass} style={{ marginTop: '0.5rem' }}>
                  <Plus size={16} /> Add First Class
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid view grouped by stream */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {streams.map((stream) => {
                const streamClasses = classes.filter((c) => (c.stream || 'General') === stream);
                if (streamClasses.length === 0) return null;
                return (
                  <div key={stream}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{stream}</span>
                      <span className="badge badge-neutral">{streamClasses.length}</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem',
                    }}>
                      {streamClasses.map((cls) => (
                        <ClassCard
                          key={cls.id}
                          cls={cls}
                          subjectCount={subjects.filter((s) => s.classId === cls.id).length}
                          isSelected={selectedClassId === cls.id}
                          onClick={() => setSelectedClassId(cls.id === selectedClassId ? null : cls.id)}
                          onEdit={() => openEditClass(cls)}
                          onDelete={() => setConfirmDeleteClass(cls)}
                          onSelectSubjects={() => { setSelectedClassId(cls.id); setActiveTab('subjects'); }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List view */
            <div className="card">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Stream</th>
                      <th>Room</th>
                      <th>Strength</th>
                      <th>Subjects</th>
                      <th>Periods/Wk</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => {
                      const clsSubjects = subjects.filter((s) => s.classId === cls.id);
                      const clsPeriods  = clsSubjects.reduce((sum, s) => sum + (s.requiredPeriods || 0), 0);
                      return (
                        <tr key={cls.id} className="clickable" onClick={() => { setSelectedClassId(cls.id); setActiveTab('subjects'); }}>
                          <td><span style={{ fontWeight: 700 }}>{cls.name}</span></td>
                          <td>{cls.section ? <span className="badge badge-primary">{cls.section}</span> : '—'}</td>
                          <td><span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{cls.stream || '—'}</span></td>
                          <td>{cls.roomNo || '—'}</td>
                          <td>{cls.strength || '—'}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: clsSubjects.length > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
                              {clsSubjects.length}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{clsPeriods}</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditClass(cls)} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => { setSelectedClassId(cls.id); setActiveTab('subjects'); }}
                                title="Assign subjects"
                              >
                                <BookOpen size={13} />
                              </button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirmDeleteClass(cls)} title="Delete">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ TAB: SUBJECT ASSIGNMENT ══════════ */}
      {activeTab === 'subjects' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left: class selector ── */}
          <div className="card" style={{ position: 'sticky', top: '1rem' }}>
            <div className="card-header" style={{ padding: '1rem' }}>
              <span className="card-title" style={{ fontSize: '0.875rem' }}>Select Class</span>
            </div>
            <div style={{ padding: '0.5rem', maxHeight: 500, overflowY: 'auto' }}>
              {classes.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No classes yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {/* Group by stream */}
                  {streams.map((stream) => {
                    const sc = classes.filter((c) => (c.stream || 'General') === stream);
                    if (sc.length === 0) return null;
                    return (
                      <div key={stream}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 0.75rem 0.25rem' }}>
                          {stream}
                        </div>
                        {sc.map((cls) => {
                          const cnt = subjects.filter((s) => s.classId === cls.id).length;
                          const isActive = selectedClassId === cls.id;
                          return (
                            <div
                              key={cls.id}
                              onClick={() => setSelectedClassId(cls.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                background: isActive ? 'var(--color-primary-bg)' : 'transparent',
                                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontWeight: isActive ? 700 : 500, fontSize: '0.875rem',
                                transition: 'all var(--transition-fast)',
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                                background: isActive ? 'var(--color-primary)' : 'var(--color-surface-2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.7rem', flexShrink: 0,
                                color: isActive ? 'white' : 'var(--text-secondary)',
                              }}>
                                {cls.name.slice(0, 3)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div>{cls.name}{cls.section ? ` – ${cls.section}` : ''}</div>
                              </div>
                              <span style={{
                                fontSize: '0.7rem', fontWeight: 700,
                                color: cnt > 0 ? 'var(--color-success)' : 'var(--text-muted)',
                              }}>{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: subject assignment ── */}
          {!selectedClassId ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><ChevronsRight size={28} /></div>
                <h3>Select a class</h3>
                <p>Choose a class from the left panel to assign or manage its subjects.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary bar */}
              <div className="card card-body" style={{ padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>
                      {activeClass?.name}{activeClass?.section ? ` – ${activeClass.section}` : ''}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {classSubjects.length} subjects · {totalPeriods} periods/week
                      {activeClass?.roomNo ? ` · Room ${activeClass.roomNo}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {missingTeachers > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <AlertCircle size={14} /> {missingTeachers} without teacher
                      </div>
                    )}
                    <span className="badge badge-success">{classSubjects.length} assigned</span>
                  </div>
                </div>
              </div>

              {/* Subjects grid */}
              {classSubjects.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon"><BookOpen size={28} /></div>
                    <h3>No subjects yet</h3>
                    <p>Add subjects to this class by clicking the button above.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                  {classSubjects.map((s) => (
                    <div key={s.id} style={{
                      border: `2px solid ${s.color || 'var(--color-border)'}30`,
                      borderLeft: `4px solid ${s.color || 'var(--color-primary)'}`,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-white)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      {/* Subject header */}
                      <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                          background: `${s.color || '#6366f1'}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, color: s.color || '#6366f1',
                          flexShrink: 0,
                        }}>
                          {s.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                            {s.name}
                          </div>
                          {s.code && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.code}</div>}
                        </div>
                        {s.isElective && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', border: '1px solid #fcd34d' }}>
                            ELECTIVE
                          </span>
                        )}
                      </div>

                      {/* Config row */}
                      <div style={{ padding: '0.625rem 1rem', background: 'var(--color-surface-2)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)' }}>
                        <div className="form-group" style={{ flex: 2, minWidth: 130, marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Teacher</label>
                          <select
                            className="form-control"
                            style={{ fontSize: '0.8rem', padding: '0.375rem 0.625rem' }}
                            value={s.teacherId || ''}
                            onChange={(e) => updateSubject(s.id, { teacherId: e.target.value })}
                          >
                            <option value="">No teacher assigned</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ width: 80, marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Periods/Wk</label>
                          <input
                            className="form-control"
                            type="number" min="1" max="30"
                            style={{ fontSize: '0.8rem', padding: '0.375rem 0.625rem' }}
                            value={s.requiredPeriods}
                            onChange={(e) => updateSubject(s.id, { requiredPeriods: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.125rem' }}>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            onClick={() => removeSubject(s.id)}
                            title="Remove subject"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add subject quick button */}
              <button
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.875rem', border: '2px dashed var(--color-border)' }}
                onClick={() => {
                  setSubjectForm({ ...EMPTY_SUBJ, color: SUBJECT_COLORS[classSubjects.length % SUBJECT_COLORS.length] });
                  setShowSubjectCatalogueModal(true);
                }}
              >
                <Plus size={16} /> Add Another Subject to {activeClass?.name}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Class Modal ── */}
      <Modal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        title={editClassId ? 'Edit Class' : 'Add Class'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowClassModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="class-form" type="submit">
              {editClassId ? 'Save Changes' : 'Add Class'}
            </button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleClassSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group">
              <label className="form-label required">Class Name</label>
              <input className="form-control" placeholder="e.g. Class 10, Grade 11, B.Sc 1st Year" {...cf('name')} required />
            </div>

            {!editClassId ? (
              <div className="form-group">
                <label className="form-label">Sections (comma-separated)</label>
                <input
                  className="form-control"
                  placeholder="e.g. A, B, C  (blank = no section)"
                  value={batchSections}
                  onChange={(e) => setBatchSections(e.target.value)}
                />
                <span className="form-hint">Creates multiple sections at once. E.g: "A, B, C" creates 3 classes.</span>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Section</label>
                <input className="form-control" placeholder="e.g. A, Science, Commerce" {...cf('section')} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Grade / Year</label>
              <input className="form-control" placeholder="e.g. Grade 10, 1st Year" {...cf('grade')} />
            </div>
            <div className="form-group">
              <label className="form-label">Stream</label>
              <select className="form-control" {...cf('stream')}>
                <option value="">Select Stream…</option>
                {STREAMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Room No.</label>
              <input className="form-control" placeholder="e.g. 101, Lab-A" {...cf('roomNo')} />
            </div>
            <div className="form-group">
              <label className="form-label">Strength</label>
              <input className="form-control" type="number" placeholder="No. of students" {...cf('strength')} min="1" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Class Teacher</label>
              <select className="form-control" value={classForm.classTeacherId} onChange={(e) => setClassForm((f) => ({ ...f, classTeacherId: e.target.value }))}>
                <option value="">Select Class Teacher…</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Add Subject Modal ── */}
      <Modal
        isOpen={showSubjectCatalogueModal}
        onClose={() => setShowSubjectCatalogueModal(false)}
        title={`Add Subject to ${activeClass?.name || ''}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSubjectCatalogueModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="subject-add-form" type="submit">
              Add Subject
            </button>
          </>
        }
      >
        <form id="subject-add-form" onSubmit={handleAddNewSubject}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group">
              <label className="form-label required">Subject Name</label>
              <input className="form-control" placeholder="e.g. Mathematics" {...sf('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Code</label>
              <input className="form-control" placeholder="e.g. MATH101" {...sf('code')} />
            </div>
            <div className="form-group">
              <label className="form-label">Teacher</label>
              <select className="form-control" {...sf('teacherId')}>
                <option value="">Select Teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Periods / Week</label>
              <input className="form-control" type="number" min="1" max="30" {...sf('requiredPeriods')} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={subjectForm.isElective}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, isElective: e.target.checked }))}
                />
                Mark as Elective Subject
              </label>
            </div>
          </div>
          <ColorPicker
            value={subjectForm.color}
            onChange={(c) => setSubjectForm((f) => ({ ...f, color: c }))}
            label="Subject Color"
          />
        </form>
      </Modal>

      {/* ── Copy Subjects Modal ── */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => { setShowCopyModal(false); setCopyTargetId(''); }}
        title={`Copy Subjects from ${activeClass?.name || ''} to…`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowCopyModal(false); setCopyTargetId(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCopySubjects} disabled={!copyTargetId}>
              <Copy size={14} /> Copy Subjects
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Target Class</label>
          <select className="form-control" value={copyTargetId} onChange={(e) => setCopyTargetId(e.target.value)}>
            <option value="">Select target class…</option>
            {classes.filter((c) => c.id !== selectedClassId).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.section ? ` – ${c.section}` : ''}{c.stream ? ` (${c.stream})` : ''}
              </option>
            ))}
          </select>
          <span className="form-hint">Existing subjects in the target class will not be duplicated.</span>
        </div>
      </Modal>

      {/* ── Confirm Delete Class ── */}
      <Modal
        isOpen={!!confirmDeleteClass}
        onClose={() => setConfirmDeleteClass(null)}
        title="Delete Class"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmDeleteClass(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDeleteClass(confirmDeleteClass?.id)}>
              <Trash2 size={14} /> Delete
            </button>
          </>
        }
      >
        <p>
          Delete <strong>{confirmDeleteClass?.name}{confirmDeleteClass?.section ? ` – ${confirmDeleteClass.section}` : ''}</strong>?
          All its subjects will also be removed. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
