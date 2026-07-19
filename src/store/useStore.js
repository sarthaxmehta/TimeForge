import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

/* ─────────────────────────────────────────────────────────────
   DEFAULT PERIOD PRESETS
   Each period: { id, name, startTime, endTime, type }
   type: 'class' | 'break' | 'lunch' | 'assembly' | 'free'
───────────────────────────────────────────────────────────────*/
export function generateDefaultPeriods(count = 8, startTime = '09:00', duration = 45) {
  const periods = [];
  let [h, m] = startTime.split(':').map(Number);
  let totalMin = h * 60 + m;

  const fmt = (mins) => {
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  };

  for (let i = 0; i < count; i++) {
    const start = fmt(totalMin);
    totalMin += duration;
    const end   = fmt(totalMin);
    periods.push({
      id: uuidv4(),
      name: `Period ${i + 1}`,
      startTime: start,
      endTime: end,
      type: 'class',
    });
  }
  return periods;
}

/* Common school preset */
export const SCHOOL_PRESET_PERIODS = [
  { id: 'p0', name: 'Assembly',   startTime: '08:00', endTime: '08:20', type: 'assembly' },
  { id: 'p1', name: 'Period 1',   startTime: '08:20', endTime: '09:05', type: 'class'    },
  { id: 'p2', name: 'Period 2',   startTime: '09:05', endTime: '09:50', type: 'class'    },
  { id: 'p3', name: 'Period 3',   startTime: '09:50', endTime: '10:35', type: 'class'    },
  { id: 'p4', name: 'Short Break',startTime: '10:35', endTime: '10:50', type: 'break'    },
  { id: 'p5', name: 'Period 4',   startTime: '10:50', endTime: '11:35', type: 'class'    },
  { id: 'p6', name: 'Period 5',   startTime: '11:35', endTime: '12:20', type: 'class'    },
  { id: 'p7', name: 'Lunch Break',startTime: '12:20', endTime: '13:00', type: 'lunch'    },
  { id: 'p8', name: 'Period 6',   startTime: '13:00', endTime: '13:45', type: 'class'    },
  { id: 'p9', name: 'Period 7',   startTime: '13:45', endTime: '14:30', type: 'class'    },
  { id: 'p10',name: 'Period 8',   startTime: '14:30', endTime: '15:15', type: 'class'    },
];

export const COLLEGE_PRESET_PERIODS = [
  { id: 'c0', name: 'Lecture 1',  startTime: '08:30', endTime: '09:30', type: 'class' },
  { id: 'c1', name: 'Lecture 2',  startTime: '09:30', endTime: '10:30', type: 'class' },
  { id: 'c2', name: 'Break',      startTime: '10:30', endTime: '10:45', type: 'break' },
  { id: 'c3', name: 'Lecture 3',  startTime: '10:45', endTime: '11:45', type: 'class' },
  { id: 'c4', name: 'Lecture 4',  startTime: '11:45', endTime: '12:45', type: 'class' },
  { id: 'c5', name: 'Lunch',      startTime: '12:45', endTime: '13:30', type: 'lunch' },
  { id: 'c6', name: 'Lecture 5',  startTime: '13:30', endTime: '14:30', type: 'class' },
  { id: 'c7', name: 'Lecture 6',  startTime: '14:30', endTime: '15:30', type: 'class' },
];

export const HALF_DAY_PRESET = [
  { id: 'h0', name: 'Period 1',   startTime: '07:30', endTime: '08:15', type: 'class' },
  { id: 'h1', name: 'Period 2',   startTime: '08:15', endTime: '09:00', type: 'class' },
  { id: 'h2', name: 'Period 3',   startTime: '09:00', endTime: '09:45', type: 'class' },
  { id: 'h3', name: 'Recess',     startTime: '09:45', endTime: '10:05', type: 'break' },
  { id: 'h4', name: 'Period 4',   startTime: '10:05', endTime: '10:50', type: 'class' },
  { id: 'h5', name: 'Period 5',   startTime: '10:50', endTime: '11:35', type: 'class' },
  { id: 'h6', name: 'Period 6',   startTime: '11:35', endTime: '12:20', type: 'class' },
];

/* ─────────────────────────────────────────────────────────────
   COLORS
───────────────────────────────────────────────────────────────*/
export const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#84cc16',
  '#fb7185', '#34d399', '#60a5fa', '#fbbf24',
  '#e11d48', '#0891b2', '#7c3aed', '#d97706',
];

export const APP_THEMES = [
  { name: 'Indigo',  primary: '#4f46e5', accent: '#7c3aed', gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' },
  { name: 'Ocean',   primary: '#0284c7', accent: '#0891b2', gradient: 'linear-gradient(135deg, #0284c7 0%, #0891b2 50%, #06b6d4 100%)' },
  { name: 'Forest',  primary: '#059669', accent: '#0d9488', gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #14b8a6 100%)' },
  { name: 'Rose',    primary: '#e11d48', accent: '#db2777', gradient: 'linear-gradient(135deg, #e11d48 0%, #db2777 50%, #ec4899 100%)' },
  { name: 'Amber',   primary: '#d97706', accent: '#b45309', gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)' },
  { name: 'Slate',   primary: '#334155', accent: '#475569', gradient: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)' },
];

/* ─────────────────────────────────────────────────────────────
   DEFAULT SETTINGS
───────────────────────────────────────────────────────────────*/
const DEFAULT_SETTINGS = {
  /* Institution */
  institutionName: '',
  institutionType: 'school',
  academicYear: '2025–2026',
  semester: 'Odd Semester',
  address: '',
  phone: '',
  email: '',
  website: '',
  affiliation: '',          // e.g. CBSE, ICSE, State Board
  principalName: '',

  /* Schedule */
  workingDays: [0, 1, 2, 3, 4],  // 0=Mon … 6=Sun
  periods: SCHOOL_PRESET_PERIODS, // NEW: per-period config
  assignFirstPeriodToClassTeacher: false, // Option to assign first period to class teacher

  /* Legacy (kept for migration) */
  periodsPerDay: 11,
  periodDuration: 45,
  startTime: '08:00',
  breakPeriods: [4, 7],

  /* Display */
  showTeacherInCell: true,
  showPeriodTimes: true,
  showPeriodNames: true,
  cellStyle: 'default',     // 'default' | 'compact' | 'spacious'
  timetableTheme: 'colored', // 'colored' | 'mono' | 'pastel'

  /* App */
  themeIndex: 0,            // index into APP_THEMES
  tableLayout: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
};

/* ─────────────────────────────────────────────────────────────
   STORE
   ───────────────────────────────────────────────────────────────*/
const useStore = create(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      teachers: [],
      classes: [],
      subjects: [],
      subjectTemplates: [],
      departments: [],        // { id, name, headId }
      timetables: {},
      absences: [],           // { id, date, teacherId }
      substitutions: [],      // { id, date, periodIdx, classId, originalTeacherId, substituteTeacherId, subjectId }

      /* ── Settings ── */
      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      /* Period management */
      addPeriod: (period) =>
        set((state) => ({
          settings: {
            ...state.settings,
            periods: [
              ...state.settings.periods,
              { id: uuidv4(), name: `Period ${state.settings.periods.filter(p=>p.type==='class').length+1}`, startTime: '09:00', endTime: '09:45', type: 'class', ...period },
            ],
          },
        })),

      updatePeriod: (id, patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            periods: state.settings.periods.map((p) => p.id === id ? { ...p, ...patch } : p),
          },
        })),

      removePeriod: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            periods: state.settings.periods.filter((p) => p.id !== id),
          },
        })),

      reorderPeriods: (periods) =>
        set((state) => ({ settings: { ...state.settings, periods } })),

      applyPeriodPreset: (preset) =>
        set((state) => ({
          settings: { ...state.settings, periods: preset.map((p) => ({ ...p, id: uuidv4() })) },
        })),

      /* ── Departments ── */
      addDepartment: (dept) =>
        set((state) => ({
          departments: [...state.departments, { id: uuidv4(), headId: '', ...dept }],
        })),

      updateDepartment: (id, patch) =>
        set((state) => ({
          departments: state.departments.map((d) => d.id === id ? { ...d, ...patch } : d),
        })),

      removeDepartment: (id) =>
        set((state) => ({ departments: state.departments.filter((d) => d.id !== id) })),

      /* ── Teachers ── */
      addTeacher: (teacher) =>
        set((state) => ({
          teachers: [
            ...state.teachers,
            {
              id: uuidv4(),
              name: '',
              employeeId: '',
              email: '',
              phone: '',
              department: '',
              departmentId: '',
              specialization: '',
              qualification: '',
              joiningDate: '',
              maxPeriods: 25,
              color: SUBJECT_COLORS[state.teachers.length % SUBJECT_COLORS.length],
              unavailableSlots: [],
              notes: '',
              ...teacher,
            },
          ],
        })),

      updateTeacher: (id, patch) =>
        set((state) => ({
          teachers: state.teachers.map((t) => t.id === id ? { ...t, ...patch } : t),
        })),

      removeTeacher: (id) =>
        set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),

      /* ── Classes ── */
      addClass: (cls) =>
        set((state) => ({
          classes: [
            ...state.classes,
            {
              id: uuidv4(),
              name: '',
              section: '',
              roomNo: '',
              strength: '',
              grade: '',
              stream: '',
              classTeacherId: '',
              notes: '',
              ...cls,
            },
          ],
        })),

      addClassWithSections: (baseClass, sections) =>
        set((state) => ({
          classes: [
            ...state.classes,
            ...sections.map((sec) => ({
              id: uuidv4(),
              name: baseClass.name,
              section: sec,
              roomNo: '',
              strength: baseClass.strength || '',
              grade: baseClass.grade || '',
              stream: baseClass.stream || '',
              classTeacherId: '',
              notes: '',
            })),
          ],
        })),

      updateClass: (id, patch) =>
        set((state) => ({
          classes: state.classes.map((c) => c.id === id ? { ...c, ...patch } : c),
        })),

      removeClass: (id) =>
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          subjects: state.subjects.filter((s) => s.classId !== id),
        })),

      /* ── Subjects ── */
      addSubject: (subject) =>
        set((state) => {
          const cs = state.subjects.filter((s) => s.classId === subject.classId);
          return {
            subjects: [
              ...state.subjects,
              {
                id: uuidv4(),
                name: '',
                code: '',
                classId: '',
                teacherId: '',
                requiredPeriods: 5,
                isElective: false,
                roomOverride: '',
                color: SUBJECT_COLORS[cs.length % SUBJECT_COLORS.length],
                notes: '',
                ...subject,
              },
            ],
          };
        }),

      updateSubject: (id, patch) =>
        set((state) => ({
          subjects: state.subjects.map((s) => s.id === id ? { ...s, ...patch } : s),
        })),

      removeSubject: (id) =>
        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),

      copySubjectsToClass: (fromClassId, toClassId) =>
        set((state) => {
          const sourceSubjects  = state.subjects.filter((s) => s.classId === fromClassId);
          const existingNames   = new Set(state.subjects.filter((s) => s.classId === toClassId).map((s) => s.name));
          const newSubjects     = sourceSubjects
            .filter((s) => !existingNames.has(s.name))
            .map((s) => ({ ...s, id: uuidv4(), classId: toClassId }));
          return { subjects: [...state.subjects, ...newSubjects] };
        }),

      /* ── Subject Templates ── */
      addSubjectTemplate: (template) =>
        set((state) => ({
          subjectTemplates: [...state.subjectTemplates, { ...template, id: uuidv4() }],
        })),

      removeSubjectTemplate: (id) =>
        set((state) => ({ subjectTemplates: state.subjectTemplates.filter((t) => t.id !== id) })),

      applyTemplateToClass: (templateId, classId) =>
        set((state) => {
          const template = state.subjectTemplates.find((t) => t.id === templateId);
          if (!template) return {};
          const existing = new Set(state.subjects.filter((s) => s.classId === classId).map((s) => s.name));
          const cs       = state.subjects.filter((s) => s.classId === classId);
          const newSubs  = template.subjects
            .filter((s) => !existing.has(s.name))
            .map((s, i) => ({
              id: uuidv4(), name: s.name, code: s.code || '',
              classId, teacherId: '',
              requiredPeriods: s.defaultPeriods || 5,
              isElective: s.isElective || false,
              color: SUBJECT_COLORS[(cs.length + i) % SUBJECT_COLORS.length],
              notes: '',
            }));
          return { subjects: [...state.subjects, ...newSubs] };
        }),

      /* ── Timetables ── */
      setTimetables: (timetables) => set({ timetables }),
      clearTimetables: () => set({ timetables: {} }),

      /* ── Absences & Substitutions ── */
      addAbsence: (date, teacherId) =>
        set((state) => ({
          absences: [
            ...state.absences.filter((a) => !(a.date === date && a.teacherId === teacherId)),
            { id: uuidv4(), date, teacherId },
          ],
        })),

      removeAbsence: (date, teacherId) =>
        set((state) => ({
          absences: state.absences.filter((a) => !(a.date === date && a.teacherId === teacherId)),
          // Also clear substitutions where this teacher was the substitute or original for this date
          substitutions: state.substitutions.filter(
            (s) => !(s.date === date && (s.originalTeacherId === teacherId || s.substituteTeacherId === teacherId))
          ),
        })),

      addSubstitution: (sub) =>
        set((state) => ({
          substitutions: [
            ...state.substitutions.filter(
              (s) => !(s.date === sub.date && s.periodIdx === sub.periodIdx && s.classId === sub.classId)
            ),
            { id: uuidv4(), ...sub },
          ],
        })),

      removeSubstitution: (id) =>
        set((state) => ({ substitutions: state.substitutions.filter((s) => s.id !== id) })),

      clearSubstitutionsForDate: (date) =>
        set((state) => ({
          substitutions: state.substitutions.filter((s) => s.date !== date),
          absences: state.absences.filter((a) => a.date !== date),
        })),

      /* ── Data Management ── */
      exportData: () => {
        const s = get();
        return JSON.stringify({
          settings: s.settings,
          teachers: s.teachers,
          classes: s.classes,
          subjects: s.subjects,
          subjectTemplates: s.subjectTemplates,
          departments: s.departments,
          timetables: s.timetables,
          absences: s.absences,
          substitutions: s.substitutions,
        }, null, 2);
      },

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          set({
            settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
            teachers: data.teachers || [],
            classes: data.classes || [],
            subjects: data.subjects || [],
            subjectTemplates: data.subjectTemplates || [],
            departments: data.departments || [],
            timetables: data.timetables || {},
            absences: data.absences || [],
            substitutions: data.substitutions || [],
          });
          return true;
        } catch { return false; }
      },

      clearAllData: () =>
        set({
          teachers: [],
          classes: [],
          subjects: [],
          subjectTemplates: [],
          departments: [],
          timetables: {},
          absences: [],
          substitutions: [],
        }),
    }),
    { name: 'timeforge-storage-v5' } // Incremented the persist key to avoid loading old state versions incompatibly
  )
);

export default useStore;
export { DEFAULT_SETTINGS };
