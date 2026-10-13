/* Firebase Web SDK operations shared by the static pages and admin modules. */
(() => {
  let database, authentication;
  let activationPending = Promise.resolve();
  const organizer = 'azuolynasfilmfestival@gmail.com';
  const now = () => new Date().toISOString();
  const timestamp = () => firebase.firestore.FieldValue.serverTimestamp();
  const token = prefix => prefix + Array.from(crypto.getRandomValues(new Uint8Array(24)), v => v.toString(16).padStart(2, '0')).join('');
  const emailId = email => email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    function db() {
    const value = database || window.db;
    if (!value) throw new Error('Firebase Firestore is not connected.');
    return value;
  }
  function auth() { return authentication || window.auth || firebase.auth(); }
  async function list(collection, query) {
    const snapshot = await (query || db().collection(collection)).get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }
  async function get(collection, id) {
    const snapshot = await db().collection(collection).doc(id).get();
    return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
  }
  async function put(collection, id, data) {
    await db().collection(collection).doc(id).set(data, { merge: true });
    return { ...data, id };
  }
  function mail(to, subject, html, text) {
    if (!to || !subject || !html) throw new Error('Email recipient, subject and content are required.');
    return { to: Array.isArray(to) ? to : [to], message: { subject, html, text: text || subject }, createdAt: timestamp() };
  }
  async function queueEmail({ to, subject, html, text, template, lang = 'lt', data = {} }) {
    if (template) {
      html = window.generateEmailHtml(template, lang, data);
      subject = window.getEmailSubject(template, lang, data);
    }
    const ref = await db().collection('mail').add(mail(to, subject, html, text));
    return { success: true, firestoreQueued: true, messageId: ref.id };
  }
  async function submitFilm(targetDb, data) {
    const ref = targetDb.collection('submissions').doc();
    const lang = data.submissionLang === 'en' ? 'en' : 'lt';
    const template = data.attendanceType === 'remote' ? 'remoteLivePass' : 'submissionReceived';
    const emailData = { ...data, ctaUrl: data.attendanceType === 'remote' ? data.liveStreamUrl : `${location.origin}/${lang}/index.html` };
    const batch = targetDb.batch();
    batch.set(ref, data);
    batch.set(targetDb.collection('mail').doc(`${ref.id}_receipt`), mail(data.email,
      window.getEmailSubject(template, lang, emailData), window.generateEmailHtml(template, lang, emailData)));
    batch.set(targetDb.collection('mail').doc(`${ref.id}_organizer`), mail(organizer,
      lang === 'en' ? `New submission: ${data.filmTitle}` : `Nauja paraiška: ${data.filmTitle}`,
      window.generateAdminNotificationHtml(lang, data)));
    if (data.attendanceType === 'remote') {
      batch.set(targetDb.collection('live_viewers').doc(data.liveToken), {
        token: data.liveToken, email: data.email.toLowerCase(), name: data.name,
        filmTitle: data.filmTitle, role: 'remote_participant', status: 'authorized', createdAt: timestamp()
      });
    }
    // Film and both notifications are committed together: failures are visible to the form.
    await batch.commit();
    return { id: ref.id, success: true };
  }
  async function findUser(data) {
    for (const id of [data.uid, data.userId, data.email && emailId(data.email), data.oldEmail && emailId(data.oldEmail)].filter(Boolean)) {
      const user = await get('users', id);
      if (user) return user;
    }
    const email = data.oldEmail || data.email;
    if (email) return (await list('users', db().collection('users').where('email', '==', email.toLowerCase())))[0];
    throw new Error('User not found.');
  }
  async function invite(data) {
    const inviteToken = token('inv_');
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    const email = data.email.trim().toLowerCase();
    const invitation = { token: inviteToken, code, email, name: data.name || '', surname: data.surname || '',
      role: data.role || 'viewer', canManageUsers: data.canManageUsers === true, status: 'pending',
      createdAt: now(), expiresAt: firebase.firestore.Timestamp.fromMillis(Date.now() + 7 * 86400000), invitedBy: auth().currentUser?.email || '' };
    const inviteUrl = `${location.origin}/admin.html?invite=${inviteToken}`;
    const lang = data.lang === 'en' ? 'en' : 'lt';
    const batch = db().batch();
    batch.set(db().collection('invitations').doc(inviteToken), invitation);
    // Preserve an existing account's status and permissions when sending a new invitation.
    const existing = await get('users', emailId(email));
    if (!existing) batch.set(db().collection('users').doc(emailId(email)), {
      ...invitation, uid: emailId(email), status: 'invited'
    });
    batch.set(db().collection('mail').doc(`${inviteToken}_invite`), mail(email,
      lang === 'en' ? 'Ąžuolynas Film Fest | Team Invitation' : 'Ąžuolynas Film Fest | Kvietimas prisijungti',
      window.generateInviteEmailHtml(lang, { ...invitation, inviteUrl })));
    await batch.commit();
    return { success: true, invitation, inviteUrl };
  }
  async function activate(data) {
    const invitation = await get('invitations', data.token);
    if (!invitation || invitation.status !== 'pending' || invitation.code !== data.code || (invitation.expiresAt?.toMillis?.() || Date.parse(invitation.expiresAt)) <= Date.now()) {
      throw new Error('Invalid or expired invitation.');
    }
    let credential;
    try { credential = await auth().createUserWithEmailAndPassword(invitation.email, data.password); }
    catch (error) {
      if (error.code !== 'auth/email-already-in-use') throw error;
      credential = await auth().signInWithEmailAndPassword(invitation.email, data.password);
    }
    const user = credential.user;
    const profile = { uid: user.uid, email: invitation.email, name: data.name || invitation.name,
      surname: data.surname || invitation.surname, role: invitation.role, status: 'active',
      canManageUsers: invitation.canManageUsers === true, invitationToken: data.token, updatedAt: now() };
    const batch = db().batch();
    const existingProfile = await get('users', user.uid);
    if (existingProfile) {
      batch.update(db().collection('users').doc(user.uid), { name: profile.name, surname: profile.surname, updatedAt: now() });
    } else {
      batch.set(db().collection('users').doc(user.uid), profile);
    }
    batch.update(db().collection('invitations').doc(data.token), { status: 'activated', activatedBy: user.uid, activatedAt: now() });
    await batch.commit();
    return { success: true, user: profile };
  }
  async function vote(data) {
    const settings = await get('settings', 'festival');
    if (settings?.votingActive === false || settings?.maintenanceMode === true) throw new Error('Voting is closed.');
    const film = await get('submissions', data.filmId);
    if (!film || film.inVoting !== true) throw new Error('This film is not open for voting.');
    let deviceHash = localStorage.getItem('festival_voter_id');
    if (!deviceHash) { deviceHash = token('dev_'); localStorage.setItem('festival_voter_id', deviceHash); }
    const category = String(film.category || data.category || 'general');
    const auditId = `${deviceHash}_${category}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const audit = db().collection('votes_audit').doc(auditId);
    const filmRef = db().collection('submissions').doc(data.filmId);
    let votesCount;
    await db().runTransaction(async transaction => {
      const [existingVote, currentFilm] = await Promise.all([transaction.get(audit), transaction.get(filmRef)]);
      if (existingVote.exists) throw new Error('already-voted');
      if (!currentFilm.exists || currentFilm.data().inVoting !== true) throw new Error('Voting is closed.');
      votesCount = Number(currentFilm.data().votesCount || 0) + 1;
      transaction.set(audit, { filmId: data.filmId, category, deviceHash, votedAt: timestamp() });
      transaction.update(filmRef, { votesCount });
    });
    return { success: true, votesCount };
  }
  async function streamStatus() {
    return { isLive: false, streamState: 'paused', votingActive: true, ...(await get('stream_config', 'current') || {}) };
  }
  async function livePass(data) {
    if (!data.token) throw new Error('Please enter the access token from your invitation email.');
    const viewer = await get('live_viewers', data.token);
    if (!viewer || viewer.status !== 'authorized' || (viewer.expiresAt && Date.parse(viewer.expiresAt) <= Date.now())) throw new Error('Invalid or expired access token.');
    return viewer;
  }
  async function viewerEmail(viewer) {
    const liveStreamUrl = `${location.origin}/live.html?token=${viewer.token}`;
    return queueEmail({ to: viewer.email, template: 'remoteLivePass', lang: viewer.submissionLang || 'lt',
      data: { ...viewer, liveToken: viewer.token, liveStreamUrl, ctaUrl: liveStreamUrl } });
  }
  async function execute(operation, data, write) {
    switch (operation) {
      case 'settings':
        if (write) await put('settings', 'festival', { ...data, updatedAt: now(), smtp: firebase.firestore.FieldValue.delete() });
        return { success: true, settings: await get('settings', 'festival') || {} };
      case 'submissions': return { success: true, submissions: await list('submissions') };
      case 'votingFilms': return { success: true, submissions: await list('submissions', db().collection('submissions').where('inVoting', '==', true)) };
      case 'submissions.update': await db().collection('submissions').doc(data.id).update(data.updates); return { success: true };
      case 'submissions.toggle-voting': await db().collection('submissions').doc(data.id).update({ inVoting: data.inVoting }); return { success: true };
      case 'submissions.delete': await db().collection('submissions').doc(data.id).delete(); return { success: true };
      case 'submissions.send-email': {
        const result = await queueEmail({ ...data, data: { ...data, ...(data.data || {}) } });
        return { success: true, emailResult: result };
      }
      case 'send-email': return { success: true, emailResult: await queueEmail(data), message: 'Laiškas įrašytas į siuntimo eilę.' };
      case 'email.test': return { success: true, emailResult: await queueEmail({ to: data.testEmail, subject: 'Ąžuolynas Film Fest | Test', html: '<p>Firebase Trigger Email test.</p>' }), message: 'Bandomasis laiškas įrašytas į siuntimo eilę.' };
      case 'editions':
        if (write) await put('editions', String(data.year), { ...data, updatedAt: now() });
        return { success: true, editions: await list('editions') };
      case 'editions.delete': await db().collection('editions').doc(String(data.year)).delete(); return { success: true };
      case 'tasks':
        if (write) await db().collection('tasks').add({ ...data, status: 'pending', createdAt: now() });
        return { success: true, tasks: await list('tasks') };
      case 'tasks.status': await db().collection('tasks').doc(data.taskId).update({ status: data.status, updatedAt: now() }); return { success: true };
      case 'tasks.delete': await db().collection('tasks').doc(data.taskId).delete(); return { success: true };
      case 'logs':
        if (write) await db().collection('logs').doc(data.id || token('log_')).set(data);
        return { success: true, logs: await list('logs', db().collection('logs').orderBy('timestamp', 'desc').limit(100)) };
      case 'users': return { success: true, users: await list('users') };
      case 'users.status': {
        const user = await findUser(data);
        if (user.email === organizer) throw new Error('The primary administrator cannot be suspended.');
        const profiles = await list('users', db().collection('users').where('email', '==', user.email));
        const batch = db().batch();
        profiles.forEach(profile => batch.update(db().collection('users').doc(profile.id), { status: data.status }));
        await batch.commit(); return { success: true };
      }
      case 'users.update-profile': {
        const user = await findUser(data);
        if (data.email.toLowerCase() !== user.email.toLowerCase()) throw new Error('Account email changes must be made by the account owner in Firebase Auth.');
        const { uid, oldEmail, adminEmail, emailVerified, ...profile } = data;
        if (user.email === organizer) { profile.role = 'admin'; profile.canManageUsers = true; }
        const profiles = await list('users', db().collection('users').where('email', '==', user.email));
        const batch = db().batch();
        profiles.forEach(existing => batch.update(db().collection('users').doc(existing.id), { ...profile, updatedAt: now() }));
        await batch.commit(); return { success: true };
      }
      case 'users.delete': {
        if (data.email === organizer) throw new Error('The primary administrator cannot be removed.');
        const profiles = await list('users', db().collection('users').where('email', '==', data.email.toLowerCase()));
        // Revoke app access; the Web SDK cannot delete another person's Auth account.
        const batch = db().batch();
        profiles.forEach(user => batch.delete(db().collection('users').doc(user.id)));
        const invitations = await list('invitations', db().collection('invitations').where('email', '==', data.email.toLowerCase()));
        invitations.forEach(inv => batch.delete(db().collection('invitations').doc(inv.id)));
        await batch.commit(); return { success: true };
      }
      case 'users.send-password-reset': await auth().sendPasswordResetEmail(data.email); return { success: true };
      case 'invite': case 'send-access-link': return invite(data);
      case 'invite-info': return { success: true, invitation: await get('invitations', data.token) };
      case 'activate-invite': {
        let finish;
        activationPending = new Promise(resolve => { finish = resolve; });
        try { return await activate(data); } finally { finish(); }
      }
      case 'judge-evaluations': return { success: true, evaluations: await list('judge_evaluations') };
      case 'judge-evaluation': {
        const judgeEmail = auth().currentUser?.email;
        if (!judgeEmail) throw new Error('Sign in to submit a judge evaluation.');
        const scores = Object.values(data.scores);
        if (!scores.length || scores.some(score => !Number.isFinite(score) || score < 0 || score > 10)) throw new Error('Invalid scores.');
        await put('judge_evaluations', `${data.filmId}_${emailId(judgeEmail)}`, { ...data, judgeEmail, averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length, updatedAt: now() });
        return { success: true };
      }
      case 'voting-analytics': {
        const films = await list('submissions');
        const evaluations = await list('judge_evaluations');
        const judgeSummaries = {};
        for (const evaluation of evaluations) {
          const summary = judgeSummaries[evaluation.filmId] ||= { total: 0, judgeCount: 0 };
          summary.total += evaluation.averageScore || 0; summary.judgeCount++;
          summary.averageJudgeScore = summary.total / summary.judgeCount;
        }
        return { success: true, judgeSummaries, totalAudienceVotes: films.reduce((sum, film) => sum + Number(film.votesCount || 0), 0) };
      }
      case 'declare-winner': await db().collection('submissions').doc(data.filmId).update({ isWinner: true, status: 'winner', awardTitle: data.awardTitle, awardYear: data.year }); return { success: true };
      case 'revoke-winner': await db().collection('submissions').doc(data.filmId).update({ isWinner: false, status: 'accepted', awardTitle: firebase.firestore.FieldValue.delete() }); return { success: true };
      case 'vote': return vote(data);
      case 'votes': return { success: true, votes: Object.fromEntries((await list('submissions', db().collection('submissions').where('inVoting', '==', true))).map(film => [film.id, film.votesCount || 0])) };
      case 'test-vote': {
        const started = Date.now();
        const filmRef = db().collection('submissions').doc(data.filmId);
        let currentVotes;
        await db().runTransaction(async transaction => {
          const film = await transaction.get(filmRef);
          if (!film.exists) throw new Error('Film not found.');
          currentVotes = Number(film.data().votesCount || 0) + Math.max(1, Math.min(100, Number(data.count) || 1));
          transaction.update(filmRef, { votesCount: currentVotes });
        });
        return { success: true, currentVotes, latencyMs: Date.now() - started };
      }
      case 'reset-votes': await db().collection('submissions').doc(data.filmId).update({ votesCount: Math.max(0, Number(data.targetVotes) || 0) }); return { success: true };
      case 'voting-health': {
        const started = Date.now(), settings = await get('settings', 'festival');
        const films = await list('submissions');
        return { success: true, healthy: true, votingActive: settings?.votingActive !== false, maintenanceMode: settings?.maintenanceMode === true, totalVotesRecorded: films.reduce((sum, film) => sum + Number(film.votesCount || 0), 0), latencyMs: Date.now() - started };
      }
      case 'live.status': return streamStatus();
      case 'stream.status': await put('stream_config', 'current', { streamState: data.state, isLive: data.state === 'live', updatedAt: now() }); return { success: true, streamConfig: await streamStatus() };
      case 'stream.iframe-url': await put('stream_config', 'current', { iframeUrl: data.iframeUrl, updatedAt: now() }); return { success: true };
      case 'live.verify-access': return { authorized: true, user: await livePass(data) };
      case 'live.heartbeat': {
        await livePass(data);
        await put('live_viewers', data.token, { lastSeen: now() }); return { success: true };
      }
      case 'live.viewers': {
        const viewers = await list('live_viewers');
        return { success: true, activeViewers: viewers.filter(viewer => viewer.status === 'authorized' && Date.parse(viewer.lastSeen || '') > Date.now() - 90000).length };
      }
      case 'stream.viewers': return { success: true, viewers: await list('live_viewers') };
      case 'stream.viewers.create': {
        const viewerToken = data.customToken || token('live_');
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(viewerToken)) throw new Error('Invalid access token.');
        const viewer = { token: viewerToken, email: data.email.toLowerCase(), name: data.name || '', role: data.role || 'guest_viewer', status: 'authorized', createdAt: now(), expiresAt: new Date(Date.now() + Number(data.expiresInHours || 48) * 3600000).toISOString() };
        const ref = db().collection('live_viewers').doc(viewerToken);
        await db().runTransaction(async tx => { if ((await tx.get(ref)).exists) throw new Error('Access token already exists.'); tx.set(ref, viewer); });
        if (data.sendEmail) await viewerEmail(viewer);
        return { success: true, viewer, liveLink: `${location.origin}/live.html?token=${viewerToken}` };
      }
      case 'stream.viewers.delete': await db().collection('live_viewers').doc(data.token).delete(); return { success: true };
      case 'stream.viewers.resend': { const viewer = await livePass(data); return { success: true, emailResult: await viewerEmail(viewer) }; }
      case 'resend-live-link': {
        const film = await get('submissions', data.submissionId);
        if (!film) throw new Error('Film not found.');
        return { success: true, emailResult: await viewerEmail({ ...film, token: film.liveToken }) };
      }
      default: throw new Error(`Unknown Firebase operation: ${operation}`);
    }
  }
  window.FirebaseClient = {
    configure(config) { database = config.db; authentication = config.auth; },
    queueEmail, submitFilm, vote,
    waitForActivation() { return activationPending; },
    // Preserve the existing UI's result handling while all persistence uses the Web SDK.
    async request(operation, options = {}) {
      const data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      const result = await execute(operation, data, options.method === 'POST');
      return { ok: true, json: async () => result };
    },
    subscribeVotingFilms(callback, onError = console.error) {
      return db().collection('submissions').where('inVoting', '==', true).onSnapshot(snapshot => callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))), onError);
    },
    subscribeStream(callback, onError = console.error) {
      return db().collection('stream_config').doc('current').onSnapshot(doc => callback({ isLive: false, streamState: 'paused', ...(doc.exists ? doc.data() : {}) }), onError);
    }
  };
})();
