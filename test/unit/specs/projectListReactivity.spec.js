import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

// Resolve the loads by hand so we can assert what the view does *after* the
// promises settle - that is where the Vue 3 proxy bug showed up.
let resolveLoad;
let resolveProject;

vi.mock('src/lib/store/loadMyProjects.js', () => ({
  loadMyProjects: () => new Promise(r => { resolveLoad = r; })
}));
vi.mock('src/lib/store/loadProjectsForUser.js', () => ({
  loadProjectsForUser: () => new Promise(r => { resolveLoad = r; })
}));
vi.mock('src/lib/project-list/loadProject.js', () => ({
  default: () => new Promise(r => { resolveProject = r; })
}));
vi.mock('src/lib/auth.js', () => ({ getCurrentUserId: () => 'me', default: {} }));
vi.mock('src/lib/createProject', () => ({ default: () => Promise.resolve({}) }));

const getProjectList = (await import('src/lib/getProjectList.js')).default;

const flush = () => new Promise(r => setTimeout(r, 0));
const freshList = () => getProjectList('user-' + Math.random());

describe('ProjectList reactivity through async load', () => {
  beforeEach(() => { resolveLoad = null; resolveProject = null; });

  it('re-renders the view when the async project load finishes', async () => {
    const projectList = freshList();

    const Comp = {
      props: ['projectList'],
      template: `<div>{{ projectList.loading ? 'Loading project list...' : 'loaded:' + projectList.projects.length }}</div>`
    };
    const w = mount(Comp, { props: { projectList } });
    expect(w.text()).toBe('Loading project list...');

    resolveLoad({ owner: { id: 'me' }, projects: [
      { id: 'p1', name: 'Read 30', canEdit: true, isPublic: true },
      { id: 'p2', name: 'Run', canEdit: true, isPublic: false }
    ]});
    await flush();
    await nextTick();

    expect(w.text()).toBe('loaded:2');
  });

  // Projects come back out of a Map (projectLookup). Vue 3 only wraps values
  // read *through* the reactive proxy, so this guards that path specifically:
  // ProjectPage.vue calls project.load() on exactly this object.
  it('re-renders when a single project finishes loading its details', async () => {
    const projectList = freshList();
    resolveLoad({ owner: { id: 'me' }, projects: [
      { id: 'p1', name: 'Read 30', canEdit: true, isPublic: true }
    ]});
    await flush();

    // The same lookup UserPage.vue's currentProject computed performs.
    const project = projectList.get('p1');

    const Comp = {
      props: ['project'],
      template: `<div>{{ project.loading ? 'Loading...' : 'desc:' + (project.description || 'none') }}</div>`
    };
    const w = mount(Comp, { props: { project } });
    expect(w.text()).toBe('desc:none');

    project.load();
    await nextTick();
    expect(w.text()).toBe('Loading...');

    resolveProject({
      description: 'Read 30+ minutes', spreadsheetId: 's1', settings: {},
      settingsFileId: 'f1', headers: [], sheetData: [],
      projectHistory: { filter() {} }
    });
    await flush();
    await nextTick();

    expect(w.text()).toBe('desc:Read 30+ minutes');
  });
});
