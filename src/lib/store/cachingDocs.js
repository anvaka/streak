import {
  loadSheetData as gapiLoadSheetData,
  getLogFileSpreadsheetId as gapiGetLogFileSpreadsheetId,
  loadSettings as gapiLoadSettings
} from './googleDocs.js';

// maps google sheet id to corresponding spreadsheet data (actual row values)
const sheetIdToSheetData = new Map();

// maps project id (a google drive folder) to spreadsheet file.
const projetIdToProjectFile = new Map();

// Store settings files here
const settingsIdCache = new Map();

export function loadSheetWithSettings(spreadsheetId, settingsId) {
  // TODO: There is probably no need to store independent caches
  // for spreadsheets/settings?
  return Promise.all([
    loadSheet(spreadsheetId),
    loadSettings(settingsId)
  ]).then(results => {
    return {
      sheet: results[0],
      settings: results[1]
    };
  });
}

function loadSettings(settingsId) {
  return new Promise((resolve, reject) => {
    if (!settingsId) {
      // this is possible for old projects, that were created without settings file
      const settings = addChartSettingsIfNeeded({});
      resolve(settings);
      return;
    }

    const cachedSettings = settingsIdCache.get(settingsId);
    if (cachedSettings) {
      resolve(cachedSettings);
      return;
    }

    return gapiLoadSettings(settingsId).then(settings => {
      settings = addChartSettingsIfNeeded(settings);
      settingsIdCache.set(settingsId, settings);
      return settings;
    }).then(resolve, reject);
  });
}

function addChartSettingsIfNeeded(settingsObject) {
  if (!settingsObject) settingsObject = Object.create(null);

  settingsObject.charts = [
    {
      type: 'contributions-wall',
      version: '1.0',
    }
  ];

  return settingsObject;
}

function loadSheet(spreadsheetId) {
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

    gapiGetLogFileSpreadsheetId(projectFolderId).then(file => {
      projetIdToProjectFile.set(projectFolderId, file);
      return file;
    }).then(resolve, reject);
  });
}

export function resetSheetDataCache(spreadsheetId) {
  return sheetIdToSheetData.delete(spreadsheetId);
}

export function resetSettings(settingsId) {
  return settingsIdCache.delete(settingsId);
}

export function resetProjectFileCache(projectId) {
  return projetIdToProjectFile.delete(projectId);
}
