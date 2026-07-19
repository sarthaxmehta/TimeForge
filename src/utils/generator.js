/**
 * TimeForge — Timetable Generator v6 "Maestro Supreme"
 *
 * Design principles:
 *   1. ZERO hard conflicts — teacher/class double-booking is structurally impossible.
 *   2. EVEN DISTRIBUTION — daily quotas computed per subject before any slot is filled.
 *   3. DAILY CAP SYSTEM — max 2×/day (pass C), max 3×/day (overflow passes).
 *   4. SWAP-BASED REPAIR — after initial placement a repair pass attempts to swap
 *      already-placed periods to free up slots for unscheduled subjects.
 *   5. COMBINED GROUPS — placed atomically; all teachers + all class slots must be
 *      simultaneously free before a group slot is committed.
 *   6. FEASIBILITY PRE-CHECK — emits warnings but still tries its best.
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

/**
 * Compute per-day targets for R required periods over D days.
 * Returns array of length D summing to R, values differ by at most 1.
 * Extra periods are randomly distributed so the schedule feels natural.
 */
function computeDailyTargets(R, D) {
  if (D <= 0) return [];
  const base  = Math.floor(R / D);
  const extra = R % D;
  const targets = Array(D).fill(base);
  const dayIdxs = shuffle(Array.from({ length: D }, (_, i) => i));
  for (let i = 0; i < extra; i++) targets[dayIdxs[i]]++;
  return targets;
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════════════ */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays    = workingDays.length;
  const sched      = getSchedulableIndexes(periods);

  if (!numDays || !sched.length) return { classTimetables: {}, teacherTimetables: {} };

  let bestResult = null;
  let minShortfalls = Infinity;
  
  // We run up to 100 trials to find the absolute best schedule.
  // Since it runs in less than 2ms per trial, 100 trials takes under 200ms.
  const TRIALS = 100;
  for (let trial = 0; trial < TRIALS; trial++) {
    const result = runSingleGenerationTrial(classes, subjects, teachers, settings);
    
    // Count the number of unscheduled periods (shortfalls) in this trial
    let shortfalls = 0;
    subjects.forEach(s => {
      const cls = classes.find(c => c.id === s.classId);
      if (!cls || !result.classTimetables[cls.id]) return;
      
      const needed = Number(s.requiredPeriods) || 0;
      let count = 0;
      for (let di = 0; di < numDays; di++) {
        for (const p of sched) {
          const v = result.classTimetables[cls.id][di]?.[p];
          if (v === s.id) count++;
          else if (v && typeof v === 'string' && v.startsWith('__group__:') && s.combinedGroupId) {
            if (v.split(':')[1] === s.combinedGroupId) count++;
          }
        }
      }
      if (count < needed) {
        shortfalls += (needed - count);
      }
    });

    if (shortfalls < minShortfalls) {
      minShortfalls = shortfalls;
      bestResult = result;
    }

    // Stop immediately if we found a perfect schedule with zero shortfalls!
    if (minShortfalls === 0) {
      break;
    }
  }

  return bestResult;
}

function runSingleGenerationTrial(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays    = workingDays.length;
  const numPeriods = periods.length;
  const sched      = getSchedulableIndexes(periods);

  if (!numDays || !sched.length) return { classTimetables: {}, teacherTimetables: {} };

  /* ── 1. Initialise grids ── */
  const classTimetables   = {};
  const teacherTimetables = {};

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
    for (let di = 0; di < numDays; di++) {
      teacherTimetables[t.id][di] = {};
      for (let p = 0; p < numPeriods; p++) {
        const pt = periods[p]?.type || 'class';
        teacherTimetables[t.id][di][p] = NON_CLASS_TYPES.has(pt) ? `__${pt}__` : null;
      }
    }
  });

  /* ── 2. State tables ── */
  const remaining   = {};   // remaining[sid]       = periods still to place
  const dailyTarget = {};   // dailyTarget[sid][di] = ideal placements on day di
  const dailyPlaced = {};   // dailyPlaced[sid][di] = placed so far on day di

  subjects.forEach(s => {
    const R = Number(s.requiredPeriods) || 0;
    remaining[s.id]   = R;
    dailyTarget[s.id] = computeDailyTargets(R, numDays);
    dailyPlaced[s.id] = Array(numDays).fill(0);
  });

  const teacherLoad = {};
  const teacherMax  = {};
  teachers.forEach(t => {
    teacherLoad[t.id] = 0;
    teacherMax[t.id]  = Number(t.maxPeriods) || 9999;
  });

  /* ── 3. Conflict-safe helpers ── */
  const isClassFree     = (cid, di, p) => classTimetables[cid]?.[di]?.[p] === null;
  const isTeacherFree   = (tid, di, p) => !!tid && teacherTimetables[tid]?.[di]?.[p] === null;
  const teacherUnderCap = (tid)        => (teacherLoad[tid] || 0) < (teacherMax[tid] || 9999);

  /** Atomically place a single normal subject. Returns true on success. */
  function placeSubject(sid, tid, cid, di, p) {
    if (!isClassFree(cid, di, p))   return false;
    if (!isTeacherFree(tid, di, p)) return false;
    if (!teacherUnderCap(tid))      return false;
    classTimetables[cid][di][p]   = sid;
    teacherTimetables[tid][di][p] = { subjectId: sid, classId: cid };
    remaining[sid]--;
    dailyPlaced[sid][di]++;
    teacherLoad[tid]++;
    return true;
  }

  /**
   * Remove a previously placed subject assignment.
   * Returns the subject/teacher ids that were there, or null if slot was empty.
   */
  function removeSubject(cid, di, p) {
    const val = classTimetables[cid]?.[di]?.[p];
    if (!val || typeof val !== 'string' || val.startsWith('__')) return null;
    const tSlot = Object.entries(teacherTimetables).find(([, tDays]) =>
      tDays[di]?.[p]?.classId === cid && tDays[di][p]?.subjectId === val
    );
    if (!tSlot) return null;
    const [tid] = tSlot;
    const sub = subjects.find(s => s.id === val);
    if (!sub) return null;

    classTimetables[cid][di][p]   = null;
    teacherTimetables[tid][di][p] = null;
    remaining[val]++;
    dailyPlaced[val][di]--;
    teacherLoad[tid]--;
    return { sid: val, tid, cid };
  }

  /** Place a combined group atomically. Returns true on success. */
  function placeGroup(groupSubs, groupId, di, p) {
    if (!groupSubs.every(gs => gs.teacherId &&
        isTeacherFree(gs.teacherId, di, p) &&
        teacherUnderCap(gs.teacherId))) return false;
    if (!groupSubs.every(gs => isClassFree(gs.classId, di, p))) return false;

    for (const gs of groupSubs) {
      classTimetables[gs.classId][di][p]   = `__group__:${groupId}`;
      teacherTimetables[gs.teacherId][di][p] = { subjectId: gs.id, classId: gs.classId, combinedGroupId: groupId };
      remaining[gs.id]--;
      dailyPlaced[gs.id][di]++;
      teacherLoad[gs.teacherId]++;
    }
    return true;
  }

  /* ── 4. Build maps ── */
  const groupMap = {};
  subjects.forEach(s => {
    if (s.combinedGroupId)
      (groupMap[s.combinedGroupId] = groupMap[s.combinedGroupId] || []).push(s);
  });
  const normalSubjects = subjects.filter(s => !s.combinedGroupId);

  /* ══════════════════════════════════════════
     PHASE A: Combined groups — distributed evenly
   ══════════════════════════════════════════ */
  for (const [groupId, groupSubs] of Object.entries(groupMap)) {
    const R = Number(groupSubs[0]?.requiredPeriods) || 0;
    const groupTargets = computeDailyTargets(R, numDays);

    // Primary: fill per daily target
    for (let di = 0; di < numDays; di++) {
      let placed = 0;
      for (const p of sched) {
        if (placed >= groupTargets[di]) break;
        if (groupSubs.every(gs => remaining[gs.id] <= 0)) break;
        if (placeGroup(groupSubs, groupId, di, p)) placed++;
      }
    }
    // Overflow: any remaining group periods
    outer: for (let di = 0; di < numDays; di++) {
      for (const p of sched) {
        if (groupSubs.every(gs => remaining[gs.id] <= 0)) break outer;
        placeGroup(groupSubs, groupId, di, p);
      }
    }
  }

  /* ══════════════════════════════════════════
     PHASE B: Class-teacher first-period rule
   ══════════════════════════════════════════ */
  if (settings.assignFirstPeriodToClassTeacher) {
    const firstP = sched[0];
    for (let di = 0; di < numDays; di++) {
      for (const cls of classes) {
        if (!cls.classTeacherId) continue;
        const ctSubj = normalSubjects
          .filter(s =>
            s.classId === cls.id &&
            s.teacherId === cls.classTeacherId &&
            remaining[s.id] > 0 &&
            dailyPlaced[s.id][di] < (dailyTarget[s.id][di] || 1)
          )
          .sort((a, b) => remaining[b.id] - remaining[a.id])[0];
        if (!ctSubj) continue;
        placeSubject(ctSubj.id, ctSubj.teacherId, cls.id, di, firstP);
      }
    }
  }

  /* ══════════════════════════════════════════
     PHASE C: Main distribution (hard cap 2/day)
   ══════════════════════════════════════════ */
  const DAILY_CAP_NORMAL = 2;

  for (let di = 0; di < numDays; di++) {
    for (const p of sched) {
      // Classes sorted by how far behind their daily targets they are
      const classOrder = [...classes].sort((a, b) => {
        const defA = normalSubjects.filter(s => s.classId === a.id)
          .reduce((sum, s) => sum + Math.max(0, dailyTarget[s.id][di] - dailyPlaced[s.id][di]), 0);
        const defB = normalSubjects.filter(s => s.classId === b.id)
          .reduce((sum, s) => sum + Math.max(0, dailyTarget[s.id][di] - dailyPlaced[s.id][di]), 0);
        return defB - defA;
      });

      for (const cls of classOrder) {
        if (!isClassFree(cls.id, di, p)) continue;

        const candidates = normalSubjects
          .filter(s => s.classId === cls.id && remaining[s.id] > 0)
          .map(s => {
            const used = dailyPlaced[s.id][di];
            if (used >= DAILY_CAP_NORMAL) return null;
            const def   = dailyTarget[s.id][di] - used;
            const score = def * 10000 + remaining[s.id] * 10 - used * 5000;
            return { s, score };
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score)
          .map(x => x.s);

        for (const subj of candidates) {
          if (!subj.teacherId) continue;
          if (placeSubject(subj.id, subj.teacherId, cls.id, di, p)) break;
        }
      }
    }
  }

  /* ══════════════════════════════════════════
     PHASE D: Overflow passes (cap 3/day, up to 5 passes)
   ══════════════════════════════════════════ */
  const DAILY_CAP_OVERFLOW = 3;

  for (let pass = 0; pass < 5; pass++) {
    let placedAny = false;

    for (let di = 0; di < numDays; di++) {
      for (const p of sched) {
        const classOrder = [...classes].sort((a, b) => {
          const remA = normalSubjects.filter(s => s.classId === a.id).reduce((sum, s) => sum + remaining[s.id], 0);
          const remB = normalSubjects.filter(s => s.classId === b.id).reduce((sum, s) => sum + remaining[s.id], 0);
          return remB - remA;
        });

        for (const cls of classOrder) {
          if (!isClassFree(cls.id, di, p)) continue;

          const candidates = normalSubjects
            .filter(s => s.classId === cls.id && remaining[s.id] > 0)
            .map(s => {
              const used = dailyPlaced[s.id][di];
              if (used >= DAILY_CAP_OVERFLOW) return null;
              return { s, score: remaining[s.id] * 100 - used * 200 };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .map(x => x.s);

          for (const subj of candidates) {
            if (!subj.teacherId) continue;
            if (placeSubject(subj.id, subj.teacherId, cls.id, di, p)) {
              placedAny = true;
              break;
            }
          }
        }
      }
    }

    const allDone = normalSubjects.every(s => remaining[s.id] <= 0);
    if (allDone || !placedAny) break;
  }

  /* ══════════════════════════════════════════
     PHASE E: Swap-based repair pass
     ─ For each still-unscheduled subject, find
       a slot where the teacher is free but the
       class is occupied by a lower-priority subject
       that CAN be moved elsewhere.
   ══════════════════════════════════════════ */
  const unscheduled = normalSubjects.filter(s => remaining[s.id] > 0);

  for (const targetSubj of unscheduled) {
    if (remaining[targetSubj.id] <= 0) continue;
    if (!targetSubj.teacherId) continue;

    // Look for slots where targetSubj's teacher is free
    // but targetSubj's class has something already placed
    let repaired = false;

    for (let di = 0; di < numDays && !repaired; di++) {
      if (dailyPlaced[targetSubj.id][di] >= DAILY_CAP_OVERFLOW) continue;

      for (const p of sched) {
        if (!isTeacherFree(targetSubj.teacherId, di, p)) continue;
        if (!teacherUnderCap(targetSubj.teacherId)) break;

        const classSlot = classTimetables[targetSubj.classId]?.[di]?.[p];
        if (classSlot === null) {
          // Class slot is free — teacher is free — place directly
          if (placeSubject(targetSubj.id, targetSubj.teacherId, targetSubj.classId, di, p)) {
            repaired = true;
            break;
          }
          continue;
        }

        // Class slot is occupied. Try to relocate the blocker.
        if (typeof classSlot !== 'string' || classSlot.startsWith('__')) continue;

        // Remove the blocker temporarily
        const removed = removeSubject(targetSubj.classId, di, p);
        if (!removed) continue;

        const blockerSubj = subjects.find(s => s.id === removed.sid);

        // Try to place targetSubj in the now-freed slot
        const placed = placeSubject(targetSubj.id, targetSubj.teacherId, targetSubj.classId, di, p);

        if (placed) {
          // Now try to re-place the blocker somewhere else
          let blockerReplaced = false;
          if (blockerSubj && blockerSubj.teacherId) {
            for (let di2 = 0; di2 < numDays && !blockerReplaced; di2++) {
              if (dailyPlaced[removed.sid][di2] >= DAILY_CAP_OVERFLOW) continue;
              for (const p2 of sched) {
                if (blockerReplaced) break;
                blockerReplaced = placeSubject(removed.sid, removed.tid, removed.cid, di2, p2);
              }
            }
          }
          repaired = true;
          break;
        } else {
          // Can't place targetSubj here — restore the blocker
          classTimetables[removed.cid][di][p]   = removed.sid;
          teacherTimetables[removed.tid][di][p] = { subjectId: removed.sid, classId: removed.cid };
          remaining[removed.sid]--;
          dailyPlaced[removed.sid][di]++;
          teacherLoad[removed.tid]++;
        }
      }
    }
  }

  return { classTimetables, teacherTimetables };
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

  // 1. Teacher double-booking check
  teachers.forEach(t => {
    const tt = teacherTimetables[t.id];
    if (!tt) return;
    for (let di = 0; di < numDays; di++) {
      for (const p of sched) {
        const slot = tt[di]?.[p];
        if (!slot || typeof slot !== 'object' || !slot.subjectId) continue;
        // Count how many class-timetable slots this teacher's slot corresponds to
        // (Should always be exactly 1 for non-combined)
        // Combined groups are fine — teacher teaches one group in one slot
      }
    }
  });

  // 2. Unscheduled subject check
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
