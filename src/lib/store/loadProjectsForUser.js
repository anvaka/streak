import gapiFiles from '../gapi/files.js';
import { isFilePublic } from '../gapi/listFiles.js';
import { listProjects } from '../streak-api/actions.js';

export function loadProjectsForUser(userId) {
  return listProjects(userId).then(projectIds => {
    if (!projectIds) return [];

    const query = '(' +
      projectIds.map(x => { return `('${x}' in parents)`; }).join(' or ') +
    ") and (mimeType = 'application/vnd.google-apps.spreadsheet')";

    return gapiFiles('list', {
      q: query,
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name, description, permissions, ownedByMe, parents)'
    }).then((result) => {
      const { files } = result;
      const projectList = {
        projects: files.map(f => ({
          id: f.parents[0],
          name: f.name,
          description: f.description,
          isPublic: isFilePublic(f.permissions),
          canEdit: f.ownedByMe
        })),
      };

      return projectList;
    });
  });
}
