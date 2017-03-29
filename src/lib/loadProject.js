/**
 * Loads a project from data store. The project is stored into `Streaks` folder
 * and is supposed to have one spreadsheet file. That file is used for
 * log entries. The spreadsheet file when created (see ./createProject.js)
 * contains information about every column type, so that we can present
 * custom UI element to edit the column. E.g. multi-line text uses markdown
 * to render itself.
 *
 * The folder itself may contain more files in future. E.g. if we allow users
 * to upload their images with every "commit".
 */
import InputTypes from 'src/types/InputTypes';
import detectType from './detectType';
import extractColumnTypesMetadata from './extractColumnTypesMetadata';
import ProjectHistoryViewModel from './ProjectHistoryViewModel';
import {
  loadSheetData,
  loadSheetInfo,
  getLogFileSpreadsheetId
} from './store/cachingDocs.js';

export default loadProject;

function loadProject(projectFolderId) {
  return getLogFileSpreadsheetId(projectFolderId)
    .then(file => loadSpreadsheet(file));
}

function loadSpreadsheet(spreadsheetFile) {
  const spreadsheetId = spreadsheetFile.id;
  const { canEdit } = spreadsheetFile.capabilities;
  const { owners } = spreadsheetFile;
  const columnTypeByName = extractColumnTypesMetadata(spreadsheetFile.properties);

  const sheetDataPromise = loadSheetData(spreadsheetId);
  const sheetInfoPromise = loadSheetInfo(spreadsheetId);

  return Promise.all([sheetDataPromise, sheetInfoPromise])
    .then(convertToViewModel);

  function convertToViewModel(results) {
    // TODO: use capabilities.canEdit to determine whether current user can edit this project.
    const vm = makeProjectViewModel({
      canEdit,
      owners,
      sheetData: results[0],
      sheetInfo: results[1]
    }, columnTypeByName);

    return vm;
  }
}

function makeProjectViewModel(project, columnTypeByName) {
  const { sheetData, sheetInfo, canEdit, owners } = project;
  const { title } = sheetInfo.properties;
  const headers = extractHeaders(sheetInfo.sheets[0], columnTypeByName);
  // TODO: I'm not sure why I was trimming this. It is actually not correct
  // to do so, because when we have 3 columns, but first entry has only
  // two columns used - any subsequent addition will never show third column
  // I'm keeping this code commented out in case if I learn why. But if
  // it stays here for too long - I'll drop it.
  // headers = trimHeadersToContent(headers, sheetData);
  augmentSingleLineHeadersWithAutosuggestions(headers, sheetData);
  if (owners.length > 1) {
    console.log('This file has multiple owners. Expected?', sheetInfo.spreadsheetId);
  }

  return {
    title,
    canEdit,
    owner: owners[0],
    spreadsheetId: sheetInfo.spreadsheetId,
    sheetData,
    projectHistory: new ProjectHistoryViewModel(sheetData, headers),
    headers,
    raw: sheetInfo
  };
}

function augmentSingleLineHeadersWithAutosuggestions(headers, sheetData) {
  if (!sheetData) return;

  const headersToUpdate = [];
  headers.forEach((header, headerIndex) => {
    if (header.valueType === InputTypes.SINGLE_LINE_TEXT) {
      headersToUpdate.push({
        index: headerIndex,
        completions: new Set()
      });
    }
  });

  if (headersToUpdate.length === 0) return;

  sheetData.forEach(row => {
    // remember all unique values that we saw
    headersToUpdate.forEach(header => {
      const completion = (row[header.index] || '').trim();
      if (completion) header.completions.add(completion);
    });
  });

  headersToUpdate.forEach(header => {
    headers[header.index].autocomplete = Array.from(header.completions);
  });
}

// function trimHeadersToContent(headers, sheetData) {
//   // sometimes we receive more header columns than there are in the file.
//   // We figure out the longest row, and assume we have that many headers:
//   if (!sheetData) return headers;
//   let maxColumns = 0;
//
//   for (let i = 0; i < sheetData.length; ++i) {
//     if (sheetData[i].length > maxColumns) maxColumns = sheetData[i].length;
//   }
//
//   // TODO: What if `maxColumns > headers.length?`
//   return headers.slice(0, maxColumns);
// }

function extractHeaders(mainSheet, columnTypeByName) {
  if (!mainSheet) throw new Error('Sheet with headers is missing');
  const { data } = mainSheet;
  if (!data || data.length === 0) return [];

  const { rowData } = data[0];
  if (!rowData || rowData.length === 0) return [];

  // First row is always columns. Iterate over it and build types:
  const columnHeaders = rowData[0].values;
  return columnHeaders.map((x, columnIndex) => {
    const title = x && x.formattedValue;
    return {
      title,
      valueType: guessType(rowData, columnIndex, title)
    };
  }).filter(column => column.title);

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
