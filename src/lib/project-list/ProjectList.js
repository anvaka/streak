import Project from './Project.js';

import gapiCreateProject from '../createProject';
import { loadMyProjects } from '../store/loadMyProjects.js';
import { getCurrentUserId } from '../auth.js';

export default class ProjectList {

  constructor(ownerId) {
    this.ownerId = ownerId;
    this.loading = false;
    this.projects = [];
    // maps projectId to Project.
    this.projectLookup = new Map();
  }

  get(projectId) {
    return this.projectLookup.get(projectId);
  }

  load() {
    this.loading = true;

    if (this.ownerId === getCurrentUserId()) {
      loadMyProjects().then((projectList) => {
        this.loading = false;
        this.projects = projectList.projects.map(file => {
          const project = new Project(file, this);
          this.projectLookup.set(project.id, project);

          return project;
        });
      });
    }
  }

  createNewProject(projectName, description, fields) {
    return gapiCreateProject(projectName, description, fields)
    .then(file => {
      const project = new Project(file, this);
      this.projectLookup.set(project.id, project);
      this.projects.push(project);

      return project.id;
    });
  }

  removeChild(child) {
    const childIndex = this.projects.indexOf(child);
    if (childIndex > -1) {
      this.projects.splice(childIndex, 1);
    }
  }
}
