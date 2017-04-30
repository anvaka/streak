import { request, get } from './ajax.js';

export function setProjectPublic(projectId, isPublic) {
  // For now this is just fire and forget call.
  return request({
    method: 'POST',
    body: {
      operation: 'set-project-public',
      projectId,
      isPublic
    }
  });
}

export function listProjects(userId) {
  return get({
    operation: 'list-projects',
    userId
  }).then(projectList => {
    return JSON.parse(projectList);
  });
}
