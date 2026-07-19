import React, { useState } from 'react';
import useStore, { SUBJECT_COLORS } from '../store/useStore';
import { Plus, Trash2, Pencil, Check, X, Users, Mail, Phone, Building2, Hash } from 'lucide-react';
import Modal from '../components/Modal';
import ColorPicker from '../components/ColorPicker';
import { showToast } from '../components/Toast';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const EMPTY_FORM = {
  name: '', employeeId: '', email: '', phone: '',
  department: '', specialization: '', maxPeriods: 25,
  color: SUBJECT_COLORS[0],
};

export default function TeachersPage() {
  const { teachers, addTeacher, updateTeacher, removeTeacher } = useStore();

  const [showModal, setShowModal]     = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]           = useState('');

  const isEdit = editId !== null;

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, color: SUBJECT_COLORS[teachers.length % SUBJECT_COLORS.length] });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      name: t.name, employeeId: t.employeeId || '', email: t.email || '',
      phone: t.phone || '', department: t.department || '',
      specialization: t.specialization || '', maxPeriods: t.maxPeriods,
      color: t.color || SUBJECT_COLORS[0],
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (isEdit) {
      updateTeacher(editId, form);
      showToast('Teacher updated successfully', 'success');
    } else {
      addTeacher(form);
      showToast('Teacher added successfully', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    removeTeacher(id);
    setConfirmDelete(null);
    showToast('Teacher removed', 'info');
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Teachers</h1>
          <p className="page-subtitle">Manage your teaching staff and their workload</p>
        </div>
        <div className="page-header-actions">
          <span className="badge badge-primary">{teachers.length} total</span>
          <button id="add-teacher-btn" className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Search */}
      {teachers.length > 0 && (
        <div style={{ marginBottom: '1.25rem', maxWidth: 360 }}>
          <input
            className="form-control"
            placeholder="Search by name or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <h3>{teachers.length === 0 ? 'No teachers yet' : 'No results'}</h3>
            <p>{teachers.length === 0
              ? 'Add teaching staff to get started. You can assign subjects to them on the Classes page.'
              : 'Try a different search term.'}</p>
            {teachers.length === 0 && (
              <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '0.5rem' }}>
                <Plus size={16} /> Add First Teacher
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Contact</th>
                  <th>Max Periods/Wk</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          className="avatar avatar-md"
                          style={{ background: t.color || 'var(--color-primary)', color: 'white' }}
                        >
                          {getInitials(t.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                          {t.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {t.employeeId
                        ? <span className="badge badge-neutral"><Hash size={11} /> {t.employeeId}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>}
                    </td>
                    <td>{t.department || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{t.specialization || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {t.phone && <span style={{ fontSize: '0.8125rem' }}>{t.phone}</span>}
                        {t.email && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.email}</span>}
                        {!t.phone && !t.email && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{t.maxPeriods}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}> / week</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openEdit(t)}
                          title="Edit teacher"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setConfirmDelete(t)}
                          title="Remove teacher"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEdit ? 'Edit Teacher' : 'Add New Teacher'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="teacher-form" type="submit">
              {isEdit ? 'Save Changes' : 'Add Teacher'}
            </button>
          </>
        }
      >
        <form id="teacher-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label required">Full Name</label>
              <input className="form-control" placeholder="e.g. Dr. Anita Sharma" {...field('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-control" placeholder="e.g. EMP-001" {...field('employeeId')} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" placeholder="e.g. Mathematics" {...field('department')} />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-control" placeholder="e.g. Algebra, Calculus" {...field('specialization')} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Periods / Week</label>
              <input className="form-control" type="number" min="1" max="60" {...field('maxPeriods')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="teacher@school.edu" {...field('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" placeholder="+91 9876543210" {...field('phone')} />
            </div>
          </div>
          <ColorPicker
            value={form.color}
            onChange={(c) => setForm((f) => ({ ...f, color: c }))}
            label="Teacher Color Tag"
          />
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Teacher"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete?.id)}>
              <Trash2 size={15} /> Remove
            </button>
          </>
        }
      >
        <p style={{ fontSize: '0.9375rem' }}>
          Are you sure you want to remove <strong>{confirmDelete?.name}</strong>?
          This will not delete their assigned subjects, but those subjects will have no teacher.
        </p>
      </Modal>
    </div>
  );
}
