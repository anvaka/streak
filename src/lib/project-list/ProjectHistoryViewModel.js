/**
 * Given a spreadsheet builds a project history. Project history has information
 * about log entries grouped by date (though this can be customized. And has
 * an index of all rows by given day.
 *
 * Additionally, project contributions can be filtered to be only within specific range.
 */
import InputTypes from 'src/types/InputTypes';
import { getDateString, isDayInside } from '../dateUtils.js';

export default class ProjectHistoryViewModel {
  constructor(sheetData, headers) {
    this.facet = null;
    this.numberColumns = [];
    if (headers.length === 0) {
      this.groups = [];
      this.contributionsByDay = {};
      this.categories = [];
      this.recordsCount = 0;
      return;
    }

    const typedRows = convertToTypedRows(sheetData, headers);
    const dateIndex = getColumnIndex(headers, header => header.valueType === InputTypes.DATE);
    if (dateIndex >= 0) {
      this.groups = groupBy(dateIndex, typedRows);

      this.numberColumns = headers
        .map((header, columnIndex) => ({ header, columnIndex }))
        .filter(({ header }) => header.valueType === InputTypes.NUMBER)
        .map(({ header, columnIndex }) => ({
          columnIndex,
          title: header.title,
          combine: header.combine === 'sum' ? 'sum' : 'average',
        }));
      const facetColumn = getFacetColumnIndex(headers, typedRows);
      if (facetColumn >= 0) {
        this.facet = { columnIndex: facetColumn, title: headers[facetColumn].title };
      }
      const numericColumn = this.numberColumns[0];
      this.contributionsByDay = makeContributionsByDayIndex(
        dateIndex, typedRows,
        makeCellGetter(numericColumn ? numericColumn.columnIndex : -1),
        numericColumn && numericColumn.combine === 'average',
        makeCellGetter(facetColumn)
      );
      this.categories = getCategoriesInOrderOfAppearance(this.contributionsByDay);
    } else {
      this.groups = [];
      this.contributionsByDay = {};
      this.categories = [];
    }

    this.recordsCount = typedRows.length;
  }
}

/**
 * The record groups (days) to list: those between `from` and `to`, holding
 * only their records with `focus` - one value of the `facet` column, picked
 * above the heatmap - when that is set.
 */
export function filterGroups(groups, facet, from, to, focus) {
  let filtered = groups;
  if (from) {
    filtered = filtered.filter(group => {
      // TODO: this will not work only for date groups
      if (group.group.valueType !== InputTypes.DATE) {
        return true;
      }
      return isDayInside(group.key, from, to);
    });
  }
  if (focus !== undefined && facet) {
    const { columnIndex } = facet;
    const hasFocus = cells => cells.some(cell => (
      cell.columnIndex === columnIndex && toCategory(cell.value) === focus
    ));
    filtered = filtered
      .map(group => {
        const items = group.items.filter(hasFocus);
        if (items.length === group.items.length) return group;
        return Object.assign({}, group, { items });
      })
      .filter(group => group.items.length > 0);
  }
  return filtered;
}

/**
 * The column whose values the heatmap colors by and the chips above it
 * offer: the text column whose values repeat the most - yes/no, or a handful
 * of activities - rather than free-form notes, where most values are new.
 * What the values mean never matters, only that they come back.
 */
function getFacetColumnIndex(headers, typedRows) {
  let best = -1;
  let bestShare = Infinity;
  headers.forEach((header, columnIndex) => {
    if (header.valueType !== InputTypes.TEXT && header.valueType !== InputTypes.SINGLE_LINE_TEXT) {
      return;
    }
    let filled = 0;
    const distinct = new Set();
    typedRows.forEach(row => {
      const value = toCategory(row.cells[columnIndex].value);
      if (value === null) return;
      filled += 1;
      distinct.add(value);
    });
    // A few records can't tell the two apart yet, so up to four values count;
    // of the columns that could be it, the most repetitive wins, so a notes
    // column that happens to qualify early loses to a real yes/no.
    if (filled === 0 || distinct.size > Math.max(4, filled / 2)) return;
    const share = distinct.size / filled;
    if (share < bestShare) {
      best = columnIndex;
      bestShare = share;
    }
  });
  return best;
}

function makeContributionsByDayIndex(
  dateIndex, typedRows, getNumericCellValue, isAveraged, getCategoricalValue
) {
  const contributionsByDay = {};

  groupRowsByDate();
  calculateGroupValue();

  return contributionsByDay;

  function groupRowsByDate() {
    typedRows.forEach(row => {
      const cellRecord = row.cells[dateIndex];
      const dayKey = getGroupKey(cellRecord);
      let dayContributions = contributionsByDay[dayKey];
      if (!dayContributions) {
        dayContributions = {
          rows: [],
          date: cellRecord.value,
        };
        contributionsByDay[dayKey] = dayContributions;
      }
      dayContributions.rows.push(row);
    });
  }

  function calculateGroupValue() {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    const contributions = Object.keys(contributionsByDay).map(day => contributionsByDay[day]);
    contributions.forEach((dayContributions) => {
      let dayTotalValue = 0;
      let valueCount = 0;
      const values = new Set();
      dayContributions.rows.forEach(row => {
        const value = getNumericCellValue(row.cells);
        if (!Number.isNaN(value)) {
          dayTotalValue += value;
          valueCount += 1;
        }

        // TODO: what if it's multiple different groups?
        dayContributions.groupKey = toCategory(getCategoricalValue(row.cells));
        values.add(dayContributions.groupKey);
      });

      // Two weigh-ins in a day are one weight, not twice it: a column adds up
      // only when the owner said so (see numberColumns).
      if (isAveraged) dayTotalValue = valueCount ? dayTotalValue / valueCount : 0;
      dayContributions.value = dayTotalValue;
      // Every facet value the day has, for focusing on one of them.
      dayContributions.values = Array.from(values);
      if (dayTotalValue < minValue) minValue = dayTotalValue;
      if (dayTotalValue > maxValue) maxValue = dayTotalValue;
    });

    contributions.forEach(dayContributions => {
      // When every day adds up the same (one record a day, say) there is no
      // "more" or "less" to show, so draw them all at full strength rather
      // than all at the palest shade.
      dayContributions.scaledValue = (maxValue === minValue) ? 1 :
        (dayContributions.value - minValue) / (maxValue - minValue);
    });
  }
}

/**
 * The categories the days have, earliest day first. The heatmap hands
 * out colors in this order, so a category keeps its color as records are
 * added - a new category can only ever be later than the existing ones.
 */
function getCategoriesInOrderOfAppearance(contributionsByDay) {
  const days = Object.keys(contributionsByDay)
    .map(key => contributionsByDay[key])
    // Undated days sort last. Compare rather than subtract: Infinity - Infinity is NaN.
    .sort((a, b) => {
      const x = timeOf(a.date);
      const y = timeOf(b.date);
      return x === y ? 0 : (x < y ? -1 : 1);
    });

  // Every value of a day, not only the one it is colored by: a value that is
  // never a day's last record still gets a chip to focus on.
  const seen = new Set();
  days.forEach(day => (day.values || [day.groupKey]).forEach(value => seen.add(value)));
  return Array.from(seen);
}

function timeOf(date) {
  const time = date instanceof Date ? date.getTime() : NaN;
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

/**
 * Cells are compared as trimmed text, so 'Yes' and 'Yes ' are one category.
 * A blank cell has no category (null).
 */
export function toCategory(value) {
  if (typeof value !== 'string') return value === undefined ? null : value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function groupBy(groupIndex, typedRows) {
  const groups = new Map(); // group key -> group records.

  typedRows.forEach(row => {
    const cellRecord = row.cells[groupIndex];
    const groupKey = getGroupKey(cellRecord);
    let groupRecords = groups.get(groupKey);

    if (!groupRecords) {
      groupRecords = {
        key: groupKey,
        group: cellRecord,
        items: []
      };

      groups.set(groupKey, groupRecords);
    }
    const rowItems = [];

    row.cells.forEach((otherCellRecord) => {
      rowItems.push(otherCellRecord);
      // TODO: This is ugly. I need a better model to reflect
      // that individual subgroups can be edited.
      rowItems.rowIndex = otherCellRecord.rowIndex;
    });

    groupRecords.items.push(rowItems);
  });

  const groupRecords = Array.from(groups.values());
  removeRedundantGroupKeys(groupRecords);

  return groupRecords.sort((x, y) => {
    return y.group.value - x.group.value;
  });
}

function removeRedundantGroupKeys(groupRecords) {
  groupRecords.forEach(groupRecord => {
    const { items } = groupRecord;
    if (items.length > 1) {
      // no need to do anything, as group cell is necessary for UI
      // TODO: Should probably sort...
      return;
    }

    const firstAndOnlyGroup = groupRecord.items[0];
    // otherwise it's just one record, and group is displayed as a header
    // so we remove group from items.
    groupRecord.items[0] = firstAndOnlyGroup.filter(cell => cell !== groupRecord.group);
    // TODO This is really bad. See comment above. We need a better model to reflect
    // individual subgroups
    groupRecord.items[0].rowIndex = firstAndOnlyGroup.rowIndex;
  });
}

function getGroupKey(cellRecord) {
  const cellValue = cellRecord.value;

  if (cellValue instanceof Date) {
    //  This probably need to be configurable. E.g. what if someone wants to group by hour?
    return getDateString(cellValue);
  }

  return cellValue;
}

function getColumnIndex(headers, predicateCallback) {
  if (!headers || headers.length === 0) throw new Error('headers are required');

  for (let i = 0; i < headers.length; ++i) {
    if (predicateCallback(headers[i])) return i;
  }

  return -1;
}

function convertToTypedRows(sheetData, headers) {
  if (!sheetData) return [];

  const typedRows = [];

  sheetData.forEach((row, rowIndex) => {
    const cells = [];
    const typedRow = {
      cells,
    };
    typedRows.push(typedRow);

    headers.forEach((column, columnIndex) => {
      const rowValue = row[columnIndex];
      let typedValue;

      if (column.valueType === InputTypes.DATE) {
        // TODO: date parsing may need to be changed in future.
        typedValue = new Date(rowValue);
      } else if (column.valueType === InputTypes.NUMBER) {
        typedValue = Number.parseFloat(rowValue);
      } else {
        // save strings as is.
        typedValue = rowValue;
      }

      cells.push({
        value: typedValue,
        title: column.title,
        valueType: column.valueType,
        rowIndex,
        columnIndex
      });
    });
  });

  return typedRows;
}

function makeCellGetter(columnIndex) {
  return (columnIndex < 0) ? () => 1 : (row) => row[columnIndex].value;
}
