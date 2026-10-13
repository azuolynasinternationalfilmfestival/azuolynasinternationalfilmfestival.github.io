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
