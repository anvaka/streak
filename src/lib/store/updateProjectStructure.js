import constructSheetUpdateDiff from '../sheets/constructSheetUpdateDiff.js';
import { batchUpdate } from './sheetOperations.js';
import { clone } from '../utils.js';
import { resetProjectFileCache, resetSettings, resetSheetDataCache } from './cachingDocs.js';
import uploadJsonFile from '../gapi/uploadJsonFile.js';

export default function updateProjectStructure(project, newFields) {
  const pendingRequests = [];

  // Updating project structure is a two-step process. First we need to update
  // sheet's columns, and then we update the `streak-settings.json` file, which
  // contains information about field types.

  // To update the sheet's structure we are using batch update Google Sheets API.
  // Batch update API is executed by a single JSON object. We construct it here:
  const sheetUpdateDiff = constructSheetUpdateDiff(project.headers, newFields);

  if (sheetUpdateDiff.length) {
    // If there was a change in the sheet structure, we invoke `batchUpdate`
    // and store promise.
    pendingRequests.push(batchUpdate(project.spreadsheetId, sheetUpdateDiff));
  }

  // Finally, we want to update streak-settings.json file as well. We can do
  // this in parallel:
  pendingRequests.push(updateSettings(project, newFields));

  // And wait until both promises are resolved
  return Promise.all(pendingRequests).then(() => {
    // when all is done, we must reset our caches, so that we requerry full information
    // on next page render.
    resetProjectFileCache(project.id);
    resetSettings(project.settingsFileId);
    resetSheetDataCache(project.spreadsheetId);
  });

  // TODO: What happens in case of an error?
}


function updateSettings(project, newFields) {
  const streakSettings = clone(project.settings || {});
  // TODO: This is duplicate of the createProject
  streakSettings.fields = newFields.map(c => ({
    title: c.title,
    type: c.type.value
  }));

  const uploadMetadata = {
    name: 'streak-settings.json',
    mimeType: 'application/json',
  };

  if (!project.settingsFileId) {
    uploadMetadata.parents = [project.id];
  }

  return uploadJsonFile(
    uploadMetadata,
    JSON.stringify(streakSettings, null, 2),
    project.settingsFileId
  );
}

