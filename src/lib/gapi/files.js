import baseCall from './baseCall.js';

/**
 * A Google API wrapper for `gapi.client.drive.files'
 */
export default function files(methodName, methodArguments) {
  return baseCall(gapi.client.drive.files, methodName, methodArguments);
}
