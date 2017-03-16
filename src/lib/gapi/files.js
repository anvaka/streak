import handleAuthError from './handleAuthError.js';

export default function files(methodName, methodArguments) {
  return new Promise((resolve, reject) => {
    const parts = methodName.split('.');
    let functionToCall = gapi.client.drive.files;
    for (let i = 0; i < parts.length; ++i) {
      functionToCall = functionToCall[parts[i]];
    }

    functionToCall(methodArguments)
      .then(response => {
        resolve(response.result);
      }, handleAuthError(() => {
        return files(methodName, methodArguments).then(resolve, reject);
      }, reject));
  });
}
