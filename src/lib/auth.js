const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const CLIENT_ID = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'].join(' ');

const user = {
  signedIn: false
};

export default {
  checkStatus
};

function checkStatus() {
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
          .listen((isSignedIn) => (user.signedIn = isSignedIn));

        const initialSignInState = gapi.auth2.getAuthInstance().isSignedIn.get();
        user.profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        user.signedIn = initialSignInState;

        resolve(user);
      });
    }
  });
}
