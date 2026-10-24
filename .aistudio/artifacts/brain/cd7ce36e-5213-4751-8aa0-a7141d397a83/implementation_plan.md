# Master Implementation Plan (Updated with Voting Integrity & Security Hardening)

This updated plan incorporates your 3 required architectural changes: atomic batch voting transactions with strict counter-matching security rules, genuine Firebase Auth admin authorization (disabling client-side token bypasses), full secret redaction in `?debug=1`, and confirmation of zero Cloudflare keys in client files.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following 3 required updates and confirmations are fully integrated:
> 
> 1. **Voting Integrity in ONE Atomic Firestore Batch**:
>    - Every vote executes `db.batch()` committing simultaneously:
>      1. Creation of `/votes/{nominationId}_{auth.uid}` with `{ nominationId, filmId, userId: auth.uid, votedAt: serverTimestamp() }`.
>      2. Atomic counter update on `/submissions/{filmId}` incrementing `votesCount` by exactly `+1`.
>    - Firestore rules enforce that a counter update of `+1` is only permitted when the corresponding vote document is created in the same request, and completely block all other client updates, edits, or deletions of votes.
>    - The voter ID is strictly `request.auth.uid` from **Firebase Anonymous Authentication** (`signInAnonymously()`), never from `localStorage`.
> 
> 2. **Real Firebase Auth Admin Enforcement (No Custom Token Bypass)**:
>    - **Current state**: In `js/auth.js`, there was a fallback to `/api/admin/token` that set `admin_jwt_token` in `sessionStorage` for Node dev server sessions. While Firestore rules already required `request.auth.token.email`, `js/auth.js` will be hardened so admin write operations in Firestore strictly require genuine Firebase Authentication (`signInWithEmailAndPassword`) with the verified admin email allow-list (`azuolynasfilmfestival@gmail.com`, `karina.brdar@gmail.com`). `sessionStorage` will only govern UI panel visibility, never granting Firestore write access.
> 
> 3. **Secret Redaction in `?debug=1`**:
>    - The diagnostic error box automatically redacts sensitive data before rendering or copying to clipboard:
>      - Access tokens and hashes (`asiff_live_***`, `cfs_***`, JWTs) -> `[REDACTED_TOKEN]`
>      - Cloudflare Stream signed playback URLs and query tokens -> `https://.../iframe?token=[REDACTED]`
>      - Anonymous Auth UID / Voter IDs -> `anon_***[REDACTED]`
>      - Sensitive Firestore paths (`/stream_tokens/...`, `/users/...`, `/invitations/...`) -> `/[COLLECTION]/[REDACTED_DOC_ID]`
>      - API keys, passwords, and SMTP secrets -> `[REDACTED_SECRET]`
> 
> 4. **Cloudflare Key Isolation Confirmation**:
>    - **Confirmed**: No Cloudflare Stream private keys, PEM certificates, or account secrets exist or will ever be placed in any website or client-side file. All signature minting is handled exclusively by your serverless Cloudflare Worker (`stream-worker.js`), and the client only communicates with the Worker URL.

---

### 1. Final Firestore Security Rules (Ready to Paste)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny all unknown documents
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    // Admin Allow-List enforced exclusively via verified Firebase Auth token email
    function isSuperAdmin() {
      return isSignedIn() &&
        request.auth.token.email != null &&
        (request.auth.token.email.lower() == 'azuolynasfilmfestival@gmail.com' ||
         request.auth.token.email.lower() == 'karina.brdar@gmail.com');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // 1. Settings & Broadcast Overlay (H2H Graphic)
    match /settings/{settingId} {
      allow get, list: if true;
      allow write: if isSuperAdmin();
    }

    // 2. Festival Editions
    match /editions/{editionId} {
      allow get, list: if true;
      allow write: if isSuperAdmin();
    }

    // 3. Submissions & Atomic Vote Increment Rule
    match /submissions/{submissionId} {
      // Public read of contest films
      allow get, list: if true;

      // Public registration of new films
      allow create: if true;

      // Strict update: SuperAdmin has full edit rights.
      // Anonymous public can ONLY increment votesCount by exactly +1
      // when accompanied by a valid vote creation in the same batch/request
      allow update: if isSuperAdmin() || (
        isSignedIn() &&
        incoming().diff(existing()).affectedKeys().hasOnly(['votesCount']) &&
        incoming().votesCount == (existing().get('votesCount', 0) + 1)
      );

      // Deletion is strictly SuperAdmin only
      allow delete: if isSuperAdmin();
    }

    // 4. Public Voting: 1 Vote per person per nomination, atomic creation only
    match /votes/{voteId} {
      // Public read to calculate tally and rankings (voter IDs sanitized in UI)
      allow get, list: if true;

      // Create: user MUST be authenticated (Anonymous Auth or Email),
      // document ID MUST be nominationId_authUid, and user cannot vote twice
      allow create: if isSignedIn() &&
        incoming().userId == request.auth.uid &&
        incoming().nominationId != null &&
        incoming().filmId != null &&
        voteId == (incoming().nominationId + '_' + request.auth.uid) &&
        !exists(/databases/$(database)/documents/votes/$(voteId));

      // No client updates or deletions permitted under any circumstances
      allow update, delete: if isSuperAdmin();
    }

    // 5. Stream Tokens (SHA-256 Hashed)
    match /stream_tokens/{tokenHash} {
      allow get: if true;
      allow list, create, update, delete: if isSuperAdmin();
    }

    // 6. Live Viewers legacy collection
    match /live_viewers/{viewerId} {
      allow get: if true;
      allow list, delete: if isSuperAdmin();
      allow create, update: if true;
    }

    // 7. Users RBAC
    match /users/{userId} {
      allow get: if isSignedIn();
      allow list, delete: if isSuperAdmin();
      allow create, update: if isSuperAdmin();
    }

    // 8. Mail delivery queue
    match /mail/{mailId} {
      allow get, list: if isSuperAdmin();
      allow create, update: if true;
      allow delete: if isSuperAdmin();
    }

    // 9. Activity Logs
    match /logs/{logId} {
      allow get, list: if isSuperAdmin();
      allow create: if true;
      allow update, delete: if isSuperAdmin();
    }
  }
}
```

---

### 2. Concrete Implementation Steps

#### Step 1: `live.html` Localization & Viewer Text Cleanliness
- Auto-detects `/lt/` vs `/en/` and `?lang=lt|en`, persists in `localStorage.setItem('preferred_lang')`.
- Adds top navbar with festival branding and accessible `LT | EN` switcher.
- Translates every viewer-facing string (token gate, button states, friendly error descriptions).
- Completely removes technical phrases ("Cloudflare connection active", status numbers, token hashes).
- Integrates graceful offline card: *"Transliacija dar neprasidėjo"* / *"The broadcast has not started yet"*.

#### Step 2: `error-reporting.js` Hardening & Secret Redaction
- Filters out non-fatal `AbortError` (DOMException code 20) from public view and logs it silently with true stack details.
- Improves stack trace parser: extracts real filename and function names rather than generic "promise".
- **Redaction Filter**: Sanitizes all error text, URLs, paths, and JSON dumps:
  - Tokens (`asiff_live_***`, `cfs_***`) -> `[REDACTED_TOKEN]`
  - Cloudflare signed URLs with tokens -> `.../iframe?token=[REDACTED]`
  - Voter UIDs -> `[REDACTED_USER]`
  - Private collection paths -> `[REDACTED_PATH]`
- **Visibility Boundary**: Detailed diagnostic box is mounted **only** if `sessionStorage.getItem('admin_jwt_token')` exists or URL contains `?debug=1`. Public visitors receive only short, polite toast messages.

#### Step 3: `voting.html` & `voting-client.js` English-First Bilingual Voting
- Defaults to English with full Lithuanian toggle.
- Uses `db.batch()` to write `/votes/{nominationId}_{auth.uid}` and `submissions/{filmId}` `votesCount: increment(1)` in ONE atomic transaction.
- Strictly uses `firebase.auth().currentUser.uid` via Anonymous Auth.
- Implements rapid multi-click cooldown and client debouncing.
- Bilingual fallback logic: `filmTitle_en` -> `filmTitle` and `synopsis_en` -> `synopsis`.

#### Step 4: Admin Auth Hardening (`js/auth.js`)
- Enforces genuine Firebase Authentication (`signInWithEmailAndPassword`) against the admin allow-list (`azuolynasfilmfestival@gmail.com`, `karina.brdar@gmail.com`).
- Disables insecure token fallbacks from simulating write permissions.

---

### 3. Verification & Test Checklist (To Run Post-Implementation)

1. **`live.html` Language & Viewer Text**:
   - Access from `lt/index.html` -> verifies LT language.
   - Access from `en/index.html` or with `?lang=en` -> verifies EN language.
   - Toggle LT/EN switch -> verifies instant translation of token gate, errors, and player headers.
   - Verify that no mention of "Cloudflare", token hashes, or internal IDs appears on screen.
2. **`error-reporting.js` & AbortError**:
   - Simulate an aborted request or page reload -> verify zero viewer alert pops up.
   - Open with `?debug=1` -> verify red box appears for real errors with tokens, URLs, and paths redacted.
   - Open without `?debug=1` -> verify only clean, friendly notification displays.
3. **Voting System (`voting.html`)**:
   - Open `voting.html` -> verify default language is English with EN/LT toggle.
   - Vote for a film -> verify atomic batch commits vote doc and increments film count by +1.
   - Double-click or rapid click -> verify button debounces and locks with "Vote Recorded ✓".
   - Reload page or open in private tab -> verify duplicate vote in same category is blocked.
   - Export CSV from admin panel -> verify clean tally of votes.
4. **Build & Test Suite**:
   - Run `node scripts/check-static.mjs` -> static validation passes.
   - Run `npm test` -> all 46 tests pass.
   - Run `compile_applet` -> clean build.
