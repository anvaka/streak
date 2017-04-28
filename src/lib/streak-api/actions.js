import { request } from './ajax.js';

// TODO: This should be configurable
const API_ENDPOINT = 'https://gnnpgomweb.execute-api.us-west-2.amazonaws.com/Stage/streak';

export function setProjectPublic(projectId, isPublic) {
  const id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  // For now this is just fire and forget call.
  return request(API_ENDPOINT, {
    method: 'POST',
    body: {
      operation: 'set-project-public',
      projectId,
      isPublic
    },
    qs: {
      id_token
    }
  });
}
