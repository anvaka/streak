// Maps userId to project list
import { reactive } from 'vue';
import ProjectList from './project-list/ProjectList.js';

const projectsByUser = new Map();

/**
 * Returns public projects for a given user
 */
export default function getProjectList(userId) {
  const cachedList = projectsByUser.get(userId);
  if (cachedList) return cachedList;

  // `reactive()` before `load()`, and never touch the raw instance again:
  // `load()` resolves asynchronously and its callbacks capture `this`, so it
  // has to be called on the proxy or those writes bypass Vue and the view
  // never updates. Vue 2 made the raw instance itself reactive; Vue 3 does not.
  const projectList = reactive(new ProjectList(userId));
  projectList.load();

  projectsByUser.set(userId, projectList);

  return projectList;
}

