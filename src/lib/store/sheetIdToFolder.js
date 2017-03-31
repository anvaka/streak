// Maps spreadsheet id to google drive folder. This is used to quickly
// update folder `modifiedTime` when user edits a spreadsheet
//
// Note: maybe there is a better way to monitor changes?

const sheetIdToParentFolder = new Map();

export function getParentFolder(sheetId) {
  return sheetIdToParentFolder.get(sheetId);
}

export function setParentFolder(sheetId, folderId) {
  sheetIdToParentFolder.set(sheetId, folderId);
}
