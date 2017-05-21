import { request } from './ajax.js';

export default function setProjectPublic(projectInfo, isPublic) {
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
