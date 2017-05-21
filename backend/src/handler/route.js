const saveProjectPublic = require('./operations/saveProjectPublic.js');
const listProjects = require('./operations/listProjects.js');

const gapiListProjects = require('./operations/gapi/listProjects.js');
const gapiUpdateProject = require('./operations/gapi/listProjects.js');

module.exports = route;

function route(req) {
  if (!req.body) return;
  const queryString = req.event.queryStringParameters;
  const operation = req.body.operation || queryString.operation;
  console.log('routing ', operation);
  switch (operation) {
    case 'set-project-public':
      gapiUpdateProject(req.body, req.user).then(res => {
        console.log('Gapi update project: ', JSON.stringify(res));
      });
      return saveProjectPublic(req);
    case 'list-projects':
      gapiListProjects(queryString).then(res => {
        console.log('Gapi list projects: ', JSON.stringify(res));
      });
      return listProjects(queryString);
    default:
      throw new Error('Not implemented');
  }
}

