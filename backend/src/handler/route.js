const gapiListProjects = require('./operations/gapi/listProjects.js');
const gapiUpdateProject = require('./operations/gapi/updateProject.js');

module.exports = route;

function route(req) {
  if (!req.body) return;
  const queryString = req.event.queryStringParameters;
  const operation = req.body.operation || queryString.operation;
  console.log('routing ', operation);

  switch (operation) {
    case 'set-project-public':
      return gapiUpdateProject(req.body, req.user).then(res => {
        console.log('Gapi update project: ', JSON.stringify(res));
        return res;
      });
    case 'list-projects':
      return gapiListProjects(queryString).then(res => {
        console.log('Gapi list projects: ', JSON.stringify(res));
        return res;
      });
    default:
      throw new Error('Not implemented');
  }
}

