/**
 * Appends a new log record to a project log
 */
const RANGE_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function appendRecord(spreadsheetId, record, row) {
  if (record.length >= RANGE_NAMES.length) throw new Error('Too many columns');

  const prefix = row !== undefined ? 'A' + (row + 2) : 'A2'; // +2 because we are zero based, and skip headers
  const range = `${prefix}:${RANGE_NAMES[record.length]}`;

  return new Promise((resolve, reject) => {
    const method = row !== undefined ? 'update' : 'append';
    return gapi.client.sheets.spreadsheets.values[method]({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      values: [record],
    }).then(resolve, reject);
  });
}
