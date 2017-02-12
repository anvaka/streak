export default createProject;

function createProject(name) {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    properties: {
      isAnvakaStreakFolder: 'true'
    }
  };

  // TODO: errors
  return gapi.client.drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }).then(response => response.result);
}
