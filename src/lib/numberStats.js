/**
 * Statistics for a number column, for its card on the Insights tab.
 *
 * The app doesn't know what a number is - a weight, minutes, a rating - so by
 * default it shows every entry as it was written, with a trend line through
 * them, which is right for any of those. Adding the numbers up (minutes a
 * week) is right only for some, so that is the owner's choice: the column's
 * `combine` setting, 'sum' or 'average'.
 */
import { toDayNumber, fromDayNumber } from './insights.js';

// The trend moves 10% of the way to each day's value, as in John Walker's
// Hacker's Diet: day-to-day noise mostly cancels, and a real change shows
// within a couple of weeks.
const SMOOTHING = 0.1;
// The weekly rate is the slope of the trend over this many recent days.
const RATE_DAYS = 28;
const MIN_RATE_POINTS = 4;
const MIN_RATE_SPAN = 14;

export const RANGES = [
  { name: '1M', days: 30 },
  { name: '3M', days: 91 },
  { name: '1Y', days: 365 },
  { name: 'All', days: Infinity },
];

/**
 * Every value in the column, oldest first: `{day, value}`, `day` a day number
 * (see insights.js).
 */
export function getEntries(contributionsByDay, columnIndex) {
  const entries = [];
  Object.keys(contributionsByDay || {}).forEach(key => {
    const dayContributions = contributionsByDay[key];
    const date = dayContributions.date;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    const day = toDayNumber(date);
    dayContributions.rows.forEach(row => {
      const cell = row.cells && row.cells[columnIndex];
      const value = cell ? cell.value : NaN;
      if (typeof value === 'number' && Number.isFinite(value)) entries.push({ day, value });
    });
  });
  return entries.sort((a, b) => a.day - b.day);
}

/**
 * The trend through the daily averages: one point per day with entries.
 * After a gap of several days it moves as if each missed day had brought the
 * same value, as Libra does, so a week away doesn't freeze it.
 */
export function getTrend(entries) {
  const daily = [];
  entries.forEach(entry => {
    const last = daily[daily.length - 1];
    if (last && last.day === entry.day) {
      last.sum += entry.value;
      last.count += 1;
    } else {
      daily.push({ day: entry.day, sum: entry.value, count: 1 });
    }
  });

  const trend = [];
  daily.forEach((point, i) => {
    const value = point.sum / point.count;
    if (i === 0) {
      trend.push({ day: point.day, value });
      return;
    }
    const previous = trend[i - 1];
    const weight = 1 - Math.pow(1 - SMOOTHING, point.day - previous.day);
    trend.push({ day: point.day, value: previous.value + weight * (value - previous.value) });
  });
  return trend;
}

/**
 * What a number card shows for the days `first` to `last` (day numbers):
 * the entries and trend inside them, or their totals when the column adds up.
 */
export function getNumberSummary(entries, { first, last, combine }) {
  const inRange = entries.filter(entry => first <= entry.day && entry.day <= last);
  if (inRange.length === 0) return null;
  const summary = {
    entries: inRange,
    count: inRange.length,
    days: new Set(inRange.map(entry => entry.day)).size,
    lowest: extreme(inRange, (a, b) => a.value < b.value),
    highest: extreme(inRange, (a, b) => a.value > b.value),
    decimals: getDecimals(inRange),
  };
  return combine === 'sum' ?
    Object.assign(summary, getTotals(entries, inRange, first, last)) :
    Object.assign(summary, getTrendSummary(entries, first, last));
}

function getTrendSummary(entries, first, last) {
  // The trend is worked out from the first entry ever, so it has settled by
  // the time the range starts.
  const trend = getTrend(entries).filter(point => point.day <= last);
  const shown = trend.filter(point => point.day >= first);
  const end = shown[shown.length - 1];
  const start = shown[0];

  const recent = shown.filter(point => point.day > end.day - RATE_DAYS);
  const span = recent.length ? end.day - recent[0].day : 0;
  const perWeek = recent.length >= MIN_RATE_POINTS && span >= MIN_RATE_SPAN ?
    slope(recent) * 7 : null;

  return {
    trend: shown,
    current: end.value,
    change: shown.length > 1 ? end.value - start.value : null,
    changeSince: fromDayNumber(start.day),
    perWeek,
  };
}

/**
 * Totals per day for a month or less, per week (Sunday to Saturday) up to a
 * year, and per month beyond that - about 30 to 50 bars.
 */
function getTotals(entries, inRange, first, last) {
  const length = last - first + 1;
  const bucketOf = length <= 45 ? day => day :
    length <= 400 ? day => day - weekdayOf(day) :
      day => toDayNumber(firstOfMonth(fromDayNumber(day)));
  const unit = length <= 45 ? 'day' : length <= 400 ? 'week' : 'month';

  const totals = new Map();
  for (let day = bucketOf(first); day <= last; day = nextBucket(day, unit)) totals.set(day, 0);
  inRange.forEach(entry => {
    const bucket = bucketOf(entry.day);
    totals.set(bucket, (totals.get(bucket) || 0) + entry.value);
  });
  const buckets = Array.from(totals, ([day, total]) => ({ day, total }));

  const total = inRange.reduce((sum, entry) => sum + entry.value, 0);
  // The same number of days just before, when the records reach back that far.
  const previousFirst = first - length;
  const previousTotal = entries.length && entries[0].day <= previousFirst ?
    entries.filter(e => previousFirst <= e.day && e.day < first).reduce((sum, e) => sum + e.value, 0) :
    null;
  return {
    unit,
    buckets,
    total,
    previousTotal,
    best: buckets.reduce((best, bucket) => (bucket.total > best.total ? bucket : best)),
  };
}

function nextBucket(day, unit) {
  if (unit === 'day') return day + 1;
  if (unit === 'week') return day + 7;
  const date = fromDayNumber(day);
  return toDayNumber(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

function firstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function weekdayOf(day) {
  return (((day + 4) % 7) + 7) % 7;
}

// Least-squares slope, per day.
function slope(points) {
  const n = points.length;
  const meanX = points.reduce((sum, p) => sum + p.day, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.value, 0) / n;
  let top = 0;
  let bottom = 0;
  points.forEach(p => {
    top += (p.day - meanX) * (p.value - meanY);
    bottom += (p.day - meanX) ** 2;
  });
  return bottom ? top / bottom : 0;
}

// The first entry that beats all others, so a repeated low is its first day.
function extreme(entries, beats) {
  return entries.reduce((best, entry) => (beats(entry, best) ? entry : best));
}

// As many decimals as the entries use, up to two.
function getDecimals(entries) {
  let decimals = 0;
  entries.forEach(({ value }) => {
    const text = String(value);
    const dot = text.indexOf('.');
    if (dot >= 0) decimals = Math.max(decimals, Math.min(2, text.length - dot - 1));
  });
  return decimals;
}

export function formatNumber(value, decimals) {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** With its sign, and a real minus: "+0.8", "−1.1". */
export function formatChange(value, decimals) {
  const text = formatNumber(Math.abs(value), decimals);
  if (Number(text.replace(/,/g, '')) === 0) return '±0';
  return (value < 0 ? '−' : '+') + text;
}
