/**
 * TimeForge — Timetable Generator v7 "Artisan Backtracking Solver"
 *
 * Design principles:
 *   1. ZERO double-bookings: Teacher & Class scheduling conflicts are physically impossible.
 *   2. MULTI-STAGE BACKTRACKING: Solves schedule as a constraint satisfaction problem.
 *      Attempts strict elegant distribution first (no duplicates per day if possible),
 *      and gracefully relaxes constraints to force-fit subjects if resources are tight.
 *   3. COMBINED GROUPS: Handled atomically as high-priority constraint variables.
 *   4. CLASS TEACHER RULE: Pre-assigns class teacher to the first period slot of each day.
 */

export const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const NON_CLASS_TYPES = new Set(['break','lunch','assembly','free']);

/* ─── Public helpers ─── */
export function getSchedulableIndexes(periods) {
  return periods
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !NON_CLASS_TYPES.has(p.type))
    .map(({ i }) => i);
}

export function formatPeriodTime(period) {
  if (!period?.startTime || !period?.endTime) return '';
  return `${period.startTime} – ${period.endTime}`;
}

export function getPeriodLabel(period, showTime = true) {
  if (!period) return '';
  const name = period.name || 'Period';
  const time = showTime ? formatPeriodTime(period) : '';
  return time ? `${name}\n${time}` : name;
}

/* ─── Internal utilities ─── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — ARTISAN BACKTRACKING SOLVER
   ══════════════════════════════════════════════════════════════════════ */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays    = workingDays.length;
  const numPeriods = periods.length;
  const sched      = getSchedulableIndexes(periods);

  if (!numDays || !sched.length) return { classTimetables: {}, teacherTimetables: {} };

  // Collect teachers' details for lookup
  const teacherMax = {};
  teachers.forEach(t => {
    teacherMax[t.id] = Number(t.maxPeriods) || 9999;
  });

  // Prepare combined groups map
  const groupMap = {};
  subjects.forEach(s => {
    if (s.combinedGroupId) {
      (groupMap[s.combinedGroupId] = groupMap[s.combinedGroupId] || []).push(s);
    }
  });

  // Main trial runner for backtracking
  function solveWithDailyCap(strictCapMode) {
    // 1. Initialise grids
    const classTimetables   = {};
    const teacherTimetables = {};
    const teacherLoad       = {};

    classes.forEach(c => {
      classTimetables[c.id] = {};
      for (let di = 0; di < numDays; di++) {
        classTimetables[c.id][di] = {};
        for (let p = 0; p < numPeriods; p++) {
          const pt = periods[p]?.type || 'class';
          classTimetables[c.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
        }
      }
    });

    teachers.forEach(t => {
      teacherTimetables[t.id] = {};
      teacherLoad[t.id] = 0;
      for (let di = 0; di < numDays; di++) {
        teacherTimetables[t.id][di] = {};
        for (let p = 0; p < numPeriods; p++) {
          const pt = periods[p]?.type || 'class';
          teacherTimetables[t.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
        }
      }
    });

    // 2. Track remaining periods per subject
    const subjectRemaining = {};
    subjects.forEach(s => {
      subjectRemaining[s.id] = Number(s.requiredPeriods) || 0;
    });

    // 3. Pre-assign Class Teacher's first period if settings enable it
    if (settings.assignFirstPeriodToClassTeacher) {
      const firstP = sched[0];
      for (let di = 0; di < numDays; di++) {
        for (const cls of classes) {
          if (!cls.classTeacherId) continue;
          
          // Find standard subject taught by class teacher in this class
          const ctSubj = subjects.find(s => 
            s.classId === cls.id && 
            s.teacherId === cls.classTeacherId && 
            !s.combinedGroupId && 
            subjectRemaining[s.id] > 0
          );
          
          if (ctSubj) {
            const tid = ctSubj.teacherId;
            // Place if class slot, teacher slot is free, and teacher is under cap
            if (classTimetables[cls.id][di][firstP] === null && 
                teacherTimetables[tid][di][firstP] === null && 
                teacherLoad[tid] < teacherMax[tid]) {
              
              classTimetables[cls.id][di][firstP] = ctSubj.id;
              teacherTimetables[tid][di][firstP] = { subjectId: ctSubj.id, classId: cls.id };
              subjectRemaining[ctSubj.id]--;
              teacherLoad[tid]++;
            }
          }
        }
      }
    }

    // 4. Collect remaining lessons to schedule
    const lessons = [];

    // Add Combined Group lessons
    for (const [groupId, groupSubs] of Object.entries(groupMap)) {
      const R = Number(groupSubs[0]?.requiredPeriods) || 0;
      // How many group lessons have already been placed in class teacher pass? (Usually 0, but count just in case)
      let placedCount = 0;
      // group subjects don't participate in class teacher pre-assignment, but let's check
      const remainingPeriods = Math.max(0, R - placedCount);
      for (let i = 0; i < remainingPeriods; i++) {
        lessons.push({
          isGroup: true,
          groupId: groupId,
          subjects: groupSubs,
          difficulty: 1000 + groupSubs.length * 100 // Highest scheduling difficulty
        });
      }
    }

    // Add Normal lessons
    subjects.filter(s => !s.combinedGroupId).forEach(s => {
      const R = subjectRemaining[s.id];
      const tLoad = teachers.find(t => t.id === s.teacherId)?.maxPeriods || 10;
      for (let i = 0; i < R; i++) {
        lessons.push({
          isGroup: false,
          subject: s,
          classId: s.classId,
          teacherId: s.teacherId,
          // Heuristic score: higher means harder to schedule (smaller maxPeriods limit or higher required periods)
          difficulty: (s.requiredPeriods * 50) + (1000 / (tLoad || 1))
        });
      }
    });

    // Sort lessons descending by difficulty (MRV heuristic)
    lessons.sort((a, b) => b.difficulty - a.difficulty);

    // Track daily count of subjects in each class to enforce distribution caps
    const dailyClassSubjectCount = {};
    classes.forEach(c => {
      dailyClassSubjectCount[c.id] = {};
      subjects.forEach(s => {
        dailyClassSubjectCount[c.id][s.id] = Array(numDays).fill(0);
      });
    });

    // Populate daily counts from pre-assignments
    classes.forEach(c => {
      for (let di = 0; di < numDays; di++) {
        for (const p of sched) {
          const val = classTimetables[c.id][di][p];
          if (val && !val.startsWith('__')) {
            dailyClassSubjectCount[c.id][val][di]++;
          }
        }
      }
    });

    // 5. Backtracking solver core
    let backtracksCount = 0;
    const MAX_BACKTRACKS = 20000;

    let bestPlacedCount = -1;
    let bestClassTimetables = null;
    let bestTeacherTimetables = null;

    function saveBestResult(placed) {
      if (placed > bestPlacedCount) {
        bestPlacedCount = placed;
        bestClassTimetables = JSON.parse(JSON.stringify(classTimetables));
        bestTeacherTimetables = JSON.parse(JSON.stringify(teacherTimetables));
      }
    }

    // Prepare list of candidate slots (di, p) in random/shuffled order to ensure distribution
    const slots = [];
    for (let di = 0; di < numDays; di++) {
      for (const p of sched) {
        slots.push({ di, p });
      }
    }
    // Shuffle slots slightly so different trials distribute periods beautifully
    const shuffledSlots = shuffle(slots);

    function solve(lessonIdx) {
      saveBestResult(lessonIdx);

      // If all lessons successfully scheduled, we are done!
      if (lessonIdx >= lessons.length) {
        return true;
      }

      if (backtracksCount > MAX_BACKTRACKS) {
        return false; // Hit safety limit, stop search path
      }

      const lesson = lessons[lessonIdx];

      // Try placing the lesson in candidate slots
      for (const { di, p } of shuffledSlots) {
        if (lesson.isGroup) {
          // Combined Group constraints check
          let fits = true;
          for (const gs of lesson.subjects) {
            // Class must be free
            if (classTimetables[gs.classId][di][p] !== null) { fits = false; break; }
            // Teacher must be free and under max limit
            if (!gs.teacherId || teacherTimetables[gs.teacherId][di][p] !== null || teacherLoad[gs.teacherId] >= teacherMax[gs.teacherId]) { fits = false; break; }
            
            // Daily cap constraint
            const R = Number(gs.requiredPeriods) || 5;
            let cap = 2;
            if (strictCapMode) {
              cap = R <= 5 ? 1 : Math.ceil(R / numDays);
            }
            if (dailyClassSubjectCount[gs.classId][gs.id][di] >= cap) { fits = false; break; }
          }

          if (fits) {
            // Make assignment
            for (const gs of lesson.subjects) {
              classTimetables[gs.classId][di][p] = `__group__:${lesson.groupId}`;
              teacherTimetables[gs.teacherId][di][p] = { subjectId: gs.id, classId: gs.classId, combinedGroupId: lesson.groupId };
              dailyClassSubjectCount[gs.classId][gs.id][di]++;
              teacherLoad[gs.teacherId]++;
            }

            backtracksCount++;
            if (solve(lessonIdx + 1)) return true;

            // Backtrack
            for (const gs of lesson.subjects) {
              classTimetables[gs.classId][di][p] = null;
              teacherTimetables[gs.teacherId][di][p] = null;
              dailyClassSubjectCount[gs.classId][gs.id][di]--;
              teacherLoad[gs.teacherId]--;
            }
          }
        } else {
          // Normal Subject constraints check
          const sub = lesson.subject;
          const tid = lesson.teacherId;
          const cid = lesson.classId;

          // Class slot must be free
          if (classTimetables[cid][di][p] !== null) continue;
          // Teacher slot must be free and under cap
          if (!tid || teacherTimetables[tid][di][p] !== null || teacherLoad[tid] >= teacherMax[tid]) continue;

          // Daily cap constraint
          const R = Number(sub.requiredPeriods) || 5;
          let cap = 3;
          if (strictCapMode) {
            cap = R <= 5 ? 1 : Math.ceil(R / numDays);
          } else {
            // Relaxed cap mode: allow 2 if R <= 5, else 3
            cap = R <= 5 ? 2 : 3;
          }
          if (dailyClassSubjectCount[cid][sub.id][di] >= cap) continue;

          // Make assignment
          classTimetables[cid][di][p] = sub.id;
          teacherTimetables[tid][di][p] = { subjectId: sub.id, classId: cid };
          dailyClassSubjectCount[cid][sub.id][di]++;
          teacherLoad[tid]++;

          backtracksCount++;
          if (solve(lessonIdx + 1)) return true;

          // Backtrack
          classTimetables[cid][di][p] = null;
          teacherTimetables[tid][di][p] = null;
          dailyClassSubjectCount[cid][sub.id][di]--;
          teacherLoad[tid]--;
        }
      }

      return false;
    }

    const success = solve(0);
    return {
      success,
      placedCount: bestPlacedCount,
      totalCount: lessons.length,
      classTimetables: bestClassTimetables,
      teacherTimetables: bestTeacherTimetables
    };
  }

  // ── Multi-Stage Optimization Pipeline ──
  // Stage 1: Attempt perfect distributed allocation (strict daily caps)
  let result = solveWithDailyCap(true);

  // Stage 2: If perfect distribution fails to place all lessons, run in relaxed cap mode to prioritize filling all periods
  if (!result.success || result.placedCount < result.totalCount) {
    const relaxedResult = solveWithDailyCap(false);
    if (relaxedResult.placedCount > result.placedCount) {
      result = relaxedResult;
    }
  }

  return {
    classTimetables: result.classTimetables,
    teacherTimetables: result.teacherTimetables
  };
}

/* ══════════════════════════════════════════════════════════════════════
   CONFLICT VALIDATOR
   Returns an array of conflict descriptors for post-generation audit.
   ══════════════════════════════════════════════════════════════════════ */
export function validateTimetable(classTimetables, teacherTimetables, classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays = workingDays.length;
  const sched   = getSchedulableIndexes(periods);
  const conflicts = [];

  subjects.forEach(s => {
    const cls = classes.find(c => c.id === s.classId);
    if (!cls || !classTimetables[cls.id]) return;
    let count = 0;
    for (let di = 0; di < numDays; di++) {
      for (const p of sched) {
        const v = classTimetables[cls.id][di]?.[p];
        if (v === s.id) count++;
        else if (v && typeof v === 'string' && v.startsWith('__group__:') && s.combinedGroupId) {
          if (v.split(':')[1] === s.combinedGroupId) count++;
        }
      }
    }
    const needed = Number(s.requiredPeriods) || 0;
    if (count < needed) {
      conflicts.push({
        type: 'unscheduled',
        severity: 'warning',
        subjectId: s.id,
        subjectName: s.name,
        classId: s.classId,
        className: `${cls.name}${cls.section ? `-${cls.section}` : ''}`,
        scheduled: count,
        required: needed,
        missing: needed - count,
      });
    }
  });

  return conflicts;
}
