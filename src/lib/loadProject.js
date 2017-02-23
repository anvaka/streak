/**
 * Loads a project from data store
 */
import detectType from './detectType';
import extractColumnTypesMetadata from './extractColumnTypesMetadata';
import ProjectHistoryViewModel from './ProjectHistoryViewModel';

export default loadProject;

// Note: We are assuming there can be only 25 columns. If we ever need more
// we can use loadSheetInfo() results here.
const DATA_RANGE = 'A2:Z';

// We take one row for header, and one more to fetch data types.
const HEADER_RANGE = 'A1:Z2';

function loadProject(projectFolderId) {
  return getLogFileSpreadsheetId(projectFolderId)
    .then(laodSpreadsheet);
}

function laodSpreadsheet(spreadsheetFile) {
  const spreadsheetId = spreadsheetFile.id;
  const columnTypeByName = extractColumnTypesMetadata(spreadsheetFile.properties);

  const sheetDataPromise = loadSheetData(spreadsheetId);
  const sheetInfoPromise = loadSheetInfo(spreadsheetId);

  return Promise.all([sheetDataPromise, sheetInfoPromise])
    .then(convertToViewModel);

  function convertToViewModel(results) {
    // TODO: use capabilities.canEdit to determine whether current user can edit this project.
    return makeProjectViewModel({
      sheetData: results[0],
      sheetInfo: results[1]
    }, columnTypeByName);
  }
}

function loadSheetInfo(spreadsheetId) {
  return new Promise((resolve, reject) => {
    gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: HEADER_RANGE
    }).then(data => {
      return data.result;
    }).then(resolve, reject);
  });
}

function loadSheetData(spreadsheetId) {
  return new Promise((resolve, reject) => {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: DATA_RANGE,
    }).then(data => {
      return data.result.values;
    }).then(resolve, reject);
  });
}

function getLogFileSpreadsheetId(projectFolderId) {
  // TODO: This potentially can be cached. Not caching now to avoid premature optimization
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
    }).then(resolve, reject);
  });
}

function makeProjectViewModel({ sheetData, sheetInfo }, columnTypeByName) {
  const title = sheetInfo.properties.title;
  let headers = extractHeaders(sheetInfo.sheets[0], columnTypeByName);
  headers = trimHeadersToContent(headers, sheetData);

  return {
    title,
    spreadsheetId: sheetInfo.spreadsheetId,
    sheetData,
    projectHistory: new ProjectHistoryViewModel(sheetData, headers),
    headers,
    raw: sheetInfo
  };
}

function trimHeadersToContent(headers, sheetData) {
  // sometimes we receive more header columns than there are in the file.
  // We figure out the longest row, and assume we have that many headers:
  if (!sheetData) return headers;
  let maxColumns = 0;

  for (let i = 0; i < sheetData.length; ++i) {
    if (sheetData[i].length > maxColumns) maxColumns = sheetData[i].length;
  }

  // TODO: What if `maxColumns > headers.length?`
  return headers.slice(0, maxColumns);
}

function extractHeaders(mainSheet, columnTypeByName) {
  if (!mainSheet) throw new Error('Sheet with headers is missing');
  const { data } = mainSheet;
  if (!data || data.length === 0) return [];

  const { rowData } = data[0];
  if (!rowData || rowData.length === 0) return [];

  return rowData[0].values.map((x, columnIndex) => {
    const title = x && x.formattedValue;
    return {
      title,
      valueType: guessType(rowData, columnIndex, title)
    };
  });

  function guessType(rowData, columnIndex, columnTitle) {
    if (columnTypeByName.has(columnTitle)) {
      // we are lucky: The column name matches to what we stored during project
      // creation. We trust this data 100%;
      return columnTypeByName.get(columnTitle);
    }

    const DEFAULT_TYPE = 'string';

    // Okay, we don't have informatino about file. Let's see if we have any data:
    if (rowData.length < 2) {
      // This means we have only one header row. We cannot guess anything here
      return DEFAULT_TYPE;
    }

    return guessTypeFromRow(rowData[1], columnIndex) || DEFAULT_TYPE;

    function guessTypeFromRow(rowWithValues, columnIndex) {
      if (!rowWithValues || !rowWithValues.values) return;

      const cellValues = rowWithValues.values[columnIndex];
      const cellValue = cellValues && cellValues.formattedValue;

      return detectType(cellValue);
    }
  }
}
