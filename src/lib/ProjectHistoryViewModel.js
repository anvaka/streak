import InputTypes from 'src/types/InputTypes';
import { getDateString, isDayInside } from './dateUtils.js';

export default class ProjectHistoryViewModel {
  constructor(sheetData, headers) {
    const typedRows = convertToTypedRows(sheetData, headers);
    const dateIndex = getDateIndex(headers);

    this.groups = groupBy(dateIndex, typedRows);

    this.contributionsByDay = makeContributionsByDayIndex(dateIndex, typedRows);
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

function makeContributionsByDayIndex(dateIndex, typedRows) {
  const contributions = {};

  typedRows.forEach(row => {
    const cellRecord = row.cells[dateIndex];
    const dayKey = getGroupKey(cellRecord);
    // TODO aggregate?
    contributions[dayKey] = row;
  });

  return contributions;
}

function groupBy(groupIndex, typedRows, from, to) {
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

function getDateIndex(headers) {
  if (!headers || headers.length === 0) throw new Error('headers are required');

  for (let i = 0; i < headers.length; ++i) {
    if (headers[i].valueType === InputTypes.DATE) return i;
  }

  return 0;
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
