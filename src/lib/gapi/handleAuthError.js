import renewAuth from './renewAuth.js';

export default handleAuthError;

function handleAuthError(retryCallback, rejectCallback) {
  return err => {
    // TODO: should I give up at some point?
    const isInvalidCredentials = (err.status === 401) &&
      err.result && (
        // Google drive returns one error message
        (err.result.error.status === 'UNAUTHENTICATED') ||
        // while google sheets another
        (err.result.error.message === 'Invalid Credentials')
      );

    if (isInvalidCredentials) {
      return renewAuth().then(retryCallback).catch(rejectCallback);
    }

    rejectCallback(err);
  };
}
