/* Static hosting uses Trigger Email; Node hosting keeps the SMTP dispatcher. */
(() => {
  const sender = 'azuolynasfilmfestival@gmail.com';
  const validAddress = value => typeof value === 'string' && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
  function buildMail({ to, subject, html, text, replyTo = sender }) {
    const recipients = (Array.isArray(to) ? to : [to]).map(value => typeof value === 'string' ? value.trim() : value);
    if (!recipients.length || !recipients.every(validAddress) || !validAddress(replyTo)) throw new Error('Nurodykite galiojantį el. pašto adresą.');
    if (typeof subject !== 'string' || !subject.trim() || typeof html !== 'string' || !html.trim() || (text !== undefined && typeof text !== 'string')) {
      throw new Error('Laiškui reikalinga tema ir HTML turinys.');
    }
    return { to: recipients, from: sender, replyTo,
      message: { subject, html, text: text ?? subject }, createdAt: new Date().toISOString() };
  }
  function viewer(data) {
    return { token: data.liveToken, email: data.email.toLowerCase(), name: data.name,
      filmTitle: data.filmTitle, role: 'remote_participant', status: 'authorized',
      createdAt: firebase.firestore.FieldValue.serverTimestamp() };
  }
  window.MailClient = {
    buildMail,
    async send(db, payload) {
      const mail = buildMail(payload);
      if (await window.FestivalApi.hasServer()) {
        return window.FestivalApi.json('/api/admin/send-email', { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: mail.to.join(', '), ...mail.message }) });
      }
      if (!db) throw new Error('Firestore šiuo metu nepasiekiamas.');
      const ref = await db.collection('mail').add(mail);
      return { success: true, id: ref.id, queued: true,
        message: 'Laiškas įrašytas į siuntimo eilę. Pristatymo būseną galite matyti žemiau.' };
    },
    createSubmission(db, data) { return { ref: db.collection('submissions').doc(), data }; },
    async submit(db, attempt) {
      const { ref, data } = attempt;
      // Select transport before any writes. Never fall back after a mail POST.
      if (await window.FestivalApi.hasServer()) {
        if (!attempt.filmSaved) {
          await ref.set(data);
          attempt.filmSaved = true;
        }
        if (data.attendanceType === 'remote' && !attempt.viewerSaved) {
          await db.collection('live_viewers').doc(data.liveToken).set(viewer(data));
          attempt.viewerSaved = true;
        }
        return window.FestivalApi.json('/api/submissions/record', { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ref.id, ...data, submittedAt: new Date().toISOString() }) });
      }
      const lang = data.submissionLang === 'en' ? 'en' : 'lt';
      const template = data.attendanceType === 'remote' ? 'remoteLivePass' : 'submissionReceived';
      const emailData = { ...data, ctaUrl: data.attendanceType === 'remote' ? data.liveStreamUrl : undefined };
      const batch = db.batch();
      batch.set(ref, data);
      batch.set(db.collection('mail').doc(`${ref.id}_receipt`), buildMail({ to: data.email,
        subject: window.getEmailSubject(template, lang, emailData), html: window.generateEmailHtml(template, lang, emailData) }));
      batch.set(db.collection('mail').doc(`${ref.id}_organizer`), buildMail({ to: sender, replyTo: data.email,
        subject: `${lang === 'en' ? 'New Submission' : 'Nauja paraiška'}: ${data.filmTitle}`,
        html: window.generateAdminNotificationHtml(lang, data) }));
      if (data.attendanceType === 'remote') batch.set(db.collection('live_viewers').doc(data.liveToken), viewer(data));
      await batch.commit();
      return { success: true, queued: true, id: ref.id };
    }
  };
})();
