/**
 * Statistics for the Insights tab, computed from the records already loaded.
 *
 * Days are counted as whole calendar days since January 1, 1970 ("day
 * numbers"), so neither daylight saving nor the hour of a record can move it
 * to another day, and weekdays and gaps are plain integer arithmetic.
 *
 * A pattern is only put into words when there is enough data for it and it is
 * big enough to matter. Most "insights" people read off exploratory charts
 * turn out to be false (Zgraggen et al., CHI 2018), so every sentence below
 * has a minimum count, and the two that compare groups need a significance
 * test to pass as well.
 */
import { formatDateOnly, getDateFromFilterString } from './dateUtils.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 30;
const SPARKLINE_DAYS = 365;
// Each weekday has to come up this many times in the period before its rate is
// drawn, and twice as many before a sentence says one weekday stands out.
export const MIN_WEEKS_FOR_CHART = 4;
const MIN_WEEKS_FOR_CLAIM = 8;
export const MIN_TIMED_FOR_CHART = 10;
const MIN_TIMED_FOR_CLAIM = 15;
export const MIN_GAPS = 10;
// Two sentences come from a test (the recent change, the weekday pattern), so
// each gets half of the usual 5% (Bonferroni).
const ALPHA = 0.025;
const MAX_SENTENCES = 3;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Everything the Insights tab shows, for the records of `contributionsByDay`
 * inside the `from`/`to` filter (all of them when there is no filter).
 * Returns null when that leaves no records.
 */
export function getInsights(contributionsByDay, { from, to } = {}, today = new Date()) {
  const records = collectRecords(contributionsByDay);
  if (records.length === 0) return null;

  const todayNumber = toDayNumber(today);
  const allDays = uniqueSorted(records.map(record => record.day));
  const firstDay = allDays[0];
  const scope = getScope(from, to, firstDay, todayNumber);
  const inScope = day => scope.first <= day && day <= scope.last;
  const days = allDays.filter(inScope);
  if (days.length === 0) return null;

  const active = new Set(allDays);
  const scopedRecords = records.filter(record => inScope(record.day));
  const minutes = scopedRecords
    .map(record => record.minute)
    .filter(minute => minute !== null);

  const insights = {
    scope: {
      first: fromDayNumber(scope.first),
      last: fromDayNumber(scope.last),
      isAllTime: scope.isAllTime,
      reachesToday: scope.reachesToday,
    },
    recent: getRecent(active, scope, firstDay),
    strength: getHabitStrength(allDays, active, scope),
    weekdays: getWeekdays(active, scope),
    hours: getHours(minutes),
    consistency: getConsistency(days, scope, todayNumber, scopedRecords.length),
  };
  insights.sentences = getSentences(insights, scope);
  return insights;
}

/**
 * One entry per record: its day, and its minute of the day when it has a
 * time. A time of exactly midnight is taken as "no time": that is what a
 * record gets when it's added for an earlier day from the heatmap, or when the
 * sheet holds only dates.
 */
function collectRecords(contributionsByDay) {
  const records = [];
  Object.keys(contributionsByDay || {}).forEach(key => {
    const date = getDateFromFilterString(key);
    if (Number.isNaN(date.getTime())) return;
    const day = toDayNumber(date);
    contributionsByDay[key].rows.forEach(row => {
      records.push({ day, minute: getMinuteOfDay(row) });
    });
  });
  return records;
}

function getMinuteOfDay(row) {
  const cell = row.cells && row.cells.find(c => c.value instanceof Date);
  const date = cell && cell.value;
  if (!date || Number.isNaN(date.getTime())) return null;
  const minute = date.getHours() * 60 + date.getMinutes();
  if (minute === 0 && date.getSeconds() === 0) return null;
  return minute;
}

function getScope(from, to, firstDay, today) {
  const a = from && toDayNumber(getDateFromFilterString(from));
  const b = to ? toDayNumber(getDateFromFilterString(to)) : a;
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return { first: firstDay, last: today, isAllTime: true, reachesToday: true };
  }
  // The ends can come in either order (shift-tapping an earlier day), and a
  // range reaching into the future stops at today.
  const last = Math.min(Math.max(a, b), today);
  return { first: Math.min(a, b), last, isAllTime: false, reachesToday: last === today };
}

/**
 * Active days in the last 30 days (or in the filtered period), and in the
 * same number of days before it - when the records go back that far.
 */
function getRecent(active, scope, firstDay) {
  const first = scope.isAllTime ? Math.max(scope.last - RECENT_DAYS + 1, firstDay) : scope.first;
  const length = scope.last - first + 1;
  const previousFirst = first - length;
  return {
    title: getRecentTitle(scope, first, length),
    days: length,
    count: countActive(active, first, scope.last),
    previousCount: previousFirst >= firstDay ? countActive(active, previousFirst, first - 1) : null,
  };
}

function getRecentTitle(scope, first, length) {
  // The filter above the tab already names the period.
  if (!scope.isAllTime) return 'This period';
  if (length === RECENT_DAYS) return `Last ${RECENT_DAYS} days`;
  return 'Since ' + formatDateOnly(fromDayNumber(first));
}

/**
 * Loop Habit Tracker's habit score (uhabits-core, Score.kt): every day the
 * score moves a little towards 1 if the target was met and towards 0 if it
 * wasn't, so recent days count the most and one missed day only dents it. For
 * a daily target it halves in 13 days without a record, and a perfect run
 * takes it to about 80% in a month and 96% in two.
 *
 * Loop asks for the target; here it's the owner's usual pace, the median
 * number of days with a record in the weeks that have any. Someone who runs
 * three days a week then scores 100% for keeping that up, not 43%.
 */
function getHabitStrength(allDays, active, scope) {
  const firstDay = allDays[0];
  const lastDay = scope.last;
  const target = getUsualPace(allDays, lastDay);
  const multiplier = Math.pow(0.5, Math.sqrt(target / 7) / 13);
  // Like Loop, a target of fewer than 7 days a week is checked over two weeks,
  // which is kinder to a schedule that isn't the same every week.
  const window = target === 7 ? 1 : 14;
  const needed = target === 7 ? 1 : 2 * target;

  const series = [];
  let score = 0;
  let inWindow = 0;
  for (let day = firstDay; day <= lastDay; ++day) {
    if (active.has(day)) inWindow += 1;
    if (day - window >= firstDay && active.has(day - window)) inWindow -= 1;
    score = score * multiplier + Math.min(1, inWindow / needed) * (1 - multiplier);
    series.push(score);
  }

  const shownFrom = scope.isAllTime ? lastDay - SPARKLINE_DAYS + 1 : scope.first;
  return {
    score,
    target,
    isYoung: lastDay - firstDay + 1 < 30,
    series: series.slice(Math.max(0, shownFrom - firstDay)),
  };
}

function getUsualPace(allDays, lastDay) {
  const perWeek = new Map();
  allDays.forEach(day => {
    if (day > lastDay) return;
    const week = weekOf(day);
    perWeek.set(week, (perWeek.get(week) || 0) + 1);
  });
  // The first and last weeks are usually cut short, so leave them out when
  // there are others.
  const firstWeek = weekOf(allDays[0]);
  const lastWeek = weekOf(lastDay);
  const counts = [];
  perWeek.forEach((count, week) => {
    if (week !== firstWeek && week !== lastWeek) counts.push(count);
  });
  // Without a whole week yet, go by the share of days so far.
  const pace = counts.length ? median(counts) :
    7 * allDays.filter(day => day <= lastDay).length / (lastDay - allDays[0] + 1);
  return Math.max(1, Math.min(7, Math.round(pace)));
}

/**
 * The share of each weekday with a record. Counted as a rate, since a period
 * can hold five Mondays and four Sundays.
 */
function getWeekdays(active, scope) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let day = scope.first; day <= scope.last; ++day) {
    const weekday = weekdayOf(day);
    totals[weekday] += 1;
    if (active.has(day)) counts[weekday] += 1;
  }
  const fewest = Math.min(...totals);
  return {
    counts,
    totals,
    rates: counts.map((count, i) => (totals[i] ? count / totals[i] : 0)),
    enough: fewest >= MIN_WEEKS_FOR_CHART,
    fewest,
    p: chiSquareWeekdays(counts, totals),
  };
}

/**
 * Records per hour of the day, and the shortest stretch of the day holding
 * half of them.
 */
function getHours(minutes) {
  const counts = new Array(24).fill(0);
  minutes.forEach(minute => { counts[Math.floor(minute / 60)] += 1; });
  return {
    counts,
    count: minutes.length,
    enough: minutes.length >= MIN_TIMED_FOR_CHART,
    half: minutes.length ? getBusiestHalf(minutes) : null,
  };
}

function getBusiestHalf(minutes) {
  const sorted = minutes.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const size = Math.ceil(n / 2);
  let best = null;
  for (let i = 0; i < n; ++i) {
    const j = (i + size - 1) % n;
    // Measured round the clock: 11pm to 1am is two hours.
    const span = (sorted[j] - sorted[i] + 1440) % 1440;
    if (!best || span < best.span) best = { start: sorted[i], end: sorted[j], span };
  }
  const startHour = Math.floor(best.start / 60);
  let endHour = Math.ceil(best.end / 60);
  if (endHour === startHour) endHour += 1;
  return {
    startHour,
    endHour: endHour % 24,
    hours: (endHour - startHour + 24) % 24 || 24,
  };
}

function getConsistency(days, scope, today, recordCount) {
  const streaks = getRuns(days);
  const longest = maxBy(streaks);
  const lastStreak = streaks[streaks.length - 1];
  const current = scope.reachesToday && lastStreak.last >= today - 1 ? lastStreak : null;

  const weekRuns = getRuns(uniqueSorted(days.map(weekOf)));
  const lastWeeks = weekRuns[weekRuns.length - 1];
  const currentWeeks = scope.reachesToday && lastWeeks.last >= weekOf(today) - 1 ? lastWeeks.count : 0;

  const gaps = [];
  let longestBreak = null;
  for (let i = 1; i < days.length; ++i) {
    const gap = days[i] - days[i - 1];
    gaps.push(gap);
    if (gap > 1 && (!longestBreak || gap - 1 > longestBreak.count)) {
      longestBreak = { first: days[i - 1] + 1, last: days[i] - 1, count: gap - 1 };
    }
  }
  const sortedGaps = gaps.slice().sort((a, b) => a - b);

  return {
    activeDays: days.length,
    totalDays: scope.last - scope.first + 1,
    recordCount,
    longest: toDateRun(longest),
    current: current ? toDateRun(current) : null,
    isLongestCurrent: current === longest && streaks.length > 1,
    longestWeeks: maxBy(weekRuns).count,
    currentWeeks,
    gaps,
    typicalGap: gaps.length >= MIN_GAPS ? quantile(sortedGaps, 0.5) : null,
    gap90: gaps.length >= MIN_GAPS ? quantile(sortedGaps, 0.9) : null,
    longestBreak: longestBreak ? toDateRun(longestBreak) : null,
    lastDay: fromDayNumber(days[days.length - 1]),
    daysSinceLast: scope.reachesToday ? today - days[days.length - 1] : null,
  };
}

function getSentences(insights, scope) {
  const { consistency, recent, weekdays, hours } = insights;
  const sentences = [];

  if (consistency.current && consistency.isLongestCurrent && consistency.current.count >= 3) {
    sentences.push(`You're on your longest streak so far: ${formatDays(consistency.current.count)}.`);
  }

  if (scope.isAllTime && recent.days === RECENT_DAYS && recent.previousCount !== null) {
    const now = recent.count;
    const before = recent.previousCount;
    if (fisherExact(now, RECENT_DAYS, before, RECENT_DAYS) < ALPHA) {
      sentences.push(now > before ?
        `More active lately: ${now} of the last ${RECENT_DAYS} days, up from ${before} in the ${RECENT_DAYS} before.` :
        `Less active lately: ${now} of the last ${RECENT_DAYS} days, down from ${before} in the ${RECENT_DAYS} before.`);
    }
  }

  const since = consistency.daysSinceLast;
  if (since >= 2 && consistency.gaps.length >= MIN_GAPS) {
    const sooner = consistency.gaps.filter(gap => gap < since).length / consistency.gaps.length;
    if (sooner === 1) {
      sentences.push(`It's been ${formatDays(since)} since the last record, the longest wait so far.`);
    } else if (sooner >= 0.9) {
      sentences.push(`It's been ${formatDays(since)} since the last record; 9 in 10 times the next one came sooner.`);
    }
  }

  if (weekdays.fewest >= MIN_WEEKS_FOR_CLAIM && weekdays.p < ALPHA) {
    const { rates } = weekdays;
    const best = rates.indexOf(Math.max(...rates));
    const worst = rates.indexOf(Math.min(...rates));
    if (rates[best] - rates[worst] >= 0.2) {
      sentences.push(`You're most active on ${WEEKDAYS[best]}s (${percent(rates[best])} of them) ` +
        `and least on ${WEEKDAYS[worst]}s (${percent(rates[worst])}).`);
    }
  }

  // Half the records inside a quarter of the day is a habit, not chance.
  if (hours.count >= MIN_TIMED_FOR_CLAIM && hours.half.hours <= 6) {
    sentences.push(`Half of the records are made between ${formatHour(hours.half.startHour)} ` +
      `and ${formatHour(hours.half.endHour)}.`);
  }

  return sentences.slice(0, MAX_SENTENCES);
}

// Statistics.

/**
 * Two-sided Fisher exact test: is `a` of `n1` days different from `b` of `n2`?
 */
export function fisherExact(a, n1, b, n2) {
  const k = a + b;
  const logP = x => logChoose(n1, x) + logChoose(n2, k - x) - logChoose(n1 + n2, k);
  const observed = logP(a);
  let p = 0;
  for (let x = Math.max(0, k - n2); x <= Math.min(k, n1); ++x) {
    const lp = logP(x);
    if (lp <= observed + 1e-7) p += Math.exp(lp);
  }
  return Math.min(1, p);
}

/**
 * Chi-square test of "every weekday is equally likely to have a record",
 * over the 2 x 7 table of days with and without one. With 6 degrees of
 * freedom the tail has a closed form.
 */
export function chiSquareWeekdays(counts, totals) {
  const days = totals.reduce((sum, x) => sum + x, 0);
  const active = counts.reduce((sum, x) => sum + x, 0);
  if (active === 0 || active === days) return 1;
  let statistic = 0;
  counts.forEach((count, i) => {
    const expected = totals[i] * active / days;
    const expectedIdle = totals[i] - expected;
    statistic += (count - expected) ** 2 / expected;
    statistic += (totals[i] - count - expectedIdle) ** 2 / expectedIdle;
  });
  const h = statistic / 2;
  return Math.exp(-h) * (1 + h + h * h / 2);
}

function logChoose(n, k) {
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
}

function logFactorial(n) {
  let sum = 0;
  for (let i = 2; i <= n; ++i) sum += Math.log(i);
  return sum;
}

function median(values) {
  return quantile(values.slice().sort((a, b) => a - b), 0.5);
}

// Nearest rank: always one of the values, so a typical gap is a whole number of days.
function quantile(sorted, q) {
  return sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)];
}

// Days and weeks.

export function toDayNumber(date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function fromDayNumber(day) {
  const utc = new Date(day * DAY_MS);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

// January 1, 1970 was a Thursday; 0 is Sunday, as in Date.getDay().
function weekdayOf(day) {
  return (((day + 4) % 7) + 7) % 7;
}

// Weeks run Sunday to Saturday, as on the heatmap.
function weekOf(day) {
  return Math.floor((day + 4) / 7);
}

function countActive(active, first, last) {
  let count = 0;
  for (let day = first; day <= last; ++day) if (active.has(day)) count += 1;
  return count;
}

/** Runs of consecutive numbers in a sorted list. */
function getRuns(sorted) {
  const runs = [];
  sorted.forEach(value => {
    const run = runs[runs.length - 1];
    if (run && value === run.last + 1) {
      run.last = value;
      run.count += 1;
    } else {
      runs.push({ first: value, last: value, count: 1 });
    }
  });
  return runs;
}

// The earliest of the longest, as on the overview.
function maxBy(runs) {
  return runs.reduce((best, run) => (run.count > best.count ? run : best));
}

function toDateRun(run) {
  return { first: fromDayNumber(run.first), last: fromDayNumber(run.last), count: run.count };
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

// Words.

export function formatDays(count) {
  return count === 1 ? '1 day' : `${count.toLocaleString('en-US')} days`;
}

export function formatHour(hour) {
  if (hour === 0) return 'midnight';
  if (hour === 12) return 'noon';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

export function percent(share) {
  return Math.round(share * 100) + '%';
}
