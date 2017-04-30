const saveProjectPublic = require('./operations/saveProjectPublic.js');
const listProjects = require('./operations/listProjects.js');

module.exports = route;

function route(req) {
  if (!req.body) return;
  const queryString = req.event.queryStringParameters;
  const operation = req.body.operation || queryString.operation;
  console.log('routing ', operation);
  switch (operation) {
    case 'set-project-public':
      return saveProjectPublic(req);
    case 'list-projects':
      return listProjects(queryString);
    default:
      throw new Error('Not implemented');
  }
}

