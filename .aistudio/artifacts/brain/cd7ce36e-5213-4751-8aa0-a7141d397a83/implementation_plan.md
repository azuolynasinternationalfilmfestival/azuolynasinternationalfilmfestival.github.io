# ASIFF Film Festival: Live Streaming, Classroom Tokens, Settings Persistence & Real Diagnostics

Comprehensive implementation plan to resolve mobile/desktop layout overlaps on `live.html`, introduce Teacher/Classroom multi-device access tokens with QR codes and CSV export, fix Firestore admin settings saving, and rebuild the admin Diagnostics suite into an authentic GitHub Pages + Firebase + Cloudflare verification tool.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during requirements alignment:
> 
> - **Classroom Device Capacity**: Default to **35 concurrent devices** per classroom token (configurable from 1 to 100 or unlimited during the festival time window).
> - **Stream Token Validator Architecture**: Use `/api/stream/validate-token` with configurable Cloudflare Worker URL fallback. Zero private keys in client files.
> - **Token QR & Quick Access**: Interactive modal containing a large printable QR code, copyable `live.html?t=CODE` link, and instant URL stripping via `history.replaceState`.
> - **Settings Persistence Strategy**: Primary write is directed to Firestore (`settings/festival` and `settings/global`) to guarantee persistence on static GitHub Pages, with raw `error.code` surfaced in admin toasts.
> - **Diagnostics Suite Scope**: Purged legacy server metrics (PHP, Nginx, Linux file permissions, memory heap) in favor of real tests for Firebase Auth, Firestore CRUD, Storage upload, Email queue, Cloudflare Worker signed streams, and Voting rules.

---

## 1. Overview & Core Concept

The Ąžuolynas International Students Film Festival (ASIFF) is hosted statically on GitHub Pages with Firestore persistence and Cloudflare Stream playback. This update ensures:
1. **Flawless Viewer Experience**: Clean, non-overlapping header and toolbar on `live.html` across all device viewports (360px mobile to 4K desktop), with unified real-time stream status and auto-reconnecting video playback.
2. **Teacher & Classroom Accessibility**: Specialized multi-device tokens enabling teachers to stream the festival in classrooms and auditoriums without individual student registrations, supported by bulk creation, QR codes, and CSV exports.
3. **Reliable Festival Control**: Guaranteed admin settings persistence for section visibility and archive controls, eliminating failures caused by missing server routes.
4. **Authentic System Diagnostics**: An independent, modular test runner in the admin panel verifying every cloud service the festival relies on.

---

## 2. User Experience & Visual Design

### `live.html` Layout & Responsive Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] Ąžuolynas Film Fest Ceremonija (Kauno Tarptautinė Gimnazija)    │  Row 1: Festival Branding
├────────────────────────────────────────────────────────────────────────┤
│ [ LT | EN ]                [ Classroom 302 (35 Devices) ]  [ Log out ] │  Row 2: Action Toolbar
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                                                                        │
│                 16:9 Responsive Cloudflare Live Player                 │  Row 3: Video Stage
│               [ Offline / Starting / Live Auto-Detector ]              │  (Zero Overlap)
│                                                                        │
│ [ ⛶ Fullscreen ]                                                       │
├────────────────────────────────────────────────────────────────────────┤
│ ● Tiesioginis eteris aktyvus / Live broadcast      [ Žiūrovų Balsavimas → ]│  Row 4: Status & Action
└────────────────────────────────────────────────────────────────────────┘
```

- **Top Row (Branding)**: Festival laurel logo, official title, and subtitle, centered on mobile and left-aligned on desktop.
- **Toolbar Row (Controls)**:
  - Left: Compact `LT | EN` language toggle.
  - Right: Viewer/Classroom badge (displaying teacher name/class and concurrent devices) and red "Log out" button.
  - Wrapped cleanly using CSS flexbox with `gap: 10px` so controls never collide or overlay the video container at 360px, 390px, or in landscape mode.
- **16:9 Video Stage**: Dedicated aspect-ratio wrapper with rounded corners and gold border accents.
- **Unified Real-Time Status**: Eliminates contradictory messages. A single status badge evaluates stream connectivity:
  - `Offline` (Red/Yellow): *"Transliacija dar neprasidėjo / Broadcast has not started yet"*
  - `Starting` (Yellow): *"Signalas ruošiamas... / Signal connecting..."*
  - `Live` (Green): *"Tiesioginis eteris aktyvus / Live broadcast in progress"*
- **Fullscreen & Auto-Retry**: Built-in fullscreen trigger and an automatic 5-second polling retry if the live broadcast temporarily drops.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Teacher / Classroom Multi-Device Tokens
- **Challenge**: The ceremony hall has limited physical seating. Teachers need to broadcast the ceremony across classrooms and computer labs.
- **Approach**:
  - Store token documents in Firestore collection `/stream_tokens/{tokenHash}` and `/live_viewers/{token}`.
  - Fields: `tokenType: "classroom" | "individual"`, `maxConcurrentDevices: 35`, `activeConnections: 0`, `label: "Mokytoja Rasa - 11B kabinetas"`, `validFrom`, `expiresAt`, `isActive: true`.
  - Admin UI includes:
    1. Single token generator (specifying type, device limit, label, expiration).
    2. Bulk generator: Paste multiple lines (e.g. `Jonas Kazlauskas - 11A - Kab 204\nRasa Petraitiene - 10B - Aktų salė`), auto-generating unique tokens.
    3. One-click CSV export: `Label, Token, DirectLink, MaxDevices, ValidUntil`.
    4. QR Code & Access Link Modal: Displays a high-resolution printable QR code and one-click copyable link (`https://site/live.html?t=asiff_live_...`).
  - Safe Link Consumption: `live.html` detects `?t=CODE`, executes verification, immediately removes the token from the browser history via `window.history.replaceState({}, document.title, window.location.pathname)`, and enforces `<meta name="referrer" content="no-referrer">` to prevent token leakage.

### 2. Admin Visibility Settings Root Cause & Persistence Fix
- **Root Cause Identified**:
  - `js/settings.js` functions `updateGlobalTumbler()` and `saveSettings()` were structured with `fetch("/api/admin/settings")` as the **primary** blocking call. On static GitHub Pages hosting, this POST route does not exist and throws `404 Not Found` / `"Nepavyko išsaugoti serverio nustatymo"`, aborting before reaching the Firestore fallback!
  - In addition, toggles updated `settings/festival`, while some voting components read `settings/global`.
- **Solution**:
  - Make direct Firestore write `db.collection("settings").doc("festival").set(payload, { merge: true })` the **primary** operation.
  - Mirror to `settings/global` to ensure synchronicity with the voting engine.
  - Surface the exact raw Firebase error code in the toast (e.g., `[permission-denied] Admin auth required: azuolynasfilmfestival@gmail.com`).
  - Verify `lt/index.html` and `en/index.html` snapshot listeners apply visibility toggles in real time to `#about`, `#rules`, `#faq`, `#categories`, `#archive`, and `#screening`.

### 3. Real "System Check" Diagnostics Suite
- **Legacy Cleanup**: Remove all references to Nginx, Node process memory, Linux permissions `0775`, PHP directives, and fake error log viewers.
- **Authentic Modular Test Runner**:
  1. **Firebase Auth Test**: Verifies active session, checks currentUser email against admin allow-list (`azuolynasfilmfestival@gmail.com`, `karina.brdar@gmail.com`).
  2. **Firestore Collections CRUD**: Sequentially writes, reads, and deletes a temporary probe document (`_diag_probe`) in `settings`, `submissions`, `votes`, `stream_tokens`, and `editions`.
  3. **Storage Upload Test**: Uploads a 1-pixel probe blob to `/uploads/diag_test.png` and immediately removes it.
  4. **Email Queue Test**: Verifies write permissions on `/mail` trigger queue.
  5. **Cloudflare Worker Signed Token Test**: Calls the Worker endpoint with a valid probe token and verifies receipt of a signed playback URL; verifies rejection of an invalid token.
  6. **Voting Counters & Security Rules Test**: Simulates atomic batch rule validation.
  7. **Public Page Listeners Test**: Validates that settings listeners on `settings/festival` respond within 500ms.
- **Resilient Execution**: Every test runs inside its own isolated `try/catch`. One failure will never abort subsequent tests. Each test displays a crisp `PASS` or `FAIL` badge, latency in milliseconds, exact raw error messages, and a "Copy Diagnostic Report" button.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Management Panel                          │
│   ┌────────────────────┐ ┌────────────────────┐ ┌───────────────────┐  │
│   │ Visibility Toggles │ │ Classroom Tokens   │ │ System Check      │  │
│   │ (Settings Tab)     │ │ (Stream Tab)       │ │ (Diagnostics Tab) │  │
│   └─────────┬──────────┘ └─────────┬──────────┘ └─────────┬─────────┘  │
└─────────────┼──────────────────────┼──────────────────────┼────────────┘
              │                      │                      │
              │ Primary Firestore    │ Hashed Token Sync    │ Probe Tests
              ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Google Cloud Firestore Database                      │
│                                                                        │
│  /settings/festival          /stream_tokens/{tokenHash}                │
│    - showAbout: bool           - tokenType: "classroom"                │
│    - showArchive: bool         - maxConcurrentDevices: 35              │
│    - showVoting: bool          - activeDevices: int                    │
│    - archiveVisibility: bool   - label: "11B - Sala 3"                 │
│                                - expiresAt: timestamp                  │
│                                                                        │
│  /submissions/{filmId}       /votes/{nominationId}_{uid}               │
│    - inVoting: bool            - userId: uid                           │
│    - votesCount: int           - filmId: id                            │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Cloudflare Stream & Public Viewers                    │
│                                                                        │
│  live.html (Mobile/Desktop)             Public Pages                   │
│   - history.replaceState (no leak)        - lt/index.html              │
│   - Dual-row responsive toolbar           - en/index.html              │
│   - Unified stream state detector         - Real-time onSnapshot sync  │
│   - Auto-reconnecting stream player                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Entity Schema Additions

#### `stream_tokens/{tokenHash}`
```typescript
interface StreamTokenDoc {
  tokenHash: string;            // SHA-256 of the plain token
  tokenType: "individual" | "classroom";
  label: string;                // e.g. "Mokytoja Rasa - 11B kabinetas"
  maxConcurrentDevices: number; // default 35 for classroom, 1 for individual
  activeDevices: number;        // current live connections
  currentUses: number;          // cumulative access count
  isActive: boolean;
  validFrom: string;            // ISO Date or timestamp
  expiresAt: string;            // ISO Date or timestamp
  createdBy: string;            // admin email
  createdAt: string;
}
```

---

## 5. Execution Steps

1. **Rebuild `live.html` Layout & Connectivity**:
   - Separate header into Branding Row and compact Controls Toolbar (`flex-wrap`, no overlap at 360px/390px).
   - Unify stream status into a single state indicator (Offline, Connecting, Live).
   - Implement fullscreen toggle button and automatic 5-second polling recovery.
   - Support `?t=CODE` URL parameters with automatic validation and `history.replaceState` cleanup.

2. **Implement Classroom Tokens in Admin & Worker**:
   - Update `stream-admin.js` with Classroom token options (device limit 1–100, label, expiration).
   - Add QR code modal generator using client-side SVG/Canvas rendering.
   - Add bulk token creation parser and CSV export.
   - Synchronize with `/stream_tokens` and `/live_viewers` collections.

3. **Fix Settings Persistence & Error Reporting (`js/settings.js`)**:
   - Switch primary saving order: execute Firestore write `db.collection("settings").doc("festival").set()` first.
   - Surface exact Firebase `error.code` in toast notifications.
   - Ensure `lt/index.html` and `en/index.html` real-time listeners react immediately to visibility toggles.

4. **Reconstruct Diagnostics Suite (`js/diagnostics.js` & `admin.html`)**:
   - Strip fake server/OS indicators from `admin.html`.
   - Implement 7 independent modular tests (Firebase Auth, Firestore CRUD, Storage, Email queue, Cloudflare Worker, Voting counters, Public listeners).
   - Add PASS/FAIL status indicators, latency tracking, raw error traces, and report copying.

5. **Security Rules Verification & Testing**:
   - Verify Firestore security rules permit classroom token writes and settings updates by superadmins.
   - Run `node scripts/check-static.mjs`, `npm test`, and `compile_applet`.
   - Provide test verification checklist.
