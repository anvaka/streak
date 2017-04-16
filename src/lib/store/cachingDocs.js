import {
  loadSheetData as gapiLoadSheetData,
  getLogFileSpreadsheetId as gapGetLogFileSpreadsheetId
} from './googleDocs.js';

// maps google sheet id to corresponding spreadsheet data (actual row values)
const sheetIdToSheetData = new Map();

// maps project id (a google drive folder) to spreadsheet file.
const projetIdToProjectFile = new Map();

export function loadSheetData(spreadsheetId) {
  return new Promise((resolve, reject) => {
    const cachedData = sheetIdToSheetData.get(spreadsheetId);
    if (cachedData) {
      resolve(cachedData);
      return;
    }

    return gapiLoadSheetData(spreadsheetId).then(sheetData => {
      sheetIdToSheetData.set(spreadsheetId, sheetData);
      return sheetData;
    }).then(resolve, reject);
  });
}

export function getLogFileSpreadsheetId(projectFolderId) {
  return new Promise((resolve, reject) => {
    const cachedFile = projetIdToProjectFile.get(projectFolderId);
    if (cachedFile) {
      resolve(cachedFile);
      return;
    }

    gapGetLogFileSpreadsheetId(projectFolderId).then(file => {
      projetIdToProjectFile.set(projectFolderId, file);
      return file;
    }).then(resolve, reject);
  });
}

export function resetSheetDataCache(spreadsheetId) {
  return sheetIdToSheetData.delete(spreadsheetId);
}

export function resetProjectFileCache(projectId) {
  return projetIdToProjectFile.delete(projectId);
}
