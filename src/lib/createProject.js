/**
 * Creates a new project in google docs;
 *
 * The project is always stored in its own folder, which is a child of all streaks folder.
 * Each project has at least one spreadsheet file, where project log is saved.
 */
import getStreaksFolder from './getStreaksFolder';

export default createProject;

function createProject(name) {
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

    return gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }).then(response => response.result.id);
  }

  function createLogFile(parentFolder) {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [parentFolder],
      properties: {
        createdByStreak: 'true'
      }
    };
    return gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }).then(response => {
      return response.result.id;
    }).then(spreadsheetId => updateSheetTemplate(spreadsheetId, name));
  }
}

function updateSheetTemplate(spreadsheetId, name) {
  // Since we've just created this template, the sheetId should be 0 (if I understand
  // this correctly).
  const sheetId = 0;

  // TODO: This should be configured by user.
  return gapi.client.sheets.spreadsheets.batchUpdate({
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
          values: [
            header('Time'),
            header('Comments')
          ]
        }]
      }
    }]
  }).then(res => {
    console.log('sheet updated', res);
    return spreadsheetId;
  });
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
