const streakGraph = require('./streakGraph.js');

module.exports = function listUsers(queryString) {
  return streakGraph.queryNode('user', queryString && queryString.pageCursor)
    .then(response => {
      response.users = response.users.map(toUserWithoutSensitiveInfo);
      return response;
    });
};

function toUserWithoutSensitiveInfo(user) {
  return {
    id: user.id,
    name: user.name,
    picture: user.picture
  };
}
