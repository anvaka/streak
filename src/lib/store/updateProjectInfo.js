import gapiFiles from '../gapi/files.js';
import changePermissions from './changePermissions.js';
import { resetProjectFileCache } from './cachingDocs.js';

/**
 * Updates existing project. Currently only allows to change name/description
 * Can be extended to change columns, etc.
 *
 * TODO: I don't like how many arguments this function take.
 */
export default function updateProjectInfo(projectId, sheetId, name, description, isPublic) {
  // rename both parent folder and sheet id for consistency
  return Promise.all([
    rename(sheetId, name, description),
    rename(projectId, name, description),
    changePermissions({
      projectId,
      name,
      description
    }, isPublic)
  ]).then(all => {
    // TODO: Get rid of this.
    resetProjectFileCache(projectId);
    return all;
  });

  function rename(fileId, name, description) {
    gapiFiles('update', {
      fileId,
      resource: {
        name,
        description
      }
    });
  }
}
