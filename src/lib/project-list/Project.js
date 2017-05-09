import loadProject from './loadProject.js';
import updateProjectInfo from '../store/updateProjectInfo.js';
import updateProjectStructure from '../store/updateProjectStructure.js';
import moveProjectToTrash from '../store/moveProjectToTrash.js';
import { updateRow, deleteRow } from '../store/sheetOperations.js';

export default class Project {
  constructor(file, parentList) {
    this.parentList = parentList;

    // this is projectId (a folder). TODO: rename to make it explicit.
    this.id = file.id;
    this.ownerId = parentList.ownerId;
    this.title = file.name;
    this.description = file.description;
    this.canEdit = file.canEdit;
    this.isPublic = file.isPublic;

    this.loading = false;
    this.projectHistory = null;
    this.spreadsheetId = null;
    this.settingsFileId = null;
    this.settings = null;
    this.headers = [];
    this.owner = null;
    this.sheetData = [];
  }

  load(from, to) {
    this.loading = true;

    return loadProject(this.id).then(vm => {
      this.loading = false;

      this.description = vm.description;
      this.spreadsheetId = vm.spreadsheetId;
      this.settings = vm.settings;
      this.settingsFileId = vm.settingsFileId;
      this.headers = vm.headers;
      this.owner = vm.owner;
      this.sheetData = vm.sheetData;

      vm.projectHistory.filter(from, to);

      this.projectHistory = vm.projectHistory;

      return this;
    });
  }

  updateRow(newRowValues, rowIndex) {
    return updateRow(this.id, this.spreadsheetId, newRowValues, rowIndex);
  }

  deleteRow(rowIndex) {
    return deleteRow(this.id, this.spreadsheetId, rowIndex);
  }

  updateProjectInfo(name, description, isPublic) {
    return updateProjectInfo(this.id, this.spreadsheetId, name, description, isPublic)
    .then(all => {
      this.title = name;
      this.description = description;
      this.isPublic = isPublic;
      return all;
    });
  }

  updateStructure(newProjectStructure) {
    return updateProjectStructure(this, newProjectStructure);
  }

  moveToTrash() {
    return moveProjectToTrash(this.id).then(() => {
      this.parentList.removeChild(this);
    });
  }
}
