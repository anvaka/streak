/**
 * Collection of date related utilities
 */

/**
 * Given a string, attempts to parse it
 */
export function convertDateToSheetsDateString(str) {
  const dateObject = new Date(str + 'Z');

  return dateObject.toISOString().substr(0, '2016-09-27T02:10:00'.length)
    .replace(/T/, ' ')
    .replace(/-/g, '/');
}

/**
 * returns current time as an <input type='datetime-local'/> value.
 */
export function getNow() {
  return toDateInputStr(new Date());
}

/**
 * Given a Date object returns its string value in US format MM/DD/YYYY
 */
export function toDateInputStr(date) {
  /* eslint prefer-template: 0 */
  return pad(date.getMonth() + 1) +
        '/' + pad(date.getDate()) +
        '/' + date.getFullYear() +
        ' ' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds());
}

function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}
