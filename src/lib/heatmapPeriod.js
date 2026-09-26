/**
 * Which days the heatmap draws. By default it is the last twelve months:
 * this week and the 52 before it, ending today. Older records are reached one
 * calendar year at a time (`?year=2023`), January to December.
 *
 * Columns are weeks, Sunday to Saturday. `start` is the Sunday of the first
 * column; days before `firstDay` or after `lastDay` are not drawn, so a year
 * starts and ends with a partly filled week. `labelsEnd` is the last day that
 * still gets a month name: for this year that is December, so the months
 * still to come are named above their empty columns.
 */
const RECENT_WEEKS = 52;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getPeriod(year, today = new Date()) {
  const todayMidnight = startOfDay(today);

  if (!year) {
    const start = addDays(getSunday(todayMidnight), -7 * RECENT_WEEKS);
    return {
      key: 'recent',
      start,
      columns: RECENT_WEEKS + 1,
      firstDay: start,
      lastDay: todayMidnight,
      labelsEnd: todayMidnight,
    };
  }

  const firstDay = new Date(year, 0, 1);
  const lastOfYear = new Date(year, 11, 31);
  const start = getSunday(firstDay);
  return {
    key: String(year),
    start,
    columns: daysBetween(start, getSunday(lastOfYear)) / 7 + 1,
    firstDay,
    lastDay: lastOfYear < todayMidnight ? lastOfYear : todayMidnight,
    labelsEnd: lastOfYear,
  };
}

/**
 * The `year` to show `date` in: none (the last twelve months) when it is
 * recent enough, otherwise its calendar year.
 */
export function getYearToShow(date, today = new Date()) {
  return date < getPeriod(null, today).firstDay ? date.getFullYear() : null;
}

/** Column (week) of `date` within `period`. */
export function getColumn(period, date) {
  return Math.floor(daysBetween(period.start, startOfDay(date)) / 7);
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
