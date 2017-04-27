import baseCall from './baseCall.js';

export default function files(methodName, methodArguments) {
  return baseCall(gapi.client.drive.files, methodName, methodArguments);
}
