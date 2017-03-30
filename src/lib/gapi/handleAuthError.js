export default handleAuthError;

function handleAuthError(retryCallback, rejectCallback) {
  return err => {
    // TOOD: should I give up at some point?
    const isInvalidCredentials = (err.status === 401) &&
      err.result && (
        // Google drive returns one error message
        (err.result.error.status === 'UNAUTHENTICATED') ||
        // while google sheets another
        (err.result.error.message === 'Invalid Credentials')
      );

    if (isInvalidCredentials) {
      return (
        new Promise((resolve) => {
          gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()
            .then(resolve, rejectCallback);
        })
      ).then(retryCallback);
    }

    rejectCallback(err);
  };
}
