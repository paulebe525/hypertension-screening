Hypertension Screening – Version 1.2.1 (Google Sheet sync, Entered by, village list)
Scudder College of Nursing, Ranipet (Digital Health)

HOW TO OPEN
  Open index.html in any modern browser (Chrome, Edge, Firefox, Safari) – no internet,
  no installation, no server needed. Keep index.html, app.js and styles.css together
  in the same folder.

  To use on many phones, it is easiest to host the folder on any static web host
  (e.g. GitHub Pages / college intranet) and open the link once; it then works offline
  as long as the page stays open/cached. Each phone/browser keeps its OWN data.

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
