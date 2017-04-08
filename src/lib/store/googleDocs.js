import gapiSheets from '../gapi/sheets.js';
import gapiFiles from '../gapi/files.js';

// We take one row for header, and one more to fetch data types.
const HEADER_RANGE = 'A1:Z2';

// Note: We are assuming there can be only 25 columns. If we ever need more
// we can use loadSheetInfo() results here.
const DATA_RANGE = 'A2:Z';
// TODO: gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()

export function loadSheetData(spreadsheetId) {
  return gapiSheets('values.get', {
    spreadsheetId,
    range: DATA_RANGE,
  }).then(result => result.values);
}

// Sheet info contains information about sheet structure (columns, header names, title)
export function loadSheetInfo(spreadsheetId) {
  return gapiSheets('get', {
    spreadsheetId,
    includeGridData: true,
    ranges: HEADER_RANGE
  });
}

export function getLogFileSpreadsheetId(projectFolderId) {
  return gapiFiles('list', {
    q: `trashed = false and '${projectFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
    pageSize: 10,
    fields: 'files(id, name, description, properties, capabilities, owners)'
  }).then(result => {
    const { files } = result;
    if (files.length === 0) {
      throw new Error('This project does not exist... or maybe it is private?');
    }
    if (files.length !== 1) {
      // TODO: Implement this. Need to find best candidate.
      throw new Error('At the moment, only one log file is supported');
    }

    return files[0];
  });
}
