/**
 * Creates and uploads a new file to google drive
 */
import handleAuthError from './handleAuthError.js';

export default function uploadJsonFile(fileMetadata, jsonContent) {
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

    gapi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: {
        uploadType: 'multipart'
      },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body
    }).then(resolve, handleAuthError(() => {
      return uploadJsonFile(name, jsonContent);
    }, reject));
  });
}
