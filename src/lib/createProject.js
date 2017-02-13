import getStreaksFolder from './getStreaksFolder';

export default createProject;

function createProject(name) {
  return getStreaksFolder().then(createInParent);

  function createInParent(parent) {
    if (!parent) throw new Error('Parent was not specified');

    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parent],
      properties: {
        createdByStreak: 'true'
      }
    };

    return gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }).then(response => response.result);
  }
}

