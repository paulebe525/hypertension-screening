Hypertension Screening – Version 1.3.1 (installable app + offline, Google Sheet sync, Entered by, village list)
Scudder College of Nursing, Ranipet (Digital Health)

HOW TO OPEN
  Live link: https://paulebe525.github.io/hypertension-screening/
  Best: open the link once and INSTALL it as an app (see INSTALL AS AN APP below) – it
  then opens from the home screen and works fully offline.
  Also works by opening index.html directly from a folder (keep all files together);
  offline install/update features need the web link (https).
  Each phone/browser keeps its OWN data.

INSTALL AS AN APP (v1.3)
  Android (Chrome): open the link > tap "Install app" at the top of the Screen tab
    (or Records > data tools, or Chrome menu ⋮ > Install app / Add to Home screen).
  iPhone (Safari): open the link > tap Share (square with arrow) > Add to Home Screen > Add.
  The icon "BP Screening" appears on the home screen and opens full-screen.

TABS
  Screen     – "Entered by" (your name, asked once per phone, required) at the top; register
               person (village chosen from a list, consent required) + two BP readings + pulse + risk factors.
               Average BP and risk flag are shown live and after saving.
  Follow-up  – everyone flagged High / Urgent; editable recheck due date, add recheck
               reading, mark done / reopen. Filters: Pending, Overdue, Done, All.
  Dashboard  – totals, risk categories, breakdown by village, age group and sex,
               risk-factor prevalence. Toggle to include/exclude sample records.
  Records    – search, view, edit, delete records; Export CSV; Load/Remove sample data;
               Clear all data (with confirmation).

RISK FLAG (applied to the average of the two readings; exact average, e.g. 139.5 stays < 140)
  Urgent referral : SBP >= 180 or DBP >= 120   -> follow-up due same day (immediate referral)
  High            : SBP >= 140 or DBP >= 90    -> follow-up due in 7 days
  Elevated        : SBP 120-139 or DBP 80-89
  Normal          : SBP < 120 and DBP < 80
  The higher of the systolic/diastolic category is used.

VALIDATION
  Age 18-120 (whole years); SBP 60-300; DBP 30-200; SBP must exceed DBP; pulse 30-220;
  phone optional but must be 10 digits (+91 / leading 0 accepted); height 90-230 cm;
  weight 20-250 kg; waist 40-200 cm; screening date not in the future.
  BMI uses Asian-Indian cut-offs (<18.5, 18.5-22.9, 23-24.9, >=25);
  high waist = men >= 90 cm, women >= 80 cm.

DATA
  Stored in browser localStorage on the device (key: htnScreening.v1.records).
  Clearing browser data / uninstalling the browser deletes it – export CSV regularly.
  CSV is UTF-8 with BOM (Tamil text opens correctly in Excel).

GOOGLE SHEET SYNC (v1.1)
  All phones can send their records to one Google Sheet owned by the project lead.
  Setup: see SETUP-GOOGLE-SHEET.txt and apps-script/Code.gs (paste into the sheet's
  Extensions > Apps Script; set your own KEY; deploy as a Web app).
  On each phone: Records tab > Sync settings > Web App URL + secret key > Save >
  Test connection. Or open a setup link (Copy setup link) which fills them in.
  - Every save, edit and follow-up change is queued and sent automatically when online;
    queued records are retried on app start, when the internet returns, every minute,
    and with the "Sync now" button. Local data is never removed by sync.
  - Rows in the sheet are updated by record_id, so edits never create duplicates.
  - Columns = the CSV columns + synced_at + device_id (a random ID made once per phone).
  - Sample records are never sent. Deleting a record on a phone does NOT delete it
    from the sheet (delete the row in the sheet if needed).

ENTERED BY + VILLAGE LIST (v1.2)
  - Entered by: asked once per phone at the top of the Screen form (tap Change to switch
    person). Required for every new record; saved as entered_by (CSV + sheet). Edits and
    follow-up updates record the current name as updated_by. Old records keep a blank
    entered_by.
  - Village: chosen from a drop-down, never typed. Source of truth = the "Villages" tab of
    the Google Sheet (column A, header "Village"); the app downloads it on start, when
    internet returns and with Records > Village list > Refresh villages, and caches it for
    offline use. If no sheet list is available (sync not set up, or the tab is empty) the
    app uses the phone's "Local village list (fallback)", edited in the same card.
    If that is empty too, the built-in list is used: Gudimallur, Avarakarai, Maniyampattu.
    Precedence: sheet Villages tab (non-empty) > local list > built-in list.
    A newly created Villages tab starts with the same three names.
  - Old records with a free-text village keep it; when edited it is shown as
    "<name> (not in list)" and can be kept or changed to a listed village.

INSTALLABLE APP + OFFLINE MODE (v1.3, Progressive Web App)
  - manifest.json: name "BP Screening – Scudder", short name "BP Screening", opens
    full-screen (standalone, portrait), colours = app header (#0b5f8a). Icons in icons/
    (192, 512, maskable 512, apple-touch-icon 180, favicons).
  - sw.js (service worker): all app files are stored on the phone in a versioned cache
    (htn-shell-<version>) and served from there first, so the app opens with no internet,
    even after a reload or phone restart. Google Apps Script requests (sync, villages) are
    never cached – they always go to the network; the existing sync queue keeps records
    waiting until the phone is online.
  - A grey "Offline – records are saved on this phone" bar shows when there is no internet.
  - Install button (Android Chrome) / "Tap Share → Add to Home Screen" hint (iPhone Safari),
    English + Tamil; hidden once the app is installed; "Not now" hides it for 14 days.
  - Updates: when a new version is published, the app shows "New version available – tap
    to update" (EN + Tamil). Tapping it switches to the new version and reloads (asks
    first if a form is half-filled). Old caches are deleted. Records are never affected.
  - Publishing a new version: change VERSION in sw.js (and the ?v= numbers in index.html
    and the SHELL list in sw.js if app.js/styles.css changed).

LAYOUT FIXES (v1.3.1)
  - "4. Screening details": Screening date and "Screened by" are now full width, one below the
    other (on iPhone the date box used to overflow into the Screened by box).
  - All date boxes (screening date, follow-up due date, recheck date) are left-aligned and fit
    their space on iPhone and Android.
  - Side-by-side boxes (systolic/diastolic, height/weight, recheck readings) are always equal
    width and line up even when one label wraps (Tamil); "mmHg" moved next to "Reading 1/2".
  - Result and record details use a fixed label column; on very small phones (<360 px wide)
    each label sits above its value. Long names/villages wrap instead of overflowing.
  - Age box is full width like the other boxes; Tamil tab labels no longer break mid-word.
