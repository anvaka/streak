const decodeUrlEncodedFormBody = require('./lib/decodeUrlEncodedFormBody.js');
const decodeAndVerifyIdToken = require('./lib/decodeAndVerifyIdToken.js');
const route = require('./route.js');

module.exports = {
  handler
};

function handler(event, context, callback) {
  const body = decodeUrlEncodedFormBody(event.body);
  const idTokenUnsafe = extracIdToken(event, body);

  decodeAndVerifyIdToken(idTokenUnsafe).then(user => {
    if (user) {
      route({ body, user, event }).then(sendResponse);
    } else {
      sendResponse(403, 'id_token is required');
    }
  }).catch(e => {
    console.log('Failed to decode token', e);
    callback(null, createResponse(500, 'Something is wrong'));
  });

  function sendResponse(response) {
    callback(null, createResponse(200, JSON.stringify(response), event));
  }
}

function extracIdToken(event, postBody) {
  let id_token;
  if (event.queryStringParameters) id_token = event.queryStringParameters.id_token;
  if (!id_token && event.headers) id_token = event.headers['x-id_token'];
  if (!id_token && postBody) id_token = postBody.id_token;

  return id_token;
}

function createResponse(statusCode, body, event) {
  if (isDebug(event)) {
    body += '\n' + JSON.stringify(event, null, 2);
  }

  return {
    statusCode,
    body,
    headers: {
      'Access-Control-Allow-Origin': getCorsDomain(event.headers)
    }
  };
}

function getCorsDomain(reqHeaders) {
  const defaultDomain = 'https://streak.anvaka.com';

  if (!reqHeaders || !reqHeaders.origin) return defaultDomain;

  return reqHeaders.origin.indexOf('http://localhost:8100') === 0 ? 'http://localhost:8100' : defaultDomain;
}

function isDebug(event) {
  const qs = event && event.queryStringParameters;

  if (!qs) return false;

  return (isDebug in qs);
}
