/**
 * Looks at the current user google drive, and attempts to find `Streaks` folder.
 *
 * It is okay to have multiple folders called `Streak`. Ours will have a special
 * folder marker (`isAnvakaStreakFolderRoot`) as a file property.
 *
 * If such folder does not exist, a new one will be created.
 */
import gapiFiles from '../gapi/files.js';

const ROOT_FOLDER_NAME = 'Streaks';
const ROOT_FOLDER_MARKER = 'isAnvakaStreakFolderRoot';

// Stores identifier of a folder that hosts all streak projects
let parentStreakFolder;

// Poor man's protection against race conditions. This might be gone.
let isCreateStreakFolderInProgress = false;

let mainPendingGapiRequest;
const pendingCallers = [];

/**
 * Gets or creates a folder that is a root of all streak projects
 */
export function getStreaksFolder() {
  if (parentStreakFolder !== undefined) {
    // immediately resolve it, since we already have it. Parent streak
    // folder never changes.
    return new Promise(resolve => resolve(parentStreakFolder));
  }

  if (mainPendingGapiRequest) {
    // someone already called us. Pause everybody until we finish mainPendingGapiRequest
    const promisePair = {};
    const waitUntilFinished = new Promise((resolve, reject) => {
      promisePair.resolve = resolve;
      promisePair.reject = reject;
    });
    pendingCallers.push(promisePair);

    return waitUntilFinished;
  }


  mainPendingGapiRequest = gapiFiles('list', {
    q: `trashed = false and properties has { key='${ROOT_FOLDER_MARKER}' and value='true' }`,
    pageSize: 1,
    fields: 'files(id, name)'
  }).then(processRootFolder)
    .then(resolvePendingCallers)
    .catch(err => {
      rejectPendingCallers(err);
      throw err;
    });

  return mainPendingGapiRequest;

  function resolvePendingCallers(streakFolder) {
    pendingCallers.forEach(pair => pair.resolve(streakFolder));
    mainPendingGapiRequest = null;
    return streakFolder;
  }

  function rejectPendingCallers(err) {
    pendingCallers.forEach(pair => pair.reject(err));
  }
}

function processRootFolder(result) {
  const files = result.files;
  if (files.length === 0) {
    parentStreakFolder = null; // The folder is not created yet.
  } else {
    parentStreakFolder = files[0].id;
  }

  return parentStreakFolder;
}

export function makeNewStreakFolder() {
  if (isCreateStreakFolderInProgress) throw new Error('You are getting into race conditions');
  isCreateStreakFolderInProgress = true;

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
    isCreateStreakFolderInProgress = false;
    parentStreakFolder = result.id;
    return parentStreakFolder;
  });
}
