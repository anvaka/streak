import baseCall from './baseCall.js';

export default function sheets(methodName, methodArguments) {
  return baseCall(gapi.client.sheets.spreadsheets, methodName, methodArguments);
}

