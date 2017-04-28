import gapiPermissions from '../gapi/permissions.js';
import { setProjectPublic } from '../streak-api/actions.js';

export default function changePermissions(fileId, isPublic) {
  if (isPublic) {
    return gapiPermissions('create', {
      fileId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    }).then(() => {
      return setProjectPublic(fileId, isPublic);
    });
  }

  return setProjectPublic(fileId, isPublic).then(() => {
    gapiPermissions('delete', {
      fileId,
      permissionId: 'anyoneWithLink'
    }).catch(err => {
      if (err && err.status === 404) {
        return; // This is okay, we are removing removed permissions
      }
      // this is not good. We don't know why it failed, so let's fail.
      throw err;
    });
  });
}
