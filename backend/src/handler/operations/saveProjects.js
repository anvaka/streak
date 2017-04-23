const makeGraph = require('../lib/makeGraph.js');

module.exports = saveProjects;

function saveProjects(projects, user) {
  const g = makeGraph();

  // We add prefixes `user`, `project` to node so that we can differentiate
  // between different node types.
  // TODO: Do I need UserNode/ProjectNode for higher level abstraction?
  const userId = `user.${user.id}`;
  g.addNode(userId, user.data);

  projects.forEach(project => {
    const projectId = `project.${project.id}`;

    g.addNode(projectId, { name: project.name });

    // We add special prefix to edge, so that we can differentiate between
    // "follows", "likes", "owns", etc.
    g.addEdge(userId, `owns.${projectId}`);
  });

  return g.save();
}
