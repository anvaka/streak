const { OAuth2Client } = require('google-auth-library');

const isIntegration = !!process.env.INTEGRATION_TEST_RUN;

const streakAppAud = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';

const oauthClient = new OAuth2Client(streakAppAud);

module.exports = decodeAndVerifyIdToken;

function decodeAndVerifyIdToken(idToken) {
  if (isIntegration) {
    return integrationUser(idToken);
  }

  // Cryptographically verifies the JWT signature and standard claims locally
  // using Google's public keys, instead of trusting the unauthenticated
  // tokeninfo endpoint response.
  return oauthClient.verifyIdToken({ idToken, audience: streakAppAud })
    .then((ticket) => verifyToken(ticket.getPayload(), idToken))
    .catch((e) => {
      console.log('Failed to verify the token', idToken);
      console.error(e);
      return undefined;
    });
}

function integrationUser(idToken) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Integration run. Decoding ' + idToken);
      const user = JSON.parse(decodeURIComponent(idToken));
      console.log('Decoded as', user);
      resolve(user);
    } catch (e) {
      console.log('Failed to decode integration token');
      reject(e);
    }
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
