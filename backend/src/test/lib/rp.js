const request = require('request');
const encodeUser = require('./encode-user.js');

const endpoint = process.env.REST_STREAK_INTEGRATION;

if (!endpoint) {
  console.log('Make sure to specify REST_STREAK_INTEGRATION endpoint in environment variables');
  process.exit(1);
}

console.log('Starting tests at ' + endpoint);

module.exports = rp;

function rp(method, options) {
  if (options.qs.id_token) {
    options.qs.id_token = encodeUser(options.qs.id_token);
  }

  return new Promise((resolve, reject) => {
    request[method](endpoint, options, (error, response, body) => {
      if (error) reject(error);
      if (body) resolve(JSON.parse(body));
      else resolve(body);
    });
  });
}
