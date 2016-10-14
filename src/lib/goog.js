/**
 * The file provides a wrapper on top of Google API.
 */
import appModel from './appModel.js'

// This is my API client id. It's whitelisted only for the following domains
//
// http://localhost:8100
// http://127.0.0.1:8100
// https://streak.anvaka.com
// http://streak.anvaka.com
//
// So if you want to run this on a different port, you'll need your own client id.
const CLIENT_ID = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com'

const SCOPES = [
  // We need this to list all spreadsheet files
  'https://www.googleapis.com/auth/drive',
  // We need this to read/write time entries to the spreadsheet.
  'https://www.googleapis.com/auth/spreadsheets',
]

// We use this to quickly lookup sheet name by their id.
// See getSheetTitle() method
const sheetIdToTitle = new Map()

let apiInitialized = false

/**
 * Attempts to sign in
 * @param {bool} immediate - if true, then login uses "immediate mode", which
 * means that the token is refreshed behind the scenes, and no UI is shown to the user.
 */
export function signIn(immediate) {
  return gapi.auth.authorize({
    client_id: CLIENT_ID,
    scope: SCOPES,
    immediate
  }, handleAuthResult)
}

export function signOut(callback) {
  const token = gapi.auth.getToken()
  if (token) {
    const accessToken = token.access_token
    const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`

    window.jQuery.ajax({
      type: 'GET',
      url: revokeUrl,
      async: false,
      contentType: 'application/json',
      dataType: 'jsonp',
      success: forwardCallback,
      error: forwardCallback
    })
  }

  gapi.auth.signOut()

  // Make sure we also forward callback right now, if there was no token.
  if (!token) setTimeout(forwardCallback, 0)

  function forwardCallback() {
    cleanAppModel()
    callback()
  }
}

function cleanAppModel() {
  appModel.filesLoaded = false
  appModel.files = []
  appModel.authenticated = undefined
}

/**
 * Attempts to refresh auth token in background. If Google Client is not loaded
 * yet, this function prepares window.initializeGoogleApi variable to be called
 * by index.html
 */
export function initializeGoogleApi() {
  if (!gapi.auth) {
    // This means, google client was not yet loaded. We ask index.html
    // to call us when google client script is loaded.
    window.initializeGoogleApi = initializeGoogleApi

    // And wait until client is loaded...
    return
  }

  // On the other hand, if we've already initialized the API, we just bail out
  if (apiInitialized) return

  // First time here - make sure no-one will ever call us again.
  apiInitialized = true

  // Attempt to sign in in background
  signIn(/* immediate = */ true)
}

/**
 * Extracts error from Google API response
 */
export function getError(response) {
  if (!response) throw new Error('Response is required here')

  if (response.result && response.result.error) {
    return response.result.error.message
  }

  return 'Unknown error :('
}

/**
 * Gets a title of a sheet
 */
export function getSheetTitle(spreadsheetId, callback) {
  if (sheetIdToTitle.has(spreadsheetId)) {
    const title = sheetIdToTitle.get(spreadsheetId)
    setTimeout(() => callback(title), 0)
    return
  }

  gapi.client.sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'properties/title'
  }).then(response => {
    const title = get(response, 'result.properties.title')
    sheetIdToTitle.set(spreadsheetId, title)
    callback(title)
  })
}

export function logStreak(spreadsheetId, note) {
  note = note || ''

  const now = (new Date()).toISOString()

  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId,
    valueInputOption: 'USER_ENTERED',
    range: 'A2:B',
    values: [[now, note]],
  }).then(id, checkError)
}

function handleAuthResult(authResult) {
  appModel.authenticated = authResult && !authResult.error

  if (appModel.authenticated) loadAPIs()
}

function loadAPIs() {
  gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4').then(markGapiReady)
  gapi.client.load('drive', 'v3', listTimeSheetFiles)
}

function markGapiReady() {
  appModel.sheetsAPIReady = true
}

function listTimeSheetFiles() {
  // TODO: List only streak files. They could be in a folder?
  gapi.client.drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false",
    pageSize: 100,
  }).execute(response => {
    appModel.filesLoaded = true
    appModel.files = response.files
    makeTitleIndex(response.files)
  }, checkError)
}

function makeTitleIndex(files) {
  files.forEach(file => {
    sheetIdToTitle.set(file.id, file.name)
  })
}

function get(obj, path) {
  if (!obj) return obj

  const parts = path.split('.')
  for (let i = 0; i < parts.length; ++i) {
    const key = parts[i]
    obj = obj[key]
    if (!obj) return obj
  }

  return obj
}

function checkError(response) {
  if (response.status === 401) {
    // this is invalid auth. Refresh the page should fix it
    window.location.reload()
  }

  return response
}

function id(x) { return x }
