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

      // Pass 1: Handle class teacher assigning if option is enabled and it is the first schedulable period
      const isFirstPeriod = (p === schedulableIdxs[0]);
      if (isFirstPeriod && settings.assignFirstPeriodToClassTeacher) {
        for (const cls of classes) {
          if (!cls.classTeacherId) continue;

          // 1. Find if class teacher teaches a subject here
          const ctSubject = subjects.find(
            (s) => s.classId === cls.id && s.teacherId === cls.classTeacherId && remaining[s.id] > 0
          );

          if (ctSubject) {
            const teacher = teachers.find((t) => t.id === cls.classTeacherId);
            const maxP = teacher ? teacher.maxPeriods : Infinity;
            if (!busyTeachers.has(cls.classTeacherId) && teacherCount[cls.classTeacherId] < maxP) {
              classTimetables[cls.id][di][p] = ctSubject.id;
              teacherTimetables[cls.classTeacherId][di][p] = { subjectId: ctSubject.id, classId: cls.id };
              remaining[ctSubject.id]--;
              busyTeachers.add(cls.classTeacherId);
              teacherCount[cls.classTeacherId]++;
            }
          } else {
            // 2. Otherwise, assign a virtual "Homeroom" session with the class teacher (if they aren't busy)
            if (!busyTeachers.has(cls.classTeacherId)) {
              classTimetables[cls.id][di][p] = `__homeroom__:${cls.classTeacherId}`;
              teacherTimetables[cls.classTeacherId][di][p] = { subjectId: `__homeroom__:${cls.classTeacherId}`, classId: cls.id };
              busyTeachers.add(cls.classTeacherId);
            }
          }
        }
      }

      // Pass 2: Fill rest of the schedule normally
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

          if (teacherCount[subj.teacherId] < maxP) {
            // Check if this subject is in a combined simultaneous group
            if (subj.combinedGroupId) {
              const groupSubs = subjects.filter((s) => s.combinedGroupId === subj.combinedGroupId);
              let groupEligible = true;

              for (const gs of groupSubs) {
                // Ensure the teacher is not busy with another subject outside this group
                if (busyTeachers.has(gs.teacherId)) {
                  const scheduledObj = teacherTimetables[gs.teacherId]?.[di]?.[p];
                  if (scheduledObj) {
                    const targetSubId = scheduledObj.subjectId || (typeof scheduledObj === 'string' ? scheduledObj : null);
                    const targetSub = subjects.find(s => s.id === targetSubId);
                    if (!targetSub || targetSub.combinedGroupId !== subj.combinedGroupId) {
                      groupEligible = false;
                      break;
                    }
                  } else {
                    groupEligible = false;
                    break;
                  }
                }

                // Check maxPeriods limit for this teacher
                const gsTeacher = teachers.find(t => t.id === gs.teacherId);
                if (gsTeacher) {
                  const existingLoad = teacherCount[gs.teacherId] || 0;
                  if (existingLoad >= gsTeacher.maxPeriods) {
                    groupEligible = false;
                    break;
                  }
                }

                // Check class cell availability
                const clsCell = classTimetables[gs.classId]?.[di]?.[p];
                if (clsCell !== null) {
                  // If it has a group scheduled, it must be the exact same group
                  if (clsCell !== `__group__:${subj.combinedGroupId}`) {
                    groupEligible = false;
                    break;
                  }
                }
              }

              if (groupEligible) {
                // Schedule the entire group together
                for (const gs of groupSubs) {
                  classTimetables[gs.classId][di][p] = `__group__:${subj.combinedGroupId}`;
                  remaining[gs.id]--;

                  const existing = teacherTimetables[gs.teacherId]?.[di]?.[p];
                  if (existing && typeof existing === 'object' && existing.combinedGroupId === subj.combinedGroupId) {
                    if (!existing.classes.includes(gs.classId)) {
                      existing.classes.push(gs.classId);
                    }
                  } else {
                    teacherTimetables[gs.teacherId][di][p] = { 
                      subjectId: gs.id, 
                      classId: gs.classId, 
                      classes: [gs.classId],
                      combinedGroupId: subj.combinedGroupId
                    };
                    busyTeachers.add(gs.teacherId);
                    teacherCount[gs.teacherId]++;
                  }
                }
                break;
              }
            } else if (subj.mergedWithSubjectId) {
              // Merged subject (fallback)
              if (!busyTeachers.has(subj.teacherId)) {
                const partnerSub = subjects.find((s) => s.id === subj.mergedWithSubjectId);
                if (partnerSub && remaining[partnerSub.id] > 0) {
                  const partnerClassId = partnerSub.classId;
                  if (classTimetables[partnerClassId][di][p] === null) {
                    classTimetables[cls.id][di][p] = subj.id;
                    classTimetables[partnerClassId][di][p] = partnerSub.id;
                    teacherTimetables[subj.teacherId][di][p] = { 
                      subjectId: subj.id, 
                      classId: cls.id, 
                      mergedWithClassId: partnerClassId 
                    };
                    remaining[subj.id]--;
                    remaining[partnerSub.id]--;
                    busyTeachers.add(subj.teacherId);
                    teacherCount[subj.teacherId]++;
                    break;
                  }
                }
              }
            } else {
              // Normal scheduling
              if (!busyTeachers.has(subj.teacherId)) {
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
    }
  }

  return { classTimetables, teacherTimetables };
}
