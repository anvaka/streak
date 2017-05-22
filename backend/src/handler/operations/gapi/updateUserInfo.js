const streakGraph = require('./streakGraph.js');

module.exports = updateUserInfo;

function updateUserInfo(user) {
  console.log('Updating user', JSON.stringify(user));
  const userId = user.id;

  return streakGraph.addNode({
    kind: 'user',
    id: userId,
    data: user.data
  }).then(() => {
    // Return nothing.
  });
}
