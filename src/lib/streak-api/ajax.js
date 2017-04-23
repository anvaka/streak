/**
 * Super simple ajax client
 */
export function get(url, qs) {
  return request(url, {
    qs
  });
}

export function request(url, params) {
  params = params || Object.create(null);

  if (params.method && params.method !== 'GET' && params.method !== 'POST') {
    throw new Error('Invalid request method');
  }

  return new Promise((resolve, reject) => {
    const queryPart = stringify(params.qs);
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
      resolve(this.responseText);
    }
  });
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
