const streakGraph = require('./streakGraph.js');
const toUserWithoutSensitiveInfo = require('./toUserWithoutSensitiveInfo.js');
// const Datastore = require('@google-cloud/datastore');
const datastore = require('./streakGraph.js').datastore;

const USER_KIND = 'user';

module.exports = {
  listAll,
  listSpecific
};

function listAll(queryString) {
  return streakGraph.queryNode(USER_KIND, queryString && queryString.pageCursor)
    .then(response => {
      response.users = response.nodes.map(toUserWithoutSensitiveInfo);
      return response;
    });
}

function listSpecific(queryString) {
  const { users } = queryString;
  if (!users) {
    throw new Error('users are required');
  }

  let usersObj;
  try {
    usersObj = JSON.parse(users);
  } catch (e) {
    throw new Error('Cannot parse users');
  }
  if (!Array.isArray(usersObj)) {
    throw new Error('Users object is not an array');
  }
  const keys = usersObj.map(id => datastore.key([USER_KIND, id]));

  return datastore.get(keys)
  .then(result => {
    const users = (result && result[0]) || [];
    return users.map(x => {
      const user = Object.assign({}, x, {
        id: x[datastore.KEY].name
      });
      return toUserWithoutSensitiveInfo(user);
    });
  });
}

