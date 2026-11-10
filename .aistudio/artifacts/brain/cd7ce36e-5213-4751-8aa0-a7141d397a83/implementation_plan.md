# Voting, Results Publishing & Security Rules Hardening Plan (Revised)

Comprehensive technical plan to implement, harden, and verify the voting, security rules, and real-time jury results/audience favorite announcement system for the Ąžuolynas International Student Film Festival (AISFF).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The revised plan incorporates all precise technical specifications from your review:
> - **Security Rules Formula**: Exactly enforces `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['votes']) && request.resource.data.votes == resource.data.votes + 1` on `/movies/{movieId}` for public voting, with all other fields (title, director, category, winners, awards) strictly writable only by authenticated administrators.
> - **No Mandatory Login for Voting**: Friction-free public voting without requiring viewer login or credentials, secured via `localStorage.getItem('festival_voted')` and atomic increment:
>   `db.collection('movies').doc(movieId).update({ votes: firebase.firestore.FieldValue.increment(1) })`.
> - **Categorized Jury Podiums & Dynamic Audience Favorite**:
>   - **Senior Category (Vyresniųjų / 14–18 m.)**: 1st, 2nd, and 3rd place set by Jury.
>   - **Junior Category (Jaunesniųjų / 10–13 m.)**: 1st, 2nd, and 3rd place set by Jury.
>   - **Audience Favorite ("Любимчик / Žiūrovų simpatija")**: Computed in real-time from the highest viewer votes across all movies.
> - **Locked Results Reveal**: All winner badges, percentages, and podiums remain strictly hidden behind a locked view until the festival organizer flips the `publishResults` / `showResults` flag in Firestore, triggering animated podium reveals on the site and OBS stream overlays.

---

### 1. Overview & Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC CLIENTS                            │
│                                                                        │
│   voting.html (Web / Mobile / OBS Overlay)                             │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 1. Checks localStorage.getItem('festival_voted') on load       │   │
│   │ 2. If voted: Replaces form with Thank-You screen               │   │
│   │ 3. If not voted: Displays filtered film cards (Senior/Junior)  │   │
│   │ 4. On Vote: Updates 'festival_voted' & executes atomic         │   │
│   │    db.collection('movies').doc(id).update({ votes: +1 })       │   │
│   │ 5. Real-time Listener on settings/global.showResults:          │   │
│   │    • Locked: Displays "Results locked until ceremony conclusion"│  │
│   │    • Unlocked: Animates Senior/Junior podiums + Audience Fav.  │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ Atomic +1 vote / Realtime reads
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE BACKEND / CLOUD                        │
│                                                                        │
│   firestore.rules                                                      │
│   ├── /movies/{movieId}                                                │
│   │     • allow read: if true;                                         │
│   │     • allow update: if atomic increment (+1) on 'votes' only      │
│   │     • allow create, delete, metadata update: if isSuperAdmin()     │
│   ├── /settings/{settingId}                                            │
│   │     • allow read: if true;                                         │
│   │     • allow write: if isSuperAdmin()                               │
│   └── /submissions/{submissionId} (Seamless backward compatibility)    │
│                                                                        │
│   storage.rules                                                        │
│   ├── /movies/{allPaths=**}  ──> allow read: if true;                  │
│   │                              allow write, delete: if isTopAdmin(); │
│   └── /posters/{allPaths=**} ──> allow read: if true;                  │
│                                  allow write, delete: if isTopAdmin(); │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Step-by-Step Implementation Details

#### Step 1: Firestore & Storage Security Rules (`firestore.rules` & `storage.rules`)
1. **Firestore Rules (`firestore.rules`)**:
   - `match /movies/{movieId}`:
     - `allow get, list: if true;`
     - `allow create, delete: if isSuperAdmin();`
     - `allow update: if isSuperAdmin() || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['votes']) && request.resource.data.votes == resource.data.votes + 1);`
   - Preserve existing collections (`/submissions`, `/editions`, `/settings`, `/stream_config`, `/live_viewers`, `/users`, `/invitations`, `/mail`, `/logs`) so that all existing 46 automated backend test suites continue to pass with 100% success.
2. **Storage Rules (`storage.rules`)**:
   - `match /movies/{allPaths=**}`: `allow read: if true; allow write, delete: if isTopAdmin();`
   - `match /posters/{allPaths=**}`: `allow read: if true; allow write, delete: if isTopAdmin();`
   - `match /submissions/{fileName}`: public upload with size (<500MB) and MIME validation, top admin delete/update.

#### Step 2: Client Logic & Double-Voting Prevention (`voting.html`)
1. **Load Verification**:
   - Read `localStorage.getItem('festival_voted')`.
   - If present (e.g. contains `{ filmId: "...", votedAt: 123456789 }` or `"true"`):
     - Hide the voting buttons.
     - Display the responsive "Thank you for your vote! / Ačiū už jūsų balsą! / Спасибо за ваш голос!" card, highlighting the chosen film with a direct link to the live stream (`live.html`).
2. **Atomic Firestore Execution**:
   - Wrap in strict `try / catch` with localized user-facing feedback banner.
   - Disable all buttons immediately upon click to prevent race conditions or double clicks.
   - Execute:
     ```javascript
     const movieRef = db.collection('movies').doc(movieId);
     await movieRef.update({
       votes: firebase.firestore.FieldValue.increment(1)
     });
     ```
   - Store `localStorage.setItem('festival_voted', JSON.stringify({ filmId: movieId, timestamp: Date.now() }))`.
3. **High Traffic Stability (OBS & Cloudflare friendly)**:
   - Zero synchronous blocking loops.
   - Graceful fallback: reads from `movies` collection, falling back to `submissions` if needed.
   - Clean retry handler on transient network disconnections.

#### Step 3: Jury Results & Winner Announcement System
1. **Database Representation (`settings/global` & `movies`)**:
   - Firestore flag: `settings/global.showResults === true` (or `resultsPublished: true`).
   - Movie documents store official jury rankings:
     - `juryPlace`: `1`, `2`, `3`, or `null`.
     - `category`: `"senior"` / `"junior"` (or `"II Kategorija (14–18 m.)"` / `"I Kategorija (10–13 m.)"`).
     - `votes`: numeric counter.
2. **Category Structuring**:
   - **Senior Category**:
     - 🥇 1st Place (Auksinis ąžuolas / Golden Oak)
     - 🥈 2nd Place (Sidabrinis ąžuolas / Silver Oak)
     - 🥉 3rd Place (Bronzinis ąžuolas / Bronze Oak)
   - **Junior Category**:
     - 🥇 1st Place (Auksinis ąžuolas / Golden Oak)
     - 🥈 2nd Place (Sidabrinis ąžuolas / Silver Oak)
     - 🥉 3rd Place (Bronzinis ąžuolas / Bronze Oak)
   - **Audience Favorite ("Любимчик / Žiūrovų simpatija")**:
     - Automatically determined by selecting the film with `Math.max(...movies.map(m => m.votes || 0))`.
     - Displays verified total votes badge, flame/trophy indicator, and laurel wreath styling.
3. **Admin Real-Time Toggle**:
   - Flip switch in `admin.html` settings card: "Paskelbti festivalio rezultatus ir laureatus / Publish Festival Results".
   - Immediately pushes update to `settings/global` via Firestore, updating all connected `voting.html`, `live.html`, and OBS browser overlays in sub-second time.

#### Step 4: Verification & Delivery Checklist
- Run full codebase tests (`npm test` — all 46 suites must pass).
- Verify with `lint_applet` and `compile_applet`.
- Restart development server with `restart_dev_server`.
- Output complete, clean, copy-paste ready code blocks for:
  1. `firestore.rules`
  2. `storage.rules`
  3. `voting.html` (including all frontend logic, styles, and Firestore interactions).
