import {
  loadSheetData as gapiLoadSheetData,
  loadSheetInfo as gapiLoadSheetInfo,
  getLogFileSpreadsheetId as gapGetLogFileSpreadsheetId
} from './googleDocs.js';

// maps google sheet id to corresponding spreadsheet data (actual row values)
const sheetIdToSheetData = new Map();

// maps sheet id to spreadsheet information (column headers, title)
const sheetIdToSheetInfo = new Map();

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

export function loadSheetInfo(spreadsheetId) {
  return new Promise((resolve, reject) => {
    const cachedInfo = sheetIdToSheetInfo.get(spreadsheetId);
    if (cachedInfo) {
      resolve(cachedInfo);
      return;
    }

    gapiLoadSheetInfo(spreadsheetId).then(sheetInfo => {
      sheetIdToSheetInfo.set(spreadsheetId, sheetInfo);
      return sheetInfo;
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

export function resetSheetInfoCache(spreadsheetId) {
  return sheetIdToSheetInfo.delete(spreadsheetId);
}

export function resetProjectFileCache(projectId) {
  return projetIdToProjectFile.delete(projectId);
}
