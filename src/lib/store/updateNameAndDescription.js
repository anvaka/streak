import gapiFiles from '../gapi/files.js';
import { resetProjectFileCache } from './cachingDocs.js';

/**
 * Updates existing project. Currently only allows to change name/description
 * Can be extended to change columns, etc.
 */
export default function updateNameAndDescription(projectId, sheetId, name, description) {
  // rename both parent folder and sheet id for consistency
  return Promise.all([
    rename(sheetId, name, description),
    rename(projectId, name, description)
  ]).then(all => {
    // TODO: Get rid of this.
    resetProjectFileCache(projectId);
    // updateNameInLocalCache(projectId, name);
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
