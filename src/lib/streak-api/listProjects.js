import { get } from './ajax.js';

export default function listProjects(userId) {
  return get({
    operation: 'list-projects',
    userId
  });
}
