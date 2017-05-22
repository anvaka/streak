import renewAuth from '../gapi/renewAuth.js';

/**
 * Super simple ajax client
 */
export function get(qs, url) {
  return request({
    qs
  }, url);
}

// TODO: This should be configurable
const API_ENDPOINT = 'https://13bqs50skh.execute-api.us-west-2.amazonaws.com/Stage/streak';
// const API_ENDPOINT = 'http://localhost:8083';

export function request(params, url, isRetry) {
  params = params || Object.create(null);

  if (params.method && params.method !== 'GET' && params.method !== 'POST') {
    throw new Error('Invalid request method');
  }

  return new Promise((resolve, reject) => {
    if (!params.qs) params.qs = {};

    let id_token = params.qs && params.qs.id_token;
    if (!id_token) {
      id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
      if (method === 'POST') {
        params.body.id_token = id_token;
      } else {
        params.qs.id_token = id_token;
      }
    }

    const queryPart = stringify(params.qs);
    url = url || API_ENDPOINT;
    const suffix = (url.indexOf('?') > -1) ? '&' : '?';

    const oReq = new XMLHttpRequest();
    oReq.addEventListener('load', resolveBound);
    oReq.addEventListener('error', reject);

    const method = params.method || 'GET';
    oReq.open(method, queryPart ? (url + suffix + queryPart) : url);

    if (method === 'POST') {
      oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      oReq.send(stringify(params.body));
    } else {
      oReq.send();
    }

    function resolveBound() {
      if (this.status === 401 && tokenExpired(this.responseText)) {
        if (isRetry) {
          // we already tried to renew the token.
          return reject('AUTH');
        }

        return renewAuth().then(() => request(params, url, /* isRetry = */ true));
      }

      resolve(this.responseText);
    }
  });
}

function tokenExpired(errorText) {
  try {
    const r = JSON.parse(errorText);
    return r.error === 'ID_TOKEN';
  } catch (e) {
    return false;
  }
}

function stringify(object) {
  if (!object) return '';

  return Object.keys(object).map(toPairs).join('&');

  function toPairs(key) {
    let pair = encodeURIComponent(key);
    const value = object[key];
    if (value !== undefined) {
      pair += '=' + encodeURIComponent(value);
    }

    return pair;
  }
}
