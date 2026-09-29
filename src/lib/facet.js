/**
 * Focusing on one value of a project's facet column - the text column the
 * heatmap colors by, such as Yes/No or Run/Swim/Bike (see
 * ProjectHistoryViewModel). The value picked above the heatmap is kept in the
 * URL as `focus`, and the heatmap, streaks, records and Insights all follow it.
 */
import { toCategory } from './project-list/ProjectHistoryViewModel.js';
import { isDayInside } from './dateUtils.js';

/** The focused value in `query`, or undefined for all records. */
export function getFocus(query) {
  const focus = query && query.focus;
  return typeof focus === 'string' && focus ? focus : undefined;
}

/** `query` with the focus in it kept, for links that change something else. */
export function keepFocus(query, currentQuery) {
  const focus = getFocus(currentQuery);
  return focus === undefined ? query : Object.assign({}, query, { focus });
}

/** The days of `contributionsByDay` between `from` and `to`, or all without `from`. */
export function daysBetween(contributionsByDay, from, to) {
  if (!from) return contributionsByDay;
  const days = {};
  Object.keys(contributionsByDay || {}).forEach(key => {
    if (isDayInside(key, from, to)) days[key] = contributionsByDay[key];
  });
  return days;
}

/** How many days have a record with each value. */
export function countDaysByValue(contributionsByDay) {
  const counts = new Map();
  Object.keys(contributionsByDay || {}).forEach(key => {
    (contributionsByDay[key].values || []).forEach(value => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });
  return counts;
}

/**
 * The days of `contributionsByDay` holding only their records with `focus` in
 * the facet column; days without one are left out.
 */
export function focusContributions(contributionsByDay, facet, focus) {
  if (focus === undefined || !facet) return contributionsByDay;
  const focused = {};
  Object.keys(contributionsByDay).forEach(key => {
    const day = contributionsByDay[key];
    const rows = day.rows.filter(row => (
      row.cells && toCategory(row.cells[facet.columnIndex].value) === focus
    ));
    if (rows.length) focused[key] = Object.assign({}, day, { rows });
  });
  return focused;
}
