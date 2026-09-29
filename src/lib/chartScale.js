/**
 * Axes for the number charts on the Insights tab: a few gridlines on round
 * values, and dates where weeks, months or years begin.
 */
import { toDayNumber, fromDayNumber, weekdayOf, weekOf } from './insights.js';
import { SHORT_MONTH_NAMES } from './dateUtils.js';

// About four gridlines: two tell too little, seven are clutter. A step of at
// least a quarter of the values' span gives three to six of them.
const GRID_STEPS = 4;
// The values never fill less than this share of their size, so a change of
// 0.2 in a weight of 74 stays small instead of filling the chart.
const MIN_SPAN_SHARE = 0.03;
// Room above and below the values, so no dot sits on the edge.
const PADDING = 0.08;

/**
 * Gridlines for `values`: `{min, max, ticks}` with `ticks` on round steps
 * (1, 2 or 5 times a power of ten) and `min`/`max` the first and last of them.
 * `fromZero` for bars, which always start at zero - below or above it.
 */
export function getValueScale(values, { fromZero = false } = {}) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  const neverNegative = min >= 0;
  if (fromZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  } else {
    const minSpan = MIN_SPAN_SHARE * Math.max(Math.abs(min), Math.abs(max));
    if (max - min < minSpan) {
      const middle = (min + max) / 2;
      min = middle - minSpan / 2;
      max = middle + minSpan / 2;
    }
    const pad = (max - min) * PADDING;
    min -= pad;
    max += pad;
    if (neverNegative) min = Math.max(0, min);
  }
  if (max === min) max = min + 1;

  const step = roundStep((max - min) / GRID_STEPS);
  const first = Math.floor(min / step + 1e-9);
  const last = Math.ceil(max / step - 1e-9);

  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const ticks = [];
  for (let i = first; i <= last; ++i) ticks.push(Number((i * step).toFixed(decimals)));
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks, decimals };
}

// The smallest of 1, 2, 5 or 10 times a power of ten that is at least `raw`.
function roundStep(raw) {
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const multiple = [1, 2, 5, 10].find(m => m * power >= raw * (1 - 1e-9));
  return multiple * power;
}

// From the finest to the coarsest; the first one whose labels fit is used.
const DATE_STEPS = [
  { unit: 'day', every: 1 },
  { unit: 'day', every: 2 },
  { unit: 'week', every: 1 },
  { unit: 'week', every: 2 },
  { unit: 'month', every: 1 },
  { unit: 'month', every: 2 },
  { unit: 'month', every: 3 },
  { unit: 'month', every: 6 },
  { unit: 'year', every: 1 },
  { unit: 'year', every: 2 },
  { unit: 'year', every: 5 },
  { unit: 'year', every: 10 },
  { unit: 'year', every: 25 },
];

/**
 * Dates to label between the day numbers `first` and `last`, as many as fit
 * in `width` pixels: `[{day, label, strong}]`. Weeks start on Sunday, as the
 * weekly totals do; a new year's label is `strong`.
 */
export function getDateTicks(first, last, width) {
  let ticks = [];
  for (const step of DATE_STEPS) {
    ticks = datesOf(step, first, last);
    const widest = Math.max(0, ...ticks.map(t => t.label.length));
    if (ticks.length * getLabelWidth(widest) <= width) return ticks;
  }
  return ticks;
}

/** About how wide a label of `chars` characters is, with room around it. */
export function getLabelWidth(chars) {
  return chars * 6.5 + 14;
}

// Steps straight from one boundary to the next, so ten years of months are
// a hundred and twenty steps, not three and a half thousand days.
function datesOf({ unit, every }, first, last) {
  const ticks = [];
  if (unit === 'day' || unit === 'week') {
    const start = unit === 'day' ? first : first + (7 - weekdayOf(first)) % 7;
    const step = unit === 'day' ? every : 7;
    for (let day = start; day <= last; day += step) {
      if (unit === 'week' && weekOf(day) % every !== 0) continue;
      ticks.push(dayTick(day, fromDayNumber(day)));
    }
    return ticks;
  }
  const start = fromDayNumber(first);
  const months = unit === 'month' ? every : 12 * every;
  // The first month (or year) that starts on or after `first`, on a multiple of `every`.
  let year = start.getFullYear();
  let month = start.getDate() === 1 ? start.getMonth() : start.getMonth() + 1;
  if (unit === 'year') {
    if (month > 0) year += 1;
    month = 0;
    year = Math.ceil(year / every) * every;
  } else {
    month = Math.ceil(month / every) * every;
  }
  for (let date = new Date(year, month, 1); ; date = new Date(date.getFullYear(), date.getMonth() + months, 1)) {
    const day = toDayNumber(date);
    if (day > last) break;
    const isYear = date.getMonth() === 0;
    ticks.push(isYear ?
      { day, label: String(date.getFullYear()), strong: unit === 'month' } :
      { day, label: SHORT_MONTH_NAMES[date.getMonth()], strong: false });
  }
  return ticks;
}

function dayTick(day, date) {
  const newYear = date.getMonth() === 0 && date.getDate() === 1;
  return newYear ?
    { day, label: String(date.getFullYear()), strong: true } :
    { day, label: `${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}`, strong: false };
}
