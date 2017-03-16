/**
 * Creates a new project in google docs;
 *
 * The project is always stored in its own folder, which is a child of all streaks folder.
 * Each project has at least one spreadsheet file, where project log is saved.
 */
import getStreaksFolder from './getStreaksFolder';
import gapiFiles from './gapi/files.js';
import gapiSheets from './gapi/sheets.js';

export default createProject;

function createProject(name, columns) {
  return getStreaksFolder()
    .then(createProjectFolder)
    .then(createLogFile);

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

  function createLogFile(parentFolderId) {
    const properties = {
      createdByStreak: 'true',
    };

    // Properties and app properties are limited to 124 bytes in UTF-8 encoding,
    // counting both the key and the value. So we split each property into multiple
    // keys:
    columns.forEach((column, idx) => {
      const nameKey = `col.${idx}.name`;
      properties[nameKey] = column.name;

      const typeKey = `col.${idx}.type`;
      properties[typeKey] = column.type.value;
      // TODO: probabyl worth to check max length
    });

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
      .then(spreadsheetId => updateSheetTemplate(spreadsheetId, name, columns))
      .then(() => parentFolderId);
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
