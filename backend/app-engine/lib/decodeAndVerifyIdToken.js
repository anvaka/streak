const https = require('https');

const streakAppAud = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';

module.exports = decodeAndVerifyIdToken;

function decodeAndVerifyIdToken(idToken) {
  return new Promise((resolve, reject) => {
    https.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`, (res) => {
      res.on('data', (d) => {
        try {
          const data = JSON.parse(d);
          resolve(verifyToken(data, idToken));
        } catch (e) {
          console.log('Failed to parse the token response');
          console.log(d, idToken);
          reject(e);
        }
      });
    }).on('error', (e) => {
      // TODO: retry?
      console.error(e);
      reject(e);
    });
  });
}


/**
 * Implements checks from https://developers.google.com/identity/sign-in/web/backend-auth#verify-the-integrity-of-the-id-token
 */
function verifyToken(decodedToken, idToken) {
  if (!decodedToken) {
    console.log('Cannot verify idToken', idToken);
    return;
  }

  // Check 1. The value of aud in the ID token is equal to one of our app's client IDs.
  // This check is necessary to prevent ID tokens issued to a malicious app
  // being used to access data about the same user on our app's backend server.
  if (decodedToken.aud !== streakAppAud) {
    console.log('Decoded idToken aud does not match streak app', idToken);
    return;
  }

  // Check 2: The value of iss in the ID token is equal to accounts.google.com or https://accounts.google.com.
  const issValid = decodedToken.iss === 'accounts.google.com' || decodedToken.iss === 'https://accounts.google.com';
  if (!issValid) {
    console.log('Invalid iss attribute for token', idToken);
    return;
  }

  // Check 3: The expiry time (exp) of the ID token has not passed.
  const now = (new Date()).getTime();
  // need to multiply by 1000 to get timestamp to javascript format
  const exp = Number.parseInt(decodedToken.exp, 10) * 1000;
  if (now > exp) {
    console.log('token expired', idToken);
    return;
  }

  // All looks good. Return the decoded token
  return {
    id: decodedToken.sub,
    data: {
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      locale: decodedToken.locale,
      given_name: decodedToken.given_name,
      family_name: decodedToken.family_name
    }
  };
}

module.exports = decodeAndVerifyIdToken;
