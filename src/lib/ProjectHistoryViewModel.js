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

    const numberIndex = getColumnIndex(headers, header => header.valueType === InputTypes.NUMBER);
    const getCellValue = (numberIndex < 0) ? () => 1 : (row) => row[numberIndex].value;

    this.groups = groupBy(dateIndex, typedRows);

    this.contributionsByDay = makeContributionsByDayIndex(dateIndex, typedRows, getCellValue);
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

function makeContributionsByDayIndex(dateIndex, typedRows, getCellValue) {
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
        let value = getCellValue(row.cells);
        if (Number.isNaN(value)) value = 0;
        dayTotalValue += value;
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

    row.cells.forEach((otherCellRecord, otherIndex) => {
      if (otherIndex === groupIndex) {
        // Don't include group itself into group records.
        return;
      }
      rowItems.push(otherCellRecord);
    });

    groupRecords.items.push(rowItems);
  });

  return Array.from(groups.values()).sort((x, y) => {
    return y.group.value - x.group.value;
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
