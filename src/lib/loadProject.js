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
import extractHeaderTypesFromData from './extractHeaderTypesFromData';
import ProjectHistoryViewModel from './ProjectHistoryViewModel';
import { setParentFolder } from './store/sheetIdToFolder.js';
import {
  loadSheetWithSettings,
  getLogFileSpreadsheetId
} from './store/cachingDocs.js';

export default loadProject;

function loadProject(projectFolderId) {
  return getLogFileSpreadsheetId(projectFolderId)
    .then(folderContent => {
      // Remember the mapping to the parent folder so that later we can use it
      // to `touch` parent folder on each update (see `updateRow.js`)
      setParentFolder(folderContent.spreadsheetFile.id, projectFolderId);
      return loadSpreadsheet(folderContent, projectFolderId);
    });
}

function loadSpreadsheet(folderContent, projectId) {
  const { spreadsheetFile, settingsFileId } = folderContent;

  const spreadsheetId = spreadsheetFile.id;
  const { canEdit } = spreadsheetFile.capabilities;
  const { owners, name, description } = spreadsheetFile;

  return loadSheetWithSettings(spreadsheetId, settingsFileId)
    .then(convertToViewModel);

  function convertToViewModel(sheetWithSettings) {
    const vm = makeProjectViewModel({
      id: projectId,
      canEdit,
      owners,
      sheetData: sheetWithSettings.sheet,
      settings: sheetWithSettings.settings,
      spreadsheetId,
    });

    vm.title = name;
    vm.description = description;
    vm.settingsFileId = settingsFileId;

    const headersAreValid = checkHeadersAreValid(vm.headers);
    // if headers are not valid, let's redirect to the settings page, so that
    // user can fix the structure;
    vm.shouldRedirectToSettings = !headersAreValid;

    return vm;
  }
}

function checkHeadersAreValid(headers) {
  // TODO: this duplicates logic in the ProjectStructure.vue
  let hasDate = false;
  for (let i = 0; i < headers.length; ++i) {
    if (headers[0].valueType === InputTypes.DATE) {
      hasDate = true;
      break;
    }
  }

  // This should be enough for now. No duplicate name checks here yet.
  return hasDate;
}

function makeProjectViewModel(project) {
  const { sheetData, canEdit, owners, spreadsheetId, settings } = project;
  // TODO: Don't extract this, if streak-settings.json is present.
  const headers = extractHeaderTypesFromData(sheetData, settings);

  if (owners.length > 1) {
    console.log('This file has multiple owners. Expected?', spreadsheetId);
  }

  return {
    id: project.id,
    canEdit,
    owner: owners[0],
    sheetData: sheetData.values,
    spreadsheetId,
    projectHistory: new ProjectHistoryViewModel(sheetData.values, headers),
    headers,
    settings
  };
}
