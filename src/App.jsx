import React, { useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  Settings, GraduationCap, BarChart2, Menu, X, UserX
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/TeachersPage';
import ClassesPage from './pages/ClassesPage';
import TimetableView from './pages/TimetableView';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import SubstitutionsPage from './pages/SubstitutionsPage';
import ToastContainer from './components/Toast';
import useStore from './store/useStore';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',          icon: LayoutDashboard, group: 'OVERVIEW' },
  { id: 'reports',       label: 'Reports & Analytics', icon: BarChart2,       group: 'OVERVIEW' },
  { id: 'teachers',      label: 'Teachers',            icon: Users,           group: 'MANAGEMENT' },
  { id: 'classes',       label: 'Classes & Subjects',  icon: BookOpen,        group: 'MANAGEMENT' },
  { id: 'timetable',     label: 'Timetables',          icon: Calendar,        group: 'MANAGEMENT' },
  { id: 'substitutions', label: 'Substitutions',       icon: UserX,           group: 'MANAGEMENT' },
  { id: 'settings',      label: 'Settings',            icon: Settings,        group: 'SYSTEM' },
];

const PAGE_MAP = {
  dashboard:     Dashboard,
  reports:       ReportsPage,
  teachers:      TeachersPage,
  classes:       ClassesPage,
  timetable:     TimetableView,
  substitutions: SubstitutionsPage,
  settings:      SettingsPage,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { settings, teachers, classes, subjects } = useStore();

  const ActivePage = PAGE_MAP[activeTab] || Dashboard;
  const groups = [...new Set(NAV_ITEMS.map((n) => n.group))];

  // Notification dots
  const hasIssues = {
    reports: teachers.some((t) => subjects.filter((s) => s.teacherId === t.id).reduce((sum, s) => sum + (s.requiredPeriods || 0), 0) > t.maxPeriods) ||
             subjects.some((s) => !s.teacherId),
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon">
              <GraduationCap size={20} />
            </div>
            <span className="brand-name">TimeForge</span>
          </div>
          <span className="brand-tagline">Timetable Management</span>
        </div>

        {/* Institution Name */}
        {settings.institutionName && settings.institutionName !== 'My Institution' && (
          <div className="institution-name" title={settings.institutionName}>
            🏫 {settings.institutionName}
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group}>
              <div className="nav-section-label">{group}</div>
              {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="nav-item-icon">
                      <Icon size={18} />
                    </span>
                    {item.label}
                    {hasIssues[item.id] && (
                      <span style={{
                        marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--color-danger)', flexShrink: 0,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Quick Stats in sidebar footer */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { label: 'Teachers', value: teachers.length },
            { label: 'Classes',  value: classes.length },
            { label: 'Subjects', value: subjects.length },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{s.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          TimeForge v2.0 &copy; {new Date().getFullYear()}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrapper">
        <div className="page-content animate-fade-in" key={activeTab}>
          <ActivePage onNavigate={setActiveTab} />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
