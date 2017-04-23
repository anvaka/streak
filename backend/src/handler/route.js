const saveProjects = require('./operations/saveProjects.js');

module.exports = route;

function route(req) {
  if (!req.body) return;

  switch (req.body.operation) {
    case 'save-projects':
      return saveProjectsRoute(req);
    default:
      throw new Error('Not implemented');
  }
}

function saveProjectsRoute({ body, user }) {
  const projects = JSON.parse(body.projects);
  return saveProjects(projects, user);
}
