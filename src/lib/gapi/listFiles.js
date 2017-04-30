import gapiFiles from './files.js';

export default function listFiles(query) {
  return gapiFiles('list', {
    q: query,
    pageSize: 1000,
    fields: 'nextPageToken, files(id, name, description, permissions, ownedByMe)'
  }).then((result) => {
    const { files } = result;
    const projectList = {
      projects: files.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        isPublic: isFilePublic(f.permissions),
        canEdit: f.ownedByMe
      })),

      // TODO: what is this?
      loading: false
    };

    return projectList;
  });
}

export function isFilePublic(permissions) {
  for (let i = 0; i < permissions.length; ++i) {
    if (permissions[i].type === 'anyone') return true;
  }

  return false;
}
