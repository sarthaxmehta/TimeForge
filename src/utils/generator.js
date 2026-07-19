/**
 * TimeForge — Timetable Generator v4
 * Smart multi-pass constraint-satisfaction scheduler.
 * Uses per-period config (settings.periods array).
 * Break / assembly / lunch / free types are never scheduled.
 */

export const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/** Period types that are NOT schedulable */
const NON_CLASS_TYPES = new Set(['break','lunch','assembly','free']);

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
  const name = period.name || `Period`;
  const time = showTime ? formatPeriodTime(period) : '';
  return time ? `${name}\n${time}` : name;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Main generator — produces conflict-free schedules
 * Uses a smarter priority-sorted multi-pass algorithm to minimise free periods.
 */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays  = workingDays.length;
  const numPeriods = periods.length;
  const schedulableIdxs = getSchedulableIndexes(periods);

  /* ── Init class timetables ── */
  const classTimetables = {};
  classes.forEach((c) => {
    classTimetables[c.id] = {};
    for (let di = 0; di < numDays; di++) {
      classTimetables[c.id][di] = {};
      for (let p = 0; p < numPeriods; p++) {
        const pt = periods[p]?.type || 'class';
        classTimetables[c.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
      }
    }
  });

  /* ── Init teacher timetables ── */
  const teacherTimetables = {};
  teachers.forEach((t) => {
    teacherTimetables[t.id] = {};
    for (let di = 0; di < numDays; di++) {
      teacherTimetables[t.id][di] = {};
      for (let p = 0; p < numPeriods; p++) {
        const pt = periods[p]?.type || 'class';
        teacherTimetables[t.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
      }
    }
  });

  /* ── Remaining periods per subject ── */
  const remaining = {};
  subjects.forEach((s) => { remaining[s.id] = Number(s.requiredPeriods) || 0; });

  /* ── Teacher cumulative count ── */
  const teacherCount = {};
  teachers.forEach((t) => { teacherCount[t.id] = 0; });

  /* ── Teacher max periods lookup ── */
  const teacherMax = {};
  teachers.forEach((t) => { teacherMax[t.id] = Number(t.maxPeriods) || Infinity; });

  /* ── Helper: is teacher free at (di, p)? ── */
  const isTeacherFree = (tid, di, p) => {
    if (!tid) return false;
    const slot = teacherTimetables[tid]?.[di]?.[p];
    return slot === null;
  };

  /* ── Helper: is class free at (di, p)? ── */
  const isClassFree = (cid, di, p) => {
    return classTimetables[cid]?.[di]?.[p] === null;
  };

  /* ── Helper: how many times has a subject been scheduled today? ── */
  const countSubjectToday = (sid, cid, di) => {
    let count = 0;
    for (const p of schedulableIdxs) {
      if (classTimetables[cid][di][p] === sid) count++;
    }
    return count;
  };

  /* ── Build combined group registry ── */
  const combinedGroupsMap = {};
  subjects.forEach((s) => {
    if (s.combinedGroupId) {
      if (!combinedGroupsMap[s.combinedGroupId]) {
        combinedGroupsMap[s.combinedGroupId] = [];
      }
      combinedGroupsMap[s.combinedGroupId].push(s);
    }
  });

  /* ── Deduplicated groups list (only one representative per group per iteration) ── */
  const processedGroups = new Set();

  /* ═══════════════════════════════════════════════
     PASS 1: Combined Group subjects — schedule all
     group members at the same (di, p) slot
   ═══════════════════════════════════════════════ */
  for (const [groupId, groupSubs] of Object.entries(combinedGroupsMap)) {
    const totalNeeded = groupSubs[0] ? (Number(groupSubs[0].requiredPeriods) || 0) : 0;
    let scheduled = 0;

    // Build candidate slots: all (di, p) combinations
    const slots = [];
    for (let di = 0; di < numDays; di++) {
      for (const p of schedulableIdxs) {
        slots.push([di, p]);
      }
    }
    shuffle(slots);

    for (const [di, p] of slots) {
      if (scheduled >= totalNeeded) break;
      if (groupSubs.every(gs => remaining[gs.id] <= 0)) break;

      // All teachers free and within limits?
      const allTeachersFree = groupSubs.every(gs => {
        if (!gs.teacherId) return false;
        return isTeacherFree(gs.teacherId, di, p) &&
               teacherCount[gs.teacherId] < teacherMax[gs.teacherId];
      });
      if (!allTeachersFree) continue;

      // All class slots free?
      const allClassesFree = groupSubs.every(gs => isClassFree(gs.classId, di, p));
      if (!allClassesFree) continue;

      // No teacher teaching same subject twice today (unless needed)
      const noRepeat = groupSubs.every(gs => countSubjectToday(gs.id, gs.classId, di) === 0);
      if (!noRepeat && scheduled < totalNeeded - 1) continue;

      // Schedule
      for (const gs of groupSubs) {
        classTimetables[gs.classId][di][p] = `__group__:${groupId}`;
        teacherTimetables[gs.teacherId][di][p] = {
          subjectId: gs.id,
          classId: gs.classId,
          combinedGroupId: groupId
        };
        remaining[gs.id]--;
        teacherCount[gs.teacherId]++;
      }
      scheduled++;
    }
  }

  /* ═══════════════════════════════════════════════
     PASS 2: Class teacher first-period subjects
   ═══════════════════════════════════════════════ */
  if (settings.assignFirstPeriodToClassTeacher) {
    for (let di = 0; di < numDays; di++) {
      const p = schedulableIdxs[0];
      for (const cls of classes) {
        if (!cls.classTeacherId) continue;
        if (!isClassFree(cls.id, di, p)) continue;
        if (!isTeacherFree(cls.classTeacherId, di, p)) continue;
        if (teacherCount[cls.classTeacherId] >= teacherMax[cls.classTeacherId]) continue;

        const ctSubject = subjects.find(
          (s) => s.classId === cls.id &&
                 s.teacherId === cls.classTeacherId &&
                 remaining[s.id] > 0 &&
                 !s.combinedGroupId
        );
        if (!ctSubject) continue;

        classTimetables[cls.id][di][p] = ctSubject.id;
        teacherTimetables[cls.classTeacherId][di][p] = { subjectId: ctSubject.id, classId: cls.id };
        remaining[ctSubject.id]--;
        teacherCount[cls.classTeacherId]++;
      }
    }
  }

  /* ═══════════════════════════════════════════════
     PASS 3: Normal subjects — greedy multi-pass
     with priority ordering and daily distribution
   ═══════════════════════════════════════════════ */

  // We do multiple passes so subjects that couldn't be placed initially get retried
  const MAX_PASSES = 4;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    // Build all (di, p) slots in interleaved order for fair distribution
    const allSlots = [];
    for (const p of schedulableIdxs) {
      const dayOrder = shuffle(Array.from({ length: numDays }, (_, i) => i));
      for (const di of dayOrder) {
        allSlots.push([di, p]);
      }
    }

    for (const [di, p] of allSlots) {
      // Sort classes by how urgently they need more periods scheduled
      const sortedClasses = classes
        .map(cls => {
          const unscheduledTotal = subjects
            .filter(s => s.classId === cls.id && !s.combinedGroupId && remaining[s.id] > 0)
            .reduce((sum, s) => sum + remaining[s.id], 0);
          return { cls, unscheduledTotal };
        })
        .sort((a, b) => b.unscheduledTotal - a.unscheduledTotal)
        .map(x => x.cls);

      for (const cls of sortedClasses) {
        if (!isClassFree(cls.id, di, p)) continue;

        const classSubjects = subjects
          .filter(s =>
            s.classId === cls.id &&
            !s.combinedGroupId &&
            remaining[s.id] > 0
          )
          .map(s => {
            const todayCount = countSubjectToday(s.id, cls.id, di);
            const urgency = remaining[s.id];
            // Penalise repeat of same subject on same day
            const score = urgency * 10 - todayCount * 30;
            return { s, score };
          })
          .filter(x => x.score > -100)
          .sort((a, b) => b.score - a.score)
          .map(x => x.s);

        for (const subj of classSubjects) {
          if (!subj.teacherId) continue;
          if (!isTeacherFree(subj.teacherId, di, p)) continue;
          if (teacherCount[subj.teacherId] >= teacherMax[subj.teacherId]) continue;

          // Enforce: same subject maximum twice per day
          if (countSubjectToday(subj.id, cls.id, di) >= 2) continue;

          // Schedule it
          classTimetables[cls.id][di][p] = subj.id;
          teacherTimetables[subj.teacherId][di][p] = { subjectId: subj.id, classId: cls.id };
          remaining[subj.id]--;
          teacherCount[subj.teacherId]++;
          break;
        }
      }
    }

    // If all subjects fully placed, stop early
    const allDone = subjects
      .filter(s => !s.combinedGroupId)
      .every(s => remaining[s.id] <= 0);
    if (allDone) break;
  }

  return { classTimetables, teacherTimetables };
}
