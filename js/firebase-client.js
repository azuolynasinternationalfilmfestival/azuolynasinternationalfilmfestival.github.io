/* Static-first Firestore & optional Node backend transport for live player and stream admin. */
(() => {
  const DEFAULT_IFRAME_URL = 'https://customer-auu36r7owuzogvfb.cloudflarestream.com/937d1a8b2c545a980c9fabc8502d8af4/iframe';
  const routes = {
    'live.verify-access': '/api/live/verify-access',
    'live.heartbeat': '/api/live/heartbeat',
    'live.status': '/api/live/status',
    'votingFilms': '/api/submissions',
    'vote': '/api/vote',
    'submissions': '/api/admin/submissions',
    'stream.viewers': '/api/admin/stream/viewers',
    'live.viewers': '/api/admin/live/viewers',
    'stream.iframe-url': '/api/admin/stream/iframe-url',
    'stream.viewers.resend': '/api/admin/stream/viewers/resend',
    'stream.viewers.delete': '/api/admin/stream/viewers/delete',
    'stream.viewers.create': '/api/admin/stream/viewers/create',
    'stream.viewers.bulk-create': '/api/admin/stream/viewers/bulk-create',
    'stream.viewers.update': '/api/admin/stream/viewers/update',
    'stream.viewers.regenerate': '/api/admin/stream/viewers/regenerate-token',
    'stream.settings': '/api/admin/stream/settings',
    'stream.status': '/api/admin/stream/status',
    'resend-live-link': '/api/admin/resend-live-link'
  };

  function getDb() {
    if (typeof window === 'undefined') return null;
    if (window.db && typeof window.db.collection === 'function') return window.db;
    if (window.firestoreDb && typeof window.firestoreDb.collection === 'function') return window.firestoreDb;
    if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
      try {
        return firebase.firestore();
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  async function hasServerSafe() {
    if (typeof window !== 'undefined' && window.FestivalApi && typeof window.FestivalApi.hasServer === 'function') {
      try {
        return await window.FestivalApi.hasServer();
      } catch (_) {
        return false;
      }
    }
    return null;
  }

  function jsonResponse(data, status = 200) {
    const bodyText = JSON.stringify(data);
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: typeof Headers !== 'undefined' ? new Headers({ 'content-type': 'application/json' }) : {
        get: name => (String(name).toLowerCase() === 'content-type' ? 'application/json' : null)
      },
      json: async () => JSON.parse(bodyText),
      text: async () => bodyText
    };
  }

  function parseBody(rawBody) {
    if (rawBody === undefined || rawBody === null) return {};
    if (typeof rawBody === 'string') {
      try {
        return JSON.parse(rawBody);
      } catch (_) {
        return {};
      }
    }
    return typeof rawBody === 'object' ? rawBody : {};
  }

  function normalizeDateValue(val) {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val.toDate === 'function') {
      try { return val.toDate().toISOString(); } catch (_) { return null; }
    }
    if (typeof val.toMillis === 'function') {
      try { return new Date(val.toMillis()).toISOString(); } catch (_) { return null; }
    }
    if (val instanceof Date) return val.toISOString();
    return null;
  }

  function toMillis(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    const parsed = Date.parse(String(val));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeDoc(doc) {
    const raw = (typeof doc.data === 'function' ? doc.data() : doc) || {};
    const out = { ...raw };
    if (doc.id && !out.id) out.id = doc.id;
    for (const key of ['createdAt', 'updatedAt', 'submittedAt', 'expiresAt', 'lastSeenAt', 'heartbeatAt']) {
      if (out[key] !== undefined && out[key] !== null) {
        const iso = normalizeDateValue(out[key]);
        if (iso) out[key] = iso;
      }
    }
    return out;
  }

  function toFirestoreTimestamp(date) {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.Timestamp && typeof firebase.firestore.Timestamp.fromDate === 'function') {
      return firebase.firestore.Timestamp.fromDate(date);
    }
    return date;
  }

  async function sha256Hex(input) {
    const str = String(input || '');
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function' && typeof TextEncoder !== 'undefined') {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (typeof crypto !== 'undefined' && typeof crypto.createHash === 'function') {
      return crypto.createHash('sha256').update(str).digest('hex');
    }
    // Deterministic fallback hash only if WebCrypto is unavailable in a minimal sandbox
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
    }
    return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(4);
  }

  function generateViewerToken(prefix = 'aisff') {
    let rand = '';
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      rand = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    }
    return `${prefix}_${rand}`;
  }

  function sanitizeCustomToken(raw) {
    return String(raw || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
  }

  function buildOrigin() {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'https://www.azuolynasfilmfestival.lt';
  }

  async function writeAdminLog(db, action, details = {}) {
    try {
      const adminEmail = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin_user_email')) ||
        (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser?.email) || 'admin';
      await db.collection('logs').add({
        action: String(action || 'admin_action').slice(0, 100),
        actor: adminEmail,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (_) {
      // Logging failure should never block primary operation
    }
  }

  async function queueLivePassMail(db, { to, name, token, lang = 'lt', expiresAtIso }) {
    if (!to || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(String(to).trim())) {
      throw new Error('Neteisingas gavėjo el. pašto adresas.');
    }
    const cleanLang = lang === 'en' ? 'en' : 'lt';
    const liveLink = `${buildOrigin()}/live.html?t=${encodeURIComponent(token)}`;
    const payload = {
      name: name || (cleanLang === 'en' ? 'Guest' : 'Žiūrove'),
      email: String(to).trim(),
      liveToken: token,
      liveStreamUrl: liveLink,
      ctaUrl: liveLink,
      expiresAt: expiresAtIso || ''
    };
    const subject = typeof window.getEmailSubject === 'function'
      ? window.getEmailSubject('remoteLivePass', cleanLang, payload)
      : (cleanLang === 'en' ? 'FEST 2027 LIVE Stream Access Pass' : 'FEST 2027 TIESIOGINĖS transliacijos prieiga');
    const html = typeof window.generateEmailHtml === 'function'
      ? window.generateEmailHtml('remoteLivePass', cleanLang, payload)
      : `<p>${cleanLang === 'en' ? 'Your LIVE stream access code:' : 'Jūsų tiesioginės transliacijos kodas:'} <strong>${token}</strong></p><p><a href="${liveLink}">${liveLink}</a></p>`;
    const text = typeof window.generateSubmissionPlainText === 'function'
      ? window.generateSubmissionPlainText('remoteLivePass', cleanLang, payload)
      : `${subject}\n${token}\n${liveLink}`;

    if (window.MailClient && typeof window.MailClient.buildMail === 'function') {
      const mailDoc = window.MailClient.buildMail({ to: payload.email, subject, html, text });
      await db.collection('mail').add(mailDoc);
    } else {
      await db.collection('mail').add({
        to: [payload.email],
        replyTo: 'azuolynasfilmfestival@gmail.com',
        message: { subject, html, text },
        createdAt: new Date().toISOString()
      });
    }
  }

  async function createViewerRecords(db, item) {
    const email = String(item.email || '').trim().toLowerCase();
    const name = String(item.name || '').trim() || email;
    const tokenType = item.tokenType === 'classroom' ? 'classroom' : 'individual';
    const classroomLabel = String(item.classroomLabel || '').trim();
    const role = String(item.role || (tokenType === 'classroom' ? 'teacher_classroom' : 'guest_viewer')).trim();
    const parsedHours = parseInt(item.expiresInHours, 10);
    const expiresInHours = Number.isFinite(parsedHours) && parsedHours > 0 ? Math.min(parsedHours, 8760) : 48;

    let token = '';
    if (item.customToken && String(item.customToken).trim()) {
      token = sanitizeCustomToken(item.customToken);
      if (token.length < 8) {
        throw { status: 400, message: 'Pasirinktas žetonas turi būti bent 8 simbolių (lotyniškos raidės, skaičiai, _ arba -).' };
      }
    } else {
      token = generateViewerToken(tokenType === 'classroom' ? 'aisff_cls' : 'aisff_live');
    }

    const tokenHash = await sha256Hex(token);
    const now = new Date();
    const expiresDate = new Date(now.getTime() + expiresInHours * 3600 * 1000);
    const nowIso = now.toISOString();
    const expiresAtIso = expiresDate.toISOString();

    const viewerDoc = {
      token,
      tokenHash,
      email,
      name,
      role,
      tokenType,
      classroomLabel: classroomLabel || (tokenType === 'classroom' ? name : ''),
      status: 'authorized',
      expiresInHours,
      createdAt: nowIso,
      expiresAt: expiresAtIso
    };

    const tokenDoc = {
      tokenHash,
      label: classroomLabel || name || email,
      email,
      role,
      tokenType,
      isActive: true,
      maxUses: tokenType === 'classroom' ? 200 : 5,
      currentUses: 0,
      createdAt: toFirestoreTimestamp(now),
      expiresAt: toFirestoreTimestamp(expiresDate)
    };

    return { token, tokenHash, viewerDoc, tokenDoc, expiresAtIso };
  }

  async function handleFirestoreRequest(db, operation, options = {}) {
    const body = parseBody(options.body);
    const adminEmail = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin_user_email')) ||
      body.adminEmail || 'azuolynasfilmfestival@gmail.com';

    switch (operation) {
      case 'live.status': {
        const snap = await db.collection('stream_config').doc('broadcast').get();
        const data = snap.exists ? normalizeDoc(snap) : {};
        return jsonResponse({
          streamState: data.streamState || (data.isLive ? 'live' : 'paused'),
          isLive: Boolean(data.isLive || data.streamState === 'live'),
          viewPermission: data.viewPermission || 'token_only',
          iframeUrl: data.iframeUrl || DEFAULT_IFRAME_URL,
          serverUrl: data.serverUrl || 'rtmps://live.cloudflare.com:443/live/',
          streamKey: data.streamKey || '',
          activeViewers: Number(data.activeViewers || 0),
          updatedAt: data.updatedAt || null
        });
      }

      case 'stream.status': {
        const state = ['live', 'paused', 'ended'].includes(body.state) ? body.state : 'paused';
        const nowIso = new Date().toISOString();
        const patch = {
          streamState: state,
          isLive: state === 'live',
          updatedAt: nowIso,
          updatedBy: adminEmail
        };
        const ref = db.collection('stream_config').doc('broadcast');
        await ref.set(patch, { merge: true });
        try {
          await db.collection('settings').doc('festival').set({
            streamLive: state === 'live',
            broadcastActive: state === 'live',
            streamState: state,
            updatedAt: nowIso
          }, { merge: true });
        } catch (_) {}
        await writeAdminLog(db, 'stream_status_changed', { state });
        const snap = await ref.get();
        const streamConfig = snap.exists ? normalizeDoc(snap) : patch;
        return jsonResponse({ success: true, streamConfig });
      }

      case 'stream.iframe-url':
      case 'stream.settings': {
        const nowIso = new Date().toISOString();
        const patch = { updatedAt: nowIso, updatedBy: adminEmail };
        if (typeof body.iframeUrl === 'string' && body.iframeUrl.trim()) {
          const rawUrl = body.iframeUrl.trim();
          if (!/^https:\/\//i.test(rawUrl)) {
            return jsonResponse({ error: 'Iframe nuoroda turi prasidėti https://' }, 400);
          }
          patch.iframeUrl = rawUrl;
        }
        if (typeof body.viewPermission === 'string' && ['token_only', 'public', 'restricted'].includes(body.viewPermission)) {
          patch.viewPermission = body.viewPermission;
        }
        if (typeof body.serverUrl === 'string' && body.serverUrl.trim()) {
          patch.serverUrl = body.serverUrl.trim();
        }
        if (typeof body.streamKey === 'string') {
          patch.streamKey = body.streamKey.trim();
        }
        await db.collection('stream_config').doc('broadcast').set(patch, { merge: true });
        await writeAdminLog(db, 'stream_settings_updated', {
          viewPermission: patch.viewPermission,
          hasIframe: Boolean(patch.iframeUrl)
        });
        return jsonResponse({ success: true, ...patch });
      }

      case 'submissions': {
        const snap = await db.collection('submissions').get();
        const submissions = snap.docs
          .map(normalizeDoc)
          .sort((a, b) => toMillis(b.submittedAt) - toMillis(a.submittedAt));
        return jsonResponse({ submissions });
      }

      case 'votingFilms': {
        const snap = await db.collection('submissions').where('inVoting', '==', true).get();
        const submissions = snap.docs.map(normalizeDoc);
        return jsonResponse({ submissions });
      }

      case 'stream.viewers': {
        const snap = await db.collection('live_viewers').get();
        const viewers = snap.docs
          .map(d => ({ token: d.id, ...normalizeDoc(d) }))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        return jsonResponse({ viewers });
      }

      case 'live.viewers': {
        let activeViewers = 0;
        try {
          const cfg = await db.collection('stream_config').doc('broadcast').get();
          if (cfg.exists && Number.isFinite(Number(cfg.data()?.activeViewers))) {
            activeViewers = Number(cfg.data().activeViewers);
          }
        } catch (_) {}
        try {
          const cutoff = Date.now() - 2 * 60 * 1000;
          const snap = await db.collection('live_viewers').get();
          let onlineCount = 0;
          snap.docs.forEach(d => {
            const data = d.data() || {};
            const seen = toMillis(data.lastSeenAt || data.heartbeatAt);
            if (seen >= cutoff) onlineCount++;
          });
          if (onlineCount > 0) activeViewers = onlineCount;
        } catch (_) {}
        return jsonResponse({ activeViewers });
      }

      case 'stream.viewers.create': {
        if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
          return jsonResponse({ error: 'Įveskite galiojantį el. pašto adresą.' }, 400);
        }
        let prepared;
        try {
          prepared = await createViewerRecords(db, body);
        } catch (err) {
          return jsonResponse({ error: err.message || 'Neteisingi žetono duomenys.' }, err.status || 400);
        }
        const batch = db.batch();
        batch.set(db.collection('live_viewers').doc(prepared.token), prepared.viewerDoc);
        batch.set(db.collection('stream_tokens').doc(prepared.tokenHash), prepared.tokenDoc);
        await batch.commit();

        let emailQueued = false;
        let emailWarning = '';
        if (body.sendEmail === true) {
          try {
            await queueLivePassMail(db, {
              to: prepared.viewerDoc.email,
              name: prepared.viewerDoc.classroomLabel || prepared.viewerDoc.name,
              token: prepared.token,
              lang: body.lang === 'en' ? 'en' : 'lt',
              expiresAtIso: prepared.expiresAtIso
            });
            emailQueued = true;
          } catch (mailErr) {
            emailWarning = mailErr?.message || 'Nepavyko įrašyti laiško į eilę';
          }
        }
        await writeAdminLog(db, 'stream_token_created', {
          tokenType: prepared.viewerDoc.tokenType,
          email: prepared.viewerDoc.email
        });
        return jsonResponse({ success: true, viewer: prepared.viewerDoc, emailQueued, emailWarning });
      }

      case 'stream.viewers.bulk-create': {
        const items = Array.isArray(body.items) ? body.items : [];
        if (items.length === 0) {
          return jsonResponse({ error: 'Pateikite bent vieną žiūrovo įrašą.' }, 400);
        }
        const viewers = [];
        for (let i = 0; i < items.length; i += 200) {
          const chunk = items.slice(i, i + 200);
          const batch = db.batch();
          for (const item of chunk) {
            const prepared = await createViewerRecords(db, item);
            batch.set(db.collection('live_viewers').doc(prepared.token), prepared.viewerDoc);
            batch.set(db.collection('stream_tokens').doc(prepared.tokenHash), prepared.tokenDoc);
            viewers.push(prepared.viewerDoc);
          }
          await batch.commit();
        }
        await writeAdminLog(db, 'stream_tokens_bulk_created', { count: viewers.length });
        return jsonResponse({ success: true, count: viewers.length, viewers });
      }

      case 'stream.viewers.update': {
        const token = String(body.token || '').trim();
        if (!token) return jsonResponse({ error: 'Nenurodytas žetonas.' }, 400);
        const tokenHash = await sha256Hex(token);
        const patch = { updatedAt: new Date().toISOString() };
        if (typeof body.name === 'string') patch.name = body.name.trim();
        if (typeof body.classroomLabel === 'string') patch.classroomLabel = body.classroomLabel.trim();
        if (typeof body.isActive === 'boolean') {
          patch.status = body.isActive ? 'authorized' : 'revoked';
        }
        const batch = db.batch();
        batch.set(db.collection('live_viewers').doc(token), patch, { merge: true });
        batch.set(db.collection('stream_tokens').doc(tokenHash), {
          ...(patch.classroomLabel ? { label: patch.classroomLabel } : (patch.name ? { label: patch.name } : {})),
          ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {})
        }, { merge: true });
        await batch.commit();
        return jsonResponse({ success: true });
      }

      case 'stream.viewers.delete': {
        const token = String(body.token || '').trim();
        if (!token) return jsonResponse({ error: 'Nenurodytas žetonas.' }, 400);
        const tokenHash = await sha256Hex(token);
        const batch = db.batch();
        batch.delete(db.collection('live_viewers').doc(token));
        batch.delete(db.collection('stream_tokens').doc(tokenHash));
        await batch.commit();
        await writeAdminLog(db, 'stream_token_deleted', { tokenPrefix: token.slice(0, 12) });
        return jsonResponse({ success: true });
      }

      case 'stream.viewers.regenerate': {
        const oldToken = String(body.token || '').trim();
        if (!oldToken) return jsonResponse({ error: 'Nenurodytas esamas žetonas.' }, 400);
        const oldSnap = await db.collection('live_viewers').doc(oldToken).get();
        if (!oldSnap.exists) return jsonResponse({ error: 'Žiūrovas nerastas.' }, 404);
        const existing = oldSnap.data() || {};
        const prepared = await createViewerRecords(db, {
          email: existing.email,
          name: existing.name,
          role: existing.role,
          tokenType: existing.tokenType,
          classroomLabel: existing.classroomLabel,
          expiresInHours: existing.expiresInHours || 48
        });
        const oldHash = await sha256Hex(oldToken);
        const batch = db.batch();
        batch.set(db.collection('live_viewers').doc(prepared.token), prepared.viewerDoc);
        batch.set(db.collection('stream_tokens').doc(prepared.tokenHash), prepared.tokenDoc);
        batch.delete(db.collection('live_viewers').doc(oldToken));
        batch.delete(db.collection('stream_tokens').doc(oldHash));
        await batch.commit();
        return jsonResponse({ success: true, viewer: prepared.viewerDoc });
      }

      case 'stream.viewers.resend': {
        const token = String(body.token || '').trim();
        if (!token) return jsonResponse({ error: 'Nenurodytas žetonas.' }, 400);
        const snap = await db.collection('live_viewers').doc(token).get();
        if (!snap.exists) return jsonResponse({ error: 'Žiūrovo įrašas nerastas.' }, 404);
        const viewer = normalizeDoc(snap);
        await queueLivePassMail(db, {
          to: viewer.email,
          name: viewer.classroomLabel || viewer.name,
          token,
          lang: body.lang === 'en' ? 'en' : 'lt',
          expiresAtIso: viewer.expiresAt || ''
        });
        await writeAdminLog(db, 'stream_token_resent', { email: viewer.email });
        return jsonResponse({ success: true, queued: true });
      }

      case 'resend-live-link': {
        const submissionId = String(body.submissionId || '').trim();
        if (!submissionId) return jsonResponse({ error: 'Nenurodytas paraiškos ID.' }, 400);
        const subRef = db.collection('submissions').doc(submissionId);
        const subSnap = await subRef.get();
        if (!subSnap.exists) return jsonResponse({ error: 'Paraiška nerasta.' }, 404);
        const sub = normalizeDoc(subSnap);
        const lang = sub.submissionLang === 'en' ? 'en' : 'lt';

        let token = String(sub.liveToken || '').trim();
        if (!token) {
          const prepared = await createViewerRecords(db, {
            email: sub.email,
            name: sub.name || [sub.directorFirstName, sub.directorLastName].filter(Boolean).join(' '),
            role: 'remote_participant',
            tokenType: 'individual',
            expiresInHours: 168
          });
          token = prepared.token;
          const liveLink = `${buildOrigin()}/live.html?t=${encodeURIComponent(token)}`;
          const batch = db.batch();
          batch.update(subRef, { liveToken: token, liveStreamUrl: liveLink });
          batch.set(db.collection('live_viewers').doc(token), {
            ...prepared.viewerDoc,
            filmTitle: sub.filmTitle || ''
          });
          batch.set(db.collection('stream_tokens').doc(prepared.tokenHash), prepared.tokenDoc);
          await batch.commit();
        } else {
          const tokenHash = await sha256Hex(token);
          const tokRef = db.collection('stream_tokens').doc(tokenHash);
          const tokSnap = await tokRef.get();
          if (!tokSnap.exists) {
            const now = new Date();
            const exp = new Date(now.getTime() + 168 * 3600 * 1000);
            await tokRef.set({
              tokenHash,
              label: sub.name || sub.filmTitle || sub.email,
              email: (sub.email || '').toLowerCase(),
              role: 'remote_participant',
              tokenType: 'individual',
              isActive: true,
              maxUses: 5,
              currentUses: 0,
              createdAt: toFirestoreTimestamp(now),
              expiresAt: toFirestoreTimestamp(exp)
            }, { merge: true });
          }
        }

        await queueLivePassMail(db, {
          to: sub.email,
          name: sub.name || [sub.directorFirstName, sub.directorLastName].filter(Boolean).join(' '),
          token,
          lang
        });
        await writeAdminLog(db, 'submission_live_link_resent', { submissionId, email: sub.email });
        return jsonResponse({ success: true, queued: true, token });
      }

      case 'live.verify-access': {
        const token = String(body.token || '').trim();
        if (!token) return jsonResponse({ valid: false, error: 'invalid' }, 400);
        const tokenHash = await sha256Hex(token);
        const tokSnap = await db.collection('stream_tokens').doc(tokenHash).get();
        if (tokSnap.exists) {
          const d = tokSnap.data() || {};
          const expMs = toMillis(d.expiresAt);
          if (d.isActive === false) return jsonResponse({ valid: false, error: 'revoked' }, 403);
          if (expMs && expMs < Date.now()) return jsonResponse({ valid: false, error: 'expired' }, 403);
          const cfgSnap = await db.collection('stream_config').doc('broadcast').get();
          const playbackUrl = cfgSnap.exists ? (cfgSnap.data()?.iframeUrl || DEFAULT_IFRAME_URL) : DEFAULT_IFRAME_URL;
          return jsonResponse({
            valid: true,
            tokenType: d.tokenType || 'individual',
            label: d.label || 'Žiūrovas',
            playbackUrl,
            expiresAt: normalizeDateValue(d.expiresAt)
          });
        }
        const viewerSnap = await db.collection('live_viewers').doc(token).get();
        if (viewerSnap.exists) {
          const v = viewerSnap.data() || {};
          return jsonResponse({
            valid: true,
            tokenType: v.tokenType || 'individual',
            label: v.classroomLabel || v.name || 'Žiūrovas',
            playbackUrl: DEFAULT_IFRAME_URL
          });
        }
        return jsonResponse({ valid: false, error: 'invalid' }, 404);
      }

      case 'live.heartbeat': {
        return jsonResponse({ success: true, timestamp: new Date().toISOString() });
      }

      case 'vote': {
        return jsonResponse({ error: 'Balsavimas vykdomas tiesiogiai per Firestore.' }, 400);
      }

      default:
        throw new Error(`Unknown server operation: ${operation}`);
    }
  }

  async function request(operation, options = {}) {
    const route = routes[operation];
    if (!route) throw new Error(`Unknown server operation: ${operation}`);

    const serverAvailable = await hasServerSafe();
    const db = getDb();
    if (serverAvailable === false && db) {
      return handleFirestoreRequest(db, operation, options);
    }
    if (serverAvailable === null && db && (!window.FestivalApi || typeof window.FestivalApi.hasServer !== 'function')) {
      return handleFirestoreRequest(db, operation, options);
    }
    if (serverAvailable === false && !db) {
      throw new Error('Firestore ryšys dar neparuoštas. Perkraukite puslapį ir bandykite dar kartą.');
    }

    const headers = { ...options.headers };
    const sessionToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_jwt_token') : null;
    const adminEmail = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_user_email') : null;
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
    if (adminEmail) headers['x-admin-email'] = adminEmail;
    let body = options.body;
    if (body !== undefined && typeof body !== 'string') body = JSON.stringify(body);
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    return fetch(route, { ...options, headers, body });
  }

  function subscribe(operation, select, callback, onError) {
    let stopped = false;
    let pending = false;
    async function refresh() {
      if (stopped || pending) return;
      pending = true;
      try {
        const response = await request(operation);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load live updates.');
        if (!stopped) callback(select(data));
      } catch (error) {
        if (!stopped) onError(error);
      } finally { pending = false; }
    }
    const timer = setInterval(refresh, 5000);
    refresh();
    return () => { stopped = true; clearInterval(timer); };
  }

  window.FirebaseClient = {
    request,
    subscribeStream(callback, onError = console.error) {
      return subscribe('live.status', data => data, callback, onError);
    },
    subscribeVotingFilms(callback, onError = console.error) {
      return subscribe('votingFilms', data => (data.submissions || []).filter(film => film.inVoting === true), callback, onError);
    }
  };
})();
