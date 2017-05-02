const makeGraph = require('../lib/makeGraph.js');

module.exports = setProjectPublic;

function setProjectPublic({ body, user }) {
  const isPublic = body.isPublic === 'true';
  console.log('setting project public', body, isPublic, user);

  const g = makeGraph();

  // We add prefixes `user`, `project` to node so that we can differentiate
  // between different node types.
  const userId = `user.${user.id}`;
  const projectId = `project.${body.projectId}`;
  const edgeId = `owns.${projectId}`;

  // TODO: Do I need to update user data every time?
  if (isPublic) {
    g.addNode(userId, user.data);
    g.addNode(projectId, {
      name: body.name,
      description: body.description,
    });
    g.addEdge(userId, edgeId);
  } else {
    // TODO: Remove node?
    g.removeEdge(userId, edgeId);
  }

  return g.save();
}
