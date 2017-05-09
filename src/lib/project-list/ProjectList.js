import Project from './Project.js';

import gapiCreateProject from '../createProject';
import { loadMyProjects } from '../store/loadMyProjects.js';
import { loadProjectsForUser } from '../store/loadProjectsForUser.js';
import { getCurrentUserId } from '../auth.js';

export default class ProjectList {

  constructor(ownerId) {
    this.ownerId = ownerId;
    this.loading = false;
    this.projects = [];
    // maps projectId to Project.
    this.projectLookup = new Map();
    this.owner = null;
  }

  get(projectId) {
    return this.projectLookup.get(projectId);
  }

  load() {
    if (this.ownerId === getCurrentUserId()) {
      this.loading = true;
      loadMyProjects().then((projectList) => {
        this.loading = false;
        this.setProjectsInternal(projectList);
        this.owner = projectList.owner;
      });
    } else {
      this.loading = true;
      loadProjectsForUser(this.ownerId).then((projectList) => {
        this.loading = false;
        this.setProjectsInternal(projectList);
        this.owner = projectList.owner;
      });
    }
  }

  setProjectsInternal(projectList) {
    // TODO: This should private
    this.projects = projectList.projects.map(file => {
      const project = new Project(file, this);
      this.projectLookup.set(project.id, project);

      return project;
    });
  }

  createNewProject(projectName, description, isPublic, fields) {
    // TODO: This doesn't seem to fit here...
    return gapiCreateProject(projectName, description, isPublic, fields)
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
