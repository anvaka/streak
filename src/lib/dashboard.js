import getStreaksFolder from './getStreaksFolder';

const dashboard = {
  error: null,
  loading: true,
  projects: [],
  loadProjects
};

export default dashboard;

function loadProjects() {
  return getStreaksFolder().then(listFiles);
}

function listFiles(parentId) {
  return gapi.client.drive.files.list({
    q: `trashed = false and '${parentId}' in parents`,
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)'
  }).then((response) => {
    const files = response.result.files;
    dashboard.projects = files;
    dashboard.loading = false;
    // TODO: errors handling should be done here.
  });
}
