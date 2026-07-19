/**
 * Timetable generator — produces conflict-free schedules respecting:
 * - Teacher availability (max periods / week)
 * - No teacher double-booking in the same slot
 * - Break periods (from settings)
 * - Avoids the same subject repeating more than once per day
 *
 * Returns:
 *   classTimetables: { classId → { dayIdx → { periodIdx → subjectId | null } } }
 *   teacherTimetables: { teacherId → { dayIdx → { periodIdx → { subjectId, classId } | null } } }
 */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periodsPerDay, breakPeriods = [] } = settings;
  const numDays = workingDays.length;
  const breakSet = new Set(breakPeriods.map(Number));

  // ── Init class timetables ──
  const classTimetables = {};
  classes.forEach((c) => {
    classTimetables[c.id] = {};
    workingDays.forEach((_, di) => {
      classTimetables[c.id][di] = {};
      for (let p = 0; p < periodsPerDay; p++) {
        classTimetables[c.id][di][p] = breakSet.has(p) ? '__break__' : null;
      }
    });
  });

  // ── Init teacher timetables ──
  const teacherTimetables = {};
  teachers.forEach((t) => {
    teacherTimetables[t.id] = {};
    workingDays.forEach((_, di) => {
      teacherTimetables[t.id][di] = {};
      for (let p = 0; p < periodsPerDay; p++) {
        teacherTimetables[t.id][di][p] = breakSet.has(p) ? '__break__' : null;
      }
    });
  });

  // ── Remaining periods counter ──
  const remaining = {};
  subjects.forEach((s) => {
    remaining[s.id] = s.requiredPeriods || 0;
  });

  // ── Track teacher periods assigned (for max-periods check) ──
  const teacherPeriodCount = {};
  teachers.forEach((t) => { teacherPeriodCount[t.id] = 0; });

  // ── Effective periods (non-break slots) ──
  const effectivePeriods = Array.from({ length: periodsPerDay }, (_, i) => i).filter(
    (i) => !breakSet.has(i)
  );

  // ── Assign slots ──
  for (let di = 0; di < numDays; di++) {
    for (const p of effectivePeriods) {
      // Teachers busy in this exact slot
      const busyTeachers = new Set();

      // Shuffle classes for fairness
      const shuffledClasses = [...classes].sort(() => Math.random() - 0.5);

      for (const cls of shuffledClasses) {
        if (classTimetables[cls.id][di][p] !== null) continue; // Already filled

        const classSubjects = subjects.filter(
          (s) => s.classId === cls.id && remaining[s.id] > 0
        );

        // Sort: most remaining first; penalise if subject already appears today
        classSubjects.sort((a, b) => {
          let sa = remaining[a.id];
          let sb = remaining[b.id];

          for (const pp of effectivePeriods) {
            if (pp >= p) break;
            if (classTimetables[cls.id][di][pp] === a.id) sa -= 10;
            if (classTimetables[cls.id][di][pp] === b.id) sb -= 10;
          }
          return sb - sa;
        });

        for (const subj of classSubjects) {
          const teacher = teachers.find((t) => t.id === subj.teacherId);
          const maxP = teacher ? teacher.maxPeriods : Infinity;

          if (
            !busyTeachers.has(subj.teacherId) &&
            teacherPeriodCount[subj.teacherId] < maxP
          ) {
            // Assign
            classTimetables[cls.id][di][p] = subj.id;
            teacherTimetables[subj.teacherId][di][p] = {
              subjectId: subj.id,
              classId: cls.id,
            };
            remaining[subj.id]--;
            busyTeachers.add(subj.teacherId);
            teacherPeriodCount[subj.teacherId]++;
            break;
          }
        }
      }
    }
  }

  return { classTimetables, teacherTimetables };
}

/**
 * Compute a human-readable time label for a period
 * e.g. period 0, startTime "09:00", duration 45 → "9:00 – 9:45"
 */
export function getPeriodTime(periodIndex, startTime, durationMinutes, breakPeriods = []) {
  const [sh, sm] = startTime.split(':').map(Number);
  let totalMinutes = sh * 60 + sm;

  // Walk through each period, accounting for breaks (same duration)
  for (let i = 0; i < periodIndex; i++) {
    totalMinutes += durationMinutes;
  }

  const startH = Math.floor(totalMinutes / 60) % 24;
  const startM = totalMinutes % 60;
  const endTotalMinutes = totalMinutes + durationMinutes;
  const endH = Math.floor(endTotalMinutes / 60) % 24;
  const endM = endTotalMinutes % 60;

  const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  return `${fmt(startH, startM)} – ${fmt(endH, endM)}`;
}

/** Day names */
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
