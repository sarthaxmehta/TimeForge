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

const INITIAL_TEACHERS = [
  {
    id: "t1",
    name: "Mr. Robert Chen",
    employeeId: "EMP001",
    email: "robert.c@timeforge.edu",
    phone: "",
    department: "Science",
    departmentId: "",
    specialization: "Physics",
    qualification: "M.Sc. Physics",
    joiningDate: "",
    maxPeriods: 25,
    color: "#3b82f6",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t2",
    name: "Ms. Emily Parker",
    employeeId: "EMP002",
    email: "emily.p@timeforge.edu",
    phone: "",
    department: "Mathematics",
    departmentId: "",
    specialization: "Calculus",
    qualification: "M.Sc. Mathematics",
    joiningDate: "",
    maxPeriods: 28,
    color: "#ec4899",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t3",
    name: "Dr. Alan Turing",
    employeeId: "EMP003",
    email: "alan.t@timeforge.edu",
    phone: "",
    department: "Computer Science",
    departmentId: "",
    specialization: "Computer Science",
    qualification: "Ph.D. CS",
    joiningDate: "",
    maxPeriods: 24,
    color: "#14b8a6",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t4",
    name: "Mrs. Anita Desai",
    employeeId: "EMP004",
    email: "anita.d@timeforge.edu",
    phone: "",
    department: "English",
    departmentId: "",
    specialization: "Literature",
    qualification: "M.A. English",
    joiningDate: "",
    maxPeriods: 26,
    color: "#8b5cf6",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t5",
    name: "Mr. Rajiv Sharma",
    employeeId: "EMP005",
    email: "rajiv.s@timeforge.edu",
    phone: "",
    department: "Commerce",
    departmentId: "",
    specialization: "Accountancy",
    qualification: "M.Com, CA",
    joiningDate: "",
    maxPeriods: 25,
    color: "#f59e0b",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t6",
    name: "Ms. Priya Singh",
    employeeId: "EMP006",
    email: "priya.s@timeforge.edu",
    phone: "",
    department: "Science",
    departmentId: "",
    specialization: "Chemistry",
    qualification: "M.Sc. Chemistry",
    joiningDate: "",
    maxPeriods: 25,
    color: "#06b6d4",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t7",
    name: "Mr. David Lee",
    employeeId: "EMP007",
    email: "david.l@timeforge.edu",
    phone: "",
    department: "Physical Education",
    departmentId: "",
    specialization: "Sports",
    qualification: "B.P.Ed",
    joiningDate: "",
    maxPeriods: 20,
    color: "#22c55e",
    unavailableSlots: [],
    notes: ""
  },
  {
    id: "t8",
    name: "Mrs. Kavita Patel",
    employeeId: "EMP008",
    email: "kavita.p@timeforge.edu",
    phone: "",
    department: "Commerce",
    departmentId: "",
    specialization: "Business Studies",
    qualification: "MBA",
    joiningDate: "",
    maxPeriods: 26,
    color: "#d946ef",
    unavailableSlots: [],
    notes: ""
  }
];

const INITIAL_CLASSES = [
  {
    id: "c1",
    name: "11",
    section: "A",
    roomNo: "101",
    strength: "40",
    grade: "11",
    stream: "Science",
    classTeacherId: "t1",
    notes: ""
  },
  {
    id: "c2",
    name: "11",
    section: "B",
    roomNo: "102",
    strength: "38",
    grade: "11",
    stream: "Science",
    classTeacherId: "t2",
    notes: ""
  },
  {
    id: "c3",
    name: "11",
    section: "C",
    roomNo: "201",
    strength: "45",
    grade: "11",
    stream: "Commerce",
    classTeacherId: "t5",
    notes: ""
  }
];

const INITIAL_SUBJECTS = [
  {
    id: "s1_c1",
    name: "Physics",
    code: "PHY",
    classId: "c1",
    teacherId: "t1",
    requiredPeriods: 6,
    isElective: false,
    roomOverride: "",
    color: "#3b82f6",
    notes: ""
  },
  {
    id: "s2_c1",
    name: "Mathematics",
    code: "MATH",
    classId: "c1",
    teacherId: "t2",
    requiredPeriods: 7,
    isElective: false,
    roomOverride: "",
    color: "#ec4899",
    notes: ""
  },
  {
    id: "s3_c1",
    name: "Computer Science",
    code: "CS",
    classId: "c1",
    teacherId: "t3",
    requiredPeriods: 5,
    isElective: true,
    roomOverride: "Lab 1",
    color: "#14b8a6",
    notes: ""
  },
  {
    id: "s4_c1",
    name: "English",
    code: "ENG",
    classId: "c1",
    teacherId: "t4",
    requiredPeriods: 5,
    isElective: false,
    roomOverride: "",
    color: "#8b5cf6",
    notes: ""
  },
  {
    id: "s5_c1",
    name: "Chemistry",
    code: "CHEM",
    classId: "c1",
    teacherId: "t6",
    requiredPeriods: 6,
    isElective: false,
    roomOverride: "",
    color: "#06b6d4",
    notes: ""
  },
  {
    id: "s6_c1",
    name: "Physical Education",
    code: "PE",
    classId: "c1",
    teacherId: "t7",
    requiredPeriods: 2,
    isElective: false,
    roomOverride: "Ground",
    color: "#22c55e",
    notes: ""
  },
  {
    id: "s1_c2",
    name: "Physics",
    code: "PHY",
    classId: "c2",
    teacherId: "t1",
    requiredPeriods: 6,
    isElective: false,
    roomOverride: "",
    color: "#3b82f6",
    notes: ""
  },
  {
    id: "s2_c2",
    name: "Mathematics",
    code: "MATH",
    classId: "c2",
    teacherId: "t2",
    requiredPeriods: 7,
    isElective: false,
    roomOverride: "",
    color: "#ec4899",
    notes: ""
  },
  {
    id: "s3_c2",
    name: "Computer Science",
    code: "CS",
    classId: "c2",
    teacherId: "t3",
    requiredPeriods: 5,
    isElective: true,
    roomOverride: "Lab 2",
    color: "#14b8a6",
    notes: ""
  },
  {
    id: "s4_c2",
    name: "English",
    code: "ENG",
    classId: "c2",
    teacherId: "t4",
    requiredPeriods: 5,
    isElective: false,
    roomOverride: "",
    color: "#8b5cf6",
    notes: ""
  },
  {
    id: "s5_c2",
    name: "Chemistry",
    code: "CHEM",
    classId: "c2",
    teacherId: "t6",
    requiredPeriods: 6,
    isElective: false,
    roomOverride: "",
    color: "#06b6d4",
    notes: ""
  },
  {
    id: "s6_c2",
    name: "Physical Education",
    code: "PE",
    classId: "c2",
    teacherId: "t7",
    requiredPeriods: 2,
    isElective: false,
    roomOverride: "Ground",
    color: "#22c55e",
    notes: ""
  },
  {
    id: "s1_c3",
    name: "Accountancy",
    code: "ACC",
    classId: "c3",
    teacherId: "t5",
    requiredPeriods: 7,
    isElective: false,
    roomOverride: "",
    color: "#f59e0b",
    notes: ""
  },
  {
    id: "s2_c3",
    name: "Business Studies",
    code: "BST",
    classId: "c3",
    teacherId: "t8",
    requiredPeriods: 6,
    isElective: false,
    roomOverride: "",
    color: "#d946ef",
    notes: ""
  },
  {
    id: "s3_c3",
    name: "Mathematics",
    code: "MATH",
    classId: "c3",
    teacherId: "t2",
    requiredPeriods: 6,
    isElective: true,
    roomOverride: "",
    color: "#ec4899",
    notes: ""
  },
  {
    id: "s4_c3",
    name: "English",
    code: "ENG",
    classId: "c3",
    teacherId: "t4",
    requiredPeriods: 5,
    isElective: false,
    roomOverride: "",
    color: "#8b5cf6",
    notes: ""
  },
  {
    id: "s5_c3",
    name: "Physical Education",
    code: "PE",
    classId: "c3",
    teacherId: "t7",
    requiredPeriods: 3,
    isElective: false,
    roomOverride: "Ground",
    color: "#22c55e",
    notes: ""
  }
];

const INITIAL_TEMPLATES = [
  {
    id: "st1",
    name: "Class 11 Science Standard",
    stream: "Science",
    subjects: [
      { name: "Physics", code: "PHY", defaultPeriods: 6, isElective: false },
      { name: "Chemistry", code: "CHEM", defaultPeriods: 6, isElective: false },
      { name: "Mathematics", code: "MATH", defaultPeriods: 7, isElective: false },
      { name: "English", code: "ENG", defaultPeriods: 5, isElective: false },
      { name: "Computer Science", code: "CS", defaultPeriods: 5, isElective: true },
      { name: "Physical Education", code: "PE", defaultPeriods: 2, isElective: false }
    ]
  },
  {
    id: "st2",
    name: "Class 11 Commerce Standard",
    stream: "Commerce",
    subjects: [
      { name: "Accountancy", code: "ACC", defaultPeriods: 7, isElective: false },
      { name: "Business Studies", code: "BST", defaultPeriods: 6, isElective: false },
      { name: "Economics", code: "ECO", defaultPeriods: 6, isElective: false },
      { name: "English", code: "ENG", defaultPeriods: 5, isElective: false },
      { name: "Mathematics", code: "MATH", defaultPeriods: 5, isElective: true },
      { name: "Physical Education", code: "PE", defaultPeriods: 2, isElective: false }
    ]
  }
];

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
      combinedGroups: [],     // { id, name, requiredPeriods }

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
      setTimetableSlot: (classId, dayIdx, periodIdx, subjectId) =>
        set((state) => {
          const timetables = { ...state.timetables };
          if (!timetables.classTimetables) return {};
          
          // 1. Get old subject at this slot
          const oldSubjectId = timetables.classTimetables[classId]?.[dayIdx]?.[periodIdx];
          
          // 2. Clear old subject from class timetable and teacher timetable
          if (oldSubjectId && typeof oldSubjectId === 'string' && !oldSubjectId.startsWith('__')) {
            const oldSub = state.subjects.find(s => s.id === oldSubjectId);
            if (oldSub && oldSub.teacherId) {
              if (timetables.teacherTimetables[oldSub.teacherId]?.[dayIdx]) {
                timetables.teacherTimetables[oldSub.teacherId][dayIdx][periodIdx] = null;
              }
            }
          }
          
          // 3. Set new subject in class timetable
          if (!timetables.classTimetables[classId]) {
            timetables.classTimetables[classId] = {};
          }
          if (!timetables.classTimetables[classId][dayIdx]) {
            timetables.classTimetables[classId][dayIdx] = {};
          }
          timetables.classTimetables[classId][dayIdx][periodIdx] = subjectId;
          
          // 4. Update new teacher timetable
          if (subjectId && typeof subjectId === 'string' && !subjectId.startsWith('__')) {
            const newSub = state.subjects.find(s => s.id === subjectId);
            if (newSub && newSub.teacherId) {
              if (!timetables.teacherTimetables[newSub.teacherId]) {
                timetables.teacherTimetables[newSub.teacherId] = {};
              }
              if (!timetables.teacherTimetables[newSub.teacherId][dayIdx]) {
                timetables.teacherTimetables[newSub.teacherId][dayIdx] = {};
              }
              
              // Check if teacher is already busy at this slot in another class, if so, clear that class slot to prevent double-booking!
              const existingTeacherSlot = timetables.teacherTimetables[newSub.teacherId][dayIdx][periodIdx];
              if (existingTeacherSlot && existingTeacherSlot.classId && existingTeacherSlot.classId !== classId) {
                const busyClassId = existingTeacherSlot.classId;
                if (timetables.classTimetables[busyClassId]?.[dayIdx]) {
                  timetables.classTimetables[busyClassId][dayIdx][periodIdx] = null;
                }
              }
              
              timetables.teacherTimetables[newSub.teacherId][dayIdx][periodIdx] = {
                subjectId: newSub.id,
                classId: classId
              };
            }
          }
          
          return { timetables: { ...timetables } };
        }),

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

      /* ── Combined Period Groups ── */
      addCombinedGroup: (group) =>
        set((state) => ({
          combinedGroups: [
            ...state.combinedGroups,
            { id: uuidv4(), name: 'Combined Group', requiredPeriods: 5, ...group },
          ],
        })),

      removeCombinedGroup: (id) =>
        set((state) => {
          const updatedSubjects = state.subjects.map((s) =>
            s.combinedGroupId === id ? { ...s, combinedGroupId: undefined } : s
          );
          return {
            combinedGroups: state.combinedGroups.filter((g) => g.id !== id),
            subjects: updatedSubjects,
          };
        }),

      updateCombinedGroup: (id, patch) =>
        set((state) => {
          const updatedGroups = state.combinedGroups.map((g) =>
            g.id === id ? { ...g, ...patch } : g
          );
          const group = updatedGroups.find((g) => g.id === id);
          const updatedSubjects = state.subjects.map((s) =>
            s.combinedGroupId === id ? { ...s, requiredPeriods: group.requiredPeriods } : s
          );
          return {
            combinedGroups: updatedGroups,
            subjects: updatedSubjects,
          };
        }),

      assignSubjectToCombinedGroup: (subjectId, groupId) =>
        set((state) => {
          const group = state.combinedGroups.find((g) => g.id === groupId);
          const periods = group ? group.requiredPeriods : 5;
          return {
            subjects: state.subjects.map((s) =>
              s.id === subjectId ? { ...s, combinedGroupId: groupId, requiredPeriods: periods } : s
            ),
          };
        }),

      removeSubjectFromCombinedGroup: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId ? { ...s, combinedGroupId: undefined } : s
          ),
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
          combinedGroups: s.combinedGroups,
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
            combinedGroups: data.combinedGroups || [],
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
          combinedGroups: [],
        }),

      loadSampleData: () =>
        set({
          settings: {
            ...DEFAULT_SETTINGS,
            institutionName: "TimeForge International Academy",
          },
          teachers: INITIAL_TEACHERS,
          classes: INITIAL_CLASSES,
          subjects: INITIAL_SUBJECTS,
          subjectTemplates: INITIAL_TEMPLATES,
          departments: [],
          timetables: {},
          absences: [],
          substitutions: [],
          combinedGroups: [],
        }),
    }),
    { name: 'timeforge-storage-v6' } // Incremented the persist key to avoid loading old state versions incompatibly
  )
);

export default useStore;
export { DEFAULT_SETTINGS };
