import { request } from './ajax.js';

// TODO: This should be configurable
const API_ENDPOINT = 'https://gnnpgomweb.execute-api.us-west-2.amazonaws.com/Stage/streak';

export function savePublicProjects(publicProjects) {
  const basicProjectInfo = publicProjects.map(x => ({
    id: x.id,
    name: x.name
  }));

  const id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  // For now this is just fire and forget call.
  request(API_ENDPOINT, {
    method: 'POST',
    body: {
      operation: 'save-projects',
      projects: JSON.stringify(basicProjectInfo)
    },
    qs: {
      id_token
    }
  });
}
