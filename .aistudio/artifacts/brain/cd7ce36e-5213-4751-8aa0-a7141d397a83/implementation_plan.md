# Comprehensive Festival Platform Master Implementation Plan

This master plan details the concrete implementation across all core pillars: public real-time voting (`voting.html`), token-gated live streaming (`live.html`), broadcast graphics export (H2H Graphic) & "Now Playing" display, global on-screen error diagnostics, security audit and GitGuardian-style secret isolation, registration form/upload/email hardening, and admin statistics with legacy Tasks cleanup.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core architectural rules and decisions are established based on your explicit requirements:
> - **Flat File Placement for All New Files**: Every newly created file (`voting.html`, `voting-client.js`, `error-reporting.js`, `now-playing.js`, `h2h-export.js`, `stream-worker.js`) will reside strictly in the repository root (`/`), with no new subdirectories. Existing files in `js/`, `lt/`, and `en/` will be preserved and linked cleanly without breaking static hosting or tooling.
> - **Instagram Floating Button Preserved**: The floating Instagram button on public pages will NOT be removed and remains intact.
> - **Gated live.html Zero-Exposure**: Before a valid token is verified, `live.html` renders strictly a standalone, distraction-free token gate. No iframe, no Cloudflare Stream URLs, no titles, and no stream metadata exist in the initial DOM or page source.
> - **Voting Integrity (Firestore Rules & Anonymous Auth)**: Enforces 1 vote per person per nomination using Firebase Anonymous Auth IDs combined with Firestore Security Rules, accompanied by real-time animated percentage bars and CSV export for admins.
> - **Serverless Token Protection**: Generates hashed tokens in Firestore with expiration and use limits, validated server-side (Firebase Cloud Function / Cloudflare Worker) to mint signed Cloudflare Stream playback tokens.

---

### 1. Repository Structure & Flat File Audit

#### Existing Directory Analysis
- **Root (`/`)**: Core HTML entry points (`index.html`, `admin.html`, `live.html`, `faq.html`, `privacy.html`, `terms.html`), styles (`style.css`, `live.css`), configuration (`config.js`, `email-templates.js`), rules (`firestore.rules`, `storage.rules`), and server runtime (`server.js`).
- **Subdirectories**: `js/` (admin and legacy modules), `lt/` & `en/` (localized festival editions), `data/` (local JSON store for Node dev server), `tests/` (Jest/Node test suites), `scripts/` (`check-static.mjs`).
- **Subfolder Compatibility with Tooling & GitHub Pages**: GitHub Pages natively supports static assets in subfolders (`/js/...`, `/lt/...`). However, to guarantee your GitHub tooling compatibility, **all new files will be created flat in the root directory**. Any edits to existing files in `js/` will be minimal, safe, and backwards-compatible.

---

### 2. Task-by-Task Implementation Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 System Architecture                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────┐   ┌─────────────┐    ┌───────────────┐   ┌──────────────┐   ┌───────────────┐
│ voting.html │   │  live.html  │    │  admin.html   │   │ Global Error │   │ Public Site   │
│ (New Flat)  │   │(Gated Auth) │    │(Exporters/    │   │   Reporter   │   │  (Now Playing │
│ - Anon Auth │   │- No initial │    │ Dashboard)    │   │(error-report │   │ & Submissions)│
│ - Live snap │   │  stream DOM │    │- H2H Graphic  │   │   .js flat)  │   │               │
│ - Bar charts│   │- Cloudflare │    │- Voting stats │   │- Screen box  │   │               │
│ - 1-vote/nom│   │  Worker val │    │- Deprec Tasks │   │- Copy btn    │   │               │
└─────────────┘   └─────────────┘    └───────────────┘   └──────────────┘   └───────────────┘
```

#### Task 1: Real-Time Public Voting System (`voting.html` & `voting-client.js`)
- **New Flat Files**:
  - `voting.html`: Complete, standalone festival-styled voting page in the repository root. Includes festival header/navigation, language toggle, hero banner, nomination category tabs, dynamic film cards with posters/synopses, interactive voting triggers, and animated post-vote live result bars.
  - `voting-client.js`: Root-level client script initializing Firebase Anonymous Auth (`signInAnonymously`), real-time Firestore listener on `submissions` (where `inVoting == true`) and `votes`, vote submission with duplicate prevention, and local cookie/storage caching.
- **Navigation Integration**: Add "Balsavimas / Voting" link in headers and burger menus across `index.html`, `lt/index.html`, `en/index.html`, `live.html`, and `admin.html`.
- **Voting Logic & Security Rules**:
  - Each vote doc stored in `/votes/{nominationId}_{userId}` ensuring atomic duplicate denial.
  - Admin toggle `votingOpen` stored in `/settings/global` listened to in real-time.
  - If voting is closed, voting cards display a graceful "Balsavimas uždarytas" indicator.
  - Upon submitting a vote: user sees an animated success confirmation, followed by immediate reveal of all films' vote counts, percentages, and progress bars.
- **Admin-Side Voting Statistics & CSV Export**:
  - Update `js/voting-analytics.js` and `admin.html` with real-time tally per nomination, total votes counter, voter distribution timeline, and a one-click "Eksportuoti CSV" button generating clean, RFC-4180 compliant CSV files.

#### Task 2: Gated Live Streaming & Token System (`live.html` & `stream-worker.js`)
- **Zero-Exposure Gating on `live.html`**:
  - Before validation, the DOM displays **only** a branded, centered access card: festival badge, token input field, submit button, and status container.
  - No iframe tag, no Cloudflare Stream URLs, no video IDs, and no schedule containers exist in the initial HTML or DOM.
  - The player container is dynamically constructed and injected into the DOM **only** after the serverless validator returns a valid playback token.
- **Serverless Token Validator (`stream-worker.js`)**:
  - A standalone Cloudflare Worker / Firebase Function script placed in the root for easy deployment.
  - Validates submitted token hash against Firestore `/stream_tokens/{tokenHash}`:
    - Checks `isActive !== false`, `expiresAt > now`, and `currentUses < maxUses`.
    - Increments `currentUses` atomically in Firestore.
    - Generates short-lived signed Cloudflare Stream URL (using Cloudflare Stream signing key ID and PEM secret).
  - Returns JSON `{ success: true, playbackUrl: "..." }` or error `{ error: "expired" | "revoked" | "max_uses_reached" | "invalid" }`.
- **Admin Token Generator**:
  - In `js/stream-admin.js` and `admin.html`: form with Token Label/Attendee Name, Expiry Date picker, Max Uses input, and "Generuoti Žetoną" button.
  - Generates secure random 16-character alphanumeric token, computes SHA-256 hash for Firestore storage, and presents the unhashed token once to the admin to copy.
  - Token table shows Label, Created Date, Expiry, Uses (`used / max`), Status (Aktyvus / Atšauktas), and a "Atšaukti (Revoke)" toggle button.
- **Player Resilience**:
  - Responsive 16:9 player wrapper with `allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen`.
  - Fallback offline card if stream is not currently broadcasting: "Transliacija netrukus prasidės" with live countdown to ceremony time.

#### Task 3: Graphics Export for Broadcast (H2H Graphic) & "Now Playing" Display
- **"Now Playing" Live Controller in Admin**:
  - In `admin.html`: add dedicated "Transliacijos Grafika & H2H" control section.
  - Dropdown selector for "Dabar rodomas filmas (Now Playing)" and "Sekantis filmas (Next Up)", saved to Firestore document `/settings/broadcast_overlay`.
  - Checkbox for "Rodyti viešai svetainėje (Display on public website)".
- **Public Site Display (`now-playing.js`)**:
  - Root-level lightweight script `now-playing.js` included on `index.html` and `live.html`.
  - Renders a sleek floating/hero badge "Dabar eteryje: [Filmo Pavadinimas] · Rež. [Vardas]" with real-time Firestore synchronization.
- **H2H Graphic Export Generator (`h2h-export.js`)**:
  - Placed in repository root.
  - Generates downloadable `asiff-graphics-data.json` and `asiff-graphics-data.csv` formatted specifically for broadcast graphic overlays (Lower Thirds, Nomination Boards, Next-Up Crawls).
  - Exposes REST endpoint `/api/broadcast/overlay` on `server.js` returning clean JSON for external graphics software polling.

#### Task 4: Global On-Screen Error Box & Admin Diagnostics Resolution
- **Global Error Reporter (`error-reporting.js`)**:
  - Standalone script in root loaded across all pages (`index.html`, `admin.html`, `live.html`, `voting.html`).
  - Hooks `window.onerror` and `window.addEventListener("unhandledrejection")`.
  - Wraps network fetch and Firestore calls with contextual telemetry.
  - When an error occurs: displays a non-intrusive floating alert card in the bottom-left corner with:
    - Failed Action (e.g., `Firestore Read: submissions`)
    - Exact Error Code/Message (e.g., `permission-denied`, `Failed to fetch`)
    - Source File & Function Name
    - Timestamp (ISO + Local)
    - "Kopijuoti klaidą (Copy error details)" button copying JSON diagnostic report to clipboard.
- **Admin Diagnostics & Connection Bug Fixes**:
  - In `js/diagnostics.js` and `server.js`: resolve race conditions where Firestore snapshot listener fails before auth state resolves.
  - Fix test suite and mock endpoints so all diagnostic tiles (Firestore RW, Auth state, Storage upload, Email service, Stream tokens) report accurate live health.
  - Store and display an in-memory & session log of the last 50 error events with stack traces.

#### Task 5: Security & Secrets Audit (GitGuardian-Style)
- **Repo-Wide Secrets Scan**:
  - Audit all files and commit history for exposed API keys, private keys, service accounts, and tokens.
  - Extract any hardcoded secrets into environment variables (`.env`).
  - Provide a clean `.env.example` and update `.gitignore` to prevent any credentials or local configs from leaking.
  - Produce a clear **Key Rotation Checklist** detailing any keys previously committed so you can rotate them immediately.
- **Hardened Rules**:
  - `firestore.rules`: Enforce strict read/write permissions (anonymous users can only read accepted films and create 1 vote doc; authenticated admins can write; tokens read-only via validator).
  - `storage.rules`: Limit upload file size (max 500MB for film videos, max 10MB for posters/presskits) and restrict MIME types (`video/mp4`, `video/webm`, `image/jpeg`, `image/png`, `application/pdf`).

#### Task 6: Submission Form, File Upload & Branded HTML Emails
- **Form & Upload Validation**:
  - Validate all fields in `lt/index.html` and `en/index.html` (title, director, email, phone, category, synopsis, runtime, attendance type).
  - Progress bar indicator during poster and film file upload to Firebase Storage / Cloudflare.
- **Branded HTML Emails (`email-templates.js`)**:
  - **Submitter Confirmation Email**: Festival visual identity (deep emerald `#081B17`, gold accents `#D4AF37`, festival typography), complete submission summary (film title, director, category, attendance preference, unique submission ID), and next steps.
  - **Admin Notification Email**: Clean notification sent to `azuolynasfilmfestival@gmail.com` with direct review link to admin panel and file attachments/links.
  - Robust error handling if mail server is unreachable, displaying clear retry guidance without losing form input state.

#### Task 7: Tasks Section Removal & Submission Statistics
- **Tasks Deprecation**:
  - Remove `#tabTasksBtn` from `admin.html`.
  - Remove `#tasksTab` HTML from `admin.html`.
  - Remove `initTasks` and `loadTasks` from `js/admin-main.js` and remove `js/tasks.js` references.
- **Dedicated Admin Dashboard Tab**:
  - Add `#tabDashboardBtn` and `#dashboardTab` in `admin.html` with Category distribution bars, Attendance SVG donut chart, and Countries leaderboard.

---

### 3. File Modification & Creation Inventory

| File Path (Root Flat) | Operation | Concrete Changes |
| :--- | :--- | :--- |
| `voting.html` | **Create (Root)** | Standalone public voting page with real-time film listener, nomination cards, and live results. |
| `voting-client.js` | **Create (Root)** | Anonymous auth, Firestore voting listener, duplicate denial, animated bar rendering. |
| `error-reporting.js` | **Create (Root)** | Global unhandled rejection & window.onerror dialog with copyable error details. |
| `now-playing.js` | **Create (Root)** | Public "Now Playing" floating banner and ceremony stream sync. |
| `h2h-export.js` | **Create (Root)** | Generator for H2H Graphic broadcast JSON/CSV data and API bindings. |
| `stream-worker.js` | **Create (Root)** | Serverless token validator with SHA-256 hash check and signed stream URL minting. |
| `live.html` | **Modify (Root)** | Remove pre-rendered player and URLs; render strict token gate; dynamic player mounting upon valid token. |
| `admin.html` | **Modify (Root)** | Remove Tasks tab; add Dashboard tab; add H2H Graphics export panel; add Token Manager with hashed tokens; update voting analytics. |
| `firestore.rules` | **Modify (Root)** | Rules for `/votes`, `/stream_tokens`, `/settings`, and admin role enforcement. |
| `storage.rules` | **Modify (Root)** | Hardened file size and MIME type upload validation. |
| `.env.example` | **Create (Root)** | Clean environment variable template for secrets. |
| `.gitignore` | **Modify (Root)** | Strict exclusions for `.env`, credentials, service accounts, and secret configs. |
| `email-templates.js` | **Modify (Root)** | Premium branded HTML confirmation emails for submitter and admin. |
| `server.js` | **Modify (Root)** | Add `/api/broadcast/overlay` endpoint, token hashing verification, and diagnostic endpoints. |
| `js/admin-main.js` | **Modify (js/)** | Remove tasks module references; register new dashboard and graphics handlers. |

---

### 4. Step-by-Step Execution Sequence

1. **Phase 1: Security Scan & Environment Cleanup**
   - Perform repository grep scan for hardcoded tokens, passwords, and service keys.
   - Configure `.env.example` and update `.gitignore`.
   - Update `firestore.rules` and `storage.rules` with strict access control.
2. **Phase 2: Global Error Reporter**
   - Create `error-reporting.js` in root and link it in the `<head>` of all HTML pages.
   - Verify that caught and uncaught errors trigger the modal with full diagnostic info and copy button.
3. **Phase 3: Gated Live Streaming & Token System**
   - Refactor `live.html` to guarantee zero stream exposure prior to token submission.
   - Create `stream-worker.js` in root with hashed token validation logic.
   - Update admin stream manager in `admin.html` and `js/stream-admin.js` for hashed token creation, expiry, max uses, and revocation.
4. **Phase 4: Public Voting System & Admin Voting Stats**
   - Create `voting.html` and `voting-client.js` in root.
   - Add "Balsavimas" link to all page navigation bars.
   - Implement real-time Firestore film listener and anonymous auth voting.
   - Update admin voting analytics with CSV export.
5. **Phase 5: Broadcast Graphics Export (H2H Graphic) & Now Playing**
   - Create `h2h-export.js` and `now-playing.js` in root.
   - Add admin Now Playing selector and JSON/CSV export triggers in `admin.html`.
   - Mount Now Playing banner on public pages.
6. **Phase 6: Submission Form & Email Hardening**
   - Verify upload progress feedback and MIME/size limits on submission forms.
   - Upgrade `email-templates.js` with responsive, branded HTML templates for both submitter and jury admin.
7. **Phase 7: Tasks Deprecation & Admin Dashboard**
   - Remove Tasks tab and code references from `admin.html` and `js/admin-main.js`.
   - Add dedicated Dashboard tab in `admin.html` with category bars, attendance donut chart, and country rankings.
8. **Phase 8: Comprehensive Testing & Verification**
   - Execute `node scripts/check-static.mjs`, `npm test`, and `compile_applet`.
   - Test every flow in browser preview and generate final audit report with key rotation and setup instructions.
