import header from './header.js';
import { indexBy } from '../utils.js';

/**
 * Constructs a batchUpdate diff to get old fields configuration to a new one
 * See https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request
 */
export default function constructSheetUpdateDiff(oldFields, newFields) {
  const requests = [];
  let insertedCount = 0;
  const oldFieldsCount = oldFields.length;

  // We are trying to update all in one request. The tricky part is to maintain
  // column indices during columns removal/creation.
  // To not track the column indices, I append all new columns first to the end
  // of the current collection of columns, and then go from the end of the columns
  // collection (right to left) and remove deleted columns one by one. This way
  // the removed column indices are consistent.

  newFields.forEach(field => {
    if (field.originalTitle) {
      if (field.originalTitle !== field.title) {
        // this field existed before. If it's new title changed - then it's rename operation
        requests.push(renameHeader(field.columnIndex, field.title));
      }
    } else {
      // This is a new field. We always append to the end of the sheet, so that
      // we don't have to tract column index movement during deletion.
      requests.push({
        appendDimension: {
          sheetId: 0,
          dimension: 'COLUMNS',
          length: 1
        }
      });
      requests.push(appendHeader(field.title, oldFieldsCount + insertedCount));
      insertedCount += 1;
    }
  });

  const currentFields = indexBy(newFields, 'originalTitle');

  // now let's traverse backwards, and remove all columns that were deleted
  // We need to traverse backward, to keep column indices unmodified
  for (let i = oldFields.length - 1; i > -1; i--) {
    const header = oldFields[i];
    if (header.title && !currentFields.has(header.title)) {
      requests.push(removeColumn(i));
    }
  }

  return requests;
}

function appendHeader(title, columnIndex) {
  return {
    updateCells: {
      fields: 'userEnteredValue, userEnteredFormat',
      start: {
        sheetId: 0,
        rowIndex: 0,
        columnIndex
      },
      rows: [{
        values: [header(title)]
      }]
    }
  };
}

function removeColumn(columnIndex) {
  return {
    deleteDimension: {
      range: {
        sheetId: 0,
        dimension: 'COLUMNS',
        startIndex: columnIndex,
        endIndex: columnIndex + 1
      }
    }
  };
}

function renameHeader(columnIndex, title) {
  return {
    updateCells: {
      fields: 'userEnteredValue',
      start: {
        sheetId: 0,
        rowIndex: 0,
        columnIndex
      },
      rows: [{
        values: [{
          userEnteredValue: {
            stringValue: title
          }
        }]
      }]
    }
  };
}

