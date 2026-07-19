import React, { useState, useCallback } from 'react';
import useStore, {
  SCHOOL_PRESET_PERIODS, COLLEGE_PRESET_PERIODS, HALF_DAY_PRESET,
  APP_THEMES, generateDefaultPeriods
} from '../store/useStore';
import {
  Building2, Clock, Calendar, Coffee, Save, RotateCcw,
  Download, Upload, Trash2, AlertTriangle, Eye, Plus, X,
  Palette, Layout, Grip, ChevronUp, ChevronDown, Zap, BookOpen,
  GraduationCap, Settings
} from 'lucide-react';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';
import { DAY_NAMES } from '../utils/generator';
import { v4 as uuidv4 } from 'uuid';

/* ── Period Type Config ── */
const PERIOD_TYPES = [
  { value: 'class',    label: 'Class',    color: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  { value: 'break',    label: 'Break',    color: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  { value: 'lunch',    label: 'Lunch',    color: '#fef3c7', text: '#b45309', border: '#fbbf24' },
  { value: 'assembly', label: 'Assembly', color: '#f0fdf4', text: '#059669', border: '#86efac' },
  { value: 'free',     label: 'Free',     color: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
];

function getTypeStyle(type) {
  return PERIOD_TYPES.find((t) => t.value === type) || PERIOD_TYPES[0];
}

/* ── Period Row ── */
function PeriodRow({ period, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const ts = getTypeStyle(period.type);
  const [localName, setLocalName] = useState(period.name);

  return (
    <div
      className={`period-row ${period.type === 'break' || period.type === 'lunch' ? 'break-row' : period.type === 'assembly' ? 'assembly-row' : ''}`}
      style={{ gridTemplateColumns: '32px 1fr 105px 105px 130px 70px' }}
    >
      {/* Index */}
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {index + 1}
      </div>

      {/* Name */}
      <input
        className="form-control"
        style={{ fontSize: '0.875rem', padding: '0.35rem 0.625rem', fontWeight: 700, border: 'none', background: 'transparent', boxShadow: 'none' }}
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={() => onUpdate({ name: localName })}
        placeholder="Period name…"
      />

      {/* Start Time */}
      <input
        className="form-control"
        type="time"
        style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', fontWeight: 700 }}
        value={period.startTime || ''}
        onChange={(e) => onUpdate({ startTime: e.target.value })}
      />

      {/* End Time */}
      <input
        className="form-control"
        type="time"
        style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', fontWeight: 700 }}
        value={period.endTime || ''}
        onChange={(e) => onUpdate({ endTime: e.target.value })}
      />

      {/* Type selector */}
      <select
        className="form-control"
        style={{
          fontSize: '0.775rem', padding: '0.35rem 0.5rem', fontWeight: 800,
          background: ts.color, color: ts.text, border: `1.5px solid ${ts.border}`,
          borderRadius: 'var(--radius-full)', textAlign: 'center',
        }}
        value={period.type}
        onChange={(e) => onUpdate({ type: e.target.value })}
      >
        {PERIOD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move up"
          style={{ padding: '0.25rem' }}
        >
          <ChevronUp size={13} />
        </button>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move down"
          style={{ padding: '0.25rem' }}
        >
          <ChevronDown size={13} />
        </button>
        <button
          className="btn btn-danger btn-icon btn-sm"
          onClick={onRemove}
          title="Remove period"
          style={{ padding: '0.25rem' }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Toggle Switch ── */
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={`toggle-switch ${value ? 'on' : 'off'}`}
      onClick={() => onChange(!value)}
    >
      <div className="toggle-knob" />
    </button>
  );
}

/* ═══════════════════════════════════════════
   MAIN SETTINGS PAGE
═══════════════════════════════════════════ */
export default function SettingsPage() {
  const {
    settings, updateSettings, resetSettings,
    addPeriod, updatePeriod, removePeriod, reorderPeriods, applyPeriodPreset,
    exportData, importData, clearAllData,
  } = useStore();

  const [local, setLocal] = useState({ ...settings });
  const [localPeriods, setLocalPeriods] = useState([...settings.periods]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal]   = useState(false);
  const [importText, setImportText]             = useState('');
  const [activeSection, setActiveSection]       = useState('institution');

  const set = (key, val) => setLocal((s) => ({ ...s, [key]: val }));

  /* ── Save ── */
  const handleSave = () => {
    updateSettings({ ...local, periods: localPeriods });
    showToast('Settings saved!', 'success');
  };

  /* ── Period operations ── */
  const handlePeriodUpdate = (id, patch) => {
    setLocalPeriods((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  };

  const handlePeriodRemove = (id) => {
    setLocalPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    setLocalPeriods((prev) => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };

  const handleMoveDown = (idx) => {
    setLocalPeriods((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  const handleAddPeriod = (type = 'class') => {
    const classCount = localPeriods.filter((p) => p.type === 'class').length;
    const last = localPeriods[localPeriods.length - 1];
    const newStart = last?.endTime || '09:00';
    // Auto-calc end: +45 min
    const [h, m] = newStart.split(':').map(Number);
    const endMin = h * 60 + m + 45;
    const newEnd = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;

    const defaultNames = { class: `Period ${classCount+1}`, break: 'Break', lunch: 'Lunch Break', assembly: 'Assembly', free: 'Free Period' };
    setLocalPeriods((prev) => [
      ...prev,
      { id: uuidv4(), name: defaultNames[type] || `Period ${classCount+1}`, startTime: newStart, endTime: newEnd, type },
    ]);
  };

  const handleApplyPreset = (preset) => {
    setLocalPeriods(preset.map((p) => ({ ...p, id: uuidv4() })));
    showToast('Preset applied. Remember to save!', 'info');
  };

  const handleAutoFill = () => {
    const generated = generateDefaultPeriods(8, local.startTime || '09:00', 45);
    setLocalPeriods(generated);
    showToast('Periods auto-generated from start time', 'info');
  };

  /* ── Days ── */
  const toggleDay = (dayIdx) => {
    const current = local.workingDays;
    const updated = current.includes(dayIdx)
      ? current.filter((d) => d !== dayIdx).sort()
      : [...current, dayIdx].sort();
    set('workingDays', updated);
  };

  /* ── Data ── */
  const handleExport = () => {
    const json = exportData();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'timeforge_data.json';
    a.click();
    showToast('Data exported!', 'success');
  };

  const handleImport = () => {
    if (!importText.trim()) { showToast('Paste JSON data first', 'error'); return; }
    const ok = importData(importText);
    ok ? (showToast('Imported successfully!', 'success'), setShowImportModal(false), setImportText(''))
       : showToast('Invalid JSON', 'error');
  };

  const SECTIONS = [
    { id: 'institution', label: 'Institution',   icon: Building2 },
    { id: 'schedule',    label: 'Schedule',       icon: Calendar  },
    { id: 'periods',     label: 'Periods',        icon: Clock     },
    { id: 'display',     label: 'Display & Theme',icon: Palette   },
    { id: 'data',        label: 'Data',           icon: Download  },
  ];

  const theme = APP_THEMES[local.themeIndex || 0];
  const totalSchedulable = localPeriods.filter((p) => p.type === 'class').length;
  const totalBreaks = localPeriods.filter((p) => ['break','lunch'].includes(p.type)).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p className="page-subtitle">Customize every aspect of TimeForge for your institution</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => { setLocal({...settings}); setLocalPeriods([...settings.periods]); showToast('Changes discarded','info'); }}>
            Discard
          </button>
          <button id="save-settings-btn" className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left: section nav ── */}
        <div style={{ position: 'sticky', top: '1rem' }}>
          <div className="card card-body" style={{ padding: '0.5rem' }}>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem', fontWeight: 700, textAlign: 'left',
                    background: activeSection === sec.id ? 'var(--color-primary-bg)' : 'transparent',
                    color: activeSection === sec.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)', marginBottom: 2,
                  }}
                >
                  <Icon size={16} />
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* Quick summary */}
          <div className="card card-body" style={{ marginTop: '1rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              Summary
            </div>
            {[
              { label: 'Working Days', value: local.workingDays.length },
              { label: 'Total Periods/Day', value: localPeriods.length },
              { label: 'Class Periods', value: totalSchedulable },
              { label: 'Break / Lunch', value: totalBreaks },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── INSTITUTION ── */}
          {activeSection === 'institution' && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Building2 size={18} color="var(--color-primary)" />
                  <span className="card-title">Institution Information</span>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label required">Institution Name</label>
                    <input className="form-control" value={local.institutionName} onChange={(e) => set('institutionName', e.target.value)} placeholder="e.g. Delhi Public School, Sector 21" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Institution Type</label>
                    <select className="form-control" value={local.institutionType} onChange={(e) => set('institutionType', e.target.value)}>
                      <option value="school">School</option>
                      <option value="college">College / University</option>
                      <option value="coaching">Coaching Centre</option>
                      <option value="institute">Technical Institute</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Affiliation / Board</label>
                    <input className="form-control" value={local.affiliation || ''} onChange={(e) => set('affiliation', e.target.value)} placeholder="CBSE, ICSE, State Board…" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input className="form-control" value={local.academicYear} onChange={(e) => set('academicYear', e.target.value)} placeholder="2025–2026" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester / Term</label>
                    <input className="form-control" value={local.semester} onChange={(e) => set('semester', e.target.value)} placeholder="Odd Semester, Term 1…" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Principal / Director</label>
                    <input className="form-control" value={local.principalName || ''} onChange={(e) => set('principalName', e.target.value)} placeholder="Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={local.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 11 2345 6789" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" value={local.email} onChange={(e) => set('email', e.target.value)} placeholder="info@institution.edu" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-control" value={local.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://school.edu.in" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <input className="form-control" value={local.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {activeSection === 'schedule' && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Calendar size={18} color="var(--color-primary)" />
                  <span className="card-title">Schedule Configuration</span>
                </div>
              </div>
              <div className="card-body">
                {/* Working days */}
                <div className="settings-section">
                  <div className="settings-section-title"><Calendar size={15} /> Working Days</div>
                  <div className="settings-section-desc">Select which days of the week are working days.</div>
                  <div className="day-toggles">
                    {[0,1,2,3,4,5,6].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`day-toggle ${local.workingDays.includes(d) ? 'on' : ''}`}
                        onClick={() => toggleDay(d)}
                      >
                        {DAY_NAMES[d].slice(0,3)}
                      </button>
                    ))}
                  </div>
                  <div className="form-hint" style={{ marginTop: '0.75rem' }}>
                    {local.workingDays.length} working day{local.workingDays.length !== 1 ? 's' : ''} selected —{' '}
                    {local.workingDays.map((d) => DAY_NAMES[d]).join(', ')}
                  </div>
                </div>

                {/* Class Teacher First Period Rule */}
                <div className="settings-section">
                  <div className="settings-section-title">
                    <GraduationCap size={15} color="var(--color-primary)" /> Class Teacher Allocation
                  </div>
                  <div className="settings-section-desc">
                    Determine scheduling priorities for the start of the day.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Assign first period to class teacher</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Forces the first schedulable class period of each day to be taught by the class teacher.
                      </div>
                    </div>
                    <Toggle value={!!local.assignFirstPeriodToClassTeacher} onChange={(v) => set('assignFirstPeriodToClassTeacher', v)} />
                  </div>
                </div>

                {/* Auto-generate hint */}
                <div className="settings-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                  <div className="settings-section-title"><Clock size={15} /> Period Auto-Generator</div>
                  <div className="settings-section-desc">
                    Quickly generate N uniform periods from a start time. Fine-tune in the Periods tab.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Start Time</label>
                      <input className="form-control" type="time" value={local.startTime || '09:00'} onChange={(e) => set('startTime', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Duration (min)</label>
                      <input className="form-control" type="number" min="10" max="120" value={local.periodDuration || 45} onChange={(e) => set('periodDuration', parseInt(e.target.value)||45)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Count</label>
                      <input className="form-control" type="number" min="1" max="20" value={local.periodsPerDay || 8} onChange={(e) => set('periodsPerDay', parseInt(e.target.value)||8)} />
                    </div>
                    <button className="btn btn-outline" onClick={handleAutoFill} style={{ marginBottom: 0 }}>
                      <Zap size={15} /> Generate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PERIODS ── */}
          {activeSection === 'periods' && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Clock size={18} color="var(--color-primary)" />
                  <span className="card-title">Period Schedule</span>
                  <span className="badge badge-primary">{localPeriods.length} periods</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Preset buttons */}
                  <select
                    className="form-control"
                    style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.375rem 2rem 0.375rem 0.625rem' }}
                    onChange={(e) => {
                      const map = { school: SCHOOL_PRESET_PERIODS, college: COLLEGE_PRESET_PERIODS, halfday: HALF_DAY_PRESET };
                      if (map[e.target.value]) handleApplyPreset(map[e.target.value]);
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Load Preset…</option>
                    <option value="school">School (8:00–15:15)</option>
                    <option value="college">College (8:30–15:30)</option>
                    <option value="halfday">Half Day (7:30–12:20)</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                {/* Column headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 105px 105px 130px 70px',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  marginBottom: '0.375rem',
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Name</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Start</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>End</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Type</div>
                  <div />
                </div>

                {localPeriods.map((p, idx) => (
                  <PeriodRow
                    key={p.id}
                    period={p}
                    index={idx}
                    total={localPeriods.length}
                    onUpdate={(patch) => handlePeriodUpdate(p.id, patch)}
                    onRemove={() => handlePeriodRemove(p.id)}
                    onMoveUp={() => handleMoveUp(idx)}
                    onMoveDown={() => handleMoveDown(idx)}
                  />
                ))}

                {localPeriods.length === 0 && (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon"><Clock size={24} /></div>
                    <p>No periods yet. Add one or load a preset.</p>
                  </div>
                )}

                {/* Add buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                  {['class','break','lunch','assembly','free'].map((type) => {
                    const ts = getTypeStyle(type);
                    return (
                      <button
                        key={type}
                        className="btn btn-sm"
                        style={{
                          background: ts.color, color: ts.text,
                          border: `1.5px solid ${ts.border}`, fontWeight: 800,
                        }}
                        onClick={() => handleAddPeriod(type)}
                      >
                        <Plus size={13} /> {ts.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── DISPLAY & THEME ── */}
          {activeSection === 'display' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* App theme */}
              <div className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Palette size={18} color="var(--color-primary)" />
                    <span className="card-title">App Theme Color</span>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {APP_THEMES.map((t, i) => (
                      <div
                        key={i}
                        onClick={() => set('themeIndex', i)}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-lg)',
                          border: `2px solid ${local.themeIndex === i ? t.primary : 'var(--color-border)'}`,
                          background: local.themeIndex === i ? `${t.primary}10` : 'var(--color-white)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: t.gradient, flexShrink: 0, boxShadow: `0 3px 10px ${t.primary}40` }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', color: local.themeIndex === i ? t.primary : 'var(--text-primary)' }}>{t.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.primary}</div>
                        </div>
                        {local.themeIndex === i && (
                          <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="form-hint" style={{ marginTop: '0.75rem' }}>
                    ⚠️ Theme changes apply after saving. Full live-theming coming soon.
                  </p>
                </div>
              </div>

              {/* Timetable display */}
              <div className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Layout size={18} color="var(--color-primary)" />
                    <span className="card-title">Timetable Display</span>
                  </div>
                </div>
                <div className="card-body">
                  {[
                    { key: 'showPeriodTimes',  label: 'Show Period Times',    desc: 'Display start & end time on each period row' },
                    { key: 'showPeriodNames',  label: 'Show Period Names',    desc: 'Display custom period name (e.g. "Assembly")' },
                    { key: 'showTeacherInCell',label: 'Show Teacher in Cell', desc: 'Show teacher name inside the timetable cell' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{label}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{desc}</div>
                      </div>
                      <Toggle value={!!local[key]} onChange={(v) => set(key, v)} />
                    </div>
                  ))}

                  <div style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">Timetable Color Style</label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { value: 'colored', label: '🎨 Colored', desc: 'Vivid subject colors' },
                        { value: 'pastel',  label: '🌸 Pastel',  desc: 'Soft muted tones' },
                        { value: 'mono',    label: '⬜ Minimal', desc: 'Black & white' },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => set('timetableTheme', opt.value)}
                          style={{
                            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                            border: `2px solid ${local.timetableTheme === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: local.timetableTheme === opt.value ? 'var(--color-primary-bg)' : 'var(--color-white)',
                            cursor: 'pointer', flex: 1, minWidth: 120,
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', color: local.timetableTheme === opt.value ? 'var(--color-primary)' : 'var(--text-primary)' }}>{opt.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">Table Density</label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {['compact','comfortable','spacious'].map((d) => (
                        <div
                          key={d}
                          onClick={() => set('tableLayout', d)}
                          style={{
                            flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)',
                            border: `2px solid ${local.tableLayout === d ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: local.tableLayout === d ? 'var(--color-primary-bg)' : 'var(--color-white)',
                            cursor: 'pointer', textAlign: 'center',
                            fontWeight: 800, fontSize: '0.8125rem',
                            color: local.tableLayout === d ? 'var(--color-primary)' : 'var(--text-secondary)',
                            transition: 'all var(--transition-fast)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DATA ── */}
          {activeSection === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Backup & Restore</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>Export your complete TimeForge data as a JSON backup file, or import a previously saved backup.</p>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={handleExport}>
                    <Download size={16} /> Export All Data (JSON)
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setShowImportModal(true)}>
                    <Upload size={16} /> Import Data from JSON
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Danger Zone</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setShowResetConfirm(true)}>
                    <RotateCcw size={16} /> Reset Settings to Defaults
                  </button>
                  <button className="btn btn-danger" style={{ justifyContent: 'flex-start' }} onClick={() => setShowClearConfirm(true)}>
                    <Trash2 size={16} /> Clear All Data (Teachers, Classes, Timetables)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky save bar */}
          <div style={{
            position: 'sticky', bottom: 0,
            background: 'rgba(245,247,255,0.95)', backdropFilter: 'blur(12px)',
            padding: '0.875rem 0', borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
          }}>
            <button className="btn btn-secondary" onClick={() => { setLocal({...settings}); setLocalPeriods([...settings.periods]); }}>
              Discard Changes
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset Settings"
        footer={<><button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button><button className="btn btn-danger" onClick={() => { resetSettings(); setLocal({...settings}); setLocalPeriods([...settings.periods]); setShowResetConfirm(false); showToast('Reset done','info'); }}><RotateCcw size={14}/> Reset</button></>}>
        <p>Reset all settings to defaults? Your teachers, classes, and subjects won't be affected.</p>
      </Modal>

      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data"
        footer={<><button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button><button className="btn btn-danger" onClick={() => { clearAllData(); setShowClearConfirm(false); showToast('All data cleared','info'); }}><Trash2 size={14}/> Clear Everything</button></>}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <p><strong>Irreversible.</strong> All teachers, classes, subjects, and timetables will be deleted permanently.</p>
        </div>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setImportText(''); }} title="Import Data" size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportText(''); }}>Cancel</button><button className="btn btn-primary" onClick={handleImport}><Upload size={14}/> Import</button></>}>
        <div className="form-group">
          <label className="form-label">Upload JSON File</label>
          <input type="file" accept=".json" className="form-control" style={{ paddingTop: '0.5rem' }}
            onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setImportText(ev.target.result); r.readAsText(f); } }} />
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.75rem 0' }}>— or paste JSON —</div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <textarea className="form-control" rows={7} value={importText} onChange={(e) => setImportText(e.target.value)}
            placeholder='{"teachers": [], "classes": [], ...}'
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }} />
        </div>
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-bg)', border: '1px solid #fcd34d', fontSize: '0.8125rem', color: '#92400e', fontWeight: 600 }}>
          ⚠️ Importing will overwrite all existing data.
        </div>
      </Modal>
    </div>
  );
}
