/**
 * Looks at the current user google drive, and attempts to find `Streaks` folder.
 *
 * It is okay to have multiple folders called `Streak`. Ours will have a special
 * folder marker (`isAnvakaStreakFolderRoot`) as a file property.
 *
 * If such folder does not exist, a new one will be created.
 */
import gapiFiles from './gapi/files.js';

export default getStreaksFolder;

const ROOT_FOLDER_NAME = 'Streaks';
const ROOT_FOLDER_MARKER = 'isAnvakaStreakFolderRoot';

// Stores identifier of a folder that hosts all streak projects
let parentStreakFolder;

// Poor man's protection against race conditions. This might be gone.
let isRunning = false;

/**
 * Gets or creates a folder that is a root of all streak projects
 */
function getStreaksFolder() {
  if (parentStreakFolder) {
    return new Promise(resolve => resolve(parentStreakFolder));
  }

  if (isRunning) throw new Error('You are getting into race conditions. Make sure only one folder can exist here');

  isRunning = true;

  return gapiFiles('list', {
    q: `trashed = false and properties has { key='${ROOT_FOLDER_MARKER}' and value='true' }`,
    pageSize: 1,
    fields: 'files(id, name)'
  }).then(processRootFolder);
}

function processRootFolder(result) {
  const files = result.files;
  if (files.length === 0) {
    return makeNewRootFolder();
  }

  isRunning = false;
  parentStreakFolder = files[0].id;

  return parentStreakFolder;
}

function makeNewRootFolder() {
  const fileMetadata = {
    name: ROOT_FOLDER_NAME,
    description: 'This folder contains all your "streak" projects',
    mimeType: 'application/vnd.google-apps.folder',
    properties: {
      [ROOT_FOLDER_MARKER]: 'true'
    }
  };

  return gapiFiles('create', {
    resource: fileMetadata,
    fields: 'id'
  }).then(result => {
    isRunning = false;

    parentStreakFolder = result.id;
    return parentStreakFolder;
  });
}
