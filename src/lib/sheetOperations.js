/**
 * Appends or updates a new log record to a project log
 */
import { resetSheetDataCache } from './store/cachingDocs.js';
import { getParentFolder } from './store/sheetIdToFolder.js';
import gapiSheets from './gapi/sheets.js';
import gapiFiles from './gapi/files.js';

const RANGE_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function updateRow(spreadsheetId, record, row) {
  if (record.length >= RANGE_NAMES.length) throw new Error('Too many columns');

  const prefix = row !== undefined ? 'A' + (row + 2) : 'A2'; // +2 because we are zero based, and skip headers
  const range = `${prefix}:${RANGE_NAMES[record.length]}`;

  resetSheetDataCache(spreadsheetId);

  const method = row !== undefined ? 'update' : 'append';

  return gapiSheets(`values.${method}`, {
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    values: [record],
  }).then(response => {
    fireAndForgetParentTouch(spreadsheetId);
    return response;
  });
}

export function batchUpdate(spreadsheetId, requests) {
  return gapiSheets('batchUpdate', {
    spreadsheetId,
    requests
  });
}

export function deleteRow(spreadsheetId, rowIndex) {
  resetSheetDataCache(spreadsheetId);

  return gapiSheets('batchUpdate', {
    spreadsheetId,
    requests: [{
      deleteDimension: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: rowIndex + 1, // +1 because we don't want to delete the header
          endIndex: rowIndex + 2 // just one row.
        }
      }
    }]
  }).then(response => {
    fireAndForgetParentTouch(spreadsheetId);

    return response;
  });
}

function fireAndForgetParentTouch(spreadsheetId) {
  // This will update last modified time stamp on the parent folder. That
  // way we can always list folder in MRU style. According to the book
  // "The Algorithms to live by", this is one of the best possible ways to organize
  // stuff. So, let's try it here.
  const parentFolderId = getParentFolder(spreadsheetId);
  if (!parentFolderId) {
    // Though suspicious, not a big deal. We will not get the stamp updated.
    return;
  }

  const now = new Date();
  // this is fire and forget call. We don't care if it fails.
  gapiFiles('update', {
    fileId: parentFolderId,
    resource: {
      modifiedTime: now.toISOString()
    }
  });
}
