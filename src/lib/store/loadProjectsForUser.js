import { listProjects } from '../streak-api/actions.js';

/**
 * Given a user id, tries to load publicly shared projects for this user
 */
export function loadProjectsForUser(userId) {
  return listProjects(userId).then(response => {
    return {
      projects: response.projects.map(p => ({
        id: p.id,
        name: p.data.name,
        description: p.data.description || '',
        isPublic: true,
        canEdit: false,
      })),
      owner: response.user
    };
  });
}
