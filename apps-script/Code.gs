/**
 * Hypertension Screening – Google Sheet sync (Google Apps Script web app)
 * Scudder College of Nursing, Ranipet
 *
 * WHAT IT DOES
 *   Phones running the screening app send their records here. Each record is
 *   written to the "Records" tab of this spreadsheet, one row per person.
 *   Rows are matched on record_id, so re-sending or editing a record (or a
 *   follow-up update) UPDATES the existing row instead of adding a duplicate.
 *   The "Villages" tab (column A, header "Village") is the official village list:
 *   the app downloads it for its village drop-down. The tab is created automatically.
 *
 * SETUP (full steps in SETUP-GOOGLE-SHEET.txt)
 *   1. Change KEY below to your own long secret (letters and numbers).
 *   2. Deploy > New deployment > Web app; Execute as: Me; Who has access: Anyone.
 *   3. Put the Web App URL and the same KEY into the app (Records > Sync settings).
 *   4. Type the village names in the "Villages" tab, one per row under the header.
 *
 * After changing this code, use Deploy > Manage deployments > Edit (pencil) >
 * Version: New version > Deploy, so the existing URL keeps working.
 */

// ====== CHANGE THIS to your own secret key. The app must use exactly the same key. ======
const KEY = 'CHANGE-ME-TO-A-LONG-SECRET';
// ===========================================================================================

const PLACEHOLDER_KEY = 'CHANGE-ME-TO-A-LONG-SECRET'; // used to detect "KEY not set yet"
const SHEET_NAME = 'Records';                          // tab is created automatically
const VILLAGES_SHEET = 'Villages';                     // column A, header "Village" in row 1
const MAX_RECORDS_PER_REQUEST = 200;

// Same columns, same order, as the app's CSV export, plus two sync columns.
const COLUMNS = [
  'record_id', 'is_sample', 'screening_date', 'created_at', 'updated_at', 'entered_by', 'updated_by', 'screened_by',
  'name', 'age', 'age_group',
  'sex', 'village', 'phone', 'consent', 'sbp1', 'dbp1', 'sbp2', 'dbp2', 'pulse', 'avg_sbp', 'avg_dbp', 'bp_category',
  'tobacco', 'alcohol', 'diabetes', 'family_history_htn', 'height_cm', 'weight_kg', 'bmi', 'bmi_category_asian',
  'waist_cm', 'waist_high', 'followup_required', 'followup_due_date', 'followup_status', 'followup_done_date',
  'followup_overdue', 'recheck_count', 'last_recheck_date', 'last_recheck_sbp', 'last_recheck_dbp',
  'last_recheck_pulse', 'last_recheck_category', 'all_rechecks', 'notes'
];
const SYNC_COLUMNS = ['synced_at', 'device_id'];
const PLAIN_TEXT_COLUMNS = ['record_id', 'phone']; // stop Sheets turning these into numbers

/**
 * GET without parameters: simple status check (used by the app's "Test connection").
 * GET ?action=villages&key=YOUR_KEY : returns the village list from the Villages tab.
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  ensureVillagesSheet_(); // make sure the Villages tab exists so Paul can fill it in
  if (p.action === 'villages') {
    const bad = keyError_(p.key);
    if (bad) return json_({ ok: false, error: bad });
    return json_({ ok: true, villages: readVillages_(), time: new Date().toISOString() });
  }
  return json_({
    ok: true,
    app: 'htn-screening-sync',
    version: 2,
    keyConfigured: KEY !== PLACEHOLDER_KEY,
    time: new Date().toISOString()
  });
}

/**
 * POST: body is JSON sent as text/plain:
 *   { "key": "...", "action": "upsert", "device_id": "DEV-...", "records": [ {record_id: ..., ...}, ... ] }
 *   { "key": "...", "action": "ping" }   -> checks the key only
 * Always answers with JSON: { ok: true, ... } or { ok: false, error: "..." }.
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }

  // --- Security: shared secret key check ---
  const bad = keyError_(body && body.key);
  if (bad) return json_({ ok: false, error: bad });

  ensureVillagesSheet_();
  if (body.action === 'ping') return json_({ ok: true, pong: true, time: new Date().toISOString() });
  if (body.action === 'villages') return json_({ ok: true, villages: readVillages_(), time: new Date().toISOString() });

  const records = Array.isArray(body.records) ? body.records : [];
  if (records.length === 0) return json_({ ok: true, synced: [], inserted: 0, updated: 0 });
  if (records.length > MAX_RECORDS_PER_REQUEST) return json_({ ok: false, error: 'too_many_records' });
  const deviceId = String(body.device_id || '').slice(0, 64);

  // --- Only one request writes at a time (several phones may sync together) ---
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // wait up to 30 s for other writers
  } catch (err) {
    return json_({ ok: false, error: 'busy' }); // the app will retry later
  }

  try {
    const sheet = getSheet_();
    const header = ensureHeader_(sheet);
    const width = header.length;
    const idCol = header.indexOf('record_id') + 1;

    // Map existing record_id -> row number
    const lastRow = sheet.getLastRow();
    const rowById = {};
    if (lastRow > 1) {
      sheet.getRange(2, idCol, lastRow - 1, 1).getValues().forEach(function (v, i) {
        if (v[0] !== '' && v[0] !== null) rowById[String(v[0])] = i + 2;
      });
    }

    const now = new Date();
    const newRows = [];   // rows to append at the bottom
    const newIndex = {};  // record_id -> position in newRows (handles repeats in one request)
    const synced = [];
    let updated = 0;

    records.forEach(function (rec) {
      const id = rec ? String(rec.record_id || '').trim() : '';
      if (!id) return; // skip anything without an id
      const row = header.map(function (col) {
        if (col === 'synced_at') return now;
        if (col === 'device_id') return deviceId;
        return cell_(rec[col]);
      });
      if (rowById[id]) {                       // existing row -> overwrite it
        setPlainText_(sheet, header, rowById[id], 1);
        sheet.getRange(rowById[id], 1, 1, width).setValues([row]);
        updated++;
      } else if (newIndex[id] !== undefined) { // same new record twice in one request -> keep latest
        newRows[newIndex[id]] = row;
      } else {                                 // brand-new record -> append
        newIndex[id] = newRows.length;
        newRows.push(row);
      }
      synced.push(id);
    });

    if (newRows.length) {
      const start = lastRow + 1;
      const needRows = start + newRows.length - 1 - sheet.getMaxRows();
      if (needRows > 0) sheet.insertRowsAfter(sheet.getMaxRows(), needRows);
      setPlainText_(sheet, header, start, newRows.length);
      sheet.getRange(start, 1, newRows.length, width).setValues(newRows);
    }
    SpreadsheetApp.flush();
    return json_({ ok: true, synced: synced, inserted: newRows.length, updated: updated });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Optional: run once from the editor (select "setup" > Run) to create both tabs and authorise. */
function setup() {
  ensureHeader_(getSheet_());
  ensureVillagesSheet_();
}

// ----------------------------------------------------------------- helpers

/** Returns null if the key is OK, otherwise an error code for the app. */
function keyError_(key) {
  if (KEY === PLACEHOLDER_KEY) return 'key_not_set';
  if (typeof key !== 'string' || key !== KEY) return 'unauthorized';
  return null;
}

/** Creates the Villages tab with the header "Village" in A1 if it is missing. */
function ensureVillagesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(VILLAGES_SHEET);
  if (!sh) {
    try {
      sh = ss.insertSheet(VILLAGES_SHEET);
    } catch (err) {               // another request created it at the same moment
      sh = ss.getSheetByName(VILLAGES_SHEET);
    }
  }
  if (sh && String(sh.getRange(1, 1).getValue()).trim() === '') {
    sh.getRange(1, 1).setValue('Village').setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Village names from column A (row 2 down): trimmed, blanks and repeats removed, sheet order kept. */
function readVillages_() {
  const sh = ensureVillagesSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const seen = {};
  const out = [];
  sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
    const name = String(r[0] === null || r[0] === undefined ? '' : r[0]).replace(/\s+/g, ' ').trim();
    if (name && !seen[name.toLowerCase()]) { seen[name.toLowerCase()] = true; out.push(name); }
  });
  return out;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

/** Makes sure row 1 holds every column name; adds missing ones at the end. Returns the header. */
function ensureHeader_(sheet) {
  const wanted = COLUMNS.concat(SYNC_COLUMNS);
  const lastCol = sheet.getLastColumn();
  let header = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  while (header.length && header[header.length - 1] === '') header.pop();
  const missing = wanted.filter(function (c) { return header.indexOf(c) === -1; });
  if (missing.length) {
    header = header.concat(missing);
    if (header.length > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), header.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return header;
}

/** Format id/phone cells as plain text before writing so they are not changed to numbers. */
function setPlainText_(sheet, header, startRow, numRows) {
  PLAIN_TEXT_COLUMNS.forEach(function (c) {
    const col = header.indexOf(c) + 1;
    if (col > 0) sheet.getRange(startRow, col, numRows, 1).setNumberFormat('@');
  });
}

/** Clean one value for the sheet. Text that looks like a formula is stored as plain text. */
function cell_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  let s = String(v).slice(0, 5000);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // never let incoming text run as a formula
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
