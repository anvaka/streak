import getStreaksFolder from './getStreaksFolder';
import gapiFiles from './gapi/files.js';
import { getParentFolder } from './store/sheetIdToFolder.js';
import { resetProjectFileCache, resetSettings, resetSheetDataCache } from './store/cachingDocs.js';
import uploadJsonFile from './gapi/uploadJsonFile.js';
import constructSheetUpdateDiff from './sheets/constructSheetUpdateDiff.js';
import { batchUpdate } from './sheetOperations.js';
import { clone } from './utils.js';
import { savePublicProjects } from './streak-api/actions.js';

const projectList = {
  error: null,
  loading: true,
  projects: [],
};

export default projectList;

/**
 * Lists all projects in the current user account.
 *
 * TODO: I think this should be the root of application model data. Actual
 * project models (loadProject() results) should live here in the subtree.
 */
export function loadProjects() {
  return getStreaksFolder().then(listFiles);
}

function listFiles(parentId) {
  return gapiFiles('list', {
    q: `trashed = false and '${parentId}' in parents`,
    pageSize: 1000,
    fields: 'nextPageToken, files(id, name, permissions)'
  }).then((result) => {
    const { files } = result;

    // TODO: This should probably be done when user changes project visibility to
    // "public"
    // const publicProjects = files.filter(byPublicPermissions);
    // savePublicProjects(publicProjects);

    projectList.projects = files;
    projectList.loading = false;
    return projectList;
  });
}

function byPublicPermissions(file) {
  for (let i = 0; i < file.permissions.length; ++i) {
    if (file.permissions[i].type === 'anyone') return true;
  }

  return false;
}

export function deleteProject(fileId) {
  return gapiFiles('update', {
    fileId,
    resource: {
      // We could use stronger 'delete' method, but for now just trashing
      trashed: true,
    }
  }).then(() => {
    resetProjectFileCache(fileId);
    const projectIndex = findProjectIndex(fileId);
    projectList.projects.splice(projectIndex, 1);
  });
}

/**
 * Updates existing project. Currently only allows to change name/description
 * Can be extended to change columns, etc.
 *
 * TODO: should probably take projectId, not sheetId?
 */
export function updateNameAndDescription(sheetId, name, description) {
  // rename both parent folder and sheet id for consistency
  const parentFolder = getParentFolder(sheetId);

  if (!parentFolder) throw new Error(`Missing parent folder for ${sheetId}`);

  return Promise.all([
    rename(sheetId, name, description),
    rename(parentFolder, name, description)
  ]).then(all => {
    resetProjectFileCache(parentFolder);
    updateNameInLocalCache(parentFolder, name);
    return all;
  });

  function rename(fileId, name, description) {
    gapiFiles('update', {
      fileId,
      resource: {
        name,
        description
      }
    });
  }
}

function updateNameInLocalCache(projectId, name) {
  const project = findPorject(projectId);
  if (project) {
    // This will update project name only locally. Remote names
    // are updated by updateNameAndDescription() call.
    project.name = name;
  }
}

function findPorject(projectId) {
  const projectIndex = findProjectIndex(projectId);

  if (projectIndex !== undefined) return projectList.projects[projectIndex];
}

function findProjectIndex(projectId) {
  // TODO: This will become slow when too many projects are present
  const { projects } = projectList;
  for (let i = 0; i < projects.length; ++i) {
    if (projects[i].id === projectId) return i;
  }
}

export function updateProjectStructure(project, newFields) {
  const pendingRequests = [];

  // Updating project structure is a two-step process. First we need to update
  // sheet's columns, and then we update the `streak-settings.json` file, which
  // contains information about field types.

  // To update the sheet's structure we are using batch update Google Sheets API.
  // Batch update API is executed by a single JSON object. We construct it here:
  const sheetUpdateDiff = constructSheetUpdateDiff(project.headers, newFields);

  if (sheetUpdateDiff.length) {
    // If there was a change in the sheet structure, we invoke `batchUpdate`
    // and store promise.
    pendingRequests.push(batchUpdate(project.spreadsheetId, sheetUpdateDiff));
  }

  // Finally, we want to update streak-settings.json file as well. We can do
  // this in parallel:
  pendingRequests.push(updateSettings(project, newFields));

  // And wait until both promises are resolved
  return Promise.all(pendingRequests).then(() => {
    // when all is done, we must reset our caches, so that we requiry full information
    // on next page render.
    resetProjectFileCache(project.id);
    resetSettings(project.settingsFileId);
    resetSheetDataCache(project.spreadsheetId);
  });

  // TODO: What happens in case of an error?
}

function updateSettings(project, newFields) {
  const streakSettings = clone(project.settings || {});
  // TODO: This is duplicate of the createProject
  streakSettings.fields = newFields.map(c => ({
    title: c.title,
    type: c.type.value
  }));

  const uploadMetadata = {
    name: 'streak-settings.json',
    mimeType: 'application/json',
  };

  if (!project.settingsFileId) {
    uploadMetadata.parents = [project.id];
  }

  return uploadJsonFile(
    uploadMetadata,
    JSON.stringify(streakSettings, null, 2),
    project.settingsFileId
  );
}

