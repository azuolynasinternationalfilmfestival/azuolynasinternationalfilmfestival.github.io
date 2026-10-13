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
- `dominikphotofficial.t@gmail.com`
- `dominikphotofficial.lt@gmail.com`

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

Both forms upload the video and save the film in Firestore, then call
`/api/submissions/record`. The server stores the local record and sends the applicant
receipt (or remote live pass) and the organizer notification using Nodemailer.
When direct SMTP is unavailable or fails, it queues standard `mail` documents for
the Trigger Email extension in the same named database. A successful SMTP delivery
is not queued again. The browser does not create a second set of notifications.

SMTP settings can be supplied in `.env` or the restored authenticated admin email
settings panel. Saved credentials stay in the private server settings file and are
excluded from public settings and Firestore sync. Keep the server's `data/` storage
persistent and private. Set the extension's default sender to the festival address.

Film, local record and notifications are separate writes in this restored server
architecture. If notification dispatch fails, the form shows an error; a film may
already have been stored. Queuing confirms document creation, not inbox delivery;
inspect the extension's `delivery.state` and `delivery.error` for processing results.

## Live player

The admin Transliacija tab retains **Transliacijos grotuvo nuoroda → Iframe URL**.
Save an absolute HTTPS embed URL. The server preserves other stream settings when
saving the URL; the live player polls the server every five seconds. `live.html`
keeps the shared styles and 16:9 player layout.
