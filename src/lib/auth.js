/**
 * Provides helper authentication functions with
 */
const CLIENT_ID = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';

const SCOPES = [
  // Profile is required to make sure we will be able to perform server side
  // validation of the current user.
  'profile',

  // All streak projects are stored on google drive, thus we need access here:
  // Note: we are using `drive.file` this limits scope of our access to files
  // created by streak only.
  'https://www.googleapis.com/auth/drive.file',

  // This is necessary to get public folders shared by other users.
  'https://www.googleapis.com/auth/drive.metadata',

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
  profile: null,
  userId: null,

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

/**
 * gets current user id
 */
export function getCurrentUserId() {
  return signInStatus && signInStatus.userId;
}

function signOut() {
  gapi.auth2.getAuthInstance().signOut();
}

function initiateSignInStatus() {
  signInStatus.error = null;
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

  if (isSignedIn) {
    signInStatus.profile = extractProfile();
    signInStatus.signedIn = true;
    signInStatus.signedOut = false;
    signInStatus.userId = signInStatus.profile.id;
  } else {
    signInStatus.profile = null;
    signInStatus.userId = null;
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
    id: basicProfile.getId(),
    image: basicProfile.getImageUrl(),
    name: basicProfile.getName(),
    email: basicProfile.getEmail()
  };
}
