const makeGraph = require('../lib/makeGraph.js');

module.exports = listProjects;

function listProjects({ userId }) {
  console.log('getting public projects for ', userId);

  const g = makeGraph();

  const fromId = `user.${userId}`;
  const edgeId = 'owns.project.';

  return g.getOutEdges(fromId, edgeId).then(x => {
    console.log('Got list of projects for ', userId, JSON.stringify(x));
    // todo: next page?
    return x.map(node => ({
      id: node.NodeId.split('.')[1],
      data: node.data || {},
      createdTime: node.createdTime
    }));
  });
}
