const makeGraph = require('../lib/makeGraph.js');

module.exports = listProjects;

function listProjects({ userId }) {
  console.log('getting public projects for ', userId);

  const g = makeGraph();

  const fromId = `user.${userId}`;
  const edgeId = 'owns.project.';

  return g.getOutEdges(fromId, edgeId).then(x => {
    console.log(userId, ' list porjects response ', x.Items);
    if (!x || !x.Items) return [];
    // todo: next page?
    return x.Items.map(edge => {
      // remove prefix 'owns.project.'. i.e.
      // owns.project.0B8W6vQAc4byGVVZOOVBWLWxxbUE => 0B8W6vQAc4byGVVZOOVBWLWxxbUE
      return edge.ToId.substr(edgeId.length);
    });
  });
}
