import gapiSheets from '../gapi/sheets.js';
import gapiFiles from '../gapi/files.js';

// Note: We are assuming there can be only 25 columns.
const DATA_RANGE = 'A1:Z';

export function loadSheetData(spreadsheetId) {
  return gapiSheets('values.get', {
    spreadsheetId,
    range: DATA_RANGE,
  }).then(result => {
    const values = result.values;
    if (!values) {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      throw new Error(`Looks like the spreadsheet ${url} has no data.`);
    }

    const headers = values.splice(0, 1);
    return {
      values,
      // we are interested in actual cell values, not just an array
      headers: headers[0]
    };
  });
}

export function loadSettings(settingsId) {
  return gapiFiles('get', {
    fileId: settingsId,
    alt: 'media'
  });
}

// TODO: Rename this it fetches both id of the spreadsheet and the settings file.
export function getLogFileSpreadsheetId(projectFolderId) {
  const q = `trashed = false and '${projectFolderId}' in parents and (
    mimeType='application/vnd.google-apps.spreadsheet' or
    name='streak-settings.json'
  )`;

  return gapiFiles('list', {
    q,
    pageSize: 10,
    fields: 'files(id, name, description, capabilities, owners)'
  }).then(result => {
    const { files } = result;
    if (files.length === 0) {
      throw new Error('This project does not exist... or maybe it is private?');
    }

    let spreadsheetFile;
    let settingsFile;

    for (let i = 0; i < files.length; i++) {
      if (files[i].name === 'streak-settings.json') {
        if (settingsFile) throw new Error('Cannot have multiple streak settings files');
        settingsFile = files[i];
      } else {
        if (spreadsheetFile) throw new Error('At the moment, only one log file is supported');
        spreadsheetFile = files[i];
      }
    }


    return {
      spreadsheetFile,
      settingsFileId: settingsFile && settingsFile.id
    };
  });
}
