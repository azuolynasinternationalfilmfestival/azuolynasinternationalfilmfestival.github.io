# Ąžuolynas Film Festival

This is a static website hosted on GitHub Pages. Firebase Auth, Firestore and
Storage are accessed through the Firebase Web SDK. No custom backend is required.

## Firebase configuration

The project and named Firestore database are configured in `config.js`,
`js/firebase-init.js`, and `firebase-applet-config.json`. All shared operations
in `js/firebase-client.js` use that same database instance.

Publish `firestore.rules` to the named database
`ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83` in project
`filmfest-509606`. Existing Storage rules must allow film uploads and authenticated
admin media deletion. Enable Email/Password and the existing Google sign-in
provider in Firebase Auth, with the GitHub Pages domain authorized.

## Email notifications

Configure the existing **Trigger Email** extension to watch the `mail` collection
in the same named database. Submission saves commit the film, applicant receipt,
and organizer notification together in one Firestore batch. Remote submissions
also create the live access token in that batch.

Queued documents use the extension's standard format:

```js
{
  from: "azuolynasfilmfestival@gmail.com",
  replyTo: "azuolynasfilmfestival@gmail.com",
  to: ["recipient@example.com"],
  message: { subject: "Subject", html: "<p>Message</p>", text: "Message" },
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

A successful write means queued, not inbox delivery. The extension updates
`delivery.state` and `delivery.error`. The admin Firebase diagnostics panel reads
those states. Sender credentials belong in the extension configuration, never
in the website or public settings documents. Remove any old `smtp` settings from
Firestore in the Firebase console if they were previously saved.

All application notifications request `azuolynasfilmfestival@gmail.com` as the
sender and reply address. The extension's mail provider must authorize that sender;
Gmail SMTP uses its authenticated account as the sender, so configure the extension
with that festival account. Set its Default FROM address to the same address.
These settings belong in Firebase Console → Extensions → Trigger Email →
configuration. The website cannot change the extension's credentials.

If an email does not arrive, inspect its document in the named database's `mail`
collection. No `delivery` field means the extension has not processed it yet;
confirm its database and collection configuration. `delivery.state: ERROR` means
inspect `delivery.error` and extension logs for the provider failure.
`delivery.state: SUCCESS` means the provider accepted the message; check the
recipient address and spam folder. A queued document does not prove inbox receipt.

Invitations also commit the invitation and its single email notification together.
New invitations use Firestore timestamps for expiration. Reissue old invitations
whose expiration was stored as a string before using the updated rules.

Firebase Auth handles password reset and verification emails through its Web SDK.
The Web SDK cannot generate another user's secret password reset link, change
another user's Auth email, or delete their Auth identity. The admin can revoke
application access by deleting their Firestore profiles and invitations. Auth
identity changes, if needed, are performed in the Firebase console by its owner.
Live access tokens are application tokens, not Cloudflare signed media tokens.

## Local development and checks

Run `npm run dev` (Python 3 required) and open `http://localhost:3000`.
No application dependency installation or environment file is needed.

Run `npm test` for synthetic Web SDK regression checks, and `npm run build` for
JavaScript syntax, local script paths and module import validation. These checks
do not send real email or mutate the production Firebase database.

## Live player

In the admin Transliacija tab, edit **Transliacijos grotuvo nuoroda → Iframe URL**
and choose **Išsaugoti nuorodą**. Use an absolute HTTPS embed URL, rather than iframe
HTML. The Web SDK merges it into `stream_config/current.iframeUrl`, preserving
broadcast settings. The live page listens to that document and updates the player
without reloading the page. The default URL button fills the field; save to apply it.

`live.html` loads the shared `style.css` design tokens and the page styles in
`live.css`. Its player remains 16:9 at every viewport size. The broadcast indicator
reflects the stored live state; voting cards also observe festival voting settings.
