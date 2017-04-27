import baseCall from './baseCall.js';

export default function permissions(methodName, methodArguments) {
  return baseCall(gapi.client.drive.permissions, methodName, methodArguments);
}

