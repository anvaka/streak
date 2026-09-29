import constructSheetUpdateDiff from '../sheets/constructSheetUpdateDiff.js';
import { batchUpdate } from './sheetOperations.js';
import { resetProjectFileCache, resetSettings, resetSheetDataCache } from './cachingDocs.js';
import saveSettings from './saveSettings.js';

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
    // when all is done, we must reset our caches, so that we re-query full information
    // on next page render.
    resetProjectFileCache(project.id);
    resetSettings(project.settingsFileId);
    resetSheetDataCache(project.spreadsheetId);
  });

  // TODO: What happens in case of an error?
}


function updateSettings(project, newFields) {
  return saveSettings(project, streakSettings => {
    // TODO: This is duplicate of the createProject
    streakSettings.fields = newFields.map(c => {
      const field = { title: c.title, type: c.type.value };
      if (c.combine) field.combine = c.combine;
      return field;
    });
  });
}
