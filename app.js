/* Hypertension Screening v1 — Scudder College of Nursing, Ranipet
 * Self-contained, offline, no dependencies. Data stored in browser localStorage.
 */
(function () {
'use strict';

var STORE_KEY = 'htnScreening.v1.records';
var PREF_KEY = 'htnScreening.v1.prefs';
var SYNC_KEY = 'htnScreening.v1.sync';        // {url, key, lastSyncAt}
var DEVICE_KEY = 'htnScreening.v1.deviceId';  // generated once per phone/browser
var APP_VERSION = '1.2';
var VILLAGE_CACHE_KEY = 'htnScreening.v1.villages';      // {list, fetchedAt, url} from the sheet's Villages tab
var LOCAL_VILLAGES_KEY = 'htnScreening.v1.localVillages'; // fallback list typed on this phone
var SYNC_BATCH = 50;
var CATS = ['normal', 'elevated', 'high', 'urgent'];
var CAT_COLORS = { normal: '#2e7d32', elevated: '#f9a825', high: '#d84315', urgent: '#b71c1c' };
var AGE_GROUPS = [
  { key: '18-29', min: 18, max: 29 }, { key: '30-39', min: 30, max: 39 },
  { key: '40-49', min: 40, max: 49 }, { key: '50-59', min: 50, max: 59 },
  { key: '60+', min: 60, max: 200 }
];

/* ------------------------------------------------------------------ i18n */
var I18N = {
en: {
  appTitle: 'Hypertension Screening', appSubtitle: 'Scudder College of Nursing, Ranipet',
  screenHeading: 'New screening', editingRecord: 'Editing an existing record', cancelEdit: 'Cancel edit',
  secPerson: '1. Person details', name: 'Name', age: 'Age (years)', sex: 'Sex', male: 'Male', female: 'Female', other: 'Other',
  village: 'Village / Area', phone: 'Phone number', optional: '(optional)',
  consentLabel: 'Consent obtained',
  consentText: 'The person agreed to BP screening and to their anonymised data being used for health research.',
  secBP: '2. Blood pressure', bpHint: 'Seated, rested 5 minutes. Take two readings 1–2 minutes apart.',
  reading1: 'Reading 1', reading2: 'Reading 2', systolic: 'Systolic (upper)', diastolic: 'Diastolic (lower)',
  pulse: 'Pulse', bpm: 'beats/min', avgBP: 'Average BP', enterBoth: 'Enter both readings to see the average',
  diffWarn: 'Readings differ by more than 10 mmHg — consider a third reading.',
  secRisk: '3. Risk factors', tobacco: 'Tobacco use (smoking or chewing)', alcohol: 'Alcohol use',
  diabetes: 'Diabetes (known)', famHx: 'Family history of hypertension',
  height: 'Height', weight: 'Weight', waist: 'Waist circumference', bmi: 'BMI',
  bmiUnder: 'Underweight', bmiNormal: 'Normal weight', bmiOver: 'Overweight', bmiObese: 'Obese', bmiNote: '(Asian cut-offs)',
  bmiEnter: 'Enter height and weight to calculate BMI',
  waistHigh: 'High waist (abdominal obesity)',
  secDetails: '4. Screening details', screenDate: 'Screening date', screenedBy: 'Screened by', notes: 'Notes',
  save: 'Save', saveChanges: 'Save changes',
  cat_normal: 'Normal', cat_elevated: 'Elevated', cat_high: 'High', cat_urgent: 'Urgent referral', short_normal: 'Normal', short_elevated: 'Elevated', short_high: 'High', short_urgent: 'Urgent',
  adv_normal: 'BP is normal. Encourage a healthy lifestyle and check BP once a year.',
  adv_elevated: 'Advise less salt, regular exercise, and avoiding tobacco and alcohol. Recheck BP within 3–6 months.',
  adv_high: 'Recheck BP within 7 days. If still high, refer to a doctor / PHC.',
  adv_urgent: 'Refer to a doctor / hospital TODAY. Ask about chest pain, breathlessness, severe headache, weakness or blurred vision — if present, send immediately.',
  savedOk: 'Saved', resultTitle: 'Screening result', followUpDue: 'Follow-up due', immediate: 'Immediate referral (today)',
  noFollowUp: 'Not added to follow-up list', nextPerson: 'Screen next person', viewFollowup: 'Open follow-up list',
  riskFactors: 'Risk factors', none: 'None',
  fuHeading: 'Follow-up list',
  fuHint: 'People flagged High or Urgent. Urgent = refer same day; High = recheck within 7 days.',
  fPending: 'Pending', fOverdue: 'Overdue', fDone: 'Done', fAll: 'All',
  stOverdue: 'Overdue', stDueToday: 'Due today', stPending: 'Pending', stDone: 'Done',
  dueDate: 'Recheck due', markDone: 'Mark done', reopen: 'Reopen', addRecheck: 'Add recheck reading',
  recheckDate: 'Recheck date', saveRecheck: 'Save recheck', cancel: 'Cancel', rechecks: 'Recheck readings',
  noFu: 'No one in this list.', screened: 'Screened', doneOn: 'Done on', call: 'Call',
  dashHeading: 'Dashboard', includeSample: 'Include sample records', totalScreened: 'Total screened',
  highUrgent: 'High + Urgent', fuPendingStat: 'Follow-ups pending', fuOverdueStat: 'Follow-ups overdue',
  byCategory: 'By risk category', byVillage: 'By village', byAge: 'By age group', bySex: 'By sex',
  riskFactorPrev: 'Risk factor prevalence', pctHighPlus: 'High+', meanBP: 'Mean BP (all screened)',
  bmiObeseStat: 'BMI ≥ 25', noData: 'No records yet. Screen someone or load sample data.',
  recHeading: 'Records & data', dataTools: 'Data tools', exportCsv: 'Export CSV (all records)',
  loadSample: 'Load sample data', removeSample: 'Remove sample data', clearAll: 'Clear all data',
  storageWarn: 'Data is always saved on this phone first. If Google Sheet sync is set up, a copy is also sent to the sheet. Export CSV regularly as a backup.',
  search: 'Search name or village', footNote: 'Screening tool only — not a diagnosis.',
  tabScreen: 'Screen', tabFollowup: 'Follow-up', tabDashboard: 'Dashboard', tabRecords: 'Records',
  edit: 'Edit', del: 'Delete', details: 'Details',
  confirmDelete: 'Delete this record permanently?',
  confirmClear: 'Delete ALL {n} records from this device? This cannot be undone. Export CSV first if you need the data.',
  confirmSample: 'Add 20 fictional SAMPLE records? (Existing sample records will be replaced.)',
  sampleLoaded: '{n} sample records loaded', sampleRemoved: '{n} sample records removed',
  cleared: 'All data cleared', exported: 'CSV downloaded ({n} records)', nothingExport: 'No records to export',
  storageInfo: '{n} records stored on this device ({s} sample)', deleted: 'Record deleted',
  storageError: 'Could not save — device storage is full or blocked. Export your data.',
  sample: 'SAMPLE', yrs: 'y', notRecorded: 'Not recorded', yes: 'Yes', no: 'No',
  fuMarkedDone: 'Follow-up marked done', fuReopened: 'Follow-up reopened', recheckSaved: 'Recheck saved', dueUpdated: 'Due date updated',
  phoneLabel: 'Phone', initialBP: 'Screening avg', latestRecheck: 'Latest recheck', noRecords: 'No records found.',
  errRequired: 'Required', errName: 'Enter the name (at least 2 letters)', errAge: 'Enter age 18–120 years',
  errSbp: 'Systolic must be 60–300', errDbp: 'Diastolic must be 30–200',
  errSbpGtDbp: 'Systolic must be higher than diastolic', errPulse: 'Pulse must be 30–220',
  errPhone: 'Enter a valid 10-digit phone number', errConsent: 'Consent is required to save',
  errHeight: 'Height must be 90–230 cm', errWeight: 'Weight must be 20–250 kg', errWaist: 'Waist must be 40–200 cm',
  errDate: 'Enter a valid date (not in the future)', errSummary: 'Please correct the highlighted fields.'
},
ta: {
  appTitle: 'உயர் இரத்த அழுத்தப் பரிசோதனை', appSubtitle: 'ஸ்கடர் செவிலியர் கல்லூரி, ராணிப்பேட்டை',
  screenHeading: 'புதிய பரிசோதனை', editingRecord: 'ஏற்கனவே உள்ள பதிவைத் திருத்துகிறீர்கள்', cancelEdit: 'திருத்தத்தை ரத்து செய்',
  secPerson: '1. நபர் விவரங்கள்', name: 'பெயர்', age: 'வயது (ஆண்டுகள்)', sex: 'பாலினம்', male: 'ஆண்', female: 'பெண்', other: 'மற்றவர்',
  village: 'கிராமம் / பகுதி', phone: 'கைபேசி எண்', optional: '(விருப்பம்)',
  consentLabel: 'ஒப்புதல் பெறப்பட்டது',
  consentText: 'இந்த நபர் இரத்த அழுத்தப் பரிசோதனைக்கும், பெயர் நீக்கப்பட்ட தகவல்களைச் சுகாதார ஆராய்ச்சிக்குப் பயன்படுத்தவும் சம்மதித்துள்ளார்.',
  secBP: '2. இரத்த அழுத்தம்', bpHint: '5 நிமிடம் ஓய்வுக்குப் பின் அமர்ந்த நிலையில் அளக்கவும். 1–2 நிமிட இடைவெளியில் இரண்டு முறை அளக்கவும்.',
  reading1: 'அளவீடு 1', reading2: 'அளவீடு 2', systolic: 'சிஸ்டாலிக் (மேல்)', diastolic: 'டயஸ்டாலிக் (கீழ்)',
  pulse: 'நாடித் துடிப்பு', bpm: 'துடிப்பு/நிமிடம்', avgBP: 'சராசரி இரத்த அழுத்தம்', enterBoth: 'சராசரியைக் காண இரண்டு அளவீடுகளையும் உள்ளிடவும்',
  diffWarn: 'இரண்டு அளவீடுகளுக்கும் 10 mmHg-க்கு மேல் வேறுபாடு உள்ளது — மூன்றாவது முறை அளக்கவும்.',
  secRisk: '3. ஆபத்துக் காரணிகள்', tobacco: 'புகையிலைப் பழக்கம் (புகைத்தல் அல்லது மெல்லுதல்)', alcohol: 'மது அருந்தும் பழக்கம்',
  diabetes: 'நீரிழிவு நோய் (சர்க்கரை நோய்)', famHx: 'குடும்பத்தில் உயர் இரத்த அழுத்தம் உள்ளவர்கள்',
  height: 'உயரம்', weight: 'எடை', waist: 'இடுப்புச் சுற்றளவு', bmi: 'BMI (உடல் நிறை குறியீட்டெண்)',
  bmiUnder: 'குறைந்த எடை', bmiNormal: 'சரியான எடை', bmiOver: 'அதிக எடை', bmiObese: 'உடல் பருமன்', bmiNote: '(ஆசிய அளவுகோல்)',
  bmiEnter: 'BMI கணக்கிட உயரம், எடையை உள்ளிடவும்',
  waistHigh: 'இடுப்புச் சுற்றளவு அதிகம் (வயிற்றுப் பருமன்)',
  secDetails: '4. பரிசோதனை விவரங்கள்', screenDate: 'பரிசோதனை தேதி', screenedBy: 'பரிசோதித்தவர்', notes: 'குறிப்புகள்',
  save: 'சேமி', saveChanges: 'மாற்றங்களைச் சேமி',
  cat_normal: 'இயல்பு', cat_elevated: 'சற்று அதிகம்', cat_high: 'அதிகம்', cat_urgent: 'அவசரப் பரிந்துரை', short_normal: 'இயல்பு', short_elevated: 'சற்று அதிகம்', short_high: 'அதிகம்', short_urgent: 'அவசரம்',
  adv_normal: 'இரத்த அழுத்தம் இயல்பாக உள்ளது. ஆரோக்கியமான வாழ்க்கை முறையைத் தொடரவும்; ஆண்டுக்கு ஒருமுறை பரிசோதிக்கவும்.',
  adv_elevated: 'உணவில் உப்பைக் குறைக்கவும், தினமும் உடற்பயிற்சி செய்யவும், புகையிலை மற்றும் மதுவைத் தவிர்க்கவும். 3–6 மாதங்களுக்குள் மீண்டும் பரிசோதிக்கவும்.',
  adv_high: '7 நாட்களுக்குள் மீண்டும் இரத்த அழுத்தத்தைப் பரிசோதிக்கவும். தொடர்ந்து அதிகமாக இருந்தால் மருத்துவர் / ஆரம்ப சுகாதார நிலையத்திற்குப் பரிந்துரைக்கவும்.',
  adv_urgent: 'இன்றே மருத்துவர் / மருத்துவமனைக்குப் பரிந்துரைக்கவும். நெஞ்சு வலி, மூச்சுத் திணறல், கடும் தலைவலி, உடல் பலவீனம், மங்கலான பார்வை உள்ளதா எனக் கேட்கவும் — இருந்தால் உடனே அனுப்பவும்.',
  savedOk: 'சேமிக்கப்பட்டது', resultTitle: 'பரிசோதனை முடிவு', followUpDue: 'மறு பரிசோதனை தேதி', immediate: 'உடனடிப் பரிந்துரை (இன்று)',
  noFollowUp: 'மறு பரிசோதனைப் பட்டியலில் சேர்க்கப்படவில்லை', nextPerson: 'அடுத்த நபரைப் பரிசோதி', viewFollowup: 'மறு பரிசோதனைப் பட்டியலைத் திற',
  riskFactors: 'ஆபத்துக் காரணிகள்', none: 'இல்லை',
  fuHeading: 'மறு பரிசோதனைப் பட்டியல்',
  fuHint: '"அதிகம்" அல்லது "அவசரம்" எனக் குறிக்கப்பட்டவர்கள். அவசரம் = அன்றே பரிந்துரை; அதிகம் = 7 நாட்களுக்குள் மறு பரிசோதனை.',
  fPending: 'நிலுவையில்', fOverdue: 'தாமதமானவை', fDone: 'முடிந்தவை', fAll: 'அனைத்தும்',
  stOverdue: 'தாமதம்', stDueToday: 'இன்று', stPending: 'நிலுவையில்', stDone: 'முடிந்தது',
  dueDate: 'மறு பரிசோதனை தேதி', markDone: 'முடிந்தது எனக் குறி', reopen: 'மீண்டும் திற', addRecheck: 'மறு அளவீடு சேர்',
  recheckDate: 'மறு அளவீட்டுத் தேதி', saveRecheck: 'மறு அளவீட்டைச் சேமி', cancel: 'ரத்து', rechecks: 'மறு அளவீடுகள்',
  noFu: 'இந்தப் பட்டியலில் யாரும் இல்லை.', screened: 'பரிசோதித்த நாள்', doneOn: 'முடிந்த நாள்', call: 'அழை',
  dashHeading: 'தகவல் பலகை', includeSample: 'மாதிரிப் பதிவுகளையும் சேர்', totalScreened: 'மொத்தம் பரிசோதிக்கப்பட்டோர்',
  highUrgent: 'அதிகம் + அவசரம்', fuPendingStat: 'நிலுவையில் உள்ள மறு பரிசோதனைகள்', fuOverdueStat: 'தாமதமான மறு பரிசோதனைகள்',
  byCategory: 'ஆபத்து நிலை வாரியாக', byVillage: 'கிராம வாரியாக', byAge: 'வயதுப் பிரிவு வாரியாக', bySex: 'பாலின வாரியாக',
  riskFactorPrev: 'ஆபத்துக் காரணிகளின் பரவல்', pctHighPlus: 'அதிகம்+', meanBP: 'சராசரி இரத்த அழுத்தம் (அனைவரும்)',
  bmiObeseStat: 'BMI ≥ 25', noData: 'இன்னும் பதிவுகள் இல்லை. ஒருவரைப் பரிசோதிக்கவும் அல்லது மாதிரித் தரவை ஏற்றவும்.',
  recHeading: 'பதிவுகள் & தரவு', dataTools: 'தரவுக் கருவிகள்', exportCsv: 'CSV ஆகப் பதிவிறக்கு (அனைத்தும்)',
  loadSample: 'மாதிரித் தரவை ஏற்று', removeSample: 'மாதிரித் தரவை நீக்கு', clearAll: 'அனைத்துத் தரவையும் அழி',
  storageWarn: 'தரவு முதலில் இந்தக் கைபேசியில் சேமிக்கப்படுகிறது. Google Sheet ஒத்திசைவு அமைக்கப்பட்டிருந்தால், ஒரு நகல் Sheet-க்கும் அனுப்பப்படும். அடிக்கடி CSV ஆகப் பதிவிறக்கிப் பாதுகாக்கவும்.',
  search: 'பெயர் அல்லது கிராமத்தைத் தேடு', footNote: 'இது பரிசோதனைக் கருவி மட்டுமே — நோய் கண்டறிதல் அல்ல.',
  tabScreen: 'பரிசோதனை', tabFollowup: 'மறு பரிசோதனை', tabDashboard: 'தகவல்', tabRecords: 'பதிவுகள்',
  edit: 'திருத்து', del: 'நீக்கு', details: 'விவரங்கள்',
  confirmDelete: 'இந்தப் பதிவை நிரந்தரமாக நீக்கவா?',
  confirmClear: 'இந்தக் கைபேசியிலிருந்து அனைத்து {n} பதிவுகளையும் நீக்கவா? இதைத் திரும்பப் பெற முடியாது. தேவையெனில் முதலில் CSV பதிவிறக்கவும்.',
  confirmSample: '20 கற்பனை மாதிரிப் பதிவுகளைச் சேர்க்கவா? (பழைய மாதிரிப் பதிவுகள் மாற்றப்படும்.)',
  sampleLoaded: '{n} மாதிரிப் பதிவுகள் ஏற்றப்பட்டன', sampleRemoved: '{n} மாதிரிப் பதிவுகள் நீக்கப்பட்டன',
  cleared: 'அனைத்துத் தரவும் அழிக்கப்பட்டது', exported: 'CSV பதிவிறக்கப்பட்டது ({n} பதிவுகள்)', nothingExport: 'பதிவிறக்கப் பதிவுகள் இல்லை',
  storageInfo: 'இந்தக் கைபேசியில் {n} பதிவுகள் ({s} மாதிரி)', deleted: 'பதிவு நீக்கப்பட்டது',
  storageError: 'சேமிக்க முடியவில்லை — சேமிப்பகம் நிரம்பியுள்ளது அல்லது தடுக்கப்பட்டுள்ளது. தரவைப் பதிவிறக்கவும்.',
  sample: 'மாதிரி', yrs: ' வயது', notRecorded: 'பதிவு இல்லை', yes: 'ஆம்', no: 'இல்லை',
  fuMarkedDone: 'மறு பரிசோதனை முடிந்தது', fuReopened: 'மீண்டும் திறக்கப்பட்டது', recheckSaved: 'மறு அளவீடு சேமிக்கப்பட்டது', dueUpdated: 'தேதி மாற்றப்பட்டது',
  phoneLabel: 'கைபேசி', initialBP: 'முதல் சராசரி', latestRecheck: 'சமீபத்திய மறு அளவீடு', noRecords: 'பதிவுகள் இல்லை.',
  errRequired: 'கட்டாயம் நிரப்ப வேண்டும்', errName: 'பெயரை உள்ளிடவும் (குறைந்தது 2 எழுத்துகள்)', errAge: 'வயது 18–120 இடையில் இருக்க வேண்டும்',
  errSbp: 'சிஸ்டாலிக் 60–300 இடையில் இருக்க வேண்டும்', errDbp: 'டயஸ்டாலிக் 30–200 இடையில் இருக்க வேண்டும்',
  errSbpGtDbp: 'சிஸ்டாலிக், டயஸ்டாலிக்கை விட அதிகமாக இருக்க வேண்டும்', errPulse: 'நாடித் துடிப்பு 30–220 இடையில் இருக்க வேண்டும்',
  errPhone: 'சரியான 10 இலக்க எண்ணை உள்ளிடவும்', errConsent: 'சேமிக்க ஒப்புதல் அவசியம்',
  errHeight: 'உயரம் 90–230 செ.மீ. இடையில் இருக்க வேண்டும்', errWeight: 'எடை 20–250 கி.கி. இடையில் இருக்க வேண்டும்', errWaist: 'இடுப்புச் சுற்றளவு 40–200 செ.மீ. இடையில் இருக்க வேண்டும்',
  errDate: 'சரியான தேதியை உள்ளிடவும் (எதிர்காலத் தேதி கூடாது)', errSummary: 'சிவப்பில் குறிக்கப்பட்ட இடங்களைச் சரிசெய்யவும்.'
}
};

var SYNC_I18N = {
en: {
  syncTitle: 'Google Sheet sync', syncSettings: 'Sync settings', syncUrl: 'Web App URL', syncKey: 'Secret key', showKey: 'Show', hideKey: 'Hide',
  syncSave: 'Save settings', syncTest: 'Test connection', syncNow: 'Sync now', syncCopyLink: 'Copy setup link',
  syncLinkWarn: 'The setup link contains the secret key — share it only with your screening team.',
  deviceId: 'Device ID', syncSampleNote: 'Sample records are never sent to the sheet.',
  syncStNotSetup: 'Not set up — records are saved on this phone only.',
  syncStAllSynced: 'All records synced', syncStPending: '{n} record(s) waiting to sync',
  syncStOffline: 'Offline — {n} record(s) will sync when internet returns', syncStSyncing: 'Syncing…',
  syncStError: 'Sync failed: {e}. {n} record(s) kept safely on this phone.', syncLast: 'Last synced',
  syncErr_unauthorized: 'wrong key', syncErr_network: 'cannot reach the sheet (check internet / URL)',
  syncErr_key_not_set: 'KEY not set in the Apps Script', syncErr_bad: 'unexpected reply (check the URL and that access is "Anyone")',
  syncErr_busy: 'sheet busy, will retry', syncErr_other: 'server error',
  syncTesting: 'Testing…', syncTestOk: 'Connected — key accepted ✓', syncTestFail: 'Connection failed: {e}',
  syncSaved: 'Sync settings saved', syncDisabled: 'Sync turned off on this phone',
  syncInvalidUrl: 'Enter a valid https:// Web App URL', syncNeedKey: 'Enter the secret key',
  syncLinkCopied: 'Setup link copied — paste it in WhatsApp/email to your team', syncLinkReady: 'Copy the link below and share it with your team',
  syncSetupConfirm: 'Set up Google Sheet sync on this phone?\n\nRecords will be sent to:\n{u}',
  syncNotGoogle: 'Warning: this is not a Google Apps Script address.',
  syncTagSynced: 'Synced', syncTagPending: 'Not synced yet', syncTagSample: 'Sample – not synced',
  syncSyncedN: '{n} record(s) synced', syncNotSetupToast: 'Set up sync first (Web App URL and key)', syncLine: 'Sheet sync'
},
ta: {
  syncTitle: 'Google Sheet ஒத்திசைவு', syncSettings: 'ஒத்திசைவு அமைப்புகள்', syncUrl: 'Web App இணைப்பு (URL)', syncKey: 'ரகசியக் குறியீடு', showKey: 'காட்டு', hideKey: 'மறை',
  syncSave: 'அமைப்புகளைச் சேமி', syncTest: 'இணைப்பைச் சோதி', syncNow: 'இப்போது ஒத்திசை', syncCopyLink: 'அமைப்பு இணைப்பை நகலெடு',
  syncLinkWarn: 'அமைப்பு இணைப்பில் ரகசியக் குறியீடு உள்ளது — உங்கள் பரிசோதனைக் குழுவுடன் மட்டும் பகிரவும்.',
  deviceId: 'சாதன அடையாள எண்', syncSampleNote: 'மாதிரிப் பதிவுகள் Sheet-க்கு அனுப்பப்படாது.',
  syncStNotSetup: 'அமைக்கப்படவில்லை — பதிவுகள் இந்தக் கைபேசியில் மட்டும் சேமிக்கப்படுகின்றன.',
  syncStAllSynced: 'அனைத்துப் பதிவுகளும் ஒத்திசைக்கப்பட்டன', syncStPending: '{n} பதிவுகள் ஒத்திசைக்கக் காத்திருக்கின்றன',
  syncStOffline: 'இணையம் இல்லை — இணையம் வந்ததும் {n} பதிவுகள் ஒத்திசைக்கப்படும்', syncStSyncing: 'ஒத்திசைக்கிறது…',
  syncStError: 'ஒத்திசைவு தோல்வி: {e}. {n} பதிவுகள் இந்தக் கைபேசியில் பாதுகாப்பாக உள்ளன.', syncLast: 'கடைசியாக ஒத்திசைத்தது',
  syncErr_unauthorized: 'தவறான குறியீடு', syncErr_network: 'Sheet-ஐ அணுக முடியவில்லை (இணையம் / URL-ஐச் சரிபார்க்கவும்)',
  syncErr_key_not_set: 'Apps Script-இல் KEY அமைக்கப்படவில்லை', syncErr_bad: 'எதிர்பாராத பதில் (URL மற்றும் "Anyone" அனுமதியைச் சரிபார்க்கவும்)',
  syncErr_busy: 'Sheet பரபரப்பாக உள்ளது, மீண்டும் முயலும்', syncErr_other: 'சர்வர் பிழை',
  syncTesting: 'சோதிக்கிறது…', syncTestOk: 'இணைப்பு சரி — குறியீடு ஏற்கப்பட்டது ✓', syncTestFail: 'இணைப்பு தோல்வி: {e}',
  syncSaved: 'ஒத்திசைவு அமைப்புகள் சேமிக்கப்பட்டன', syncDisabled: 'இந்தக் கைபேசியில் ஒத்திசைவு நிறுத்தப்பட்டது',
  syncInvalidUrl: 'சரியான https:// Web App இணைப்பை உள்ளிடவும்', syncNeedKey: 'ரகசியக் குறியீட்டை உள்ளிடவும்',
  syncLinkCopied: 'அமைப்பு இணைப்பு நகலெடுக்கப்பட்டது — WhatsApp/மின்னஞ்சலில் குழுவுக்கு அனுப்பவும்', syncLinkReady: 'கீழே உள்ள இணைப்பை நகலெடுத்துக் குழுவுடன் பகிரவும்',
  syncSetupConfirm: 'இந்தக் கைபேசியில் Google Sheet ஒத்திசைவை அமைக்கவா?\n\nபதிவுகள் இங்கு அனுப்பப்படும்:\n{u}',
  syncNotGoogle: 'எச்சரிக்கை: இது Google Apps Script முகவரி அல்ல.',
  syncTagSynced: 'ஒத்திசைந்தது', syncTagPending: 'இன்னும் ஒத்திசைக்கவில்லை', syncTagSample: 'மாதிரி – ஒத்திசைக்கப்படாது',
  syncSyncedN: '{n} பதிவுகள் ஒத்திசைக்கப்பட்டன', syncNotSetupToast: 'முதலில் ஒத்திசைவை அமைக்கவும் (URL மற்றும் குறியீடு)', syncLine: 'Sheet ஒத்திசைவு'
}
};
SYNC_I18N.en = Object.assign(SYNC_I18N.en, {
  enteredBy: 'Entered by', enteredByPrompt: 'Your name (person entering records on this phone)', saveName: 'Save name', change: 'Change',
  errEnteredBy: 'Enter your name (Entered by) first', nameSaved: 'Name saved', origEnteredBy: 'Originally entered by', updatedBy: 'Last updated by',
  selectVillage: '— Select village —', notInList: '(not in list)', errVillage: 'Select a village from the list', errVillageList: 'Choose a village from the current list',
  noVillages: 'No village list yet. The coordinator must add villages (Records tab > Village list).',
  villageListTitle: 'Village list', refreshVillages: 'Refresh villages',
  vSrcSheet: 'Using {n} villages from the Google Sheet (updated {d}).', vSrcLocal: 'Using the local list on this phone ({n} villages).',
  vSrcNone: 'No village list yet.', vRefreshed: 'Village list updated ({n})', vRefreshing: 'Refreshing villages…',
  vRefreshFail: 'Could not refresh villages: {e}. Using the saved list.', vSheetEmpty: 'The Villages tab in the Google Sheet is empty.',
  vNeedSync: 'Set up Google Sheet sync to load the official village list.',
  localListTitle: 'Local village list (fallback)', localListHint: 'Used only when no list is available from the Google Sheet. One village name per line.',
  saveLocalList: 'Save local list', localNotInUse: 'Not in use now — the Google Sheet list is being used.', localSaved: 'Local village list saved ({n})', screenedByIf: 'Screened by (if a different person)'
});
SYNC_I18N.ta = Object.assign(SYNC_I18N.ta, {
  enteredBy: 'பதிவு செய்பவர்', enteredByPrompt: 'உங்கள் பெயர் (இந்தக் கைபேசியில் பதிவு செய்பவர்)', saveName: 'பெயரைச் சேமி', change: 'மாற்று',
  errEnteredBy: 'முதலில் உங்கள் பெயரை (பதிவு செய்பவர்) உள்ளிடவும்', nameSaved: 'பெயர் சேமிக்கப்பட்டது', origEnteredBy: 'முதலில் பதிவு செய்தவர்', updatedBy: 'கடைசியாக மாற்றியவர்',
  selectVillage: '— கிராமத்தைத் தேர்ந்தெடுக்கவும் —', notInList: '(பட்டியலில் இல்லை)', errVillage: 'பட்டியலிலிருந்து கிராமத்தைத் தேர்ந்தெடுக்கவும்', errVillageList: 'தற்போதைய பட்டியலிலிருந்து கிராமத்தைத் தேர்ந்தெடுக்கவும்',
  noVillages: 'கிராமப் பட்டியல் இன்னும் இல்லை. ஒருங்கிணைப்பாளர் கிராமங்களைச் சேர்க்க வேண்டும் (பதிவுகள் > கிராமப் பட்டியல்).',
  villageListTitle: 'கிராமப் பட்டியல்', refreshVillages: 'கிராமப் பட்டியலைப் புதுப்பி',
  vSrcSheet: 'Google Sheet-இலிருந்து {n} கிராமங்கள் பயன்பாட்டில் உள்ளன ({d} அன்று புதுப்பிக்கப்பட்டது).', vSrcLocal: 'இந்தக் கைபேசியின் உள்ளூர்ப் பட்டியல் பயன்பாட்டில் உள்ளது ({n} கிராமங்கள்).',
  vSrcNone: 'கிராமப் பட்டியல் இன்னும் இல்லை.', vRefreshed: 'கிராமப் பட்டியல் புதுப்பிக்கப்பட்டது ({n})', vRefreshing: 'கிராமப் பட்டியல் புதுப்பிக்கப்படுகிறது…',
  vRefreshFail: 'கிராமப் பட்டியலைப் புதுப்பிக்க முடியவில்லை: {e}. சேமித்த பட்டியல் பயன்படுத்தப்படுகிறது.', vSheetEmpty: 'Google Sheet-இன் Villages பக்கம் காலியாக உள்ளது.',
  vNeedSync: 'அதிகாரப்பூர்வக் கிராமப் பட்டியலைப் பெற Google Sheet ஒத்திசைவை அமைக்கவும்.',
  localListTitle: 'உள்ளூர்க் கிராமப் பட்டியல் (மாற்று வழி)', localListHint: 'Google Sheet-இலிருந்து பட்டியல் கிடைக்காதபோது மட்டும் பயன்படும். ஒரு வரிக்கு ஒரு கிராமப் பெயர்.',
  saveLocalList: 'உள்ளூர்ப் பட்டியலைச் சேமி', localNotInUse: 'இப்போது பயன்பாட்டில் இல்லை — Google Sheet பட்டியல் பயன்படுத்தப்படுகிறது.', localSaved: 'உள்ளூர்க் கிராமப் பட்டியல் சேமிக்கப்பட்டது ({n})', screenedByIf: 'பரிசோதித்தவர் (வேறு நபர் என்றால்)'
});
Object.keys(SYNC_I18N).forEach(function (l) { Object.keys(SYNC_I18N[l]).forEach(function (k) { I18N[l][k] = SYNC_I18N[l][k]; }); });

/* ------------------------------------------------------------- utilities */
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function todayStr() { return dateStr(new Date()); }
function parseDate(ds) { var p = String(ds).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addDays(ds, n) { var d = parseDate(ds); d.setDate(d.getDate() + n); return dateStr(d); }
function isValidDateStr(ds) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ds || '')) return false;
  var d = parseDate(ds); return dateStr(d) === ds && d.getFullYear() >= 2000;
}
function fmtDate(ds) { if (!ds) return ''; var p = ds.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function fmtNum(x) { return x == null ? '' : (Math.round(x * 10) / 10).toString(); }
function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function parseNum(v) {
  if (v == null) return null; v = String(v).trim(); if (v === '') return null;
  var n = Number(v); return isFinite(n) ? n : NaN;
}

/* ---------------------------------------------------- clinical logic */
/** Classify BP using the study thresholds (applied to the AVERAGE of two readings):
 *  Urgent referral: SBP >= 180 or DBP >= 120
 *  High:            SBP >= 140 or DBP >= 90
 *  Elevated:        SBP 120-139 or DBP 80-89
 *  Normal:          SBP < 120 and DBP < 80
 *  The higher category of SBP/DBP wins. Exact (unrounded) averages are used. */
function classify(sbp, dbp) {
  if (sbp == null || dbp == null || isNaN(sbp) || isNaN(dbp)) return null;
  if (sbp >= 180 || dbp >= 120) return 'urgent';
  if (sbp >= 140 || dbp >= 90) return 'high';
  if (sbp >= 120 || dbp >= 80) return 'elevated';
  return 'normal';
}
function avg2(a, b) { return Math.round(((a + b) / 2) * 10) / 10; }
function calcBmi(hCm, wKg) {
  if (!hCm || !wKg || isNaN(hCm) || isNaN(wKg)) return null;
  var m = hCm / 100; return Math.round((wKg / (m * m)) * 10) / 10;
}
/** Asian-Indian BMI cut-offs (Misra et al. 2009 consensus). */
function bmiCategory(b) {
  if (b == null) return null;
  if (b < 18.5) return 'bmiUnder';
  if (b < 23) return 'bmiNormal';
  if (b < 25) return 'bmiOver';
  return 'bmiObese';
}
/** Abdominal obesity cut-offs for Indian adults: men >= 90 cm, women >= 80 cm. */
function waistHigh(waist, sex) {
  if (waist == null) return null;
  if (sex === 'M') return waist >= 90;
  if (sex === 'F') return waist >= 80;
  return null;
}
function needsFollowUp(cat) { return cat === 'high' || cat === 'urgent'; }
function defaultDueDate(cat, screenDate) {
  if (cat === 'urgent') return screenDate;          // same day / immediate referral
  if (cat === 'high') return addDays(screenDate, 7); // recheck in 7 days
  return null;
}
function ageGroup(age) {
  for (var i = 0; i < AGE_GROUPS.length; i++) if (age >= AGE_GROUPS[i].min && age <= AGE_GROUPS[i].max) return AGE_GROUPS[i].key;
  return 'unknown';
}
function normPhone(p) {
  var d = String(p || '').replace(/[\s\-().]/g, '');
  if (d.indexOf('+91') === 0) d = d.slice(3);
  else if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
  else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  return d;
}
function fuState(r, today) {
  if (!r.followUp || !r.followUp.required) return null;
  if (r.followUp.status === 'done') return 'done';
  today = today || todayStr();
  if (r.followUp.dueDate && r.followUp.dueDate < today) return 'overdue';
  if (r.followUp.dueDate === today) return 'due';
  return 'pending';
}

/* ------------------------------------------------------------- storage */
var records = [];
var prefs = {};
var syncCfg = {};
var deviceId = '';
var villageCache = { list: [] };
var localVillages = [];
function loadAll() {
  try { records = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); if (!Array.isArray(records)) records = []; }
  catch (e) { records = []; }
  // v1 records have no revision counter: give them rev 1 so they are queued for sync once.
  records.forEach(function (r) { if (!r.rev) r.rev = 1; });
  try { syncCfg = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}') || {}; } catch (e) { syncCfg = {}; }
  try { villageCache = JSON.parse(localStorage.getItem(VILLAGE_CACHE_KEY) || '{}') || {}; } catch (e) { villageCache = {}; }
  if (!Array.isArray(villageCache.list)) villageCache.list = [];
  try { localVillages = JSON.parse(localStorage.getItem(LOCAL_VILLAGES_KEY) || '[]'); if (!Array.isArray(localVillages)) localVillages = []; } catch (e) { localVillages = []; }
  deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) { deviceId = makeDeviceId(); try { localStorage.setItem(DEVICE_KEY, deviceId); } catch (e) { /* ignore */ } }
  try { prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (e) { prefs = {}; }
}
function saveAll() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); return true; }
  catch (e) { alert(t('storageError')); return false; }
}
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }
function getRec(id) { for (var i = 0; i < records.length; i++) if (records[i].id === id) return records[i]; return null; }

/* ---------------------------------------------------------------- i18n */
var lang = 'en';
function t(k, vars) {
  var s = (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  if (vars) Object.keys(vars).forEach(function (v) { s = s.replace('{' + v + '}', vars[v]); });
  return s;
}
function applyLang() {
  document.documentElement.lang = lang === 'ta' ? 'ta' : 'en';
  $all('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
  $('#langToggle').textContent = lang === 'ta' ? 'English' : 'தமிழ்';
  $('#langToggle').setAttribute('lang', lang === 'ta' ? 'en' : 'ta');
  $('#saveBtn').textContent = editingId ? t('saveChanges') : t('save');
  updateLive(); renderVillageSelect(); renderEnteredBy();
  if (editingId && getRec(editingId)) $('#editInfo').textContent = t('origEnteredBy') + ': ' + (getRec(editingId).enteredBy || '—');
  if (lastErrors) showErrors(lastErrors, false);
  if (lastResultId && !$('#resultPanel').hidden) renderResult(getRec(lastResultId));
  renderAll();
}
function catLabel(c) { return c ? t('cat_' + c) : ''; }
function sexLabel(s) { return s === 'M' ? t('male') : s === 'F' ? t('female') : s === 'O' ? t('other') : ''; }
function badge(c) { return c ? '<span class="badge-cat cat-' + c + '">' + esc(catLabel(c)) + '</span>' : ''; }

/* ---------------------------------------------------------------- toast */
var toastTimer;
function toast(msg) {
  var el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
}

/* ------------------------------------------------------------ navigation */
var currentView = 'screen';
function showView(v) {
  currentView = v;
  $('#toast').classList.remove('show');
  $all('.view').forEach(function (s) { s.classList.toggle('active', s.id === 'view-' + v); });
  $all('.tabbar button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === v); });
  renderAll();
  window.scrollTo(0, 0);
}

/* ----------------------------------------------------------- form logic */
var form, editingId = null, lastErrors = null, lastResultId = null;
function readForm() {
  var f = form.elements;
  var sexEl = form.querySelector('input[name=sex]:checked');
  return {
    name: f.name.value.trim(), age: parseNum(f.age.value), sex: sexEl ? sexEl.value : '',
    village: f.village.value.trim(), phone: f.phone.value.trim(), consent: f.consent.checked,
    sbp1: parseNum(f.sbp1.value), dbp1: parseNum(f.dbp1.value), sbp2: parseNum(f.sbp2.value), dbp2: parseNum(f.dbp2.value),
    pulse: parseNum(f.pulse.value),
    tobacco: f.tobacco.checked, alcohol: f.alcohol.checked, diabetes: f.diabetes.checked, famHx: f.famHx.checked,
    heightCm: parseNum(f.heightCm.value), weightKg: parseNum(f.weightKg.value), waistCm: parseNum(f.waistCm.value),
    screenDate: f.screenDate.value, screenedBy: f.screenedBy.value.trim(), notes: f.notes.value.trim(),
    enteredBy: (prefs.enteredBy || '').trim()
  };
}
function inRangeInt(v, lo, hi) { return v != null && !isNaN(v) && Math.floor(v) === v && v >= lo && v <= hi; }
function inRange(v, lo, hi) { return v != null && !isNaN(v) && v >= lo && v <= hi; }
/** Returns {field: errorKey}. Exposed for testing. */
function validate(d) {
  var e = {};
  if (!d.name || d.name.length < 2) e.name = 'errName';
  if (d.age == null) e.age = 'errRequired'; else if (!inRangeInt(d.age, 18, 120)) e.age = 'errAge';
  if (!d.sex) e.sex = 'errRequired';
  if (!d.enteredBy || d.enteredBy.length < 2) e.enteredBy = 'errEnteredBy';
  if (!d.village) e.village = 'errVillage';
  else if (effectiveVillages().indexOf(d.village) < 0) {
    var orig = editingId ? getRec(editingId) : null;  // an old free-text village may be kept when editing
    if (!orig || orig.village !== d.village) e.village = 'errVillageList';
  }
  if (d.phone && !/^\d{10}$/.test(normPhone(d.phone))) e.phone = 'errPhone';
  if (!d.consent) e.consent = 'errConsent';
  [['sbp1', 'dbp1'], ['sbp2', 'dbp2']].forEach(function (p) {
    var s = d[p[0]], di = d[p[1]];
    if (s == null) e[p[0]] = 'errRequired'; else if (!inRangeInt(s, 60, 300)) e[p[0]] = 'errSbp';
    if (di == null) e[p[1]] = 'errRequired'; else if (!inRangeInt(di, 30, 200)) e[p[1]] = 'errDbp';
    if (!e[p[0]] && !e[p[1]] && s <= di) e[p[1]] = 'errSbpGtDbp';
  });
  if (d.pulse == null) e.pulse = 'errRequired'; else if (!inRangeInt(d.pulse, 30, 220)) e.pulse = 'errPulse';
  if (d.heightCm != null && !inRange(d.heightCm, 90, 230)) e.heightCm = 'errHeight';
  if (d.weightKg != null && !inRange(d.weightKg, 20, 250)) e.weightKg = 'errWeight';
  if (d.waistCm != null && !inRange(d.waistCm, 40, 200)) e.waistCm = 'errWaist';
  if (!isValidDateStr(d.screenDate) || d.screenDate > todayStr()) e.screenDate = 'errDate';
  return e;
}
function showErrors(errs, scroll) {
  $all('.field[data-f]', form).forEach(function (fl) {
    var k = fl.getAttribute('data-f'); var errEl = $('.err', fl);
    fl.classList.toggle('invalid', !!errs[k]);
    if (errEl) errEl.textContent = errs[k] ? t(errs[k]) : '';
  });
  var keys = Object.keys(errs); var box = $('#formErrors');
  if (keys.length) {
    box.hidden = false; box.textContent = t('errSummary') + ' (' + keys.length + ')';
    if (scroll) {
      var first = $('.field.invalid', form);
      if (first) { first.scrollIntoView({ block: 'center' }); var inp = $('input', first); if (inp) try { inp.focus({ preventScroll: true }); } catch (x) { inp.focus(); } }
    }
  } else box.hidden = true;
}
function updateLive() {
  if (!form) return;
  var d = readForm();
  var box = $('#liveAvg');
  var ok = [d.sbp1, d.dbp1, d.sbp2, d.dbp2].every(function (v) { return v != null && !isNaN(v) && v > 0; });
  box.className = 'live';
  if (ok) {
    var s = avg2(d.sbp1, d.sbp2), di = avg2(d.dbp1, d.dbp2), c = classify(s, di);
    box.classList.add('cat-' + c + '-l');
    var html = esc(t('avgBP')) + ': ' + fmtNum(s) + '/' + fmtNum(di) + ' mmHg → ' + esc(catLabel(c));
    if (Math.abs(d.sbp1 - d.sbp2) > 10 || Math.abs(d.dbp1 - d.dbp2) > 10) html += '<div class="hint" style="margin-top:4px">⚠ ' + esc(t('diffWarn')) + '</div>';
    box.innerHTML = html;
  } else box.textContent = t('enterBoth');
  var bmi = calcBmi(d.heightCm, d.weightKg);
  var bb = $('#liveBmi'); bb.className = 'live';
  var wh = waistHigh(d.waistCm, d.sex);
  if (bmi != null && bmi > 5 && bmi < 100) {
    var bc = bmiCategory(bmi);
    bb.classList.add(bc === 'bmiNormal' ? 'cat-normal-l' : bc === 'bmiObese' ? 'cat-high-l' : 'cat-elevated-l');
    bb.textContent = 'BMI: ' + fmtNum(bmi) + ' kg/m² — ' + t(bc) + ' ' + t('bmiNote');
  } else bb.textContent = t('bmiEnter');
  if (wh) bb.textContent += ' · ' + t('waistHigh');
}
function syncChecks() {
  // Fallback highlighting for browsers without CSS :has()
  $all('.seg label', form).forEach(function (l) { l.classList.toggle('on', $('input', l).checked); });
  $all('.check', form).forEach(function (l) { l.classList.toggle('on', $('input', l).checked); });
}
function resetForm(keepContext) {
  var keep = { village: form.elements.village.value, screenDate: form.elements.screenDate.value };
  form.reset();
  form.elements.screenDate.value = (keepContext && keep.screenDate) || todayStr();
  editingId = null; lastErrors = null;
  renderVillageSelect(keepContext && effectiveVillages().indexOf(keep.village) >= 0 ? keep.village : '');
  renderEnteredBy();
  $('#editBanner').hidden = true;
  $('#saveBtn').textContent = t('save');
  showErrors({}, false); syncChecks(); updateLive();
}
function fillForm(r) {
  var f = form.elements;
  form.reset();
  f.name.value = r.name; f.age.value = r.age; f.phone.value = r.phone || '';
  renderVillageSelect(r.village || '');
  renderEnteredBy();
  $('#editInfo').textContent = t('origEnteredBy') + ': ' + (r.enteredBy || '—');
  $all('input[name=sex]', form).forEach(function (x) { x.checked = x.value === r.sex; });
  f.consent.checked = !!r.consent;
  ['sbp1', 'dbp1', 'sbp2', 'dbp2', 'pulse', 'heightCm', 'weightKg', 'waistCm'].forEach(function (k) { f[k].value = r[k] == null ? '' : r[k]; });
  ['tobacco', 'alcohol', 'diabetes', 'famHx'].forEach(function (k) { f[k].checked = !!r[k]; });
  f.screenDate.value = r.screenDate; f.screenedBy.value = r.screenedBy || ''; f.notes.value = r.notes || '';
  syncChecks(); updateLive();
}
function buildRecord(d, existing) {
  var avgS = avg2(d.sbp1, d.sbp2), avgD = avg2(d.dbp1, d.dbp2), cat = classify(avgS, avgD);
  var bmi = calcBmi(d.heightCm, d.weightKg);
  var now = new Date().toISOString();
  var r = existing ? existing : { id: uid(), createdAt: now, sample: false, deviceId: deviceId };
  r.rev = existing ? (existing.rev || 1) + 1 : 1; // every change bumps rev -> queued for sync
  r.name = d.name; r.age = d.age; r.sex = d.sex; r.village = d.village;
  r.phone = d.phone ? normPhone(d.phone) : ''; r.consent = true;
  r.sbp1 = d.sbp1; r.dbp1 = d.dbp1; r.sbp2 = d.sbp2; r.dbp2 = d.dbp2; r.pulse = d.pulse;
  r.avgSbp = avgS; r.avgDbp = avgD; r.category = cat;
  r.tobacco = d.tobacco; r.alcohol = d.alcohol; r.diabetes = d.diabetes; r.famHx = d.famHx;
  r.heightCm = d.heightCm; r.weightKg = d.weightKg; r.bmi = bmi; r.waistCm = d.waistCm;
  var prevCat = existing ? existing._prevCat : null;
  r.screenDate = d.screenDate; r.screenedBy = d.screenedBy; r.notes = d.notes; r.updatedAt = now;
  if (!existing) r.enteredBy = d.enteredBy;  // who entered it; old records without a name stay blank
  r.updatedBy = d.enteredBy;
  var fu = r.followUp || { required: false, dueDate: null, status: 'pending', doneDate: null, rechecks: [] };
  if (needsFollowUp(cat)) {
    if (!fu.required || prevCat !== cat || !fu.dueDate) fu.dueDate = defaultDueDate(cat, d.screenDate);
    fu.required = true;
    if (!fu.status) fu.status = 'pending';
  } else {
    fu.required = false; fu.dueDate = null;
  }
  r.followUp = fu;
  delete r._prevCat;
  return r;
}
function onSubmit(ev) {
  ev.preventDefault();
  var d = readForm();
  var errs = validate(d);
  lastErrors = Object.keys(errs).length ? errs : null;
  showErrors(errs, true);
  if (lastErrors) return;
  var r;
  if (editingId) {
    var ex = getRec(editingId); ex._prevCat = ex.category;
    r = buildRecord(d, ex);
  } else {
    r = buildRecord(d, null); records.push(r);
  }
  if (!saveAll()) { if (!editingId) records.pop(); return; }
  scheduleSync(300);
  lastResultId = r.id;
  editingId = null; $('#editBanner').hidden = true;
  form.hidden = true; $('#h-screen').hidden = true;
  renderResult(r);
  $('#resultPanel').hidden = false;
  window.scrollTo(0, 0);
  toast(t('savedOk'));
  updateBadge(); refreshVillageList();
}
function renderResult(r) {
  if (!r) return;
  var rf = [];
  if (r.tobacco) rf.push(t('tobacco')); if (r.alcohol) rf.push(t('alcohol'));
  if (r.diabetes) rf.push(t('diabetes')); if (r.famHx) rf.push(t('famHx'));
  var fuTxt;
  if (r.followUp && r.followUp.required) fuTxt = r.category === 'urgent' && r.followUp.dueDate === r.screenDate ? t('immediate') + ' — ' + fmtDate(r.followUp.dueDate) : fmtDate(r.followUp.dueDate);
  else fuTxt = t('noFollowUp');
  var wh = waistHigh(r.waistCm, r.sex);
  var html = '<div class="result-flag cat-' + r.category + '" id="resultFlag" data-category="' + r.category + '">' +
    '<div class="rf-sub">' + esc(t('resultTitle')) + '</div>' +
    '<div class="rf-label">' + esc(catLabel(r.category)) + '</div>' +
    '<div class="rf-bp">' + fmtNum(r.avgSbp) + '/' + fmtNum(r.avgDbp) + '</div>' +
    '<div class="rf-sub">' + esc(t('avgBP')) + ' (mmHg)</div></div>' +
    '<div class="card"><div class="advice">' + esc(t('adv_' + r.category)) + '</div></div>' +
    '<div class="card"><dl class="kv">' +
    '<dt>' + esc(t('name')) + '</dt><dd>' + esc(r.name) + '</dd>' +
    '<dt>' + esc(t('age')) + ' / ' + esc(t('sex')) + '</dt><dd>' + r.age + ' / ' + esc(sexLabel(r.sex)) + '</dd>' +
    '<dt>' + esc(t('village')) + '</dt><dd>' + esc(r.village) + '</dd>' +
    '<dt>' + esc(t('enteredBy')) + '</dt><dd>' + esc(r.enteredBy || '—') + '</dd>' +
    '<dt>' + esc(t('reading1')) + '</dt><dd>' + r.sbp1 + '/' + r.dbp1 + '</dd>' +
    '<dt>' + esc(t('reading2')) + '</dt><dd>' + r.sbp2 + '/' + r.dbp2 + '</dd>' +
    '<dt>' + esc(t('pulse')) + '</dt><dd>' + r.pulse + ' ' + esc(t('bpm')) + '</dd>' +
    '<dt>BMI</dt><dd>' + (r.bmi != null ? fmtNum(r.bmi) + ' — ' + esc(t(bmiCategory(r.bmi))) : esc(t('notRecorded'))) + '</dd>' +
    '<dt>' + esc(t('waist')) + '</dt><dd>' + (r.waistCm != null ? fmtNum(r.waistCm) + ' cm' + (wh ? ' (' + esc(t('waistHigh')) + ')' : '') : esc(t('notRecorded'))) + '</dd>' +
    '<dt>' + esc(t('riskFactors')) + '</dt><dd>' + esc(rf.length ? rf.join(', ') : t('none')) + '</dd>' +
    '<dt>' + esc(t('followUpDue')) + '</dt><dd>' + esc(fuTxt) + '</dd>' +
    '<dt>' + esc(t('syncLine')) + '</dt><dd id="resultSync">' + syncTag(r) + '</dd>' +
    '</dl></div>' +
    '<div class="btn-col"><button type="button" class="btn primary big" id="nextPerson">' + esc(t('nextPerson')) + '</button>' +
    (r.followUp && r.followUp.required ? '<button type="button" class="btn" id="gotoFu">' + esc(t('viewFollowup')) + '</button>' : '') + '</div>';
  $('#resultPanel').innerHTML = html;
}

/* -------------------------------------------------------- follow-up view */
var fuFilter = 'pending', openRecheck = null;
function renderFollowup() {
  var today = todayStr();
  var list = records.filter(function (r) { return r.followUp && r.followUp.required; });
  list = list.filter(function (r) {
    var s = fuState(r, today);
    if (fuFilter === 'pending') return s !== 'done';
    if (fuFilter === 'overdue') return s === 'overdue';
    if (fuFilter === 'done') return s === 'done';
    return true;
  });
  list.sort(function (a, b) {
    var sa = fuState(a, today) === 'done' ? 1 : 0, sb = fuState(b, today) === 'done' ? 1 : 0;
    if (sa !== sb) return sa - sb;
    if ((a.followUp.dueDate || '') !== (b.followUp.dueDate || '')) return (a.followUp.dueDate || '') < (b.followUp.dueDate || '') ? -1 : 1;
    return (b.category === 'urgent') - (a.category === 'urgent');
  });
  $all('#fuFilters .chip').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-fu') === fuFilter); });
  if (!list.length) { $('#fuList').innerHTML = '<div class="empty">' + esc(t('noFu')) + '</div>'; return; }
  $('#fuList').innerHTML = list.map(function (r) {
    var s = fuState(r, today);
    var stCls = { overdue: 'st-overdue', due: 'st-due', pending: 'st-pending', done: 'st-done' }[s];
    var stTxt = { overdue: t('stOverdue'), due: t('stDueToday'), pending: t('stPending'), done: t('stDone') }[s];
    var rc = r.followUp.rechecks || [];
    var h = '<div class="item b-' + r.category + '" data-id="' + r.id + '">' +
      '<div class="item-head"><div><div class="item-name">' + esc(r.name) + (r.sample ? ' <span class="sample-tag">' + esc(t('sample')) + '</span>' : '') + '</div>' +
      '<div class="item-meta">' + r.age + t('yrs') + ' · ' + esc(sexLabel(r.sex)) + ' · ' + esc(r.village) + '</div>' +
      '<div class="item-meta">' + esc(t('screened')) + ': ' + fmtDate(r.screenDate) + '</div></div>' +
      '<div style="text-align:right">' + badge(r.category) + '<div class="item-bp">' + fmtNum(r.avgSbp) + '/' + fmtNum(r.avgDbp) + '</div>' +
      '<span class="status ' + stCls + '">' + esc(stTxt) + '</span></div></div>';
    if (r.phone) h += '<div class="item-meta" style="margin-top:4px">' + esc(t('phoneLabel')) + ': <a href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a></div>';
    h += '<div class="due-row"><label for="due-' + r.id + '"><strong>' + esc(t('dueDate')) + ':</strong></label>' +
      '<input type="date" id="due-' + r.id + '" class="due-input" value="' + esc(r.followUp.dueDate || '') + '"' + (s === 'done' ? ' disabled' : '') + '></div>';
    if (s === 'done' && r.followUp.doneDate) h += '<div class="item-meta">' + esc(t('doneOn')) + ': ' + fmtDate(r.followUp.doneDate) + '</div>';
    if (rc.length) {
      h += '<div style="margin-top:8px;font-weight:700">' + esc(t('rechecks')) + ':</div><ul class="recheck-list">' + rc.map(function (x) {
        return '<li>' + fmtDate(x.date) + ': <strong>' + x.sbp + '/' + x.dbp + '</strong>' + (x.pulse ? ', ' + esc(t('pulse')) + ' ' + x.pulse : '') + ' ' + badge(x.category) + '</li>';
      }).join('') + '</ul>';
    }
    if (openRecheck === r.id) {
      h += '<form class="inline-form recheck-form" data-id="' + r.id + '" novalidate>' +
        '<div class="field" data-f="rdate"><label class="lbl">' + esc(t('recheckDate')) + '</label><input type="date" name="rdate" value="' + todayStr() + '"><div class="err"></div></div>' +
        '<div class="row3"><div class="field" data-f="rsbp"><label class="lbl">' + esc(t('systolic')) + '</label><input type="number" inputmode="numeric" name="rsbp"><div class="err"></div></div>' +
        '<div class="field" data-f="rdbp"><label class="lbl">' + esc(t('diastolic')) + '</label><input type="number" inputmode="numeric" name="rdbp"><div class="err"></div></div>' +
        '<div class="field" data-f="rpulse"><label class="lbl">' + esc(t('pulse')) + '</label><input type="number" inputmode="numeric" name="rpulse"><div class="err"></div></div></div>' +
        '<div class="btn-row"><button type="submit" class="btn primary small">' + esc(t('saveRecheck')) + '</button>' +
        '<button type="button" class="btn small" data-act="cancel-recheck">' + esc(t('cancel')) + '</button></div></form>';
    }
    h += '<div class="btn-row" style="margin-top:10px">';
    if (openRecheck !== r.id) h += '<button type="button" class="btn small" data-act="recheck">' + esc(t('addRecheck')) + '</button>';
    h += s === 'done' ? '<button type="button" class="btn small" data-act="reopen">' + esc(t('reopen')) + '</button>'
      : '<button type="button" class="btn primary small" data-act="done">✓ ' + esc(t('markDone')) + '</button>';
    h += '</div></div>';
    return h;
  }).join('');
}
function validateRecheck(d) {
  var e = {};
  if (!isValidDateStr(d.date) || d.date > todayStr()) e.rdate = 'errDate';
  if (d.sbp == null) e.rsbp = 'errRequired'; else if (!inRangeInt(d.sbp, 60, 300)) e.rsbp = 'errSbp';
  if (d.dbp == null) e.rdbp = 'errRequired'; else if (!inRangeInt(d.dbp, 30, 200)) e.rdbp = 'errDbp';
  if (!e.rsbp && !e.rdbp && d.sbp <= d.dbp) e.rdbp = 'errSbpGtDbp';
  if (d.pulse != null && !inRangeInt(d.pulse, 30, 220)) e.rpulse = 'errPulse';
  return e;
}

/* -------------------------------------------------------- dashboard view */
function pct(n, d) { return d ? Math.round((n / d) * 1000) / 10 : 0; }
function stackedRow(label, recs) {
  var n = recs.length, counts = { normal: 0, elevated: 0, high: 0, urgent: 0 };
  recs.forEach(function (r) { counts[r.category]++; });
  var hp = counts.high + counts.urgent;
  var segs = CATS.map(function (c) {
    return counts[c] ? '<div class="bar-seg cat-' + c + '" style="width:' + pct(counts[c], n) + '%" title="' + esc(catLabel(c)) + ': ' + counts[c] + '"></div>' : '';
  }).join('');
  return '<div class="bar-row"><div class="bl">' + esc(label) + ' <span class="sub-n">n=' + n + '</span></div>' +
    '<div class="bar-track" role="img" aria-label="' + esc(label + ': ' + CATS.map(function (c) { return catLabel(c) + ' ' + counts[c]; }).join(', ')) + '">' + segs + '</div>' +
    '<div class="bar-val">' + pct(hp, n) + '% <span class="sub-n">' + esc(t('pctHighPlus')) + '</span></div></div>';
}
function legend() {
  return '<div class="legend">' + CATS.map(function (c) { return '<span><i style="background:' + CAT_COLORS[c] + '"></i>' + esc(catLabel(c)) + '</span>'; }).join('') + '</div>';
}
function catSvg(counts, total) {
  var W = 340, H = 200, top = 24, base = 160, bw = 60, gap = (W - bw * 4) / 5;
  var max = Math.max.apply(null, CATS.map(function (c) { return counts[c]; }).concat([1]));
  var s = '<svg class="catchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('byCategory')) + '">';
  s += '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="#9aa9b6"/>';
  CATS.forEach(function (c, i) {
    var h = Math.round((counts[c] / max) * (base - top)), x = gap + i * (bw + gap), y = base - h;
    s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="4" fill="' + CAT_COLORS[c] + '"/>';
    s += '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#1b2733">' + counts[c] + ' (' + pct(counts[c], total) + '%)</text>';
    s += '<text x="' + (x + bw / 2) + '" y="' + (base + 20) + '" text-anchor="middle" font-size="' + (lang === 'ta' ? 11 : 12) + '" fill="#1b2733">' + esc(t('short_' + c)) + '</text>';
  });
  return s + '</svg>';
}
function simpleBar(label, n, total, color) {
  return '<div class="bar-row"><div class="bl">' + esc(label) + '</div><div class="bar-track"><div class="bar-seg" style="width:' + pct(n, total) + '%;background:' + color + '"></div></div>' +
    '<div class="bar-val">' + n + ' (' + pct(n, total) + '%)</div></div>';
}
function renderDashboard() {
  var incl = $('#dashIncludeSample').checked;
  var recs = records.filter(function (r) { return incl || !r.sample; });
  var el = $('#dashContent');
  if (!recs.length) { el.innerHTML = '<div class="empty card">' + esc(t('noData')) + '</div>'; return; }
  var n = recs.length, today = todayStr();
  var counts = { normal: 0, elevated: 0, high: 0, urgent: 0 };
  var fuPending = 0, fuOverdue = 0, sumS = 0, sumD = 0;
  recs.forEach(function (r) {
    counts[r.category]++; sumS += r.avgSbp; sumD += r.avgDbp;
    var s = fuState(r, today); if (s && s !== 'done') fuPending++; if (s === 'overdue') fuOverdue++;
  });
  var h = '<div class="stats">' +
    '<div class="stat"><div class="num" id="statTotal">' + n + '</div><div class="lbl">' + esc(t('totalScreened')) + '</div></div>' +
    '<div class="stat"><div class="num" style="color:var(--high)">' + (counts.high + counts.urgent) + ' <span style="font-size:1rem">(' + pct(counts.high + counts.urgent, n) + '%)</span></div><div class="lbl">' + esc(t('highUrgent')) + '</div></div>' +
    '<div class="stat"><div class="num">' + fuPending + '</div><div class="lbl">' + esc(t('fuPendingStat')) + '</div></div>' +
    '<div class="stat"><div class="num" style="color:var(--urgent)">' + fuOverdue + '</div><div class="lbl">' + esc(t('fuOverdueStat')) + '</div></div></div>';
  h += '<div class="card"><h3>' + esc(t('byCategory')) + '</h3>' + catSvg(counts, n) +
    '<table style="width:100%;border-collapse:collapse;font-size:.95rem;margin-top:6px" id="catTable">' + CATS.map(function (c) {
      return '<tr style="border-top:1px solid var(--line)"><td style="padding:6px 0">' + badge(c) + '</td><td style="text-align:right;font-weight:700" data-cat="' + c + '">' + counts[c] + '</td><td style="text-align:right;width:70px">' + pct(counts[c], n) + '%</td></tr>';
    }).join('') + '</table>' +
    '<p class="hint" style="margin-bottom:0">' + esc(t('meanBP')) + ': <strong>' + fmtNum(sumS / n) + '/' + fmtNum(sumD / n) + ' mmHg</strong></p></div>';
  // by village
  var vmap = {}, vorder = [];
  recs.forEach(function (r) { var k = r.village.trim().toLowerCase(); if (!vmap[k]) { vmap[k] = { label: r.village.trim(), recs: [] }; vorder.push(k); } vmap[k].recs.push(r); });
  vorder.sort(function (a, b) { return vmap[b].recs.length - vmap[a].recs.length || (vmap[a].label < vmap[b].label ? -1 : 1); });
  h += '<div class="card"><h3>' + esc(t('byVillage')) + '</h3>' + legend() + vorder.map(function (k) { return stackedRow(vmap[k].label, vmap[k].recs); }).join('') + '</div>';
  h += '<div class="card"><h3>' + esc(t('byAge')) + '</h3>' + legend() + AGE_GROUPS.map(function (g) {
    return stackedRow(g.key, recs.filter(function (r) { return ageGroup(r.age) === g.key; }));
  }).join('') + '</div>';
  h += '<div class="card"><h3>' + esc(t('bySex')) + '</h3>' + legend() + ['M', 'F', 'O'].map(function (s) {
    var rs = recs.filter(function (r) { return r.sex === s; }); return (rs.length || s !== 'O') ? stackedRow(sexLabel(s), rs) : '';
  }).join('') + '</div>';
  var cnt = function (fn) { return recs.filter(fn).length; };
  h += '<div class="card"><h3>' + esc(t('riskFactorPrev')) + '</h3>' +
    simpleBar(t('tobacco'), cnt(function (r) { return r.tobacco; }), n, '#6d4c41') +
    simpleBar(t('alcohol'), cnt(function (r) { return r.alcohol; }), n, '#5e35b1') +
    simpleBar(t('diabetes'), cnt(function (r) { return r.diabetes; }), n, '#00838f') +
    simpleBar(t('famHx'), cnt(function (r) { return r.famHx; }), n, '#ad1457') +
    simpleBar(t('bmiObeseStat'), cnt(function (r) { return r.bmi != null && r.bmi >= 25; }), n, '#ef6c00') +
    simpleBar(t('waistHigh'), cnt(function (r) { return waistHigh(r.waistCm, r.sex) === true; }), n, '#455a64') + '</div>';
  el.innerHTML = h;
}

/* -------------------------------------------------------- records view */
function renderRecords() {
  var q = ($('#recSearch').value || '').trim().toLowerCase();
  var list = records.filter(function (r) { return !q || r.name.toLowerCase().indexOf(q) >= 0 || r.village.toLowerCase().indexOf(q) >= 0; });
  list.sort(function (a, b) { return (b.screenDate + b.createdAt) < (a.screenDate + a.createdAt) ? -1 : 1; });
  var sampleN = records.filter(function (r) { return r.sample; }).length;
  $('#storageInfo').textContent = t('storageInfo', { n: records.length, s: sampleN });
  if (!list.length) { $('#recList').innerHTML = '<div class="empty">' + esc(records.length ? t('noRecords') : t('noData')) + '</div>'; return; }
  $('#recList').innerHTML = list.map(function (r) {
    var rf = [];
    if (r.tobacco) rf.push(t('tobacco')); if (r.alcohol) rf.push(t('alcohol')); if (r.diabetes) rf.push(t('diabetes')); if (r.famHx) rf.push(t('famHx'));
    return '<div class="item b-' + r.category + '" data-id="' + r.id + '"><div class="item-head"><div>' +
      '<div class="item-name">' + esc(r.name) + (r.sample ? ' <span class="sample-tag">' + esc(t('sample')) + '</span>' : '') + '</div>' +
      '<div class="item-meta">' + r.age + t('yrs') + ' · ' + esc(sexLabel(r.sex)) + ' · ' + esc(r.village) + ' · ' + fmtDate(r.screenDate) + '</div><div style="margin-top:4px">' + syncTag(r) + '</div></div>' +
      '<div style="text-align:right">' + badge(r.category) + '<div class="item-bp">' + fmtNum(r.avgSbp) + '/' + fmtNum(r.avgDbp) + '</div></div></div>' +
      '<details class="rec-details"><summary>' + esc(t('details')) + '</summary><dl class="kv" style="margin-top:8px">' +
      '<dt>' + esc(t('reading1')) + '</dt><dd>' + r.sbp1 + '/' + r.dbp1 + '</dd><dt>' + esc(t('reading2')) + '</dt><dd>' + r.sbp2 + '/' + r.dbp2 + '</dd>' +
      '<dt>' + esc(t('pulse')) + '</dt><dd>' + r.pulse + '</dd>' +
      '<dt>BMI</dt><dd>' + (r.bmi != null ? fmtNum(r.bmi) : '—') + '</dd><dt>' + esc(t('waist')) + '</dt><dd>' + (r.waistCm != null ? fmtNum(r.waistCm) + ' cm' : '—') + '</dd>' +
      '<dt>' + esc(t('riskFactors')) + '</dt><dd>' + esc(rf.length ? rf.join(', ') : t('none')) + '</dd>' +
      '<dt>' + esc(t('phoneLabel')) + '</dt><dd>' + esc(r.phone || '—') + '</dd>' +
      '<dt>' + esc(t('enteredBy')) + '</dt><dd>' + esc(r.enteredBy || '—') + '</dd>' +
      (r.updatedBy && r.updatedBy !== r.enteredBy ? '<dt>' + esc(t('updatedBy')) + '</dt><dd>' + esc(r.updatedBy) + '</dd>' : '') +
      '<dt>' + esc(t('screenedBy')) + '</dt><dd>' + esc(r.screenedBy || '—') + '</dd>' +
      (r.notes ? '<dt>' + esc(t('notes')) + '</dt><dd>' + esc(r.notes) + '</dd>' : '') +
      '</dl><div class="btn-row" style="margin-top:10px"><button type="button" class="btn small" data-act="edit">' + esc(t('edit')) + '</button>' +
      '<button type="button" class="btn small danger" data-act="delete">' + esc(t('del')) + '</button></div></details></div>';
  }).join('');
}

/* -------------------------------------------------------------- export */
var CSV_COLS = ['record_id', 'is_sample', 'screening_date', 'created_at', 'updated_at', 'entered_by', 'updated_by', 'screened_by', 'name', 'age', 'age_group', 'sex', 'village', 'phone', 'consent',
  'sbp1', 'dbp1', 'sbp2', 'dbp2', 'pulse', 'avg_sbp', 'avg_dbp', 'bp_category',
  'tobacco', 'alcohol', 'diabetes', 'family_history_htn', 'height_cm', 'weight_kg', 'bmi', 'bmi_category_asian', 'waist_cm', 'waist_high',
  'followup_required', 'followup_due_date', 'followup_status', 'followup_done_date', 'followup_overdue',
  'recheck_count', 'last_recheck_date', 'last_recheck_sbp', 'last_recheck_dbp', 'last_recheck_pulse', 'last_recheck_category', 'all_rechecks', 'notes'];
var BMI_EN = { bmiUnder: 'underweight', bmiNormal: 'normal', bmiOver: 'overweight', bmiObese: 'obese' };
function yn(b) { return b ? 'yes' : 'no'; }
function csvCell(v, isText) {
  if (v == null) return '';
  var s = String(v);
  if (isText && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // guard against spreadsheet formula injection
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function recordToRow(r, today) {
  var fu = r.followUp || {}, rc = fu.rechecks || [], last = rc.length ? rc[rc.length - 1] : null, st = fuState(r, today);
  var wh = waistHigh(r.waistCm, r.sex);
  return {
    record_id: r.id, is_sample: yn(r.sample), screening_date: r.screenDate, created_at: r.createdAt, updated_at: r.updatedAt || '',
    entered_by: r.enteredBy || '', updated_by: r.updatedBy || '', screened_by: r.screenedBy || '', name: r.name, age: r.age, age_group: ageGroup(r.age), sex: r.sex, village: r.village, phone: r.phone || '', consent: yn(r.consent),
    sbp1: r.sbp1, dbp1: r.dbp1, sbp2: r.sbp2, dbp2: r.dbp2, pulse: r.pulse, avg_sbp: r.avgSbp, avg_dbp: r.avgDbp, bp_category: r.category,
    tobacco: yn(r.tobacco), alcohol: yn(r.alcohol), diabetes: yn(r.diabetes), family_history_htn: yn(r.famHx),
    height_cm: r.heightCm, weight_kg: r.weightKg, bmi: r.bmi, bmi_category_asian: r.bmi != null ? BMI_EN[bmiCategory(r.bmi)] : '', waist_cm: r.waistCm,
    waist_high: wh == null ? '' : yn(wh),
    followup_required: yn(fu.required), followup_due_date: fu.required ? fu.dueDate || '' : '',
    followup_status: fu.required ? (fu.status === 'done' ? 'done' : 'pending') : 'not_required',
    followup_done_date: fu.required && fu.status === 'done' ? fu.doneDate || '' : '', followup_overdue: st ? yn(st === 'overdue') : '',
    recheck_count: rc.length, last_recheck_date: last ? last.date : '', last_recheck_sbp: last ? last.sbp : '', last_recheck_dbp: last ? last.dbp : '',
    last_recheck_pulse: last && last.pulse != null ? last.pulse : '', last_recheck_category: last ? last.category : '',
    all_rechecks: rc.map(function (x) { return x.date + ' ' + x.sbp + '/' + x.dbp + (x.pulse ? ' p' + x.pulse : '') + ' ' + x.category; }).join('; '),
    notes: r.notes || ''
  };
}
var TEXT_COLS = { entered_by: 1, updated_by: 1, screened_by: 1, name: 1, village: 1, notes: 1, phone: 1 };
function buildCsv() {
  var today = todayStr();
  var lines = [CSV_COLS.join(',')];
  records.slice().sort(function (a, b) { return a.screenDate < b.screenDate ? -1 : a.screenDate > b.screenDate ? 1 : 0; }).forEach(function (r) {
    var row = recordToRow(r, today);
    lines.push(CSV_COLS.map(function (c) { return csvCell(row[c], !!TEXT_COLS[c]); }).join(','));
  });
  return lines.join('\r\n') + '\r\n';
}
function exportCsv() {
  if (!records.length) { toast(t('nothingExport')); return; }
  var blob = new Blob(['\ufeff' + buildCsv()], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'htn-screening-' + todayStr() + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  toast(t('exported', { n: records.length }));
}

/* --------------------------------------------------------- sample data */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t2 = Math.imul(a ^ a >>> 15, 1 | a); t2 = t2 + Math.imul(t2 ^ t2 >>> 7, 61 | t2) ^ t2; return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296; }; }
function makeSampleRecords() {
  var rnd = mulberry32(20261004);
  var ri = function (lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); };
  // Target average BPs chosen to cover every category (incl. boundary values).
  var bps = [[112, 72], [108, 70], [116, 76], [119, 79], [105, 68], [114, 74],
    [126, 78], [132, 84], [120, 76], [136, 86], [128, 80],
    [146, 92], [152, 88], [140, 84], [158, 98], [148, 90], [164, 96],
    [186, 112], [176, 122], [194, 118]];
  var ages = [24, 35, 61, 47, 29, 52, 38, 66, 44, 57, 31, 68, 49, 55, 72, 42, 63, 58, 70, 53];
  var villages = ['Sample Village A', 'Sample Village B', 'Sample Village C', 'Sample Village D'];
  var today = todayStr(), out = [];
  for (var i = 0; i < 20; i++) {
    var base = bps[i], dS = ri(0, 4), dD = ri(0, 3);
    var sbp1 = base[0] + dS, sbp2 = base[0] - dS, dbp1 = base[1] + dD, dbp2 = base[1] - dD;
    var sex = i === 9 ? 'O' : (i % 2 === 0 ? 'F' : 'M');
    var h = sex === 'M' ? ri(158, 178) : ri(145, 165), w = ri(42, 88);
    var sd = addDays(today, -ri(0, 21));
    var avgS = avg2(sbp1, sbp2), avgD = avg2(dbp1, dbp2), cat = classify(avgS, avgD);
    var r = {
      id: 'sample-' + pad(i + 1) + '-' + uid(), createdAt: new Date(parseDate(sd).getTime() + 9 * 3600e3 + i * 60e3).toISOString(), updatedAt: '',
      sample: true, name: 'SAMPLE Person ' + pad(i + 1) + ' (fictional)', age: ages[i], sex: sex, village: villages[i % 4], phone: '',
      consent: true, sbp1: sbp1, dbp1: dbp1, sbp2: sbp2, dbp2: dbp2, pulse: ri(62, 98), avgSbp: avgS, avgDbp: avgD, category: cat,
      tobacco: rnd() < 0.3, alcohol: sex === 'M' && rnd() < 0.4, diabetes: rnd() < 0.2, famHx: rnd() < 0.35,
      heightCm: h, weightKg: w, bmi: calcBmi(h, w), waistCm: ri(68, 104),
      screenDate: sd, screenedBy: 'Sample data', enteredBy: 'Sample data', updatedBy: 'Sample data', notes: 'Fictional sample record for demonstration',
      followUp: { required: false, dueDate: null, status: 'pending', doneDate: null, rechecks: [] }
    };
    if (needsFollowUp(cat)) {
      r.followUp.required = true; r.followUp.dueDate = defaultDueDate(cat, sd);
      if (i === 11 || i === 17) { // a couple already followed up
        var rd = addDays(sd, cat === 'urgent' ? 0 : 6); if (rd > today) rd = today;
        var rs = base[0] - ri(4, 12), rdb = base[1] - ri(2, 6);
        r.followUp.rechecks.push({ date: rd, sbp: rs, dbp: rdb, pulse: ri(64, 90), category: classify(rs, rdb), at: new Date().toISOString() });
        r.followUp.status = 'done'; r.followUp.doneDate = rd;
      }
    }
    out.push(r);
  }
  return out;
}

/* --------------------------------------------------------- Google Sheet sync
 * Each record has rev (bumped on every change) and syncedRev (last rev the sheet confirmed).
 * rev !== syncedRev  => record is queued. Nothing is ever deleted locally because of sync.
 * Requests are POSTed as text/plain JSON (a "simple" CORS request, so no preflight —
 * Google Apps Script cannot answer OPTIONS requests).                                   */
var sync = { busy: false, status: 'idle', error: null, timer: null, backoff: 0, again: false, promise: null };
function makeDeviceId() {
  var a = new Uint8Array(6);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < 6; i++) a[i] = Math.floor(Math.random() * 256);
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var j = 0; j < 6; j++) s += chars[a[j] % chars.length];
  return 'DEV-' + s + '-' + Date.now().toString(36).toUpperCase().slice(-4);
}
function touch(r) { r.rev = (r.rev || 1) + 1; r.updatedAt = new Date().toISOString(); r.updatedBy = prefs.enteredBy || ''; }
function saveSyncCfg() { try { localStorage.setItem(SYNC_KEY, JSON.stringify(syncCfg)); } catch (e) { /* ignore */ } }
function isSyncConfigured() { return !!(syncCfg.url && syncCfg.key); }
function isPending(r) { return !r.sample && (r.rev || 1) !== (r.syncedRev || 0); }
function pendingRecords() { return records.filter(isPending); }
function validSyncUrl(u) {
  try { var x = new URL(u); if (x.protocol === 'https:') return true; return x.protocol === 'http:' && (x.hostname === 'localhost' || x.hostname === '127.0.0.1'); }
  catch (e) { return false; }
}
function isAppsScriptUrl(u) { try { var h = new URL(u).hostname; return h === 'script.google.com' || h === 'script.googleusercontent.com'; } catch (e) { return false; } }
function syncErr(code) { var e = new Error(code); e.code = code; return e; }
function errText(code) { var k = 'syncErr_' + code; return I18N.en[k] ? t(k) : t('syncErr_other') + ' (' + code + ')'; }
function httpJson(url, opts, timeoutMs) {
  var ctrl = window.AbortController ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 30000) : null;
  opts.redirect = 'follow'; opts.credentials = 'omit'; opts.cache = 'no-store';
  if (ctrl) opts.signal = ctrl.signal;
  return fetch(url, opts).then(function (res) { return res.text(); }, function () { throw syncErr('network'); })
    .then(function (txt) { clearTimeout(timer); try { return JSON.parse(txt); } catch (e) { throw syncErr('bad'); } },
      function (err) { clearTimeout(timer); throw err.code ? err : syncErr('network'); });
}
function postSync(url, payload) {
  return httpJson(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }, 45000);
}
function syncTag(r) {
  var a = ' data-sync-id="' + esc(r.id) + '"';
  if (r.sample) return '<span class="sync-tag st-sample"' + a + '>' + esc(t('syncTagSample')) + '</span>';
  if (isPending(r)) return '<span class="sync-tag st-wait"' + a + '>⏳ ' + esc(t('syncTagPending')) + '</span>';
  return '<span class="sync-tag st-ok"' + a + '>✓ ' + esc(t('syncTagSynced')) + '</span>';
}
/** Update sync badges in place (no full re-render, so half-typed forms are never wiped). */
function refreshSyncTags() {
  $all('[data-sync-id]').forEach(function (el) { var r = getRec(el.getAttribute('data-sync-id')); if (r) el.outerHTML = syncTag(r); });
}
function scheduleSync(delay) {
  clearTimeout(sync.timer);
  sync.timer = setTimeout(function () { syncNow(false); }, delay == null ? 800 : delay);
  updateSyncUI();
}
function syncNow(manual) {
  if (!isSyncConfigured()) { if (manual) toast(t('syncNotSetupToast')); updateSyncUI(); return Promise.resolve(false); }
  if (sync.busy) { sync.again = true; return sync.promise; }
  if (!pendingRecords().length) { sync.status = 'idle'; sync.error = null; updateSyncUI(); if (manual) toast(t('syncStAllSynced')); return Promise.resolve(true); }
  if (navigator.onLine === false) { sync.status = 'offline'; updateSyncUI(); return Promise.resolve(false); }
  clearTimeout(sync.timer);
  sync.busy = true; sync.status = 'syncing'; updateSyncUI();
  var total = 0, url = syncCfg.url, key = syncCfg.key;
  function step() {
    var batch = pendingRecords().slice(0, SYNC_BATCH);
    if (!batch.length) return Promise.resolve();
    var sent = batch.map(function (r) { return { id: r.id, rev: r.rev || 1 }; });
    var today = todayStr();
    return postSync(url, {
      action: 'upsert', key: key, device_id: deviceId, app_version: APP_VERSION, sent_at: new Date().toISOString(),
      records: batch.map(function (r) { return recordToRow(r, today); })
    }).then(function (d) {
      if (!d || d.ok !== true) throw syncErr((d && d.error) || 'bad');
      var ok = {}; (d.synced || []).forEach(function (id) { ok[id] = 1; });
      var now = new Date().toISOString(), n = 0;
      sent.forEach(function (s) { var r = getRec(s.id); if (ok[s.id] && r) { r.syncedRev = s.rev; r.syncedAt = now; n++; } });
      if (!n) throw syncErr('bad');
      total += n; saveAll(); syncCfg.lastSyncAt = now; saveSyncCfg();
      return step();
    });
  }
  sync.promise = step().then(function () {
    sync.status = 'idle'; sync.error = null; sync.backoff = 0;
    if (manual) toast(t('syncSyncedN', { n: total }));
    return true;
  }, function (err) {
    var code = err.code || 'network';
    sync.status = (code === 'network' && navigator.onLine === false) ? 'offline' : 'error';
    sync.error = code;
    // Wrong/missing key will not fix itself: wait for a new save, settings change or "Sync now".
    if (code !== 'unauthorized' && code !== 'key_not_set') { sync.backoff = Math.min((sync.backoff || 10000) * 2, 300000); scheduleSync(sync.backoff); }
    if (manual) toast(t('syncStError', { e: errText(code), n: pendingRecords().length }));
    return false;
  }).then(function (res) {
    sync.busy = false; updateSyncUI(); refreshSyncTags();
    if (sync.again) { sync.again = false; scheduleSync(200); }
    return res;
  });
  return sync.promise;
}
function updateSyncUI() {
  var box = $('#syncStatus'); if (!box) return;
  var n = pendingRecords().length, cls, txt;
  if (!isSyncConfigured()) { cls = 'ss-off'; txt = t('syncStNotSetup'); }
  else if (sync.status === 'syncing') { cls = 'ss-busy'; txt = t('syncStSyncing'); }
  else if (navigator.onLine === false && n) { cls = 'ss-wait'; txt = t('syncStOffline', { n: n }); }
  else if (sync.status === 'error' && n) { cls = 'ss-err'; txt = t('syncStError', { e: errText(sync.error), n: n }); }
  else if (n) { cls = 'ss-wait'; txt = t('syncStPending', { n: n }); }
  else { cls = 'ss-ok'; txt = '✓ ' + t('syncStAllSynced'); }
  box.className = 'sync-status ' + cls;
  box.setAttribute('data-pending', String(n));
  var last = syncCfg.lastSyncAt ? '<div class="hint">' + esc(t('syncLast')) + ': ' + esc(new Date(syncCfg.lastSyncAt).toLocaleString()) + '</div>' : '';
  box.innerHTML = '<div class="ss-main">' + esc(txt) + '</div>' + (isSyncConfigured() ? last : '');
  var b = $('#syncBadge'); if (b) b.textContent = isSyncConfigured() && n ? String(n) : '';
  var dv = $('#deviceIdOut'); if (dv) dv.textContent = deviceId;
}
function setSyncMsg(text, kind) { var m = $('#syncMsg'); m.textContent = text || ''; m.className = 'sync-msg ' + (kind || ''); }
function fillSyncForm() { $('#syncUrl').value = syncCfg.url || ''; $('#syncKey').value = syncCfg.key || ''; }
function readSyncForm() { return { url: $('#syncUrl').value.trim(), key: $('#syncKey').value.trim() }; }
function checkSyncForm(v) {
  if (!validSyncUrl(v.url)) { setSyncMsg(t('syncInvalidUrl'), 'bad'); return false; }
  if (!v.key) { setSyncMsg(t('syncNeedKey'), 'bad'); return false; }
  return true;
}
function saveSyncSettings() {
  var v = readSyncForm();
  if (!v.url && !v.key) { syncCfg = {}; saveSyncCfg(); setSyncMsg(t('syncDisabled'), 'ok'); updateSyncUI(); renderAll(); return; }
  if (!checkSyncForm(v)) return;
  syncCfg.url = v.url; syncCfg.key = v.key; saveSyncCfg();
  sync.status = 'idle'; sync.error = null; sync.backoff = 0;
  setSyncMsg(t('syncSaved'), 'ok'); toast(t('syncSaved'));
  syncNow(false); refreshVillages(false);
}
function testConnection() {
  var v = readSyncForm();
  if (!checkSyncForm(v)) return Promise.resolve(false);
  setSyncMsg(t('syncTesting'), '');
  var getUrl = v.url + (v.url.indexOf('?') >= 0 ? '&' : '?') + 'status=1&t=' + Date.now();
  return httpJson(getUrl, { method: 'GET' }, 20000).then(function (d) {
    if (!d || d.ok !== true || d.app !== 'htn-screening-sync') throw syncErr('bad');
    return postSync(v.url, { action: 'ping', key: v.key, device_id: deviceId, app_version: APP_VERSION });
  }).then(function (d) {
    if (!d || d.ok !== true) throw syncErr((d && d.error) || 'bad');
    setSyncMsg(t('syncTestOk'), 'ok'); return true;
  }).catch(function (err) { setSyncMsg(t('syncTestFail', { e: errText(err.code || 'network') }), 'bad'); return false; });
}
function setupLink() {
  var v = isSyncConfigured() ? { url: syncCfg.url, key: syncCfg.key } : readSyncForm();
  if (!checkSyncForm(v)) return;
  var base = location.protocol === 'file:' ? 'https://paulebe525.github.io/hypertension-screening/' : location.origin + location.pathname;
  // '#' keeps the key out of web-server logs; '?sync=...&key=...' links are accepted too.
  var link = base + '#sync=' + encodeURIComponent(v.url) + '&key=' + encodeURIComponent(v.key);
  var out = $('#syncLinkOut'); out.hidden = false; out.value = link;
  var done = function () { setSyncMsg(t('syncLinkCopied'), 'ok'); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(link).then(done, function () { out.select(); setSyncMsg(t('syncLinkReady'), ''); });
  else { out.select(); setSyncMsg(t('syncLinkReady'), ''); }
}
/** Read ?sync=URL&key=KEY (or #sync=...&key=...) from a shared setup link. */
function applySetupLink() {
  var url = null, key = null;
  [location.search.slice(1), location.hash.slice(1)].forEach(function (q) {
    if (!q || q.indexOf('sync=') < 0 && q.indexOf('key=') < 0) return;
    var p = new URLSearchParams(q); if (p.get('sync')) url = p.get('sync'); if (p.get('key')) key = p.get('key');
  });
  if (url == null && key == null) return false;
  // Remove the key from the address bar / history straight away, whatever happens next.
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
  if (!url || !key || !validSyncUrl(url)) { toast(t('syncInvalidUrl')); return false; }
  if (syncCfg.url === url && syncCfg.key === key) { toast(t('syncSaved')); return true; }
  var msg = t('syncSetupConfirm', { u: url }) + (isAppsScriptUrl(url) ? '' : '\n\n' + t('syncNotGoogle'));
  if (!confirm(msg)) return false;
  syncCfg.url = url; syncCfg.key = key; saveSyncCfg();
  sync.status = 'idle'; sync.error = null;
  fillSyncForm(); toast(t('syncSaved')); setSyncMsg(t('syncSaved'), 'ok');
  return true;
}

/* ------------------------------------------------------------- render */
function updateBadge() {
  var today = todayStr();
  var n = records.filter(function (r) { var s = fuState(r, today); return s === 'overdue' || s === 'due'; }).length;
  $('#fuBadge').textContent = n ? String(n) : '';
}
function refreshVillageList() { renderVillageSelect(); }

/* --------------------------------------------------------- Entered by */
var ebEditing = false;
function renderEnteredBy() {
  var name = prefs.enteredBy || '';
  var editing = ebEditing || !name;
  $('#ebView').hidden = editing; $('#ebEdit').hidden = !editing;
  $('#ebName').textContent = name;
  var inp = $('#ebInput');
  if (editing && document.activeElement !== inp) inp.value = name || prefs.screenedBy || '';
}
function saveEnteredBy() {
  var v = $('#ebInput').value.replace(/\s+/g, ' ').trim();
  var fl = $('#ebEdit');
  if (v.length < 2) { fl.classList.add('invalid'); $('.err', fl).textContent = t('errEnteredBy'); $('#ebInput').focus(); return; }
  prefs.enteredBy = v.slice(0, 60); savePrefs();
  ebEditing = false; fl.classList.remove('invalid'); $('.err', fl).textContent = '';
  renderEnteredBy(); toast(t('nameSaved'));
  if (lastErrors) { var errs = validate(readForm()); lastErrors = Object.keys(errs).length ? errs : null; showErrors(errs, false); }
}

/* --------------------------------------------------------- Village list
 * Source of truth: "Villages" tab of the Google Sheet (fetched with the sync key, cached for offline use).
 * Fallback: a local list typed in Records > Village list, used only when the sheet list is empty/unavailable. */
var villageState = { busy: false, error: null, promise: null };
function cleanVillageList(arr) {
  var seen = {}, out = [];
  (arr || []).forEach(function (v) {
    var n = String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 80);
    if (n && !seen[n.toLowerCase()]) { seen[n.toLowerCase()] = 1; out.push(n); }
  });
  return out.slice(0, 2000);
}
function villageSource() { return villageCache.list.length ? 'sheet' : (localVillages.length ? 'local' : 'none'); }
function effectiveVillages() { return villageCache.list.length ? villageCache.list : localVillages; }
function renderVillageSelect(selected) {
  var sel = form && form.elements.village; if (!sel) return;
  if (selected == null) selected = sel.value;
  var list = effectiveVillages(), inList = list.indexOf(selected) >= 0;
  var orig = editingId ? getRec(editingId) : null;
  var html = '<option value="">' + esc(t('selectVillage')) + '</option>' +
    list.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
  // Old free-text village of the record being edited: keep it selectable so nothing is lost.
  if (selected && !inList && orig && orig.village === selected) html += '<option value="' + esc(selected) + '">' + esc(selected + ' ' + t('notInList')) + '</option>';
  else if (!inList) selected = '';
  sel.innerHTML = html; sel.value = selected || '';
  var hint = $('#villageHint'); hint.textContent = list.length ? '' : t('noVillages'); hint.hidden = !!list.length;
}
function renderVillageUI() {
  var box = $('#villageStatus'); if (!box) return;
  var src = villageSource(), cls, txt;
  if (villageState.busy) { cls = 'ss-busy'; txt = t('vRefreshing'); }
  else if (src === 'sheet') { cls = 'ss-ok'; txt = '✓ ' + t('vSrcSheet', { n: villageCache.list.length, d: villageCache.fetchedAt ? new Date(villageCache.fetchedAt).toLocaleString() : '' }); }
  else if (src === 'local') { cls = 'ss-wait'; txt = t('vSrcLocal', { n: localVillages.length }); }
  else { cls = 'ss-err'; txt = t('vSrcNone'); }
  var extra = [];
  if (src !== 'sheet' && isSyncConfigured() && villageCache.fetchedAt && !villageState.error) extra.push(t('vSheetEmpty'));
  if (!isSyncConfigured() && src !== 'sheet') extra.push(t('vNeedSync'));
  if (villageState.error && !villageState.busy) extra.push(t('vRefreshFail', { e: errText(villageState.error) }));
  box.className = 'sync-status ' + cls; box.setAttribute('data-source', src);
  box.innerHTML = '<div class="ss-main">' + esc(txt) + '</div>' + extra.map(function (x) { return '<div class="hint">' + esc(x) + '</div>'; }).join('');
  $('#refreshVillagesBtn').disabled = villageState.busy;
  var nu = $('#localNotInUse'); nu.textContent = t('localNotInUse'); nu.hidden = src !== 'sheet';
  var ta = $('#localVillagesInput'); if (document.activeElement !== ta) ta.value = localVillages.join('\n');
}
function refreshVillages(manual) {
  if (!isSyncConfigured()) { if (manual) toast(t('vNeedSync')); renderVillageUI(); return Promise.resolve(false); }
  if (navigator.onLine === false) { if (manual) toast(t('vRefreshFail', { e: errText('network') })); return Promise.resolve(false); }
  if (villageState.busy) return villageState.promise;
  villageState.busy = true; renderVillageUI();
  var u = syncCfg.url;
  var getUrl = u + (u.indexOf('?') >= 0 ? '&' : '?') + 'action=villages&key=' + encodeURIComponent(syncCfg.key) + '&t=' + Date.now();
  villageState.promise = httpJson(getUrl, { method: 'GET' }, 20000).then(function (d) {
    if (!d || d.ok !== true || !Array.isArray(d.villages)) throw syncErr((d && d.error) || 'bad');
    villageCache = { list: cleanVillageList(d.villages), fetchedAt: new Date().toISOString(), url: u };
    try { localStorage.setItem(VILLAGE_CACHE_KEY, JSON.stringify(villageCache)); } catch (e) { /* ignore */ }
    villageState.error = null;
    if (manual) toast(villageCache.list.length ? t('vRefreshed', { n: villageCache.list.length }) : t('vSheetEmpty'));
    return true;
  }).catch(function (err) {
    villageState.error = err.code || 'network';   // keep the cached list
    if (manual) toast(t('vRefreshFail', { e: errText(villageState.error) }));
    return false;
  }).then(function (res) { villageState.busy = false; renderVillageUI(); renderVillageSelect(); return res; });
  return villageState.promise;
}
function saveLocalVillages() {
  localVillages = cleanVillageList($('#localVillagesInput').value.split(/\r?\n/));
  try { localStorage.setItem(LOCAL_VILLAGES_KEY, JSON.stringify(localVillages)); } catch (e) { /* ignore */ }
  $('#localVillagesInput').value = localVillages.join('\n');
  toast(t('localSaved', { n: localVillages.length }));
  renderVillageUI(); renderVillageSelect();
}

function renderAll() {
  updateBadge(); updateSyncUI(); renderVillageUI();
  if (currentView === 'followup') renderFollowup();
  if (currentView === 'dashboard') renderDashboard();
  if (currentView === 'records') renderRecords();
}

/* ---------------------------------------------------------------- init */
function init() {
  loadAll();
  lang = prefs.lang === 'ta' ? 'ta' : 'en';
  form = $('#screenForm');
  form.elements.screenDate.value = todayStr();
  form.elements.screenDate.max = todayStr();

  $('#langToggle').addEventListener('click', function () { lang = lang === 'en' ? 'ta' : 'en'; prefs.lang = lang; savePrefs(); applyLang(); });
  $all('.tabbar button').forEach(function (b) { b.addEventListener('click', function () { showView(b.getAttribute('data-view')); }); });

  form.addEventListener('input', function (e) {
    updateLive(); syncChecks();
    if (lastErrors) { // live re-validation once the user has tried to save
      var errs = validate(readForm()); lastErrors = Object.keys(errs).length ? errs : null; showErrors(errs, false);
    }
  });
  form.addEventListener('change', function () { syncChecks(); updateLive(); });
  form.addEventListener('submit', onSubmit);
  $('#cancelEdit').addEventListener('click', function () { resetForm(false); showView('records'); });

  $('#resultPanel').addEventListener('click', function (e) {
    if (e.target.id === 'nextPerson') { $('#resultPanel').hidden = true; lastResultId = null; form.hidden = false; $('#h-screen').hidden = false; resetForm(true); window.scrollTo(0, 0); $('#f-name').focus(); }
    if (e.target.id === 'gotoFu') { $('#resultPanel').hidden = true; lastResultId = null; form.hidden = false; $('#h-screen').hidden = false; resetForm(true); fuFilter = 'pending'; showView('followup'); }
  });

  // follow-up interactions
  $('#fuFilters').addEventListener('click', function (e) { var c = e.target.closest('.chip'); if (c) { fuFilter = c.getAttribute('data-fu'); openRecheck = null; renderFollowup(); } });
  $('#fuList').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]'); if (!btn) return;
    var item = btn.closest('.item'); var r = getRec(item.getAttribute('data-id')); if (!r) return;
    var act = btn.getAttribute('data-act');
    if (act === 'recheck') { openRecheck = r.id; renderFollowup(); var f = $('.recheck-form[data-id="' + r.id + '"] input[name=rsbp]'); if (f) f.focus(); return; }
    if (act === 'cancel-recheck') { openRecheck = null; renderFollowup(); return; }
    if (act === 'done') { r.followUp.status = 'done'; r.followUp.doneDate = todayStr(); touch(r); saveAll(); scheduleSync(); toast(t('fuMarkedDone')); }
    if (act === 'reopen') { r.followUp.status = 'pending'; r.followUp.doneDate = null; touch(r); saveAll(); scheduleSync(); toast(t('fuReopened')); }
    renderAll();
  });
  $('#fuList').addEventListener('change', function (e) {
    if (!e.target.classList.contains('due-input')) return;
    var r = getRec(e.target.closest('.item').getAttribute('data-id'));
    if (r && isValidDateStr(e.target.value)) { r.followUp.dueDate = e.target.value; touch(r); saveAll(); scheduleSync(); toast(t('dueUpdated')); renderAll(); }
    else if (r) e.target.value = r.followUp.dueDate || '';
  });
  $('#fuList').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target; var r = getRec(f.getAttribute('data-id')); if (!r) return;
    var d = { date: f.elements.rdate.value, sbp: parseNum(f.elements.rsbp.value), dbp: parseNum(f.elements.rdbp.value), pulse: parseNum(f.elements.rpulse.value) };
    var errs = validateRecheck(d);
    $all('.field[data-f]', f).forEach(function (fl) { var k = fl.getAttribute('data-f'); fl.classList.toggle('invalid', !!errs[k]); $('.err', fl).textContent = errs[k] ? t(errs[k]) : ''; });
    if (Object.keys(errs).length) return;
    r.followUp.rechecks = r.followUp.rechecks || [];
    r.followUp.rechecks.push({ date: d.date, sbp: d.sbp, dbp: d.dbp, pulse: d.pulse, category: classify(d.sbp, d.dbp), at: new Date().toISOString() });
    r.followUp.rechecks.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    touch(r);
    saveAll(); scheduleSync(); openRecheck = null; toast(t('recheckSaved')); renderAll();
  });

  $('#dashIncludeSample').addEventListener('change', renderDashboard);
  $('#recSearch').addEventListener('input', renderRecords);
  $('#recList').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]'); if (!btn) return;
    var r = getRec(btn.closest('.item').getAttribute('data-id')); if (!r) return;
    if (btn.getAttribute('data-act') === 'delete') {
      if (!confirm(t('confirmDelete') + '\n\n' + r.name)) return;
      records = records.filter(function (x) { return x.id !== r.id; }); saveAll(); toast(t('deleted')); renderAll(); refreshVillageList();
    } else if (btn.getAttribute('data-act') === 'edit') {
      editingId = r.id; fillForm(r); $('#editBanner').hidden = false; $('#saveBtn').textContent = t('saveChanges');
      $('#resultPanel').hidden = true; form.hidden = false; $('#h-screen').hidden = false; showView('screen');
    }
  });

  $('#exportCsv').addEventListener('click', exportCsv);
  $('#loadSample').addEventListener('click', function () {
    if (!confirm(t('confirmSample'))) return;
    var s = makeSampleRecords();
    records = records.filter(function (r) { return !r.sample; }).concat(s);
    if (saveAll()) toast(t('sampleLoaded', { n: s.length }));
    renderAll(); refreshVillageList();
  });
  $('#removeSample').addEventListener('click', function () {
    var n = records.filter(function (r) { return r.sample; }).length;
    records = records.filter(function (r) { return !r.sample; }); saveAll(); toast(t('sampleRemoved', { n: n })); renderAll(); refreshVillageList();
  });
  $('#clearAll').addEventListener('click', function () {
    if (!records.length) { toast(t('noData')); return; }
    if (!confirm(t('confirmClear', { n: records.length }))) return;
    records = []; saveAll(); toast(t('cleared')); renderAll(); refreshVillageList();
  });

  // ---- Entered by + villages
  $('#ebSave').addEventListener('click', saveEnteredBy);
  $('#ebInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveEnteredBy(); } });
  $('#ebChange').addEventListener('click', function () { ebEditing = true; renderEnteredBy(); $('#ebInput').focus(); });
  $('#refreshVillagesBtn').addEventListener('click', function () { refreshVillages(true); });
  $('#saveLocalVillagesBtn').addEventListener('click', saveLocalVillages);
  window.addEventListener('online', function () { refreshVillages(false); });

  // ---- Google Sheet sync wiring
  fillSyncForm();
  $('#syncSaveBtn').addEventListener('click', saveSyncSettings);
  $('#syncTestBtn').addEventListener('click', testConnection);
  $('#syncNowBtn').addEventListener('click', function () { sync.backoff = 0; syncNow(true); });
  $('#syncLinkBtn').addEventListener('click', setupLink);
  $('#syncShowKey').addEventListener('click', function () {
    var k = $('#syncKey'); var show = k.type === 'password'; k.type = show ? 'text' : 'password';
    this.setAttribute('data-i18n', show ? 'hideKey' : 'showKey'); this.textContent = t(show ? 'hideKey' : 'showKey');
  });
  window.addEventListener('online', function () { sync.backoff = 0; updateSyncUI(); syncNow(false); });
  window.addEventListener('offline', function () { updateSyncUI(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') syncNow(false); });
  window.addEventListener('hashchange', function () { if (applySetupLink()) { showView('records'); syncNow(false); refreshVillages(false); } });
  setInterval(function () { if (!sync.busy && sync.status !== 'error' && pendingRecords().length) syncNow(false); }, 60000);
  var fromLink = applySetupLink();
  if (!isSyncConfigured()) $('#syncSettings').open = true;
  if (villageSource() !== 'sheet') $('#localVillagesBox').open = true;

  // Ask the browser not to evict our data (best effort).
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }

  refreshVillageList();
  applyLang();
  if (fromLink) showView('records');
  syncNow(false); // retry anything queued from earlier sessions
  refreshVillages(false);
}

// Expose pure functions for automated testing.
window.HTN = { classify: classify, avg2: avg2, calcBmi: calcBmi, bmiCategory: bmiCategory, defaultDueDate: defaultDueDate,
  ageGroup: ageGroup, validate: validate, buildCsv: buildCsv, normPhone: normPhone, CSV_COLS: CSV_COLS,
  refreshVillages: refreshVillages, effectiveVillages: function () { return effectiveVillages().slice(); }, villageSource: function () { return villageSource(); },
  syncNow: syncNow, pendingCount: function () { return pendingRecords().length; }, deviceId: function () { return deviceId; } };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
