module.exports = encodeUser;

function encodeUser(user) {
  return encodeURIComponent(JSON.stringify(user));
}
