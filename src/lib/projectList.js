import getStreaksFolder from './getStreaksFolder';
import gapiFiles from './gapi/files.js';
import { getParentFolder } from './store/sheetIdToFolder.js';
import { resetProjectFileCache, resetSettings, resetSheetDataCache } from './store/cachingDocs.js';
import uploadJsonFile from './gapi/uploadJsonFile.js';
import { batchUpdate } from './sheetOperations.js';

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
  return new Promise((resolve, reject) => {
    gapi.client.drive.files.list({
      q: `trashed = false and '${parentId}' in parents`,
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)'
    }).then((response) => {
      const files = response.result.files;
      projectList.projects = files;
      projectList.loading = false;
      resolve(projectList);
    }, reject);
  });
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

  const sheetUpdateDiff = constructSheetUpdateDiff(project.headers, newFields);
  if (sheetUpdateDiff.length) {
    pendingRequests.push(batchUpdate(project.spreadsheetId, sheetUpdateDiff));
  }

  pendingRequests.push(updateSettings(project, newFields));

  return Promise.all(pendingRequests).then(() => {
    resetProjectFileCache(project.id);
    resetSettings(project.settingsFileId);
    resetSheetDataCache(project.spreadsheetId);
  });
}

function constructSheetUpdateDiff(headers, newFields) {
  const requests = [];
  let insertedCount = 0;
  const currentHeadersCount = headers.length;

  newFields.forEach(field => {
    if (field.originalTitle) {
      if (field.originalTitle !== field.title) {
        // this field existed before. If it's new title changed - then it's rename operation
        requests.push(renameHeader(field.columnIndex, field.title));
      }
    } else {
      // This is a new field. We always append to the end of the sheet, so that
      // we don't have to tract column index movement during deletion.
      requests.push({
        appendDimension: {
          sheetId: 0,
          dimension: 'COLUMNS',
          length: 1
        }
      });
      requests.push(appendHeader(field.title, currentHeadersCount + insertedCount));
      insertedCount += 1;
    }
  });

  const currentFields = indexBy(newFields, 'originalTitle');
  // now let's traverse backwards, and remove all columns that were deleted
  for (let i = headers.length - 1; i > -1; i--) {
    const header = headers[i];
    if (header.title && !currentFields.has(header.title)) {
      requests.push(removeColumn(i));
    }
  }

  return requests;
}

function appendHeader(title, columnIndex) {
  return {
    updateCells: {
      fields: 'userEnteredValue, userEnteredFormat',
      start: {
        sheetId: 0,
        rowIndex: 0,
        columnIndex
      },
      rows: [{
        values: [header(title)]
      }]
    }
  };
}

function header(text) {
  return {
    userEnteredValue: {
      stringValue: text
    },
    userEnteredFormat: {
      horizontalAlignment: 'CENTER',
      textFormat: {
        bold: true,
      },
    },
  };
}

function removeColumn(columnIndex) {
  return {
    deleteDimension: {
      range: {
        sheetId: 0,
        dimension: 'COLUMNS',
        startIndex: columnIndex,
        endIndex: columnIndex + 1
      }
    }
  };
}

function renameHeader(columnIndex, title) {
  return {
    updateCells: {
      fields: 'userEnteredValue',
      start: {
        sheetId: 0,
        rowIndex: 0,
        columnIndex
      },
      rows: [{
        values: [{
          userEnteredValue: {
            stringValue: title
          }
        }]
      }]
    }
  };
}

function indexBy(collection, propName) {
  const index = new Map();
  collection.forEach(el => {
    index.set(el[propName], el);
  });

  return index;
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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
