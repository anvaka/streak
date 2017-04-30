import { getStreaksFolder } from './streaksFolder.js';
import listFiles from '../gapi/listFiles.js';

/**
 * Lists all projects in the current user account.
 */
export function loadMyProjects() {
  return getStreaksFolder().then(parentId => {
    if (!parentId) {
      // Means we haven't created a parent streaks folder yet.
      return [];
    }

    return listFiles(`trashed = false and '${parentId}' in parents`);
  });
}
