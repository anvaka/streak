const streakGraph = require('./streakGraph.js');
const toUserWithoutSensitiveInfo = require('./toUserWithoutSensitiveInfo.js');

module.exports = function listUsers(queryString) {
  return streakGraph.queryNode('user', queryString && queryString.pageCursor)
    .then(response => {
      response.users = response.users.map(toUserWithoutSensitiveInfo);
      return response;
    });
};

