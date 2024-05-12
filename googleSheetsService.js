const { google } = require('googleapis');
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES
  });
  let authToken = await auth.getClient();
  return authToken;
}

async function getSpreadSheet({ spreadsheetId, auth }) {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    auth,
  });
  return res;
}

async function getSpreadSheetValues({ spreadsheetId, auth, sheetName }) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    auth,
    range: sheetName
  });
  return res;
}

async function addSpreadSheetsValue({ spreadsheetId, auth, range, values }) {
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    auth: auth,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [values],
    },
  });
  return res;
}

async function updateSpreadSheetValue({ spreadsheetId, auth, range, values }) {
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    auth: auth,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [values]
    }
  })
}


module.exports = {
  getAuthToken,
  getSpreadSheet,
  getSpreadSheetValues,
  addSpreadSheetsValue,
  updateSpreadSheetValue
}