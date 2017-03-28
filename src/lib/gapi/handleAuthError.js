export default handleAuthError;

function handleAuthError(retryCallback, rejectCallback) {
  return err => {
    // TOOD: should I give up at some point?
    const isInvalidCredentials = (err.status === 401) &&
      err.result && (err.result.error.status === 'UNAUTHENTICATED');
    // err.result.error.message === 'Invalid Credentials');

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
