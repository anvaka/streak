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

export function getDateFromFilterString(filterDateString) {
  const parts = filterDateString.split('-').map(x => Number.parseInt(x, 10));
  const month = parts[0] - 1; // JS months are 0 based :-/
  const day = parts[1];
  const year = parts[2];
  return new Date(year, month, day);
}

export function getDateString(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-based
  const day = date.getDate();

  return `${month}-${day}-${year}`;
}

function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}

export function isDayInside(day, min, max) {
  if (!min) return true;

  const dayDate = (typeof day === 'string') ? day : getDateString(day);
  if (!max) return dayDate === min;
  const dayWithoutTime = new Date(dayDate);

  return (new Date(min) <= dayWithoutTime && dayWithoutTime <= new Date(max));
}
