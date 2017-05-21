import gapiFiles from '../gapi/files.js';
import { resetProjectFileCache } from './cachingDocs.js';
import setProjectPublic from '../streak-api/setProjectPublic.js';

/**
 * Moves given file into Trash folder (https://drive.google.com/drive/trash)
 */
export default function moveProjectToTrash(fileId) {
  return gapiFiles('update', {
    fileId,
    resource: {
      // We could use stronger 'delete' method, but for now just trashing
      trashed: true,
    }
  }).then(() => {
    resetProjectFileCache(fileId);
    return setProjectPublic(fileId, false);
  });
}
