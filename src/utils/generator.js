/**
 * TimeForge — Timetable Generator v8 "Maestro Artisan"
 *
 * Design principles:
 *   1. ZERO double-bookings: Teacher & Class scheduling conflicts are physically impossible.
 *   2. STABLE GREEDY INITIALIZATION: Schedules as many periods as possible greedily,
 *      ensuring real-world over-allocated datasets get maximized placements instead of empty grids.
 *   3. MULTI-TRIAL EXPLORATION: Runs 50 random shuffles to find the best initial starting layout.
 *   4. ADVANCED SWAP-CHAIN OPTIMIZATION: Iteratively relocates blockers to convert
 *      unscheduled shortfalls into successfully assigned periods.
 *   5. COMBINED GROUPS: Handled atomically as high-priority constraints.
 *   6. CLASS TEACHER RULE: Pre-assigns class teacher to the first period slot of each day.
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
   MAIN EXPORT — MAESTRO ARTISAN
   ══════════════════════════════════════════════════════════════════════ */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays    = workingDays.length;
  const numPeriods = periods.length;
  const sched      = getSchedulableIndexes(periods);

  if (!numDays || !sched.length) return { classTimetables: {}, teacherTimetables: {} };

  // Prepare combined groups map
  const groupMap = {};
  subjects.forEach(s => {
    if (s.combinedGroupId) {
      (groupMap[s.combinedGroupId] = groupMap[s.combinedGroupId] || []).push(s);
    }
  });

  const teacherMax = {};
  teachers.forEach(t => {
    teacherMax[t.id] = Number(t.maxPeriods) || 9999;
  });

  // Single trial runner to get a starting greedy layout
  function runSingleGreedyTrial() {
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

    const subjectRemaining = {};
    subjects.forEach(s => {
      subjectRemaining[s.id] = Number(s.requiredPeriods) || 0;
    });

    const dailyClassSubjectCount = {};
    classes.forEach(c => {
      dailyClassSubjectCount[c.id] = {};
      subjects.forEach(s => {
        dailyClassSubjectCount[c.id][s.id] = Array(numDays).fill(0);
      });
    });

    // 1. Class Teacher first period pre-assignment
    if (settings.assignFirstPeriodToClassTeacher) {
      const firstP = sched[0];
      for (let di = 0; di < numDays; di++) {
        for (const cls of classes) {
          if (!cls.classTeacherId) continue;
          const ctSubj = subjects.find(s => 
            s.classId === cls.id && 
            s.teacherId === cls.classTeacherId && 
            !s.combinedGroupId && 
            subjectRemaining[s.id] > 0
          );
          if (ctSubj) {
            const tid = ctSubj.teacherId;
            if (classTimetables[cls.id][di][firstP] === null && 
                teacherTimetables[tid][di][firstP] === null && 
                teacherLoad[tid] < teacherMax[tid]) {
              classTimetables[cls.id][di][firstP] = ctSubj.id;
              teacherTimetables[tid][di][firstP] = { subjectId: ctSubj.id, classId: cls.id };
              subjectRemaining[ctSubj.id]--;
              dailyClassSubjectCount[cls.id][ctSubj.id][di]++;
              teacherLoad[tid]++;
            }
          }
        }
      }
    }

    // 2. Schedule Combined Groups atomically
    for (const [groupId, groupSubs] of Object.entries(groupMap)) {
      const R = Number(groupSubs[0]?.requiredPeriods) || 0;
      const shuffledSlots = shuffle(sched.flatMap(p => Array.from({ length: numDays }, (_, di) => ({ di, p }))));
      
      let placed = 0;
      for (const { di, p } of shuffledSlots) {
        if (placed >= R) break;
        if (groupSubs.every(gs => subjectRemaining[gs.id] <= 0)) break;

        let fits = true;
        for (const gs of groupSubs) {
          if (classTimetables[gs.classId][di][p] !== null) { fits = false; break; }
          if (!gs.teacherId || teacherTimetables[gs.teacherId][di][p] !== null || teacherLoad[gs.teacherId] >= teacherMax[gs.teacherId]) { fits = false; break; }
        }

        if (fits) {
          for (const gs of groupSubs) {
            classTimetables[gs.classId][di][p] = `__group__:${groupId}`;
            teacherTimetables[gs.teacherId][di][p] = { subjectId: gs.id, classId: gs.classId, combinedGroupId: groupId };
            subjectRemaining[gs.id]--;
            dailyClassSubjectCount[gs.classId][gs.id][di]++;
            teacherLoad[gs.teacherId]++;
          }
          placed++;
        }
      }
    }

    // 3. Greedy Normal subject placement
    // Sort subjects by total periods needed to prioritize harder/larger subjects
    const sortedSubjects = subjects
      .filter(s => !s.combinedGroupId)
      .sort((a, b) => (Number(b.requiredPeriods) || 0) - (Number(a.requiredPeriods) || 0));

    // Multiple passes with relaxing daily caps to distribute subjects naturally
    for (const capLimit of [1, 2, 3]) {
      for (let di = 0; di < numDays; di++) {
        for (const p of shuffle(sched)) {
          for (const sub of sortedSubjects) {
            if (subjectRemaining[sub.id] <= 0) continue;
            const cid = sub.classId;
            const tid = sub.teacherId;

            if (classTimetables[cid][di][p] !== null) continue;
            if (!tid || teacherTimetables[tid][di][p] !== null || teacherLoad[tid] >= teacherMax[tid]) continue;

            const currentDailyCount = dailyClassSubjectCount[cid][sub.id][di];
            if (currentDailyCount >= capLimit) continue;

            classTimetables[cid][di][p] = sub.id;
            teacherTimetables[tid][di][p] = { subjectId: sub.id, classId: cid };
            subjectRemaining[sub.id]--;
            dailyClassSubjectCount[cid][sub.id][di]++;
            teacherLoad[tid]++;
          }
        }
      }
    }

    // Count shortfalls
    let shortfalls = 0;
    subjects.forEach(s => {
      shortfalls += subjectRemaining[s.id];
    });

    return {
      classTimetables,
      teacherTimetables,
      subjectRemaining,
      dailyClassSubjectCount,
      teacherLoad,
      shortfalls
    };
  }

  // Run multi-trial shuffler to get the best starting point
  let bestTrial = null;
  const TRIALS = 50;
  for (let t = 0; t < TRIALS; t++) {
    const trial = runSingleGreedyTrial();
    if (bestTrial === null || trial.shortfalls < bestTrial.shortfalls) {
      bestTrial = trial;
    }
    if (bestTrial.shortfalls === 0) break;
  }

  // Deconstruct best trial state
  const { classTimetables, teacherTimetables, subjectRemaining, dailyClassSubjectCount, teacherLoad } = bestTrial;

  // 4. Advanced Swap-Chain Optimizer (Stage 2)
  // We iteratively search for swap paths to place remaining subjects
  const normalSubjects = subjects.filter(s => !s.combinedGroupId);
  const maxRepairIterations = 15;

  for (let iter = 0; iter < maxRepairIterations; iter++) {
    let resolvedAny = false;

    for (const sub of normalSubjects) {
      if (subjectRemaining[sub.id] <= 0) continue;
      const cid = sub.classId;
      const tid = sub.teacherId;
      if (!tid) continue;

      // Find a slot to schedule sub
      for (let di = 0; di < numDays; di++) {
        const R = Number(sub.requiredPeriods) || 5;
        const cap = R <= 5 ? 2 : 3;
        if (dailyClassSubjectCount[cid][sub.id][di] >= cap) continue;

        for (const p of sched) {
          if (subjectRemaining[sub.id] <= 0) break;

          // Case 1: Both class and teacher are free
          if (classTimetables[cid][di][p] === null && teacherTimetables[tid][di][p] === null) {
            if (teacherLoad[tid] < teacherMax[tid]) {
              classTimetables[cid][di][p] = sub.id;
              teacherTimetables[tid][di][p] = { subjectId: sub.id, classId: cid };
              dailyClassSubjectCount[cid][sub.id][di]++;
              subjectRemaining[sub.id]--;
              teacherLoad[tid]++;
              resolvedAny = true;
              break;
            }
          }

          // Case 2: Class is free, but teacher tid is busy teaching blocker in another class
          if (classTimetables[cid][di][p] === null && teacherTimetables[tid][di][p] !== null) {
            const tSlot = teacherTimetables[tid][di][p];
            if (tSlot && tSlot.subjectId && tSlot.classId && !tSlot.combinedGroupId) {
              const blockerSub = subjects.find(s => s.id === tSlot.subjectId);
              const blockerCid = tSlot.classId;
              const blockerTid = tid;
              
              if (blockerSub) {
                // Find a free slot (di2, p2) to relocate blockerSub in class blockerCid
                let foundRelocation = false;
                for (let di2 = 0; di2 < numDays && !foundRelocation; di2++) {
                  const bCap = (Number(blockerSub.requiredPeriods) || 5) <= 5 ? 2 : 3;
                  if (dailyClassSubjectCount[blockerCid][blockerSub.id][di2] >= bCap) continue;

                  for (const p2 of sched) {
                    if (classTimetables[blockerCid][di2][p2] === null && teacherTimetables[blockerTid][di2][p2] === null) {
                      // Relocate blocker
                      classTimetables[blockerCid][di2][p2] = blockerSub.id;
                      teacherTimetables[blockerTid][di2][p2] = { subjectId: blockerSub.id, classId: blockerCid };
                      dailyClassSubjectCount[blockerCid][blockerSub.id][di2]++;

                      // Clear blocker old slot
                      classTimetables[blockerCid][di][p] = null;
                      teacherTimetables[blockerTid][di][p] = null;
                      dailyClassSubjectCount[blockerCid][blockerSub.id][di]--;

                      // Assign sub
                      classTimetables[cid][di][p] = sub.id;
                      teacherTimetables[tid][di][p] = { subjectId: sub.id, classId: cid };
                      dailyClassSubjectCount[cid][sub.id][di]++;

                      subjectRemaining[sub.id]--;
                      teacherLoad[tid]++;
                      resolvedAny = true;
                      foundRelocation = true;
                      break;
                    }
                  }
                }
                if (foundRelocation) break;
              }
            }
          }

          // Case 3: Class cid is busy with blockerSub, but teacher tid is free
          if (classTimetables[cid][di][p] !== null && teacherTimetables[tid][di][p] === null) {
            const blockerSubId = classTimetables[cid][di][p];
            if (blockerSubId && typeof blockerSubId === 'string' && !blockerSubId.startsWith('__')) {
              const blockerSub = subjects.find(s => s.id === blockerSubId);
              const blockerTid = blockerSub?.teacherId;

              if (blockerSub && blockerTid) {
                // Find a free slot (di2, p2) to relocate blockerSub in class cid
                let foundRelocation = false;
                for (let di2 = 0; di2 < numDays && !foundRelocation; di2++) {
                  const bCap = (Number(blockerSub.requiredPeriods) || 5) <= 5 ? 2 : 3;
                  if (dailyClassSubjectCount[cid][blockerSub.id][di2] >= bCap) continue;

                  for (const p2 of sched) {
                    if (classTimetables[cid][di2][p2] === null && teacherTimetables[blockerTid][di2][p2] === null) {
                      // Relocate blocker
                      classTimetables[cid][di2][p2] = blockerSub.id;
                      teacherTimetables[blockerTid][di2][p2] = { subjectId: blockerSub.id, classId: cid };
                      dailyClassSubjectCount[cid][blockerSub.id][di2]++;

                      // Clear blocker old slot
                      classTimetables[cid][di][p] = null;
                      teacherTimetables[blockerTid][di][p] = null;
                      dailyClassSubjectCount[cid][blockerSub.id][di]--;

                      // Assign sub
                      classTimetables[cid][di][p] = sub.id;
                      teacherTimetables[tid][di][p] = { subjectId: sub.id, classId: cid };
                      dailyClassSubjectCount[cid][sub.id][di]++;

                      subjectRemaining[sub.id]--;
                      teacherLoad[tid]++;
                      resolvedAny = true;
                      foundRelocation = true;
                      break;
                    }
                  }
                }
                if (foundRelocation) break;
              }
            }
          }
        }
      }
    }

    if (!resolvedAny) break; // Exit early if no shortfalls could be resolved in this pass
  }

  return { classTimetables, teacherTimetables };
}

/* ══════════════════════════════════════════════════════════════════════
   CONFLICT VALIDATOR
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
