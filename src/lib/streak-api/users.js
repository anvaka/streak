import { request, get } from './ajax.js';

// user id => userInfo (name, id, avatar)
const internalUsersCache = new Map();

export function listAllUsers(query) {
  const qs = Object.assign({}, query, {
    operation: 'list-all-users'
  });

  return get(qs);
}

export function getUsers(userIds) {
  if (!Array.isArray(userIds)) userIds = [userIds];

  const uncachedUsers = getUncached(userIds);

  return getInternal(uncachedUsers)
    .then(() => {
      return userIds.map(userId => internalUsersCache.get(userId));
    });
}

function getUncached(userIds) {
  const uncached = [];

  userIds.forEach(uId => {
    if (!internalUsersCache.has(uId)) {
      uncached.push(uId);
    }
  });

  return uncached;
}

function getInternal(users) {
  if (users.length === 0) {
    return new Promise(resolve => resolve());
  }

  return request({
    method: 'GET',
    qs: {
      users: JSON.stringify(users),
      operation: 'list-specific-users',
    }
  })
    .then(res => {
      res.forEach(u => {
        internalUsersCache.set(u.id, u);
      });
    });
}
