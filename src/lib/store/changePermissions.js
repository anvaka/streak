import gapiPermissions from '../gapi/permissions.js';
import { setProjectPublic } from '../streak-api/actions.js';

export default function changePermissions(projectInfo, isPublic) {
  if (!projectInfo.projectId) throw new Error('Project id is required');
  if (isPublic) {
    return gapiPermissions('create', {
      fileId: projectInfo.projectId,
      resource: {
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: true
      }
    }).then(() => {
      return setProjectPublic(projectInfo, isPublic);
    });
  }

  return setProjectPublic(projectInfo, isPublic).then(() => {
    gapiPermissions('delete', {
      fileId: projectInfo.projectId,
      permissionId: 'anyone'
    }).catch(err => {
      if (err && err.status === 404) {
        return; // This is okay, we are removing removed permissions
      }
      // this is not good. We don't know why it failed, so let's fail.
      throw err;
    });
  });
}
