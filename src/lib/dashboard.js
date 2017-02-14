import getStreaksFolder from './getStreaksFolder';

const dashboard = {
  error: null,
  loading: true,
  projects: [],
  loadDashboard
};

export default dashboard;

function loadDashboard() {
  return getStreaksFolder().then(listFiles);
}

function listFiles(parentId) {
  return new Promise((resolve, reject) => {
    gapi.client.drive.files.list({
      q: `trashed = false and '${parentId}' in parents`,
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)'
    }).then((response) => {
      const files = response.result.files;
      dashboard.projects = files;
      dashboard.loading = false;
      resolve(dashboard);
    }, reject);
  });
}
