/**
 * This file mimics lambda environment and allows to have local instance
 * of the server
 */

const express = require('express');
const bodyParser = require('body-parser');

const handler = require('../handler/index.js').handler;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const port = process.env.PORT || 8083;

app.get('/', handleRequest);
app.post('/', handleRequest);

function handleRequest(req, res) {
  handler({
    queryStringParameters: req.query,
    body: encodeForLambda(req.body),
    headers: req.headers
  }, {}, (err, responseObject) => {
    const { headers } = responseObject;
    Object.keys(headers).forEach(header => {
      res.append(header, headers[header]);
    });

    res.status(responseObject.statusCode).send(responseObject.body);
  });
}

app.listen(port, () => {
  console.log('Local server listens on http://localhost:' + port);
});

function encodeForLambda(body) {
  if (!body) return '';

  const encoded = [];

  Object.keys(body).forEach(key => {
    let keyValue = encodeURIComponent(key);
    if (body[key]) {
      keyValue += '=' + encodeURIComponent(body[key]);
    }

    encoded.push(keyValue);
  });
  return encoded.join('&');
}
