import { getStreaksFolder } from './streaksFolder.js';
import listFiles from '../gapi/listFiles.js';
import auth from '../auth.js';

/**
 * Lists all projects in the current user account.
 */
export function loadMyProjects() {
  return getStreaksFolder().then(parentId => {
    if (!parentId) {
      // Means we haven't created a parent streaks folder yet.
      return [];
    }

    return listFiles(`trashed = false and '${parentId}' in parents`).then(projectList => {
      const profile = auth.signInStatus.profile;
      projectList.owner = {
        name: profile.name,
        picture: profile.image
      };

      return projectList;
    });
  });
}
