// We take one row for header, and one more to fetch data types.
const HEADER_RANGE = 'A1:Z2';

// Note: We are assuming there can be only 25 columns. If we ever need more
// we can use loadSheetInfo() results here.
const DATA_RANGE = 'A2:Z';
// TODO: gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()

export function loadSheetData(spreadsheetId) {
  return new Promise((resolve, reject) => {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: DATA_RANGE,
    }).then(
      data => data.result.values,
      handleAuthError(() => loadSheetData(spreadsheetId))
    ).then(resolve, reject);
  });
}

// Sheet info contains information about sheet structure (columns, header names, title)
export function loadSheetInfo(spreadsheetId) {
  return new Promise((resolve, reject) => {
    gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: HEADER_RANGE
    }).then(
      data => data.result,
      handleAuthError(() => loadSheetInfo(spreadsheetId))
    ).then(resolve, reject);
  });
}

export function getLogFileSpreadsheetId(projectFolderId) {
  return new Promise((resolve, reject) => {
    gapi.client.drive.files.list({
      q: `trashed = false and '${projectFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
      pageSize: 10,
      fields: 'files(id, name, properties, capabilities)'
    }).then(response => {
      const { result } = response;
      const { files } = result;
      if (files.length === 0) {
        throw new Error('This project does not exist');
      }
      if (files.length !== 1) {
        // TODO: Implement this. Need to find best candidate.
        throw new Error('At the moment, only one log file is supported');
      }

      return files[0];
    }, handleAuthError(() => getLogFileSpreadsheetId(projectFolderId))).then(resolve, reject);
  });
}

function handleAuthError(retryCallback) {
  return err => {
    const isInvalidCredentials = (err.status === 401) &&
      err.result && (err.result.message === 'Invalid Credentials');

    if (!isInvalidCredentials) {
      throw err;
    }

    return (
      new Promise((resolve, reject) => {
        gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()
          .then(resolve, reject);
      })
    ).then(retryCallback);
  };
}

