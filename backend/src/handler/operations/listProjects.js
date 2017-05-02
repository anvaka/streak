const makeGraph = require('../lib/makeGraph.js');

module.exports = listProjects;

function listProjects({ userId }) {
  console.log('getting public projects for ', userId);

  const g = makeGraph();

  const fromId = `user.${userId}`;
  const edgeId = 'owns.project.';

  return g.getOutEdges(fromId, edgeId)
    .then(fetchUserAndProjects);

  function fetchUserAndProjects(edges) {
    console.log('Got list of edges for ', userId, JSON.stringify(edges));

    const nodesToFetch = edges.map(edgeId => (
      // this will remove edge type prefix from the edge definition.
      // e.g.
      // "owns.project.0B8W6vQAc4byGT2t3dmRDYjNEdTQ"
      //   .split('.') // -> ["owns", "project", "0B8W6vQAc4byGT2t3dmRDYjNEdTQ"]
      //   .slice(1)  //  -> ["project", "0B8W6vQAc4byGT2t3dmRDYjNEdTQ"]
      //   .join('.')  // ->  "project.0B8W6vQAc4byGT2t3dmRDYjNEdTQ"
      edgeId.split('.').slice(1).join('.')
    ));

    // add user as well:
    nodesToFetch.push(fromId);

    return g.getNodes(nodesToFetch).then(nodes => {
      const projects = [];
      const result = { projects };

      nodes.forEach(node => {
        if (node.NodeId.startsWith('user')) {
          result.user = {
            name: node.data.name,
            picture: node.data.picture
          };
        } else {
          projects.push({
            id: node.NodeId.split('.')[1],
            data: node.data || {},
            createdTime: node.createdTime
          });
        }
      });

      return result;
    });
  }
}
