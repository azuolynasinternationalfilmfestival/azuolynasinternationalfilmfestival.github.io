# Ąžuolynas Film Festival

## Server and local development

The Express server and server email dispatcher have been restored from the setup
before the Web SDK refactor (`ee840ae`). The website uses Firebase Auth, Firestore
and Storage in the browser, with the original `/api/` endpoints for administration,
local records, invitations and email. The later live player and URL editor remain.

Install dependencies using Bun 1.4.3 or newer with `bun install --frozen-lockfile`.
Copy `.env.example` to the ignored `.env` and set a long random `JWT_SECRET` and
SMTP credentials. Start with `npm run dev` or `npm start`; open
`http://localhost:3000`. Python's static server cannot provide these API endpoints.
A production deployment needs a Node server serving the site, or a reverse proxy
routing the site's `/api/` requests to that server. GitHub Pages alone cannot run it.

Run `npm test` and `npm run build` (`npm run lint` uses the same static checker).
Tests use synthetic identities, local temporary data, and fake SMTP/Firestore
responses; they do not send production email or change the production database.

## Administrator access

All four historically authorized accounts receive full administrator access,
including user management and invitations:

- `azuolynasfilmfestival@gmail.com`
- `karina.brdar@gmail.com`
- `dominikphotofficial.lt@gmail.com`
- `dominikcute4@gmail.com`

The same list is used by `config.js`, `js/firebase-init.js`, server authorization
and `firestore.rules`. User-management visibility uses the exported client list.
A stale profile with a reduced role does not downgrade a whitelisted account.
Other active staff retain their assigned roles; suspended non-whitelisted users
cannot enter the admin panel. Admin API requests require a Firebase ID token or
an authenticated server session. A supplied email header alone grants no access.

Publish `firestore.rules` to the named database
`ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83` in project
`filmfest-509606`. The existing rules already whitelist all four accounts.

## Email

Both forms upload the video, then choose the email transport before writing the film.
On GitHub Pages (and static hosts without the server health endpoint), a Firestore
batch creates the submission, applicant receipt, organizer notification and remote
viewer token together. Rejected writes roll back the entire batch. The Trigger Email
extension processes `mail` in the configured named database. The applicant receives
a receipt in their form language; remote applicants receive their live access link.
The organizer receives the film details and can reply to the applicant.

On Node hosting, the original `/api/submissions/record` dispatcher remains in use.
It sends via Nodemailer, falling back to the extension queue if needed. Completed
recipient results are saved so retrying a partial failure does not resend successful
notifications. Browser retries reuse the uploaded file and submission ID.
A browser never falls back to creating mail after an unsuccessful server POST.

For a separate Node backend, define `window.FESTIVAL_API_BASE_URL =
"https://your-backend.example"` before loading `js/server-api.js` on each page.
Use an HTTPS backend with the repository's health/API routes and Firebase identity
verification. Without this override, other server administration functions still
require a Node deployment or a reverse proxy; GitHub Pages cannot run Express.

The admin email panel supports test and direct email on both hosting types. Its
recent queue displays the extension's `delivery.state` and `delivery.error`, including
queued, processing, error and success. Success means accepted by the recipient's
mail server, not confirmed inbox placement. SMTP configuration is shown on Node
hosting; on GitHub Pages configure SMTP in the Firebase extension. Credentials
must never be stored in public Firestore settings or browser code.

Mail documents use array `to`, string `from` and `replyTo`, and string
`message.subject`, `message.html` and `message.text`. Existing rules allow public
mail creation with valid document IDs and allow staff to read delivery status.
No rules changes are required for these payloads. Queuing confirms document creation;
actual delivery depends on the deployed extension and SMTP configuration.

## Live player

The admin Transliacija tab retains **Transliacijos grotuvo nuoroda → Iframe URL**.
Save an absolute HTTPS embed URL. The server preserves other stream settings when
saving the URL; the live player polls the server every five seconds. `live.html`
keeps the shared styles and 16:9 player layout.
