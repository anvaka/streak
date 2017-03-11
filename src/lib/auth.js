/**
 * Provides helper authentication functions with
 */
const CLIENT_ID = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';

const SCOPES = [
  // Profile is required to make sure we will be able to perform server side
  // validation of the current user.
  'profile',

  // All streak projects are stored on google drive, thuse we need access here:
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',

  // Project log is stored as a Google Spreadsheet document
  'https://www.googleapis.com/auth/spreadsheets'
].join(' ');

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];

/**
 * This is where authentication state is stored inside application
 */
const signInStatus = {
  error: null,
  loading: true,

  // need to have both, because we can be in the 'error/loading' states.
  // Maybe I should change this to enum
  signedIn: false,
  signedOut: false,
};

export default {
  /**
   * Initiates signInStatus data structure
   */
  initiateSignInStatus,

  /**
   * Rewquest to sign out current user
   */
  signOut,

  /**
   * gets current sign in status
   */
  signInStatus,
};

function signOut() {
  gapi.auth2.getAuthInstance().signOut();
}

function initiateSignInStatus() {
  signInStatus.loading = true;

  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', initClient);

    function initClient() {
      gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
      }).then(() => {
        // Listen for sign-in state changes.
        const auth2 = gapi.auth2.getAuthInstance();
        auth2.isSignedIn.listen(updateSignInStatus);

        const initialSignInState = auth2.isSignedIn.get();
        updateSignInStatus(initialSignInState);

        resolve(signInStatus);
      }, (err) => {
        setSignInError(err);
        reject(err);
      });
    }
  });
}

function updateSignInStatus(isSignedIn) {
  signInStatus.loading = false;
  console.log('sign in status changed');

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

function setSignInError(err) {
  signInStatus.signedIn = signInStatus.signedOut = false;
  signInStatus.error = err;
  signInStatus.loading = false;
}

function extractProfile() {
  const basicProfile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();

  return {
    image: basicProfile.getImageUrl(),
    name: basicProfile.getName(),
    email: basicProfile.getEmail()
  };
}
