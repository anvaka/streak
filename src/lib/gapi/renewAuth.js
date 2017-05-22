export default function renewAuth() {
  return new Promise((resolve, reject) => {
    gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()
      .then(resolve, reject);
  });
}
