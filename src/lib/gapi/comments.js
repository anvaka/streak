import baseCall from './baseCall.js';

/**
 * A Google API wrapper for `gapi.client.drive.comments'
 */
export default function files(methodName, methodArguments) {
  return baseCall(gapi.client.drive.comments, methodName, methodArguments);
}
