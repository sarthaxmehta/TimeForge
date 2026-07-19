import React, { useState } from 'react';
import useStore from '../store/useStore';
import {
  Building2, Clock, Calendar, Coffee, Save, RotateCcw,
  Download, Upload, Trash2, AlertTriangle, Eye, Settings,
  Plus, X
} from 'lucide-react';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';
import { DAY_NAMES } from '../utils/generator';

const INSTITUTION_TYPES = [
  { value: 'school',   label: 'School' },
  { value: 'college',  label: 'College / University' },
  { value: 'coaching', label: 'Coaching Centre' },
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, exportData, importData, clearAllData } = useStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importText, setImportText]             = useState('');
  const [showImportModal, setShowImportModal]   = useState(false);

  /* ── Local form state mirrors settings ── */
  const [local, setLocal] = useState({ ...settings });
  const set = (key, val) => setLocal((s) => ({ ...s, [key]: val }));

  const handleSave = () => {
    updateSettings(local);
    showToast('Settings saved successfully', 'success');
  };

  const handleReset = () => {
    resetSettings();
    setLocal({ ...settings });   // will re-render from store after reset
    setShowResetConfirm(false);
    showToast('Settings reset to defaults', 'info');
  };

  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirm(false);
    showToast('All data cleared', 'info');
  };

  /* ── Working days toggle ── */
  const toggleDay = (dayIdx) => {
    const current = local.workingDays;
    const updated = current.includes(dayIdx)
      ? current.filter((d) => d !== dayIdx).sort()
      : [...current, dayIdx].sort();
    set('workingDays', updated);
  };

  /* ── Break periods ── */
  const addBreak = (periodIdx) => {
    const updated = [...new Set([...(local.breakPeriods || []), periodIdx])].sort((a, b) => a - b);
    set('breakPeriods', updated);
  };

  const removeBreak = (periodIdx) => {
    set('breakPeriods', (local.breakPeriods || []).filter((p) => p !== periodIdx));
  };

  /* ── Export / Import ── */
  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'eduschedule_data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  const handleImport = () => {
    if (!importText.trim()) { showToast('Paste JSON data first', 'error'); return; }
    const ok = importData(importText);
    if (ok) {
      setImportText('');
      setShowImportModal(false);
      showToast('Data imported successfully', 'success');
    } else {
      showToast('Invalid JSON data', 'error');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p className="page-subtitle">Configure your institution's timetable preferences</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowResetConfirm(true)}>
            <RotateCcw size={16} /> Reset Defaults
          </button>
          <button id="save-settings-btn" className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Institution Info */}
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
                  <input
                    className="form-control"
                    value={local.institutionName}
                    onChange={(e) => set('institutionName', e.target.value)}
                    placeholder="e.g. Delhi Public School, Sector 21"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Institution Type</label>
                  <select className="form-control" value={local.institutionType} onChange={(e) => set('institutionType', e.target.value)}>
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input
                    className="form-control"
                    value={local.academicYear}
                    onChange={(e) => set('academicYear', e.target.value)}
                    placeholder="e.g. 2025–2026"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester / Term</label>
                  <input
                    className="form-control"
                    value={local.semester}
                    onChange={(e) => set('semester', e.target.value)}
                    placeholder="e.g. Odd Semester, Term 1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={local.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+91 11 2345 6789"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    value={local.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Full address of the institution"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    value={local.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="info@institution.edu.in"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Config */}
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
                <div className="settings-section-title">
                  <Calendar size={15} /> Working Days
                </div>
                <div className="settings-section-desc">Select which days of the week are working days.</div>
                <div className="day-toggles">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                    <button
                      key={dayIdx}
                      type="button"
                      className={`day-toggle ${local.workingDays.includes(dayIdx) ? 'on' : ''}`}
                      onClick={() => toggleDay(dayIdx)}
                    >
                      {DAY_NAMES[dayIdx].slice(0, 3)}
                    </button>
                  ))}
                </div>
                <div className="form-hint" style={{ marginTop: '0.75rem' }}>
                  {local.workingDays.length} working day{local.workingDays.length !== 1 ? 's' : ''} selected
                </div>
              </div>

              {/* Period config */}
              <div className="settings-section">
                <div className="settings-section-title">
                  <Clock size={15} /> Period Configuration
                </div>
                <div className="settings-section-desc">
                  Set how many periods per day and their timing. Break periods are defined separately below.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
                  <div className="form-group">
                    <label className="form-label required">Periods per Day</label>
                    <input
                      className="form-control"
                      type="number" min="1" max="16"
                      value={local.periodsPerDay}
                      onChange={(e) => set('periodsPerDay', parseInt(e.target.value) || 1)}
                    />
                    <span className="form-hint">Includes breaks</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Start Time</label>
                    <input
                      className="form-control"
                      type="time"
                      value={local.startTime}
                      onChange={(e) => set('startTime', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Period Duration (min)</label>
                    <input
                      className="form-control"
                      type="number" min="10" max="120"
                      value={local.periodDuration}
                      onChange={(e) => set('periodDuration', parseInt(e.target.value) || 45)}
                    />
                  </div>
                </div>
              </div>

              {/* Break Periods */}
              <div className="settings-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                <div className="settings-section-title">
                  <Coffee size={15} /> Break Periods
                </div>
                <div className="settings-section-desc">
                  Select which period slots are breaks (e.g. lunch break). These won't be scheduled with subjects.
                </div>

                {/* Period picker */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {Array.from({ length: local.periodsPerDay }, (_, i) => {
                    const isBreak = (local.breakPeriods || []).includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => isBreak ? removeBreak(i) : addBreak(i)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          border: `1.5px solid ${isBreak ? '#fbbf24' : 'var(--color-border)'}`,
                          background: isBreak ? '#fef3c7' : 'var(--color-white)',
                          color: isBreak ? '#92400e' : 'var(--text-secondary)',
                          fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {isBreak ? '☕ ' : ''}P{i + 1}
                      </button>
                    );
                  })}
                </div>

                {(local.breakPeriods || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(local.breakPeriods || []).map((p) => (
                      <div key={p} className="break-pill">
                        <Coffee size={14} color="#92400e" />
                        <span className="break-pill-label">Period {p + 1} — Break</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => removeBreak(p)}
                          style={{ color: '#92400e' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <label className="form-label">Break Label</label>
                  <input
                    className="form-control"
                    value={local.breakLabel || 'Lunch Break'}
                    onChange={(e) => set('breakLabel', e.target.value)}
                    placeholder="e.g. Lunch Break, Recess"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Eye size={18} color="var(--color-primary)" />
                <span className="card-title">Display Preferences</span>
              </div>
            </div>
            <div className="card-body">
              {[
                { key: 'showPeriodTimes',   label: 'Show Period Times', desc: 'Display start/end time on each period row' },
                { key: 'showTeacherInCell', label: 'Show Teacher in Cell', desc: 'Display teacher name inside the timetable cell' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.875rem 0', borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{label}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={local[key]}
                    onClick={() => set(key, !local[key])}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      background: local[key] ? 'var(--color-primary)' : 'var(--color-border)',
                      cursor: 'pointer', position: 'relative', flexShrink: 0,
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: local[key] ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      transition: 'left var(--transition-fast)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Save reminder */}
          <div style={{
            padding: '1rem', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-bg)', border: '1px solid var(--color-primary-soft)',
            fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600,
            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          }}>
            <Save size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Click <strong>Save Settings</strong> to apply your changes to the timetable generator.</span>
          </div>

          {/* Schedule Preview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Schedule Preview</span>
            </div>
            <div className="card-body" style={{ padding: '1rem' }}>
              {[
                { label: 'Institution',    value: local.institutionName },
                { label: 'Academic Year',  value: local.academicYear },
                { label: 'Semester',       value: local.semester || '—' },
                { label: 'Working Days',   value: local.workingDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') || '—' },
                { label: 'Start Time',     value: local.startTime },
                { label: 'Periods/Day',    value: local.periodsPerDay },
                { label: 'Period Duration', value: `${local.periodDuration} min` },
                { label: 'Break Slots',    value: (local.breakPeriods || []).map((p) => `P${p + 1}`).join(', ') || 'None' },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.8125rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 160, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Management</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Export your data for backup or import data from a previously saved file.
              </p>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={handleExport}>
                <Download size={16} /> Export All Data (JSON)
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setShowImportModal(true)}>
                <Upload size={16} /> Import Data (JSON)
              </button>
              <div className="divider" style={{ margin: '0.25rem 0' }} />
              <button
                className="btn btn-danger"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={16} /> Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Save button (sticky footer for long forms) ── */}
      <div style={{
        position: 'sticky', bottom: 0, background: 'rgba(248,250,252,0.95)',
        backdropFilter: 'blur(8px)', padding: '1rem 0',
        borderTop: '1px solid var(--color-border)', marginTop: '1.5rem',
        display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
      }}>
        <button className="btn btn-secondary" onClick={() => setLocal({ ...settings })}>
          Discard Changes
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Settings
        </button>
      </div>

      {/* ── Reset Confirm Modal ── */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset to Defaults"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleReset}>
              <RotateCcw size={14} /> Reset
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0 }} />
          <p>This will reset all settings to their default values. Your teachers, classes, and subjects will not be affected.</p>
        </div>
      </Modal>

      {/* ── Clear All Data Modal ── */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleClearAll}>
              <Trash2 size={14} /> Clear Everything
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <p><strong>This is irreversible.</strong> All teachers, classes, subjects, and generated timetables will be permanently deleted.</p>
            <p style={{ marginTop: '0.5rem' }}>Settings will be preserved. Consider exporting your data first.</p>
          </div>
        </div>
      </Modal>

      {/* ── Import Modal ── */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportText(''); }}
        title="Import Data"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportText(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleImport}>
              <Upload size={14} /> Import
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Upload JSON file</label>
            <input type="file" accept=".json" onChange={handleImportFile} className="form-control" style={{ paddingTop: '0.5rem' }} />
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>— or paste JSON below —</div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">JSON Data</label>
            <textarea
              className="form-control"
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"teachers": [], "classes": [], "subjects": [], ...}'
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>
          <div style={{
            padding: '0.75rem', borderRadius: 'var(--radius-md)',
            background: 'var(--color-warning-bg)', border: '1px solid #fcd34d',
            fontSize: '0.8125rem', color: '#92400e',
          }}>
            ⚠️ Importing will <strong>overwrite</strong> all existing teachers, classes, subjects, and timetables.
          </div>
        </div>
      </Modal>
    </div>
  );
}
