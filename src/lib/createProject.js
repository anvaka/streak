/**
 * Creates a new project in google docs;
 *
 * The project is always stored in its own folder, which is a child of all streaks folder.
 * Each project has at least one spreadsheet file, where project log is saved.
 */
import { getStreaksFolder, makeNewStreakFolder } from './store/streaksFolder.js';
import gapiFiles from './gapi/files.js';
import gapiSheets from './gapi/sheets.js';
import uploadJsonFile from './gapi/uploadJsonFile.js';
import header from './sheets/header.js';
import changePermissions from './store/changePermissions.js';

export default createProject;

// TODO: Some of this code is duplicated by `projectList/sheetOptions' consider
// refactoring.
function createProject(name, description, isPublic, fields) {
  return getStreaksFolder()
    .then(createStreakFolderIfNeeded)
    .then(createProjectFolder)
    .then(parentFolderId => {
      return Promise.all([
        createLogFile(parentFolderId),
        createSettingsFile(parentFolderId)
      ]).then(() => ({
        // TODO: This needs to be in sync with loadMyProjects(). Makes code
        // very brittle. Change it
        id: parentFolderId,
        name,
        description,
        isPublic,
        canEdit: true
      }));
    });

  function createStreakFolderIfNeeded(parent) {
    if (parent) {
      // this means that the parent folder exists, no need to create it again
      return parent;
    }

    // If we get here, it means that this is the first project, in the user's account
    return makeNewStreakFolder();
  }

  function createProjectFolder(parent) {
    if (!parent) throw new Error('Parent was not specified');

    const fileMetadata = {
      name,
      description,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parent],
      properties: {
        createdByStreak: 'true'
      }
    };

    return gapiFiles('create', {
      resource: fileMetadata,
      fields: 'id'
    }).then(result => result.id).then(projectId => {
      if (isPublic) {
        // if user wants to make this file public we need to issue special
        // update request to the gapi
        return changePermissions({
          projectId,
          name,
          description
        }, isPublic).then(() => projectId);
      }

      // otherwise no need to change anything
      return projectId;
    });
  }

  function createSettingsFile(parentFolderId) {
    const streakSettings = {
      name,
      fields: fields.map(c => ({
        title: c.title,
        type: c.type.value
      }))
    };

    return uploadJsonFile({
      name: 'streak-settings.json',
      mimeType: 'application/json',
      parents: [parentFolderId],
    }, JSON.stringify(streakSettings, null, 2));
  }

  function createLogFile(parentFolderId) {
    const properties = {
      createdByStreak: 'true',
    };

    const fileMetadata = {
      name,
      description,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [parentFolderId],
      properties
    };

    return gapiFiles('create', {
      resource: fileMetadata,
      fields: 'id'
    }).then(result => result.id)
      .then(spreadsheetId => updateSheetTemplate(spreadsheetId, name, fields));
  }
}

function updateSheetTemplate(spreadsheetId, name, fields) {
  // Since we've just created this template, the sheetId should be 0 (if I understand
  // this correctly).
  const sheetId = 0;

  return gapiSheets('batchUpdate', {
    spreadsheetId,
    requests: [{
      updateSheetProperties: {
        fields: 'title,gridProperties.frozenRowCount',
        properties: {
          sheetId,
          index: 0,
          title: name,
          gridProperties: {
            // We want the first row to be frozen
            frozenRowCount: 1,
          },
        }
      }
    }, {
      appendCells: {
        sheetId,
        fields: '*',
        rows: [{
          values: fields.map(f => header(f.title))
        }]
      }
    }]
  }).then(() => spreadsheetId);
}
