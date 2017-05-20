const decodeAndVerifyIdToken = require('./decodeAndVerifyIdToken.js');

module.exports = extractUser;

function extractUser(req, res, next) {
  const idTokenUnsafe = extracIdToken(req);

  decodeAndVerifyIdToken(idTokenUnsafe).then(user => {
    if (user) {
      req.user = user;
      next();
    } else {
      req.status(403).send('id_token is required');
    }
  }).catch(e => {
    console.error('Failed to decode token', e);
    res.status(500).send('Something is wrong!');
  });
}

function extracIdToken(req) {
  let id_token = req.query && req.query.id_token;
  if (!id_token && req.body) id_token = req.body.id_token;

  return id_token;
}
