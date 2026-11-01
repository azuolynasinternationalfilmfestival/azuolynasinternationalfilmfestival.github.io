# Implementation Plan: 2027 Festival Submission Period & Event Dates Update

## 1. Overview & Verified Requirements
Update the official submission period and start date for the upcoming **2027 edition (7th Edition)** of the Ąžuolynas International Student Film Festival (AISFF):
- **Submissions Officially Open:** November 1, 2026 (*2026 m. lapkričio 1 d.*)
- **Final Submission Deadline:** April 5, 2027 (*2027 m. balandžio 5 d.*)
- **Festival Start & Gala Ceremony Date:** April 27, 2027 (*2027 m. balandžio 27 d.*)
- **Countdown Target:** Synchronized directly to the Submission Deadline (April 5, 2027 at 23:59:59).
- **Date Cards in Hero Section:** Distinct dedicated cards clearly distinguishing opening date (*2026 m. lapkričio 1 d.* / *November 1, 2026*) from final deadline (*2027 m. balandžio 5 d.* / *April 5, 2027*) and event date (*2027 m. balandžio 27 d.* / *April 27, 2027*).
- **Scope Guardrail:** Strictly update 2027 edition information. Never touch or alter dates, archives, or awards from previous festival editions (2026, 2025, 2024, etc.).

---

## 2. Proposed Changes & Affected Files

### A. Countdown Timer (`js/countdown.js`)
- Update `getSubmissionDeadline()` calculation to target **April 5, 2027, 23:59:59** (`new Date(2027, 3, 5, 23, 59, 59)`).
- Update countdown sublabel strings in both Lithuanian and English.

### B. Public Index Pages (`lt/index.html` & `en/index.html`)
- **HTML Meta & OpenGraph / Twitter Cards:**
  - Update descriptions to reflect the open window (Nov 1, 2026 – Apr 5, 2027) and gala/stream date (April 27, 2027).
- **Hero Editorial Meta Grid:**
  - `dynOpening`: `2026 m. lapkričio 1 d.` (LT) / `November 1, 2026` (EN).
  - `dynDeadline`: `2027 m. balandžio 5 d.` (LT) / `April 5, 2027` (EN).
  - `dynEvent`: `2027 m. balandžio 27 d.` (LT) / `April 27, 2027` (EN).
  - `dynDates`: `Nuo 2026 m. lapkričio 1 d. iki 2027 m. balandžio 5 d.` / `November 1, 2026 – April 5, 2027`.
- **Countdown Banner:**
  - Sublabel: `Pateikite savo filmą iki 2027 m. balandžio 5 d. 23:59` / `Submit your entry before April 5, 2027 23:59`.
- **2027 Edition Card:**
  - Date label: `2027 m. balandžio 27 d.` / `April 27, 2027`.
- **Stream Replay Placeholder & FAQ Beside Form:**
  - Update placeholder text to `2027 m. balandžio 27 d.` / `April 27, 2027`.
- **Footer Section:**
  - Update submission period line to `Lapkričio 1 d. – Balandžio 5 d.` / `November 1, 2026 – April 5, 2027` and festival event line to `2027 m. balandžio 27 d.` / `April 27, 2027`.
- **Client Fallback Defaults (`DEFAULT_CONTENT`):**
  - Update `openingDate`, `deadlineDate`, `dateEvent`, `datesSubmissions`, and `recordingPlaceholder` for both LT and EN.

### C. 2027 Dedicated Subpages (`azuolynas-fest-2027.html`, `lt/azuolynas-fest-2027.html`, `en/azuolynas-fest-2027.html`)
- Update meta tags, hero dates, submission deadlines (April 5, 2027), and event dates (April 27, 2027) across all three 2027 pages.

### D. Server Configuration & Email System (`server.js` & `email-templates.js`)
- **`server.js`:**
  - Update `DEFAULT_SETTINGS` 2027 dates for `lt` and `en`:
    - `openingDate`: `"2026 m. lapkričio 1 d."` / `"November 1, 2026"`
    - `deadlineDate`: `"2027 m. balandžio 5 d."` / `"April 5, 2027"`
    - `eventDate`: `"2027 m. balandžio 27 d."` / `"April 27, 2027"`
    - `datesSubmissions`: `"Nuo 2026 m. lapkričio 1 d. iki 2027 m. balandžio 5 d."` / `"November 1, 2026 – April 5, 2027"`
    - `dateEvent`: `"2027 m. balandžio 27 d. (Kino festivalis ir tiesioginė transliacija)"` / `"April 27th, 2027 (Film Festival & Live Stream)"`
    - `recordingPlaceholder`: referencing April 27, 2027.
  - Update live stream pass email notification dates to `2027 m. balandžio 27 d.`
- **`email-templates.js`:**
  - Update `EMAIL_THEME`:
    - `eventDateLt`: `"2027 m. balandžio 27 d."`
    - `eventDateEn`: `"April 27th, 2027"`
    - `submissionPeriodLt`: `"2026 m. lapkričio 1 d. – 2027 m. balandžio 5 d."`
    - `submissionPeriodEn`: `"November 1st, 2026 – April 5th, 2027"`
  - Update all email template bodies and notes mentioning the ceremony date to April 27, 2027.

### E. Data Files (`data/editions.json` & `data/settings.json`)
- In `data/editions.json` (2027 entry only):
  - `date`: `"2027 m. balandžio 27 d."`
  - `dateEn`: `"April 27, 2027"`
  - `submissionDeadline`: `"2027-04-05"`
  - `subtitle` & `story` updated to specify April 5, 2027 deadline and April 27, 2027 gala.
  - Keep 2026, 2025, and earlier editions untouched.
- In `data/settings.json`:
  - Update 2027 opening, deadline, and event dates in both `lt` and `en` blocks.
- In `.gitignore`:
  - Ensure `data/settings.json` is added to gitignore to keep SMTP credentials protected from GitGuardian.

---

## 3. Verification & Validation Plan
1. **Automated Regression Suite:** Run `npm test` to ensure all 46 test suites pass without regression.
2. **Static & Lint Check:** Run `lint_applet` (`npm run lint`) to confirm clean imports and syntax.
3. **Applet Compilation:** Run `compile_applet` to confirm successful build.
4. **Countdown Calculation Check:** Verify in browser/node that `js/countdown.js` correctly computes time remaining until April 5, 2027.
5. **Historical Integrity Check:** Verify that 2026 and earlier editions remain completely unchanged.
