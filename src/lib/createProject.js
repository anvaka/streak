/**
 * Creates a new project in google docs;
 *
 * The project is always stored in its own folder, which is a child of all streaks folder.
 * Each project has at least one spreadsheet file, where project log is saved.
 */
import getStreaksFolder from './getStreaksFolder';
import gapiFiles from './gapi/files.js';
import gapiSheets from './gapi/sheets.js';
import uploadJsonFile from './gapi/uploadJsonFile.js';

export default createProject;

function createProject(name, columns) {
  return getStreaksFolder()
    .then(createProjectFolder)
    .then(parentFolderId => {
      return Promise.all([
        createLogFile(parentFolderId),
        createSettingsFile(parentFolderId)
      ]).then(() => parentFolderId);
    });

  function createProjectFolder(parent) {
    if (!parent) throw new Error('Parent was not specified');

    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parent],
      properties: {
        createdByStreak: 'true'
      }
    };

    return gapiFiles('create', {
      resource: fileMetadata,
      fields: 'id'
    }).then(result => result.id);
  }

  function createSettingsFile(parentFolderId) {
    const streakSettings = {
      name,
      fields: columns.map(c => ({
        title: c.name,
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
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [parentFolderId],
      properties
    };

    return gapiFiles('create', {
      resource: fileMetadata,
      fields: 'id'
    }).then(result => result.id)
      .then(spreadsheetId => updateSheetTemplate(spreadsheetId, name, columns));
  }
}

function updateSheetTemplate(spreadsheetId, name, columns) {
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
          values: columns.map(column => header(column.name))
        }]
      }
    }]
  }).then(() => spreadsheetId);
}


function header(text) {
  return {
    userEnteredValue: {
      stringValue: text
    },
    userEnteredFormat: {
      horizontalAlignment: 'CENTER',
      textFormat: {
        bold: true,
      },
    },
  };
}
