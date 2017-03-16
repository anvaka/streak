import handleAuthError from './handleAuthError.js';

export default function sheets(methodName, methodArguments) {
  return new Promise((resolve, reject) => {
    const parts = methodName.split('.');
    let functionToCall = gapi.client.sheets.spreadsheets;
    for (let i = 0; i < parts.length; ++i) {
      functionToCall = functionToCall[parts[i]];
    }

    functionToCall(methodArguments)
      .then(response => {
        resolve(response.result);
      }, handleAuthError(() => {
        return sheets(methodName, methodArguments).then(resolve, reject);
      }, reject));
  });
}

