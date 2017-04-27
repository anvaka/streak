import gapiPermissions from '../gapi/permissions.js';

export default function changePermissions(fileId, isPublic) {
  if (isPublic) {
    return gapiPermissions('create', {
      fileId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
  }

  return gapiPermissions('delete', {
    fileId,
    permissionId: 'anyoneWithLink'
  }).catch(err => {
    if (err && err.status === 404) {
      return; // This is okay, we are removing removed permissions
    }
    // this is not good. We don't know why it failed, so let's fail.
    throw err;
  });
}
