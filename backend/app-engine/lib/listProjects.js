const streakGraph = require('./streakGraph.js');

module.exports = listProjects;

function listProjects({ userId }) {
  const fromId = `user.${userId}`;
  const verb = 'share';
  return streakGraph.getEdgesFrom(fromId, verb).then(requestNodes).then(result => {
    return result;
  });
}

function requestNodes(edges) {
  const seen = new Set();
  let userRequest;
  const projectRequests = [];

  edges.forEach(edge => {
    if (!seen.has(edge.fromId)) {
      seen.add(edge.fromId);
      userRequest = makeUserRequest(edge.fromId);
    }
    if (seen.has(edge.toId)) {
      throw new Error(`Duplicate edge ${edge.fromId} -> ${edge.toId}`);
    }
    seen.add(edge.toId);
    projectRequests.push(makeProjectRequest(edge.toId));
  });

  if (!userRequest) return {};

  return streakGraph.getNode(projectRequests.concat(userRequest))
    .then(extractProjectList);
}

function extractProjectList(nodes) {
  // let response = {
  //   user: {
  //     name:
  //     picture:
  //   },
  //   projects: [{
  //     id:
  //     data:
  //     createdTime
  //   }]
  // }

  const result = {
    user: {},
    projects: []
  };

  nodes.forEach(node => {
    if (node.key.kind === 'user') {
      result.user = {
        name: node.data.name,
        picture: node.data.picture,
        id: node.key.name
      };
    } else {
      result.projects.push({
        id: node.key.name,
        data: node.data,
      });
    }
  });

  return result;
}

function makeUserRequest(edge) {
  const parts = edge.split('.');
  if (parts[0] !== 'user') throw new Error('from id is expected to have user.[] pattern');
  if (parts.length !== 2) throw new Error(`Too many dots in edge name ${edge}`);

  return {
    kind: 'user',
    id: parts[1]
  };
}

function makeProjectRequest(projectId) {
  const parts = projectId.split('.');
  if (parts[0] !== 'project') throw new Error('to id is expected to have project.[] pattern ');
  if (parts.length !== 2) throw new Error(`too many parts for project name ${projectId}`);

  return {
    kind: 'project',
    id: parts[1]
  };
}
