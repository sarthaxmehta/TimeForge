/**
 * TimeForge — Timetable Generator v5 "Maestro"
 *
 * Design principles:
 *   1. ZERO conflicts — teacher or class double-booking is physically impossible.
 *   2. EVEN DISTRIBUTION — every subject's periods are spread as evenly as possible
 *      across working days using pre-computed daily quotas.
 *   3. DAILY CAP — no subject appears more than 2× on the same day in the first pass.
 *      Overflow (unavoidable extras) are placed in a second pass (cap = 3).
 *   4. COMBINED GROUPS — scheduled atomically and distributed evenly first.
 *   5. CLASS TEACHER first-period rule respected as a soft constraint.
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
 * Compute per-day targets for a subject with R required periods over D days.
 * Returns an array of length D where sum === R, values differ by at most 1.
 * Extra periods go to randomly chosen days so the schedule feels natural.
 */
function computeDailyTargets(R, D) {
  const base = Math.floor(R / D);
  const extra = R % D;
  const targets = Array(D).fill(base);
  // Distribute extras to random day indices
  const dayIndices = shuffle(Array.from({ length: D }, (_, i) => i));
  for (let i = 0; i < extra; i++) targets[dayIndices[i]]++;
  return targets;
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════════════ */
export function generateTimetable(classes, subjects, teachers, settings) {
  const { workingDays, periods = [] } = settings;
  const numDays    = workingDays.length;
  const numPeriods = periods.length;
  const sched      = getSchedulableIndexes(periods);   // period-index array

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
  const remaining     = {};   // remaining[sid]       = periods left to place
  const dailyTarget   = {};   // dailyTarget[sid][di] = ideal placements on day di
  const dailyPlaced   = {};   // dailyPlaced[sid][di] = placed so far on day di

  subjects.forEach(s => {
    const R = Number(s.requiredPeriods) || 0;
    remaining[s.id]   = R;
    dailyTarget[s.id] = computeDailyTargets(R, numDays);
    dailyPlaced[s.id] = Array(numDays).fill(0);
  });

  const teacherLoad = {};   // teacherLoad[tid] = total periods assigned
  const teacherMax  = {};   // teacherMax[tid]  = cap
  teachers.forEach(t => {
    teacherLoad[t.id] = 0;
    teacherMax[t.id]  = Number(t.maxPeriods) || 9999;
  });

  /* ── 3. Conflict-safe write helpers ── */
  const isClassFree   = (cid, di, p) => classTimetables[cid]?.[di]?.[p] === null;
  const isTeacherFree = (tid, di, p) => !!tid && teacherTimetables[tid]?.[di]?.[p] === null;
  const teacherUnderCap = (tid) => (teacherLoad[tid] || 0) < (teacherMax[tid] || 9999);

  /** Place a single normal subject — ONLY IF both class and teacher are free */
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

  /** Place a combined group — ALL members must be free simultaneously */
  function placeGroup(groupSubs, groupId, di, p) {
    if (!groupSubs.every(gs => gs.teacherId && isTeacherFree(gs.teacherId, di, p) && teacherUnderCap(gs.teacherId))) return false;
    if (!groupSubs.every(gs => isClassFree(gs.classId, di, p))) return false;
    for (const gs of groupSubs) {
      classTimetables[gs.classId][di][p] = `__group__:${groupId}`;
      teacherTimetables[gs.teacherId][di][p] = { subjectId: gs.id, classId: gs.classId, combinedGroupId: groupId };
      remaining[gs.id]--;
      dailyPlaced[gs.id][di]++;
      teacherLoad[gs.teacherId]++;
    }
    return true;
  }

  /* ── 4. Build combined group map ── */
  const groupMap = {};
  subjects.forEach(s => {
    if (s.combinedGroupId) {
      (groupMap[s.combinedGroupId] = groupMap[s.combinedGroupId] || []).push(s);
    }
  });
  const normalSubjects = subjects.filter(s => !s.combinedGroupId);

  /* ══════════════════════════════════════════
     PHASE A: Combined groups — distributed
   ══════════════════════════════════════════ */
  for (const [groupId, groupSubs] of Object.entries(groupMap)) {
    // Use the first subject's requiredPeriods as the group total
    const R = Number(groupSubs[0]?.requiredPeriods) || 0;
    const groupTargets = computeDailyTargets(R, numDays);

    for (let di = 0; di < numDays; di++) {
      let placed = 0;
      for (const p of sched) {
        if (placed >= groupTargets[di]) break;
        if (groupSubs.every(gs => remaining[gs.id] <= 0)) break;
        if (placeGroup(groupSubs, groupId, di, p)) placed++;
      }
    }

    // Overflow pass — place any still-remaining group periods anywhere
    if (groupSubs.some(gs => remaining[gs.id] > 0)) {
      for (let di = 0; di < numDays; di++) {
        for (const p of sched) {
          if (groupSubs.every(gs => remaining[gs.id] <= 0)) break;
          placeGroup(groupSubs, groupId, di, p);
        }
        if (groupSubs.every(gs => remaining[gs.id] <= 0)) break;
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
        // Find best matching subject: class teacher teaches it, has remaining AND daily budget
        const ctSubj = normalSubjects
          .filter(s =>
            s.classId === cls.id &&
            s.teacherId === cls.classTeacherId &&
            remaining[s.id] > 0 &&
            dailyPlaced[s.id][di] < dailyTarget[s.id][di]
          )
          .sort((a, b) => remaining[b.id] - remaining[a.id])[0];
        if (!ctSubj) continue;
        placeSubject(ctSubj.id, ctSubj.teacherId, cls.id, di, firstP);
      }
    }
  }

  /* ══════════════════════════════════════════
     PHASE C: Main distribution pass (cap = 2/day)
     ─ iterate day → period → class in priority order
   ══════════════════════════════════════════ */

  // We iterate over periods first (outer) so every class gets a fair shot at
  // each period slot before moving on, avoiding starvation.
  const DAILY_CAP_NORMAL = 2;

  // Build a per-slot "busy teachers" snapshot inline during iteration for O(1) conflict checks
  // (teacherTimetables already records the assignment — isTeacherFree is O(1))

  for (let di = 0; di < numDays; di++) {
    for (const p of sched) {
      // Sort classes: most "daily deficit" first so urgent classes get priority
      const classOrder = [...classes].sort((a, b) => {
        const defA = normalSubjects
          .filter(s => s.classId === a.id)
          .reduce((sum, s) => sum + Math.max(0, dailyTarget[s.id][di] - dailyPlaced[s.id][di]), 0);
        const defB = normalSubjects
          .filter(s => s.classId === b.id)
          .reduce((sum, s) => sum + Math.max(0, dailyTarget[s.id][di] - dailyPlaced[s.id][di]), 0);
        return defB - defA;
      });

      for (const cls of classOrder) {
        if (!isClassFree(cls.id, di, p)) continue;

        // Priority-rank candidate subjects for this class
        const candidates = normalSubjects
          .filter(s => s.classId === cls.id && remaining[s.id] > 0)
          .map(s => {
            const dailyDef    = dailyTarget[s.id][di] - dailyPlaced[s.id][di]; // positive = still needs more today
            const alreadyUsed = dailyPlaced[s.id][di];
            // Hard cap: skip if already at DAILY_CAP_NORMAL today
            if (alreadyUsed >= DAILY_CAP_NORMAL) return null;
            // Scoring: strongly prefer subjects that haven't met today's quota
            const score = dailyDef * 10000 + remaining[s.id] * 10 - alreadyUsed * 5000;
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
     PHASE D: Overflow pass (cap = 3/day, multi-pass)
     — places any subjects still unscheduled
   ══════════════════════════════════════════ */
  const DAILY_CAP_OVERFLOW = 3;
  const MAX_OVERFLOW_PASSES = 5;

  for (let pass = 0; pass < MAX_OVERFLOW_PASSES; pass++) {
    let placedAny = false;

    for (let di = 0; di < numDays; di++) {
      for (const p of sched) {
        // Sort classes: most overall remaining first
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
              if (dailyPlaced[s.id][di] >= DAILY_CAP_OVERFLOW) return null;
              // Prefer subjects with most remaining AND least placed today (fairness)
              const score = remaining[s.id] * 100 - dailyPlaced[s.id][di] * 200;
              return { s, score };
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

    // Exit early once all subjects fully placed
    const allDone = normalSubjects.every(s => remaining[s.id] <= 0);
    if (allDone || !placedAny) break;
  }

  return { classTimetables, teacherTimetables };
}
