const gapiListProjects = require('./operations/gapi/listProjects.js');
const gapiUpdateProject = require('./operations/gapi/updateProject.js');
const gapiUpdateUserInfo = require('./operations/gapi/updateUserInfo.js');
const users = require('./operations/gapi/users.js');
const comments = require('./operations/gapi/comments.js');

module.exports = route;

function route(req) {
  if (!req.body) return;
  const queryString = req.event.queryStringParameters;
  const operation = req.body.operation || queryString.operation;
  if (!operation) {
    return new Promise((resolve, reject) => {
      reject('Operation cannot be undefined');
    });
  }

  console.log('routing ', operation);

  switch (operation) {
    case 'update-user-info':
      return gapiUpdateUserInfo(req.user);
    case 'set-project-public':
      return gapiUpdateProject(req.body, req.user).then(res => {
        console.log('Gapi update project: ', JSON.stringify(res));
        return res;
      });
    case 'list-all-users':
      return users.listAll(queryString);
    case 'list-specific-users':
      return users.listSpecific(queryString);
    case 'list-projects':
      return gapiListProjects(queryString).then(res => {
        console.log('Gapi list projects: ', JSON.stringify(res));
        return res;
      });
    case 'add-project-comment':
      return comments.add(req.body, req.user);
    case 'list-project-comments':
      return comments.list(queryString.projectId, queryString.pageCursor, req.user);

    default:
      throw new Error('Not implemented');
  }
}

