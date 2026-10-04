Hypertension Screening – Version 1
Scudder College of Nursing, Ranipet (Digital Health)

HOW TO OPEN
  Open index.html in any modern browser (Chrome, Edge, Firefox, Safari) – no internet,
  no installation, no server needed. Keep index.html, app.js and styles.css together
  in the same folder.

  To use on many phones, it is easiest to host the folder on any static web host
  (e.g. GitHub Pages / college intranet) and open the link once; it then works offline
  as long as the page stays open/cached. Each phone/browser keeps its OWN data.

TABS
  Screen     – register person (consent required) + two BP readings + pulse + risk factors.
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
