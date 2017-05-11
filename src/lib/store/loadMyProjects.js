import { getStreaksFolder } from './streaksFolder.js';
import listFiles from '../gapi/listFiles.js';
import auth from '../auth.js';

/**
 * Lists all projects in the current user account.
 */
export function loadMyProjects() {
  const profile = auth.signInStatus.profile;
  const owner = {
    name: profile.name,
    picture: profile.image
  };

  return getStreaksFolder().then(parentId => {
    if (!parentId) {
      // Means we haven't created a parent streaks folder yet. That's alright.
      // When we save a project it will be created
      return {
        projects: [],
        owner
      };
    }

    return listFiles(`trashed = false and '${parentId}' in parents`).then(projectList => {
      projectList.owner = owner;

      return projectList;
    });
  });
}
