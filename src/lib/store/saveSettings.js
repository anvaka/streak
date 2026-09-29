import uploadJsonFile from '../gapi/uploadJsonFile.js';
import { clone } from '../utils.js';
import { resetProjectFileCache, resetSettings } from './cachingDocs.js';

// The save in progress for each project. Saves wait for the one before, and
// each applies its change to the settings as that one left them: two quick
// changes can't undo each other, and a project without a settings file gets
// one file, not two.
const lastSave = new WeakMap();

/**
 * Changes the project's streak-settings.json: `change(settings)` edits a copy
 * of the current settings, which is uploaded and then kept on the project.
 */
export default function saveSettings(project, change) {
  const previous = lastSave.get(project) || Promise.resolve();
  const save = previous.catch(() => {}).then(() => upload(project, change));
  lastSave.set(project, save);
  return save;
}

function upload(project, change) {
  const settings = clone(project.settings || {});
  change(settings);

  const metadata = { name: 'streak-settings.json', mimeType: 'application/json' };
  const isNew = !project.settingsFileId;
  if (isNew) metadata.parents = [project.id];

  return uploadJsonFile(metadata, JSON.stringify(settings, null, 2), project.settingsFileId)
    .then(response => {
      project.settings = settings;
      const id = response && response.result && response.result.id;
      // Remembered, so the next change updates this file instead of creating another.
      if (isNew && id) project.settingsFileId = id;
      resetSettings(project.settingsFileId);
      if (isNew) resetProjectFileCache(project.id);
      return response;
    });
}
