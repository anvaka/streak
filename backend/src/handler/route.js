const saveProjectPublic = require('./operations/saveProjectPublic.js');

module.exports = route;

function route(req) {
  if (!req.body) return;
  console.log('routing ', req.body.operation);

  switch (req.body.operation) {
    case 'set-project-public':
      return saveProjectPublic(req);
    default:
      throw new Error('Not implemented');
  }
}

