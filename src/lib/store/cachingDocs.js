/**
 * This file provides caching layer on top of the ./googleDocs.js
 */
import {
  loadSheetData as gapiLoadSheetData,
  getLogFileSpreadsheetId as gapiGetLogFileSpreadsheetId,
  loadSettings as gapiLoadSettings
} from './googleDocs.js';
import { createDefaultCharts } from '../createProject.js';

// maps google sheet id to corresponding spreadsheet data (actual row values)
const sheetIdToSheetData = new Map();

// maps project id (a google drive folder) to spreadsheet file.
const projectIdToProjectFile = new Map();

// Store settings files here
const settingsIdCache = new Map();

/**
 * We store sheet settings in a separate file called 'settings.json'
 * Both files live under the same project folder.
 * This method will load them both.
 */
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

  if (!('charts' in settingsObject)) {
    // Legacy projects didn't have chart configuration. Set the default
    // config.
    settingsObject.charts = createDefaultCharts();
  }

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
    const cachedFile = projectIdToProjectFile.get(projectFolderId);
    if (cachedFile) {
      resolve(cachedFile);
      return;
    }

    gapiGetLogFileSpreadsheetId(projectFolderId).then(file => {
      projectIdToProjectFile.set(projectFolderId, file);
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
  return projectIdToProjectFile.delete(projectId);
}
