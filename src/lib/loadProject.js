import _ from 'lodash';

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

function laodSpreadsheet(spreadsheetId) {
  const sheetDataPromise = loadSheetData(spreadsheetId);
  const sheetInfoPromise = loadSheetInfo(spreadsheetId);

  return Promise.all([sheetDataPromise, sheetInfoPromise])
    .then((results) => {
      return makeProjectViewModel({
        sheetData: results[0],
        sheetInfo: results[1]
      });
    });
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
      fields: 'nextPageToken, files(id, name)'
    }).then(response => {
      const { result } = response;
      const { files } = result;
      if (files.length !== 1) {
        // TODO: Implement this. Need to find best candidate.
        throw new Error('Handle this case better!');
      }

      return files[0].id;
    }).then(resolve, reject);
  });
}

function makeProjectViewModel({ sheetData, sheetInfo }) {
  const title = sheetInfo.properties.title;
  let headers = extractHeaders(sheetInfo.sheets[0]);
  headers = trimHeadersToContent(headers, sheetData);

  return {
    title,
    sheetData,
    headers,
    raw: sheetInfo
  };
}

function trimHeadersToContent(headers, sheetData) {
  if (!sheetData) return headers;
  let maxColumns = 0;

  for (let i = 0; i < sheetData.length; ++i) {
    if (sheetData[i].length > maxColumns) maxColumns = sheetData[i].length;
  }

  return headers.slice(0, maxColumns);
}

function extractHeaders(mainSeet) {
  if (!mainSeet) throw new Error('Sheet with headers is missing');
  const { data } = mainSeet;
  if (!data || data.length === 0) return [];

  const { rowData } = data[0];
  if (!rowData || rowData.length === 0) return [];

  return rowData[0].values.map((x, columnIndex) => ({
    title: x.formattedValue,
    valueType: guessType(rowData[1], columnIndex)
  }));

  function guessType(rowWithValues, columnIndex) {
    if (!rowWithValues || !rowWithValues.values) return 'string';

    const cellValue = rowWithValues.values[columnIndex];
    const format = _.get(cellValue, 'effectiveFormat.numberFormat', {
      type: 'string'
    });

    return format;
  }
}
