import gapiFiles from '../gapi/files.js';
import { resetProjectFileCache } from './cachingDocs.js';

export default function deleteProject(fileId) {
  return gapiFiles('update', {
    fileId,
    resource: {
      // We could use stronger 'delete' method, but for now just trashing
      trashed: true,
    }
  }).then(() => {
    resetProjectFileCache(fileId);
  });
}
