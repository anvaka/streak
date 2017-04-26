import { getStreaksFolder } from './streaksFolder.js';
import gapiFiles from '../gapi/files.js';

// import { savePublicProjects } from '../streak-api/actions.js';

/**
 * Lists all projects in the current user account.
 */
export function loadMyProjects() {
  return getStreaksFolder().then(listFiles);
}

function listFiles(parentId) {
  if (!parentId) {
    // Means we haven't created a parent streaks folder yet.
    return [];
  }

  return gapiFiles('list', {
    q: `trashed = false and '${parentId}' in parents`,
    pageSize: 1000,
    fields: 'nextPageToken, files(id, name, description, permissions, ownedByMe)'
  }).then((result) => {
    const { files } = result;
    // TODO: This should probably be done when user changes project visibility to
    // "public"
    // const publicProjects = files.filter(byPublicPermissions);
    // savePublicProjects(publicProjects);

    const projectList = {
      projects: files.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        isPublic: isFilePublic(f.permissions),
        canEdit: f.ownedByMe
      })),

      loading: false
    };

    return projectList;
  });
}

function isFilePublic(permissions) {
  for (let i = 0; i < permissions.length; ++i) {
    if (permissions[i].type === 'anyone') return true;
  }

  return false;
}

// function findProjectIndex(projectId) {
//   // TODO: This will become slow when too many projects are present
//   const { projects } = projectList;
//   for (let i = 0; i < projects.length; ++i) {
//     if (projects[i].id === projectId) return i;
//   }
// }
//
