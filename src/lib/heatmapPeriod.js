/**
 * Which days the heatmap spans: from the month of the earliest record to
 * today, and never less than this week and the 52 before it.
 *
 * Columns are weeks, Sunday to Saturday; `start` is the Sunday of the first
 * one. Days after `lastDay` (today) are not drawn.
 */
const RECENT_WEEKS = 52;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getPeriod(earliest, today = new Date()) {
  const lastDay = startOfDay(today);
  let start = addDays(getSunday(lastDay), -7 * RECENT_WEEKS);
  if (earliest && earliest < start) {
    // From the 1st of that month, so the first month on the heatmap is named.
    start = getSunday(new Date(earliest.getFullYear(), earliest.getMonth(), 1));
  }
  return {
    start,
    lastDay,
    columns: daysBetween(start, getSunday(lastDay)) / 7 + 1,
  };
}

/** Column (week) of `date` within `period`. */
export function getColumn(period, date) {
  return Math.floor(daysBetween(period.start, startOfDay(date)) / 7);
}

/** The Sunday that starts `column`. */
export function getColumnStart(period, column) {
  return addDays(period.start, 7 * column);
}

function daysBetween(a, b) {
  // Rounded: a daylight-saving change makes some days 23 or 25 hours long.
  return Math.round((b - a) / DAY_MS);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getSunday(day) {
  return addDays(day, -day.getDay());
}

function addDays(day, count) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + count);
}
