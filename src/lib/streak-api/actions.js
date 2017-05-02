import { request, get } from './ajax.js';

export function setProjectPublic(projectInfo, isPublic) {
  if (!projectInfo.projectId) throw new Error('project id is required');

  // For now this is just fire and forget call.
  return request({
    method: 'POST',
    body: {
      operation: 'set-project-public',
      projectId: projectInfo.projectId,
      name: projectInfo.name,
      description: projectInfo.description,
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
