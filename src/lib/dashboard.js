const dashboard = {
  error: null,
  loading: true,
  projects: [],
  loadProjects
};

export default dashboard;

function loadProjects() {
  gapi.client.drive.files.list({
    q: "trashed = false and properties has { key='isAnvakaStreakFolder' and value='true' }",
    // q: "properties has { key='isAnvakaStreakFolder' and value='true' }",
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)'
  }).then((response) => {
    const files = response.result.files;
    console.log(files);
    dashboard.projects = files;
    dashboard.loading = false;
    // TODO: errors handling should be done here.
  });
}
