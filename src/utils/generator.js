/**
 * TimeForge — Timetable Generator v3
 * Uses new per-period config (settings.periods array)
 * Break / assembly / lunch / free types are never scheduled
 */

export const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/** Period types that are NOT schedulable */
const NON_CLASS_TYPES = new Set(['break','lunch','assembly','free']);

/**
 * Get the indexes of schedulable periods from the periods array
 */
export function getSchedulableIndexes(periods) {
  return periods
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !NON_CLASS_TYPES.has(p.type))
    .map(({ i }) => i);
}

/**
 * Format a period's time range nicely
 */
export function formatPeriodTime(period) {
  if (!period?.startTime || !period?.endTime) return '';
  return `${period.startTime} – ${period.endTime}`;
}

/**
 * Get period display label (name + time)
 */
export function getPeriodLabel(period, showTime = true) {
  if (!period) return '';
  const name = period.name || `Period`;
  const time = showTime ? formatPeriodTime(period) : '';
  return time ? `${name}\n${time}` : name;
}

/**
 * Main generator — produces conflict-free schedules
 *
 * @returns {{ classTimetables, teacherTimetables }}
 *   classTimetables:   { classId → { dayIdx → { periodIdx → subjectId | null } } }
 *   teacherTimetables: { teacherId → { dayIdx → { periodIdx → { subjectId, classId } | null } } }
 */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays = workingDays.length;
  const numPeriods = periods.length;

  const schedulableIdxs = getSchedulableIndexes(periods);

  /* ── Init class timetables ── */
  const classTimetables = {};
  classes.forEach((c) => {
    classTimetables[c.id] = {};
    workingDays.forEach((_, di) => {
      classTimetables[c.id][di] = {};
      for (let p = 0; p < numPeriods; p++) {
        const pt = periods[p]?.type || 'class';
        classTimetables[c.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
      }
    });
  });

  /* ── Init teacher timetables ── */
  const teacherTimetables = {};
  teachers.forEach((t) => {
    teacherTimetables[t.id] = {};
    workingDays.forEach((_, di) => {
      teacherTimetables[t.id][di] = {};
      for (let p = 0; p < numPeriods; p++) {
        const pt = periods[p]?.type || 'class';
        teacherTimetables[t.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
      }
    });
  });

  /* ── Remaining periods per subject ── */
  const remaining = {};
  subjects.forEach((s) => { remaining[s.id] = s.requiredPeriods || 0; });

  /* ── Teacher period count (for max check) ── */
  const teacherCount = {};
  teachers.forEach((t) => { teacherCount[t.id] = 0; });

  /* ── Assign ── */
  for (let di = 0; di < numDays; di++) {
    for (const p of schedulableIdxs) {
      const busyTeachers = new Set();
      const shuffledClasses = [...classes].sort(() => Math.random() - 0.5);

      for (const cls of shuffledClasses) {
        if (classTimetables[cls.id][di][p] !== null) continue;

        const classSubjects = subjects.filter(
          (s) => s.classId === cls.id && remaining[s.id] > 0
        );

        classSubjects.sort((a, b) => {
          let sa = remaining[a.id];
          let sb = remaining[b.id];
          // Penalise same-subject repeat today
          for (const pp of schedulableIdxs) {
            if (pp >= p) break;
            if (classTimetables[cls.id][di][pp] === a.id) sa -= 8;
            if (classTimetables[cls.id][di][pp] === b.id) sb -= 8;
          }
          return sb - sa;
        });

        for (const subj of classSubjects) {
          const teacher = teachers.find((t) => t.id === subj.teacherId);
          const maxP = teacher ? teacher.maxPeriods : Infinity;

          if (!busyTeachers.has(subj.teacherId) && teacherCount[subj.teacherId] < maxP) {
            classTimetables[cls.id][di][p]   = subj.id;
            teacherTimetables[subj.teacherId][di][p] = { subjectId: subj.id, classId: cls.id };
            remaining[subj.id]--;
            busyTeachers.add(subj.teacherId);
            teacherCount[subj.teacherId]++;
            break;
          }
        }
      }
    }
  }

  return { classTimetables, teacherTimetables };
}
