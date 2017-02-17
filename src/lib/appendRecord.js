const RANGE_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function appendRecord(spreadsheetId, record) {
  if (record.length >= RANGE_NAMES.length) throw new Error('Too many columns');

  const range = `A2:${RANGE_NAMES[record.length]}`;

  return new Promise((resolve, reject) => {
    return gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      values: [record],
    }).then(resolve, reject);
  });
}
