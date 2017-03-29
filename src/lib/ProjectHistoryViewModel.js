/**
 * Given a spreadsheet buidls a project history. Project history has information
 * about log entries grouped by date (though this can be customezed0. And has
 * an index of all rows by given day.
 *
 * Additionally, project contributions can be filtered to be only within specific range.
 */
import InputTypes from 'src/types/InputTypes';
import { getDateString, isDayInside } from './dateUtils.js';

export default class ProjectHistoryViewModel {
  constructor(sheetData, headers) {
    const typedRows = convertToTypedRows(sheetData, headers);
    const dateIndex = getColumnIndex(headers, header => header.valueType === InputTypes.DATE);
    if (dateIndex < 0) throw new Error('non-date data sets are not supported yet');

    this.groups = groupBy(dateIndex, typedRows);

    const numericColumn = getColumnIndex(headers, header => header.valueType === InputTypes.NUMBER);
    const categoricalColumn = getColumnIndex(
      headers, header => header.valueType === InputTypes.SINGLE_LINE_TEXT
    );
    this.contributionsByDay = makeContributionsByDayIndex(
      dateIndex, typedRows, makeCellGetter(numericColumn), makeCellGetter(categoricalColumn)
    );

    this.recordsCount = typedRows.length;
  }

  filter(from, to) {
    this.groups = this.groups.filter(group => {
      // TODO: this will not work only for date groups
      if (group.group.valueType !== InputTypes.DATE) {
        return true;
      }
      return isDayInside(group.key, from, to);
    });
  }
}

function makeContributionsByDayIndex(
  dateIndex, typedRows, getNumericCellValue, getCategoricalValue
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
      dayContributions.rows.forEach(row => {
        let value = getNumericCellValue(row.cells);
        if (Number.isNaN(value)) value = 0;
        dayTotalValue += value;

        // TODO: what if it's multiple different groups?
        dayContributions.groupKey = getCategoricalValue(row.cells);
      });

      dayContributions.value = dayTotalValue;
      if (dayTotalValue < minValue) minValue = dayTotalValue;
      if (dayTotalValue > maxValue) maxValue = dayTotalValue;
    });

    contributions.forEach(dayContributions => {
      dayContributions.scaledValue = (maxValue === minValue) ? 0 :
        (dayContributions.value - minValue) / (maxValue - minValue);
    });
  }
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
  removeRedundnantGroupKeys(groupRecords);

  return groupRecords.sort((x, y) => {
    return y.group.value - x.group.value;
  });
}

function removeRedundnantGroupKeys(groupRecords) {
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
