module.exports = toUserWithoutSensitiveInfo;

function toUserWithoutSensitiveInfo(user) {
  return {
    id: user.id,
    name: user.name,
    picture: user.picture
  };
}
