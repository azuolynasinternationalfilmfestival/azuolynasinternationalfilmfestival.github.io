# Implementation Plan: Contrast Enhancement, Burger Drawer Unification, 2027 Email Theme & GitGuardian Protection

## 1. Objectives & User Requirements
1. **Brighten Green Accent (`style.css`)**:
   - The dark green (`#2D6352`) blends into the black background, causing low contrast and poor text readability.
   - Update `--accent-light` to a crisp, high-contrast emerald (`#34D399` / `#6EE7B7`) so headlines, subtitles, links, and badges are clearly legible on `#070908`.
2. **Unify Mobile Burger Drawer (`style.css`)**:
   - The mobile drawer currently has a teal gradient (`#0d2923` to `#071c18`) and greenish borders.
   - Update it to match the exact obsidian canvas: pure `#070908` background, hairline divider `rgba(255, 255, 255, 0.08)`, and dark drawer header matching the desktop aesthetic.
3. **Modernize Email Templates (`email-templates.js` & `server.js`)**:
   - Remove old festival theme references and establish the official 2027 theme:
     - Lithuanian: **„Mano pašaukimas“**
     - English: **"My Purpose"**
   - Standardize festival schedule:
     - Submission window: Lapkričio 1 d. – Kovo 26 d. (Nov 1 – March 26)
     - Gala ceremony & live stream: **2027 m. balandžio 23 d. (April 23, 2027)**
     - Location: Kauno tarptautinė gimnazija (Kaunas International Gymnasium)
   - Update email branding prefix to **"AISFF"**.
4. **GitGuardian Remediation & Submissions Security (`.gitignore`, `js/auth.js`, `js/stream-admin.js`, `data/`)**:
   - GitGuardian was sending security alerts due to hardcoded secrets and runtime submission files tracked in the repository:
     - Hardcoded plaintext password `Festivalis2026!` in `js/auth.js` -> remove hardcoded quick-login credentials.
     - Hardcoded 64-character high-entropy hex string in `js/stream-admin.js` -> replace with a clean placeholder.
     - Runtime submission files (`data/submissions.json`, `data/logs.json`) containing Firebase storage tokens (`token=UUID`) -> add `data/` runtime files to `.gitignore` and sanitize existing records so GitGuardian stops alerting.

---

## 2. Proposed Changes

### Task 1: Brighten Green Accent Tokens (`style.css`)
- In `:root`:
  - Set `--accent-light: #34D399;` (crisp emerald green with high contrast on dark obsidian).
  - Set `--accent-hover: #6EE7B7;` (light mint hover).
  - Set `--accent-emerald: #34D399;`.
  - Maintain subtle background container fill `--accent-color: #1A3E32;` so cards have depth while text is sharp and bright.
- Ensure any inline elements using dark green text inherit `--accent-light`.

### Task 2: Mobile Burger Drawer Black Canvas Alignment (`style.css`)
- In `.mobile-menu-drawer`:
  - Change background to `var(--bg-color)` (`#070908`).
  - Set `border-left: 1px solid rgba(255, 255, 255, 0.08)`.
  - Set `.drawer-header` background to `#070908` and border to hairline `rgba(255, 255, 255, 0.08)`.
  - Set `.drawer-nav-link` to match the obsidian background.
  - Set `.mobile-menu-backdrop` to `rgba(0, 0, 0, 0.8)` with backdrop-filter blur.

### Task 3: Email Templates 2027 Theme, Dates & AISFF Branding (`email-templates.js`)
- In `EMAIL_THEME`:
  - Add theme constants: `themeLt: "Mano pašaukimas"`, `themeEn: "My Purpose"`.
  - Add dates: `eventDateLt: "2027 m. balandžio 23 d."`, `eventDateEn: "April 23rd, 2027"`.
  - Add submission period: `submissionPeriodLt: "Lapkričio 1 d. – Kovo 26 d."`, `submissionPeriodEn: "November 1st – March 26th"`.
- In `emailTexts` (LT & EN):
  - Replace `Ąžuolynas Film Fest` subjects and headings with `AISFF`.
  - Explicitly include the 2027 theme („Mano pašaukimas“ / "My Purpose") in submission confirmation, acceptance, and finalist email copy.
  - Standardize gala date to April 23, 2027 across all notifications.

### Task 4: GitGuardian Remediation & Submissions Security
- In `.gitignore`:
  - Add `data/*.json` (and `data/submissions.json`, `data/logs.json`) so local runtime test submissions with live tokens and storage URLs are never tracked by Git.
- In `data/submissions.json`:
  - Sanitize existing records to remove high-entropy `&token=...` query parameters from `videoUrl`.
- In `js/auth.js`:
  - Remove hardcoded passwords (`Festivalis2026!`) from quick login buttons; instead prompt or prefill email only, prompting user for authentication securely without hardcoding credentials in source code.
- In `js/stream-admin.js`:
  - Replace the 64-character hardcoded fallback stream key with an empty string or config-derived value so GitGuardian regex scanners do not flag it as a leaked secret.

---

## 3. Verification & Testing
1. **GitGuardian Secret Scan**: Search entire repository with regexes for hardcoded passwords or high-entropy tokens to ensure 100% clean status.
2. **Automated Test Suite**: Run `npm test` to verify all 46 tests pass.
3. **Syntax & Static Linting**: Run `lint_applet` and `compile_applet`.
4. **Visual & UI Verification**:
   - Inspect green text against `#070908` background for contrast and legibility.
   - Open burger menu drawer on mobile view to confirm solid black background integration.
   - Verify rendered email templates for 2027 theme and dates.
