/**
 * Super simple ajax client
 */
export default function get(url, qs) {
  return new Promise((resolve, reject) => {
    const queryPart = stringify(qs);
    const suffix = (url.indexOf('?') > -1) ? '&' : '?';

    const oReq = new XMLHttpRequest();
    oReq.addEventListener('load', resolveBound);
    oReq.addEventListener('error', reject);

    oReq.open('GET', queryPart ? (url + suffix + queryPart) : url);
    oReq.send();

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
