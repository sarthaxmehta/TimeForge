import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SETTINGS = {
  institutionName: 'My Institution',
  institutionType: 'school',
  academicYear: '2025–2026',
  semester: 'Odd Semester',
  address: '',
  phone: '',
  email: '',
  workingDays: [0, 1, 2, 3, 4],
  periodsPerDay: 8,
  periodDuration: 45,
  startTime: '09:00',
  breakPeriods: [],
  breakLabel: 'Lunch Break',
  showTeacherInCell: true,
  showPeriodTimes: true,
};

export const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#84cc16',
  '#fb7185', '#34d399', '#60a5fa', '#fbbf24',
];

const useStore = create(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────
      settings: DEFAULT_SETTINGS,
      teachers: [],
      classes: [],
      subjects: [],
      subjectTemplates: [], // { id, name, subjects: [{ name, code, color, defaultPeriods }] }
      timetables: {},

      // ── Settings ─────────────────────────────────────────
      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      // ── Teachers ─────────────────────────────────────────
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
              specialization: '',
              qualification: '',
              maxPeriods: 25,
              color: SUBJECT_COLORS[state.teachers.length % SUBJECT_COLORS.length],
              unavailableSlots: [], // [{ dayIdx, periodIdx }]
              ...teacher,
            },
          ],
        })),

      updateTeacher: (id, patch) =>
        set((state) => ({
          teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((t) => t.id !== id),
        })),

      // ── Classes ──────────────────────────────────────────
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
              ...cls,
            },
          ],
        })),

      // Batch-add multiple sections of the same class
      addClassWithSections: (baseClass, sections) =>
        set((state) => {
          const newClasses = sections.map((sec) => ({
            id: uuidv4(),
            name: baseClass.name,
            section: sec,
            roomNo: '',
            strength: baseClass.strength || '',
            grade: baseClass.grade || '',
            stream: baseClass.stream || '',
            classTeacherId: '',
          }));
          return { classes: [...state.classes, ...newClasses] };
        }),

      updateClass: (id, patch) =>
        set((state) => ({
          classes: state.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeClass: (id) =>
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          subjects: state.subjects.filter((s) => s.classId !== id),
        })),

      // ── Subjects ─────────────────────────────────────────
      addSubject: (subject) =>
        set((state) => {
          const classSubjects = state.subjects.filter((s) => s.classId === subject.classId);
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
                color: SUBJECT_COLORS[classSubjects.length % SUBJECT_COLORS.length],
                ...subject,
              },
            ],
          };
        }),

      updateSubject: (id, patch) =>
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      removeSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
        })),

      // Copy all subjects from one class to another
      copySubjectsToClass: (fromClassId, toClassId) =>
        set((state) => {
          const sourceSubjects = state.subjects.filter((s) => s.classId === fromClassId);
          const existingIds = new Set(
            state.subjects.filter((s) => s.classId === toClassId).map((s) => s.name)
          );
          const newSubjects = sourceSubjects
            .filter((s) => !existingIds.has(s.name))
            .map((s) => ({ ...s, id: uuidv4(), classId: toClassId }));
          return { subjects: [...state.subjects, ...newSubjects] };
        }),

      // ── Subject Templates ─────────────────────────────────
      addSubjectTemplate: (template) =>
        set((state) => ({
          subjectTemplates: [
            ...state.subjectTemplates,
            { ...template, id: uuidv4() },
          ],
        })),

      removeSubjectTemplate: (id) =>
        set((state) => ({
          subjectTemplates: state.subjectTemplates.filter((t) => t.id !== id),
        })),

      // Apply template subjects to a class
      applyTemplateToClass: (templateId, classId, teacherMap) =>
        set((state) => {
          const template = state.subjectTemplates.find((t) => t.id === templateId);
          if (!template) return {};
          const existing = new Set(
            state.subjects.filter((s) => s.classId === classId).map((s) => s.name)
          );
          const classSubjectCount = state.subjects.filter((s) => s.classId === classId).length;
          const newSubjects = template.subjects
            .filter((s) => !existing.has(s.name))
            .map((s, i) => ({
              id: uuidv4(),
              name: s.name,
              code: s.code || '',
              classId,
              teacherId: teacherMap?.[s.name] || '',
              requiredPeriods: s.defaultPeriods || 5,
              isElective: s.isElective || false,
              color: SUBJECT_COLORS[(classSubjectCount + i) % SUBJECT_COLORS.length],
            }));
          return { subjects: [...state.subjects, ...newSubjects] };
        }),

      // ── Timetables ───────────────────────────────────────
      setTimetables: (timetables) => set({ timetables }),
      clearTimetables: () => set({ timetables: {} }),

      // ── Data Management ──────────────────────────────────
      exportData: () => {
        const state = get();
        return JSON.stringify({
          settings: state.settings,
          teachers: state.teachers,
          classes: state.classes,
          subjects: state.subjects,
          subjectTemplates: state.subjectTemplates,
          timetables: state.timetables,
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
            timetables: data.timetables || {},
          });
          return true;
        } catch {
          return false;
        }
      },

      clearAllData: () =>
        set({ teachers: [], classes: [], subjects: [], subjectTemplates: [], timetables: {} }),
    }),
    { name: 'eduschedule-storage-v3' }
  )
);

export default useStore;
export { DEFAULT_SETTINGS };
