module.exports = function decodeUrlEncodedFormBody(body) {
  const bodyObject = Object.create(null);

  if (!body) return bodyObject;

  body.split('&').map(el => {
    const kvp = el.split('=');
    const res = [decodeURIComponent(kvp[0])];

    if (kvp.length > 1) {
      res.push(decodeURIComponent(kvp[1]));
    } else {
      res.push(false);
    }
    return res;
  }).forEach(pair => {
    bodyObject[pair[0]] = pair[1];
  });

  return bodyObject;
};
