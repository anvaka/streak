/**
 * Collection of date related utilities
 */

/**
 * Given a google sheets date string, attempts to parse it
 */
export function convertDateToSheetsDateString(dateObject) {
  return dateObject.toISOString().substr(0, '2016-09-27T02:10:00'.length)
    .replace(/T/, ' ')
    .replace(/-/g, '/')
}

/**
 * returns current time as google sheets date
 */
export function getNow() {
  return convertDateToSheetsDateString(new Date())
}
