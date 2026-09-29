/**
 * Creates and uploads a new file to google drive
 */
import handleAuthError from './handleAuthError.js';

export default function uploadJsonFile(fileMetadata, jsonContent, fileId) {
  return new Promise((resolve, reject) => {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const contentType = 'application/json';

    const body = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        (typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent)) +
        closeDelim;

    let path = '/upload/drive/v3/files';

    if (fileId) {
      // This will replace existing file.
      path += '/' + fileId;
    }

    gapi.client.request({
      path,
      method: fileId ? 'PATCH' : 'POST',
      params: {
        uploadType: 'multipart'
      },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body
    }).then(resolve, handleAuthError(() => {
      // The same upload again once sign-in is renewed. This used to pass
      // `name` (window.name) and no file id, so an expired token turned a
      // settings update into a new untitled file, and the save never finished.
      return uploadJsonFile(fileMetadata, jsonContent, fileId).then(resolve, reject);
    }, reject));
  });
}
