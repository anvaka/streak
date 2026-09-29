/**
 * Words for a failed Google API call. The APIs reject with a response object
 * whose message is at result.error.message, not with an Error, so printing the
 * rejection itself gives "[object Object]".
 */
export default function getErrorMessage(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  const apiError = err.result && err.result.error;
  if (apiError && apiError.message) return apiError.message;
  if (err.message) return err.message;
  if (err.status) return `Request failed (${err.status}${err.statusText ? ' ' + err.statusText : ''})`;
  return 'Unknown error';
}
