const CLIENT_ID = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
].join(' ');

const signInStatus = {
  // TODO: How to handle error here?
  error: null,
  loading: true,

  // need to have both, because we can be in the 'error/loading' states.
  // Maybe I should change this to enum
  signedIn: false,
  signedOut: false,
};

export default {
  checkStatus,
  signInStatus,
  signOut,
};

function signOut() {
  gapi.auth2.getAuthInstance().signOut();
}

function checkStatus() {
  signInStatus.loading = true;

  return new Promise((resolve/* , reject */) => {
    // TODO: How to handle error here?
    gapi.load('client:auth2', initClient);

    function initClient() {
      gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
      }).then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance()
          .isSignedIn
          .listen(updateSignInStatus);

        const initialSignInState = gapi.auth2.getAuthInstance().isSignedIn.get();
        updateSignInStatus(initialSignInState);

        resolve(signInStatus);
      });
    }
  });
}

function updateSignInStatus(isSignedIn) {
  signInStatus.loading = false;

  if (isSignedIn) {
    signInStatus.profile = extractProfile();
    signInStatus.signedIn = true;
    signInStatus.signedOut = false;
  } else {
    signInStatus.profile = null;
    signInStatus.signedIn = false;
    signInStatus.signedOut = true;
  }
}

function extractProfile() {
  const basicProfile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();

  return {
    image: basicProfile.getImageUrl(),
    name: basicProfile.getName(),
    email: basicProfile.getEmail()
  };
}
