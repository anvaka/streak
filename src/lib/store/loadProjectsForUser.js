import { listProjects } from '../streak-api/actions.js';

export function loadProjectsForUser(userId) {
  return listProjects(userId).then(projects => {
    return {
      projects: projects.map(p => ({
        id: p.id,
        name: p.data.name,
        description: p.data.description || '',
        isPublic: true,
        canEdit: false,
      }))
    };
  });
}
