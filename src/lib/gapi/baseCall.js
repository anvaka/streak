import handleAuthError from './handleAuthError.js';

export default function baseCall(baseFunction, methodName, methodArguments) {
  return new Promise((resolve, reject) => {
    const parts = methodName.split('.');
    let functionToCall = baseFunction;
    for (let i = 0; i < parts.length; ++i) {
      functionToCall = functionToCall[parts[i]];
    }

    functionToCall(methodArguments)
      .then(response => {
        resolve(response.result);
      }, handleAuthError(() => {
        return baseCall(baseFunction, methodName, methodArguments).then(resolve, reject);
      }, reject));
  });
}

