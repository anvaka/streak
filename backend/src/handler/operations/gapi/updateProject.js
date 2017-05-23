const streakGraph = require('./streakGraph.js');

module.exports = updateProject;

function updateProject(project, user) {
  console.log('Updating project', JSON.stringify(project));
  const userId = user.id;
  const projectId = project.projectId;
  const fromId = `user.${userId}`;
  const toId = `project.${projectId}`;

  // we are checking against string, because it's sent as a string. Doh.
  if (project.isPublic === 'true') {
    const addUser = streakGraph.addNode({
      kind: 'user',
      id: userId,
      data: user.data
    });

    const addProject = streakGraph.addNode({
      kind: 'project',
      id: projectId,
      data: { name: project.name, description: project.description }
    });

    const addEdge = streakGraph.addEdge(fromId, 'share', toId);

    return Promise.all([addUser, addProject, addEdge]);
  }

  console.log('Removing a project', projectId);

  // If we get here, we are removing public information about this project.
  return Promise.all([
    streakGraph.removeEdge(fromId, 'share', toId),
    streakGraph.removeNode('project', projectId)
  ]);
}
