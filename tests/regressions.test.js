import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const templates = fs.readFileSync(new URL('../email-templates.js', import.meta.url), 'utf8');
function fixture(initial = {}, reject = () => false) {
  const store = new Map(Object.entries(initial));
  let counter = 0;
  function apply(writes) {
    for (const [kind, ref] of writes) if (reject(kind, ref.path)) throw new Error('permission-denied');
    for (const [kind, ref, data, options] of writes) {
      if (kind === 'delete') { store.delete(ref.path); continue; }
      if (kind === 'update' && !store.has(ref.path)) throw new Error('not-found');
      const value = kind === 'update' || options?.merge ? { ...store.get(ref.path), ...data } : { ...data };
      for (const [key, v] of Object.entries(value)) if (v?.sentinel === 'delete') delete value[key];
      store.set(ref.path, value);
    }
  }
  const snapshot = path => ({ id: path.split('/').at(-1), exists: store.has(path), data: () => store.get(path) });
  function doc(collection, id = `auto${++counter}`) {
    const path = `${collection}/${id}`;
    return { path, id, get: async () => snapshot(path),
      set: async (data, options) => apply([['set', {path}, data, options]]),
      update: async data => apply([['update', {path}, data]]),
      delete: async () => apply([['delete', {path}]]) };
  }
  function collection(name, filters = []) {
    const query = {
      doc: id => doc(name, id),
      add: async data => { const ref = doc(name); await ref.set(data); return ref; },
      where: (key, op, value) => collection(name, [...filters, [key, value]]),
      orderBy: () => query, limit: () => query,
      get: async () => ({ docs: [...store.keys()].filter(path => path.startsWith(name + '/') && filters.every(([key, value]) => store.get(path)[key] === value)).map(snapshot) })
    };
    return query;
  }
  function batch() {
    const writes = [];
    return { set: (ref,data,options) => writes.push(['set',ref,data,options]), update: (ref,data) => writes.push(['update',ref,data]), delete: ref => writes.push(['delete',ref]), commit: async () => apply(writes) };
  }
  const database = { collection, batch, runTransaction: async fn => {
    const transaction = batch(); transaction.get = ref => ref.get();
    await fn(transaction); await transaction.commit();
  } };
  const authCalls = [];
  const authentication = { currentUser: { email: 'azuolynasfilmfestival@gmail.com' }, sendPasswordResetEmail: async email => authCalls.push(email) };
  const storage = new Map();
  const context = vm.createContext({ console, crypto, URL, location: { origin: 'https://festival.example.test' },
    localStorage: { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value) },
    fetch() { assert.fail('Application operations must not make custom server requests'); },
    firebase: { firestore: { FieldValue: { serverTimestamp: () => ({sentinel:'timestamp'}), delete: () => ({sentinel:'delete'}) }, Timestamp: { fromMillis: millis => ({ toMillis: () => millis }) } } }
  });
  context.window = context;
  vm.runInContext(templates, context);
  return { context, store, database, authentication, authCalls };
}
const film = { name:'Test Participant', email:'applicant@example.test', filmTitle:'Test Film', category:'Category II',
  age:15, videoUrl:'https://example.test/film.mp4', deviceModel:'Phone', submittedAt:{sentinel:'timestamp'},
  submissionLang:'en', status:'submitted', inVoting:false, votesCount:0, attendanceType:'in_person' };

// Run the actual inline form handlers with synthetic DOM and Storage events.
function formFixture(lang, attendanceType = 'in_person', reject, storageFailure = false, staticHost = false) {
  const f = fixture({}, reject);
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set(id === 'formSuccessDisplay' ? ['d-none'] : []);
      elements.set(id, { value: '', style: {}, disabled: false, textContent: '', handlers: {},
        classList: {
          add: value => classes.add(value),
          remove: value => classes.delete(value),
          contains: value => classes.has(value),
          toggle: (value, force) => {
            const on = force !== undefined ? Boolean(force) : !classes.has(value);
            if (on) classes.add(value); else classes.delete(value);
            return on;
          }
        },
        addEventListener(event, handler) { this.handlers[event] = handler; }, reset() { this.wasReset = true; }
      });
    }
    return elements.get(id);
  }
  const fields = {
    participantName: film.name,
    directorFirstName: 'Test',
    directorLastName: 'Participant',
    cameraOperatorFirstName: 'Cam',
    cameraOperatorLastName: 'Op',
    participantEmail: film.email,
    participantAge: '15',
    participantCategory: film.category,
    countryCity: 'Test City',
    institution: 'Test School',
    filmTitle: film.filmTitle,
    deviceModel: film.deviceModel,
    synopsis: 'Test Synopsis'
  };
  Object.entries(fields).forEach(([id, value]) => { element(id).value = value; });
  const uploads = [], toasts = [], errors = [], apiCalls = [];
  const document = { getElementById: element, querySelector: () => ({ value: attendanceType }),
    querySelectorAll: () => [],
    createElement: () => ({ duration: 120 }) };
  class TestURL extends URL {
    static createObjectURL() { return 'blob:test'; }
    static revokeObjectURL() {}
  }
  Object.assign(f.context, { document, firestoreDb: f.database, showToast: (message, type) => toasts.push({message, type}),
    console: { ...console, error: error => errors.push(error) },
    fetch: async (route, options) => { apiCalls.push({route, body: JSON.parse(options.body)}); return {ok: true, json: async () => ({success: true})}; },
    URL: TestURL,
    storage: { ref: path => ({ put: () => {
      if (storageFailure) throw new Error('Storage unavailable');
      const task = { snapshot: { ref: { getDownloadURL: async () => film.videoUrl } },
        on: (event, progress, error, complete) => uploads.push({path, progress, error, complete}) };
      return task;
    } }) }
  });
  f.context.FestivalApi = { hasServer: async () => !staticHost, json: async (route, options) => {
    const res = await f.context.fetch(route, options); const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Server failed');
    return data;
  } };
  vm.runInContext(fs.readFileSync(new URL('../js/mail-client.js', import.meta.url), 'utf8'), f.context);
  const html = fs.readFileSync(new URL(`../${lang}/index.html`, import.meta.url), 'utf8');
  const start = html.indexOf('    let pendingSubmission = null;');
  assert.ok(start > 0, 'Form handler must be present');
  vm.runInContext(html.slice(start, html.indexOf('</script>', start)), f.context);
  vm.runInContext("verifiedVideoFile = { name: 'test.mp4' }; videoDurationSeconds = 120;", f.context);
  const submit = () => element('submissionForm').handlers.submit({ preventDefault() {} });
  return { ...f, element, submit, uploads, toasts, errors, apiCalls };
}


for (const lang of ['lt', 'en']) {
  for (const attendance of ['in_person', 'remote']) {
    test(`${lang}/${attendance} form records the film and asks the server to dispatch notifications`, async () => {
      const f = formFixture(lang, attendance);
      await f.submit();
      await f.submit();
      assert.equal(f.uploads.length, 1);
      await f.uploads[0].complete();
      assert.equal([...f.store.keys()].filter(path => path.startsWith('submissions/')).length, 1);
      assert.equal([...f.store.keys()].filter(path => path.startsWith('live_viewers/')).length, attendance === 'remote' ? 1 : 0);
      assert.equal([...f.store.keys()].filter(path => path.startsWith('mail/')).length, 0, 'The client must not duplicate the server emails');
      assert.equal(f.apiCalls.length, 1);
      assert.equal(f.apiCalls[0].route, '/api/submissions/record');
      assert.equal(f.apiCalls[0].body.submissionLang, lang);
      assert.equal(f.apiCalls[0].body.email, film.email);
      assert.equal(f.errors.length, 0);
      assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), false);
      f.context.resetFormView();
      assert.equal(f.element('submissionForm').wasReset, true);
    });
  }
  test(`${lang} form shows server notification failures and allows retry`, async () => {
    const f = formFixture(lang, 'in_person', (kind, path) => path.startsWith('submissions/') && f.store.has(path));
    f.context.fetch = async () => ({ok: false, json: async () => ({success: false, error: 'Queue rejected'})});
    await f.submit(); await f.uploads[0].complete();
    assert.equal(f.toasts.at(-1).type, 'error');
    assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), true);
    assert.equal(f.element('submitBtn').disabled, false);
    assert.equal(f.element('progressContainer').classList.contains('active'), false);
    // Anonymous submissions cannot update the film they already created.
    f.context.fetch = async () => ({ok: true, json: async () => ({success: true})});
    await f.submit();
    assert.equal(f.uploads.length, 1);
    assert.equal([...f.store.keys()].filter(path => path.startsWith('submissions/')).length, 1);
    assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), false);
  });
  test(`${lang} form recovers from upload failure before creating documents`, async () => {
    const f = formFixture(lang);
    await f.submit(); f.uploads[0].error(new Error('Upload rejected'));
    assert.equal(f.store.size, 0);
    assert.equal(f.apiCalls.length, 0);
    assert.equal(f.element('submitBtn').disabled, false);
    assert.equal(f.element('progressContainer').classList.contains('active'), false);
  });
}

test('live player adapter calls the restored server and forwards request bodies', async () => {
  const calls = [];
  const context = vm.createContext({console, sessionStorage: {getItem: () => null},
    fetch: async (route, options) => {calls.push({route, options}); return {ok: true};} });
  context.window = context;
  vm.runInContext(fs.readFileSync(new URL('../js/firebase-client.js', import.meta.url), 'utf8'), context);
  await context.FirebaseClient.request('stream.iframe-url', {method: 'POST', body: {iframeUrl: 'https://example.test/player', adminEmail: film.email}});
  assert.equal(calls[0].route, '/api/admin/stream/iframe-url');
  assert.equal(JSON.parse(calls[0].options.body).iframeUrl, 'https://example.test/player');
  await assert.rejects(context.FirebaseClient.request('unknown'), /Unknown server operation/);
});

test('API identity wrapper attaches Firebase tokens only to same-origin API requests', async () => {
  const calls = [];
  const context = vm.createContext({URL, Headers, Request, sessionStorage: {getItem: () => 'session-token'},
    location: {href: 'https://festival.example.test/admin.html', origin: 'https://festival.example.test', hostname: 'festival.example.test'},
    firebase: {auth: () => ({currentUser: {getIdToken: async () => 'verified-id-token'}})},
    fetch: async (route, options) => {calls.push({route, options}); return {ok: true};} });
  context.window = context;
  vm.runInContext(fs.readFileSync(new URL('../js/server-api.js', import.meta.url), 'utf8'), context);
  await context.fetch('/api/admin/users');
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer verified-id-token');
  await context.fetch('https://outside.example.test/api/users');
  assert.equal(calls[1].options.headers, undefined);
  context.firebase.auth = () => ({currentUser: null});
  await context.fetch('/api/admin/users');
  assert.equal(calls[2].options.headers.get('Authorization'), 'Bearer session-token');
});

for (const lang of ['lt', 'en']) {
  for (const attendance of ['in_person', 'remote']) {
    test(`${lang}/${attendance} static form commits film and two extension emails atomically`, async () => {
      const f = formFixture(lang, attendance, undefined, false, true);
      await f.submit(); await f.uploads[0].complete();
      const mails = [...f.store.entries()].filter(([path]) => path.startsWith('mail/'));
      assert.equal(mails.length, 2);
      assert.equal(f.apiCalls.length, 0);
      assert.equal(f.errors.length, 0);
      for (const [, mail] of mails) {
        assert.ok(Array.isArray(mail.to));
        assert.equal(mail.from, undefined);
        assert.equal(typeof mail.replyTo, 'string');
        for (const value of Object.values(mail.message)) assert.equal(typeof value, 'string');
      }
      assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), false);
    });
  }
  test(`${lang} static mail denial rolls back film and viewer, retry reuses upload and ID`, async () => {
    let reject = true;
    const f = formFixture(lang, 'remote', (kind, path) => reject && path.startsWith('mail/'), false, true);
    await f.submit(); await f.uploads[0].complete();
    assert.equal(f.store.size, 0);
    assert.equal(f.element('submitBtn').disabled, false);
    reject = false;
    await f.submit();
    assert.equal(f.uploads.length, 1);
    assert.equal(f.store.size, 4);
    assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), false);
  });
}

test('mail client rejects malformed extension values before writing', async () => {
  const f = fixture();
  vm.runInContext(fs.readFileSync(new URL('../js/mail-client.js', import.meta.url), 'utf8'), f.context);
  for (const payload of [{to: 'bad'}, {to: ['good@example.test', 123]}, {to: 'a@example.test', subject: []},
    {to: 'a@example.test', html: {}}, {to: 'a@example.test', replyTo: []}]) {
    assert.throws(() => f.context.MailClient.buildMail({subject: 'Test', html: '<p>Test</p>', ...payload}));
  }
  assert.equal(f.store.size, 0);
});

test('API transport detects static HTML before mail POST and reports unexpected HTML clearly', async () => {
  let calls = [];
  const context = vm.createContext({URL, Headers, Request, sessionStorage: {getItem: () => null},
    location: {href: 'https://festival.example.test/en/', origin: 'https://festival.example.test', hostname: 'festival.example.test'},
    fetch: async (url, options) => { calls.push({url, options}); return new Response('<html>404</html>', {status: 404, headers: {'Content-Type': 'text/html'}}); } });
  context.window = context;
  vm.runInContext(fs.readFileSync(new URL('../js/server-api.js', import.meta.url), 'utf8'), context);
  assert.equal(await context.FestivalApi.hasServer(), false);
  assert.equal(calls[0].url, '/health');
  await assert.rejects(context.FestivalApi.json('/api/admin/email/test'), /API nepasiekiamas/);
  context.FESTIVAL_API_BASE_URL = 'https://backend.example.test/';
  await context.fetch('/api/admin/users');
  assert.equal(calls.at(-1).url, 'https://backend.example.test/api/admin/users');
});

function emailSettingsFixture(reject) {
  const f = fixture({}, reject), elements = new Map(), toasts = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, {value: '', textContent: '', disabled: false, hidden: false, children: [],
      replaceChildren() {this.children = [];}, appendChild(child) {this.children.push(child);},
      classList: {add() {}, remove() {}}, addEventListener() {}});
    return elements.get(id);
  };
  let snapshotCallback;
  const collection = f.database.collection;
  f.database.collection = name => {
    const query = collection(name);
    query.onSnapshot = callback => { snapshotCallback = callback; return () => {}; };
    return query;
  };
  Object.assign(f.context, {db: f.database, auth: f.authentication, PRIMARY_SUPERADMIN_EMAIL: 'azuolynasfilmfestival@gmail.com',
    AUTHORIZED_ADMIN_EMAILS: ['azuolynasfilmfestival@gmail.com','karina.brdar@gmail.com'],
    sessionStorage: {getItem: () => 'karina.brdar@gmail.com'}, showToast: (message, type) => toasts.push({message, type}),
    FestivalApi: {hasServer: async () => false},
    document: {getElementById: element, createElement: () => ({textContent: ''})}});
  vm.runInContext(fs.readFileSync(new URL('../js/mail-client.js', import.meta.url), 'utf8'), f.context);
  vm.runInContext(fs.readFileSync(new URL('../js/settings.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), f.context);
  return {...f, element, toasts, snapshot: docs => snapshotCallback({docs: docs.map(data => ({data: () => data}))})};
}

test('static admin test/direct send queues valid email and exposes delivery success and errors', async () => {
  const f = emailSettingsFixture();
  await f.context.refreshEmailStatusDisplay();
  assert.equal(f.element('smtpConfigDrawer').hidden, true);
  assert.equal(f.element('smtpStatusBadge').textContent, 'Firestore laiškų eilė');
  f.element('testEmailRecipient').value = 'test@example.test';
  await f.context.handleSendTestEmail();
  assert.equal(f.store.size, 1);
  assert.equal(f.toasts.at(-1).type, 'success');
  assert.match(f.toasts.at(-1).message, /eilę/);
  f.element('directEmailRecipient').value = 'direct@example.test';
  f.element('directEmailTemplate').value = 'custom';
  f.element('directEmailLang').value = 'en';
  f.element('directEmailSubject').value = 'Custom test';
  f.element('directEmailBody').value = '<script>bad</script>\nSecond line';
  await f.context.handleSendDirectEmail();
  assert.equal(f.store.size, 2);
  const mail = [...f.store.values()][1];
  assert.match(mail.message.html, /&lt;script&gt;/);
  assert.ok(!mail.message.html.includes('<script>'));
  f.snapshot([{to: ['direct@example.test'], message: {subject: 'Test'}, delivery: {state: 'SUCCESS'}},
    {to: ['failed@example.test'], message: {subject: 'Failed'}, delivery: {state: 'ERROR', error: 'SMTP rejected'}}]);
  assert.match(f.element('emailDeliveryLog').children[0].textContent, /Pristatyta pašto serveriui/);
  assert.match(f.element('emailDeliveryLog').children[1].textContent, /Siuntimo klaida: SMTP rejected/);
});

test('static admin mail denial is visible and restores send button', async () => {
  const f = emailSettingsFixture(() => true);
  f.element('testEmailRecipient').value = 'test@example.test';
  await f.context.handleSendTestEmail();
  assert.equal(f.store.size, 0);
  assert.equal(f.toasts.at(-1).type, 'error');
  assert.equal(f.element('btnSendTestEmail').disabled, false);
});

for (const lang of ['lt', 'en']) {
  test(`${lang} public listeners query only published films and merge winner updates`, () => {
    const subscriptions = new Map();
    const context = vm.createContext({console, filmsCache: [], document: {getElementById: () => ({classList: {remove() {}}})},
      renderWinnersSection() {}, renderFilmsGallery() {}, firestoreDb: {collection: name => {
        assert.equal(name, 'submissions');
        return {where: (field, operator, value) => {
          assert.equal(operator, '=='); assert.equal(value, true);
          return {onSnapshot: callback => subscriptions.set(field, callback)};
        }};
      }}});
    context.window = context;
    const html = fs.readFileSync(new URL(`../${lang}/index.html`, import.meta.url), 'utf8');
    const start = html.indexOf('    if (firestoreDb) {\n      const publicFilms');
    vm.runInContext(html.slice(start, html.indexOf('    function renderWinnersSection()', start)), context);
    assert.deepEqual([...subscriptions.keys()], ['inVoting', 'isWinner']);
    const snapshot = films => ({forEach: callback => films.forEach(film => callback({id:film.id, data:()=>film}))});
    subscriptions.get('inVoting')(snapshot([{id:'shared',inVoting:true}]));
    subscriptions.get('isWinner')(snapshot([{id:'shared',inVoting:true,isWinner:true},{id:'winner',isWinner:true}]));
    assert.equal(context.filmsCache.length, 2);
    subscriptions.get('inVoting')(snapshot([]));
    subscriptions.get('isWinner')(snapshot([{id:'winner',isWinner:true}]));
    assert.equal(context.filmsCache.length, 1);
    assert.equal(context.filmsCache[0].id, 'winner');
  });
}

for (const lang of ['lt', 'en']) {
  test(`${lang} author validation rejects missing/half-filled roles & bad email, accepts valid crew`, () => {
    const f = formFixture(lang);
    assert.equal(f.context.validateStep1(), true);

    // Missing director last name (spaces only)
    f.element('directorLastName').value = '   ';
    assert.equal(f.context.validateStep1(), false);
    assert.ok(f.element('err_directorLastName').textContent.length > 0);
    f.element('directorLastName').value = 'Participant';

    // Half-filled optional role (Idea Author first name without last name)
    f.element('ideaAuthorFirstName').value = 'Jonas';
    f.element('ideaAuthorLastName').value = '';
    assert.equal(f.context.validateStep1(), false);
    assert.ok(f.element('err_ideaAuthor').textContent.length > 0);
    f.element('ideaAuthorLastName').value = 'Jonaitis';

    // Half-filled screenwriter role
    f.element('screenwriterFirstName').value = '';
    f.element('screenwriterLastName').value = 'Petraitis';
    assert.equal(f.context.validateStep1(), false);
    assert.ok(f.element('err_screenwriter').textContent.length > 0);
    f.element('screenwriterFirstName').value = 'Petras';

    // Bad email format
    f.element('participantEmail').value = 'not-an-email';
    assert.equal(f.context.validateStep1(), false);
    assert.ok(f.element('err_participantEmail').textContent.length > 0);
    f.element('participantEmail').value = 'valid.creator@example.test';

    assert.equal(f.context.validateStep1(), true);
  });

  test(`${lang} video & link validator enforces format, size, duration, resolution, and HTTPS rules`, () => {
    const mockVideos = [];
    const f = formFixture(lang);
    f.context.document.createElement = () => {
      const el = { preload: '', src: '', duration: 90, videoWidth: 1280, videoHeight: 720, onloadedmetadata: null, onerror: null };
      mockVideos.push(el);
      return el;
    };

    // Invalid format (.avi)
    f.context.validateSelectedVideoFile({ name: 'bad.avi', type: 'video/x-msvideo', size: 1024 * 1024 });
    assert.match(f.element('uploadFeedback').textContent, /MP4|MOV|WEBM/i);
    assert.equal(f.element('submitBtn').disabled, false);

    // Unsupported MIME even with .mp4 extension
    f.context.validateSelectedVideoFile({ name: 'spoofed.mp4', type: 'video/x-msvideo', size: 1024 * 1024 });
    assert.match(f.element('uploadFeedback').textContent, /MP4|MOV|WEBM/i);
    assert.ok(f.element('uploadFeedback').className.includes('error'));

    // Empty file (0 B) fails
    f.context.validateSelectedVideoFile({ name: 'empty.mp4', type: 'video/mp4', size: 0 });
    assert.ok(f.element('uploadFeedback').className.includes('error'));

    // Large file (> 300 MB) in valid format is accepted when duration and resolution pass
    mockVideos.length = 0;
    f.context.validateSelectedVideoFile({ name: 'huge.mp4', type: 'video/mp4', size: 850 * 1024 * 1024 });
    mockVideos[0].duration = 120;
    mockVideos[0].videoWidth = 1920;
    mockVideos[0].videoHeight = 1080;
    mockVideos[0].onloadedmetadata();
    assert.ok(f.element('uploadFeedback').className.includes('success'));

    // Duration > 180s
    mockVideos.length = 0;
    f.context.validateSelectedVideoFile({ name: 'toolong.mp4', type: 'video/mp4', size: 5 * 1024 * 1024 });
    mockVideos[0].duration = 210;
    mockVideos[0].onloadedmetadata();
    assert.match(f.element('uploadFeedback').textContent, /180/);

    // Resolution too low (160x120)
    mockVideos.length = 0;
    f.context.validateSelectedVideoFile({ name: 'tiny.mp4', type: 'video/mp4', size: 2 * 1024 * 1024 });
    mockVideos[0].duration = 60;
    mockVideos[0].videoWidth = 160;
    mockVideos[0].videoHeight = 120;
    mockVideos[0].onloadedmetadata();
    assert.match(f.element('uploadFeedback').textContent, /320/);

    // Corrupt metadata error
    mockVideos.length = 0;
    f.context.validateSelectedVideoFile({ name: 'corrupt.mp4', type: 'video/mp4', size: 2 * 1024 * 1024 });
    mockVideos[0].onerror();
    assert.ok(f.element('uploadFeedback').className.includes('error'));

    // Valid video passes
    mockVideos.length = 0;
    f.context.validateSelectedVideoFile({ name: 'valid_film.mov', type: 'video/quicktime', size: 12 * 1024 * 1024 });
    mockVideos[0].duration = 145;
    mockVideos[0].videoWidth = 1920;
    mockVideos[0].videoHeight = 1080;
    mockVideos[0].onloadedmetadata();
    assert.ok(f.element('uploadFeedback').className.includes('success'));

    // Video link checks
    assert.equal(f.context.validateVideoLinkValue('http://youtube.com/watch?v=123').valid, false);
    assert.equal(f.context.validateVideoLinkValue('https://unknown-site.example/video').valid, false);
    assert.equal(f.context.validateVideoLinkValue('https://youtu.be/dQw4w9WgXcQ').valid, true);
    assert.equal(f.context.validateVideoLinkValue('https://cdn.example.test/movie.mp4').valid, true);
  });

  test(`${lang} submission page displays central response-time notice`, () => {
    const html = fs.readFileSync(new URL(`../${lang}/index.html`, import.meta.url), 'utf8');
    assert.match(html, /id="submissionResponseNotice"/);
    assert.match(html, /id="submissionResponseTimeValue"/);
    assert.match(html, /SUBMISSION_RESPONSE_CONFIG/);
  });
}

test('PDF generator produces valid PDF with all author roles and video metadata, and plain-text summary matches', async () => {
  const { generateSubmissionPdf } = await import('../pdf-generator.js');
  const sampleRecord = {
    id: 'sub_test_pdf_1',
    submissionLang: 'lt',
    submittedAt: '2027-01-15T12:00:00.000Z',
    directorFirstName: 'Jonas',
    directorLastName: 'Kazlauskas',
    cameraOperatorFirstName: 'Mantas',
    cameraOperatorLastName: 'Petrauskas',
    ideaAuthorFirstName: 'Greta',
    ideaAuthorLastName: 'Vaitkutė',
    screenwriterFirstName: 'Lukasz',
    screenwriterLastName: 'Nowak',
    email: 'jonas@example.test',
    age: 16,
    category: 'II Kategorija (14-18 m.)',
    location: 'Kaunas, Lietuva',
    institution: 'Kauno Gimnazija',
    filmTitle: 'Šviesos Kelias',
    deviceModel: 'iPhone 15',
    synopsis: 'Trumpas pasakojimas apie pašaukimą.',
    videoSourceType: 'upload',
    videoFileName: 'sviesos_kelias.mp4',
    videoSizeBytes: 25 * 1024 * 1024,
    videoDurationSeconds: 142,
    videoResolution: '1920x1080',
    videoUrl: 'https://storage.example.test/sviesos_kelias.mp4',
    attendanceType: 'remote',
    liveToken: 'live_abcd1234',
    liveStreamUrl: 'https://festival.example.test/live.html?t=live_abcd1234',
    responseTimeText: 'per 5 darbo dienas'
  };

  const pdf = await generateSubmissionPdf(sampleRecord);
  assert.ok(Buffer.isBuffer(pdf.buffer));
  assert.ok(pdf.buffer.subarray(0, 5).toString('utf8') === '%PDF-');
  assert.ok(pdf.sizeBytes > 1000);
  assert.equal(pdf.filename, 'Jonas_Kazlauskas_-_Sviesos_Kelias.pdf');

  const plain = vm.runInNewContext(`${templates}\ngenerateSubmissionPlainText('adminNotification', 'lt', ${JSON.stringify(sampleRecord)})`);
  assert.match(plain, /Jonas Kazlauskas/);
  assert.match(plain, /Mantas Petrauskas/);
  assert.match(plain, /Greta Vaitkutė/);
  assert.match(plain, /Lukasz Nowak/);
  assert.match(plain, /jonas@example\.test/);
  assert.match(plain, /sviesos_kelias\.mp4/);
  assert.match(plain, /1920x1080/);
  assert.match(plain, /per 5 darbo dienas/);
});

test('live Top-5 leaderboard widget ranks existing films accurately in voting-and-winners.js and voting.html', () => {
  const leaderboardWidget = { innerHTML: '', classes: new Set(['is-empty']), classList: { add: c => leaderboardWidget.classes.add(c), remove: c => leaderboardWidget.classes.delete(c) } };
  const galleryContainer = { innerHTML: '' };
  const statusBanner = { className: '', innerHTML: '' };
  const docMap = new Map([
    ['votingLeaderboardWidget', leaderboardWidget],
    ['filmsGalleryContainer', galleryContainer],
    ['voterStatusBanner', statusBanner]
  ]);
  const ctx = vm.createContext({
    console,
    URL,
    localStorage: { getItem: () => null, setItem: () => {} },
    fetch: async () => ({ ok: false }),
    document: { getElementById: (id) => docMap.get(id) || null, querySelectorAll: () => [] },
    showToast: () => {}
  });
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(new URL('../js/voting-and-winners.js', import.meta.url), 'utf8'), ctx);

  const sampleFilms = [
    { id: 'f1', filmTitle: 'Alpha Film', name: 'Dir A', category: 'Category I', inVoting: true, votesCount: 3 },
    { id: 'f2', filmTitle: 'Beta Film', name: 'Dir B', category: 'Category II', inVoting: true, votesCount: 19 },
    { id: 'f3', filmTitle: 'Gamma Film', name: 'Dir C', category: 'Category II', inVoting: true, votesCount: 12 },
    { id: 'f4', filmTitle: 'Delta Film', name: 'Dir D', category: 'Category I', inVoting: true, votesCount: 25 },
    { id: 'f5', filmTitle: 'Epsilon Film', name: 'Dir E', category: 'Category II', inVoting: true, votesCount: 8 },
    { id: 'f6', filmTitle: 'Zeta Film', name: 'Dir F', category: 'Category I', inVoting: true, votesCount: 15 },
    { id: 'f7', filmTitle: 'Hidden Draft', name: 'Dir G', category: 'Category I', inVoting: false, votesCount: 99 }
  ];

  ctx.FestivalVoting.render(sampleFilms, 'en');
  assert.equal(leaderboardWidget.classes.has('is-empty'), false);
  const buttonsCount = (leaderboardWidget.innerHTML.match(/class="lb-row-btn/g) || []).length;
  assert.equal(buttonsCount, 5);
  assert.ok(leaderboardWidget.innerHTML.indexOf('Delta Film') < leaderboardWidget.innerHTML.indexOf('Beta Film'));
  assert.ok(leaderboardWidget.innerHTML.indexOf('Beta Film') < leaderboardWidget.innerHTML.indexOf('Zeta Film'));
  assert.ok(leaderboardWidget.innerHTML.indexOf('Zeta Film') < leaderboardWidget.innerHTML.indexOf('Gamma Film'));
  assert.ok(leaderboardWidget.innerHTML.indexOf('Gamma Film') < leaderboardWidget.innerHTML.indexOf('Epsilon Film'));
  assert.doesNotMatch(leaderboardWidget.innerHTML, /Alpha Film/);
  assert.doesNotMatch(leaderboardWidget.innerHTML, /Hidden Draft/);

  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  assert.match(votingHtml, /id="liveLeaderboardWidget"/);
  assert.match(votingHtml, /function renderLeaderboard\(\)/);

  const ltIndexHtml = fs.readFileSync(new URL('../lt/index.html', import.meta.url), 'utf8');
  const enIndexHtml = fs.readFileSync(new URL('../en/index.html', import.meta.url), 'utf8');
  assert.match(ltIndexHtml, /id="votingLeaderboardWidget"/);
  assert.match(enIndexHtml, /id="votingLeaderboardWidget"/);
});

test('admin panel displays complete submission dossier fields and PDF download trigger', () => {
  const adminHtml = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  const subsJs = fs.readFileSync(new URL('../js/submissions.js', import.meta.url), 'utf8');
  for (const id of ['mSubId', 'mSubmittedAt', 'mDirFirst', 'mDirLast', 'mCamFirst', 'mCamLast', 'mIdeaFirst', 'mIdeaLast', 'mWriterFirst', 'mWriterLast', 'mEmail', 'mAttendanceType', 'mLiveToken', 'mVideoFileName', 'mVideoSize', 'mResolution', 'mPdfFilename', 'mDownloadPdfBtn']) {
    assert.ok(adminHtml.includes(`id="${id}"`), `Missing #${id} in admin.html`);
  }
  assert.match(subsJs, /formatSubmissionDate/);
  assert.match(subsJs, /\/api\/admin\/submissions\/pdf/);
});

test('privacy, stream token, and UI visibility invariants hold across HTML, JS, and server', () => {
  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  const liveHtml = fs.readFileSync(new URL('../live.html', import.meta.url), 'utf8');
  const adminHtml = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  const ltFaqHtml = fs.readFileSync(new URL('../lt/faq.html', import.meta.url), 'utf8');
  const enFaqHtml = fs.readFileSync(new URL('../en/faq.html', import.meta.url), 'utf8');
  const streamAdminJs = fs.readFileSync(new URL('../js/stream-admin.js', import.meta.url), 'utf8');
  const authJs = fs.readFileSync(new URL('../js/auth.js', import.meta.url), 'utf8');
  const serverJs = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

  assert.doesNotMatch(votingHtml, /admin\.html/i);
  assert.doesNotMatch(votingHtml, /AISFF 2027/);
  assert.doesNotMatch(ltFaqHtml, /admin\.html/i);
  assert.doesNotMatch(enFaqHtml, /admin\.html/i);
  assert.doesNotMatch(liveHtml, /\|\|\s*35/);
  assert.doesNotMatch(adminHtml, /newViewerMaxDevices/);
  assert.doesNotMatch(adminHtml, /user@example\.com/);
  const loginOverlaySection = adminHtml.slice(adminHtml.indexOf('id="loginOverlay"'), adminHtml.indexOf('id="adminApp"'));
  assert.doesNotMatch(loginOverlaySection, /azuolynasfilmfestival@gmail\.com/);
  assert.doesNotMatch(loginOverlaySection, /karina\.brdar@gmail\.com/);
  assert.doesNotMatch(authJs, /karina\.brdar@gmail\.com/);
  assert.doesNotMatch(authJs, /azuolynasfilmfestival@gmail\.com/);
  assert.doesNotMatch(streamAdminJs, /newViewerMaxDevices/);
  assert.doesNotMatch(serverJs, /maxConcurrentDevices\s*\|\|\s*35/);
});

test('voting.html queries only published/winner submissions and firestore.rules protects PII', () => {
  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  assert.doesNotMatch(votingHtml, /db\.collection\(["']submissions["']\)\.onSnapshot/);
  assert.match(votingHtml, /db\.collection\(["']submissions["']\)\.where\(field,\s*["']==["'],\s*true\)/);
  assert.match(votingHtml, /["']festival["'],\s*["']global["']/);

  const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /email_verified == true/);
  assert.match(rules, /resource\.data\.inVoting == true \|\|\s*resource\.data\.isWinner == true/);
  const subsBlock = rules.slice(rules.indexOf('match /submissions/{submissionId}'), rules.indexOf('match /stream_config/{configId}'));
  assert.doesNotMatch(subsBlock, /allow get, list: if true;/);
});

test('header 2026/2027 navigation routes match active language across LT, EN, and voting pages', () => {
  const ltPages = [
    '../lt/index.html',
    '../lt/azuolynas-fest-2026.html',
    '../lt/azuolynas-fest-2027.html',
    '../lt/azuolynas-festival-2026.html',
    '../lt/faq.html',
    '../lt/privatumo-politika.html',
    '../lt/naudojimosi-taisykles.html'
  ];
  for (const rel of ltPages) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    const navMatch = html.match(/<nav class="header-edition-nav"[\s\S]*?<\/nav>/);
    assert.ok(navMatch, `Missing .header-edition-nav in ${rel}`);
    assert.match(navMatch[0], /href="azuolynas-fest-2027\.html"/, `LT 2027 link invalid in ${rel}`);
    assert.match(navMatch[0], /href="azuolynas-fest-2026\.html"/, `LT 2026 link invalid in ${rel}`);
    assert.doesNotMatch(navMatch[0], /\.\.\/en\//, `LT edition nav leaked EN path in ${rel}`);
  }

  const enPages = [
    '../en/index.html',
    '../en/azuolynas-fest-2026.html',
    '../en/azuolynas-fest-2027.html',
    '../en/faq.html',
    '../en/privacy-policy.html',
    '../en/terms-of-service.html'
  ];
  for (const rel of enPages) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    const navMatch = html.match(/<nav class="header-edition-nav"[\s\S]*?<\/nav>/);
    assert.ok(navMatch, `Missing .header-edition-nav in ${rel}`);
    assert.match(navMatch[0], /href="azuolynas-fest-2027\.html"/, `EN 2027 link invalid in ${rel}`);
    assert.match(navMatch[0], /href="azuolynas-fest-2026\.html"/, `EN 2026 link invalid in ${rel}`);
    assert.doesNotMatch(navMatch[0], /\.\.\/lt\//, `EN edition nav leaked LT path in ${rel}`);
  }

  const legacy2026 = fs.readFileSync(new URL('../lt/azuolynas-festival-2026.html', import.meta.url), 'utf8');
  assert.match(legacy2026, /href="\.\.\/en\/azuolynas-fest-2026\.html"/);

  const root2027 = fs.readFileSync(new URL('../azuolynas-fest-2027.html', import.meta.url), 'utf8');
  assert.match(root2027, /href="lt\/privatumo-politika\.html"/);
  assert.match(root2027, /href="lt\/naudojimosi-taisykles\.html"/);

  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  assert.match(votingHtml, /id="navFest2027"/);
  assert.match(votingHtml, /id="navFest2026"/);
  assert.match(votingHtml, /id="drawerNavFest2027"/);
  assert.match(votingHtml, /id="drawerNavFest2026"/);
  assert.match(votingHtml, /const langPrefix = currentLang === "lt" \? "lt\/" : "en\/";/);
  assert.doesNotMatch(votingHtml, /AISFF 2027/);
});

test('admin panel exposes unified Turinys (Content) tab with year pills, multi-photo gallery, and SEO fields', () => {
  const adminHtml = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  const adminMainJs = fs.readFileSync(new URL('../js/admin-main.js', import.meta.url), 'utf8');
  const contentJs = fs.readFileSync(new URL('../js/content.js', import.meta.url), 'utf8');

  assert.match(adminHtml, /id="tabContentBtn"[\s\S]*?>[\s\S]*?<span>Turinys<\/span>[\s\S]*?<\/button>/);
  for (const id of [
    'tabContentBtn', 'contentTab', 'contentYearTabs', 'contentNewYearInput',
    'contentAddYearBtn', 'contentDeleteYearBtn', 'contentSelectFilesBtn',
    'cntStory', 'cntStoryEn', 'cntSeoTitle', 'cntSeoDescription',
    'contentMultiPhotoInput', 'contentPhotosGrid', 'saveContentBtn', 'contentStickySaveBtn'
  ]) {
    assert.ok(adminHtml.includes(`id="${id}"`), `Missing #${id} in admin.html`);
  }
  assert.match(adminHtml, /id="contentMultiPhotoInput"[^>]*multiple/);
  assert.match(adminMainJs, /from ["']\.\/content\.js["']/);
  assert.match(adminMainJs, /showOnlyTabContent\(["']contentTab["']\)/);
  assert.match(adminMainJs, /initContent\(\)/);
  assert.match(contentJs, /export function initContent/);
  assert.match(contentJs, /export function subscribeContent/);
  assert.match(contentJs, /db\.collection\(["']content["']\)\.doc\(key\)\.set/);
});

test('content.js saves unified content/2028 + mirror editions/2028 and falls back cleanly on image upload', async () => {
  const f = fixture();
  const elements = new Map();
  function makeEl(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      const attrs = {};
      elements.set(id, {
        id,
        value: '',
        src: '',
        href: '',
        innerHTML: '',
        textContent: '',
        disabled: false,
        handlers: {},
        style: {},
        setAttribute(k, v) { attrs[k] = String(v); },
        getAttribute(k) { return attrs[k]; },
        dispatchEvent() {},
        classList: {
          add: c => classes.add(c),
          remove: c => classes.delete(c),
          contains: c => classes.has(c),
          toggle: (c, force) => (force === undefined ? (classes.has(c) ? !classes.delete(c) : !!classes.add(c)) : (force ? !!classes.add(c) : !classes.delete(c)))
        },
        addEventListener(evt, fn) { this.handlers[evt] = fn; },
        click() { if (this.handlers.click) this.handlers.click({ target: this, stopPropagation() {}, preventDefault() {} }); }
      });
    }
    return elements.get(id);
  }

  const toasts = [];
  const apiCalls = [];
  const dispatched = [];
  class MockFileReader {
    readAsDataURL() {
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      if (this.onload) this.onload();
    }
  }
  class MockImage {
    set src(v) {
      this._src = v;
      this.width = 800;
      this.height = 600;
      if (this.onload) this.onload();
    }
  }

  const contentSrc = fs.readFileSync(new URL('../js/content.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace(/^export /gm, '');

  Object.assign(f.context, {
    db: f.database,
    storage: null,
    auth: f.authentication,
    DEFAULT_CONTENT: { lt: { topic: 'Mano pašaukimas', aboutText: 'Apie' }, en: { topic: 'My Purpose', aboutText: 'About' } },
    showToast: (message, type) => toasts.push({ message, type }),
    sessionStorage: { getItem: (k) => (k === 'admin_user_email' ? 'azuolynasfilmfestival@gmail.com' : 'jwt-tok') },
    Blob,
    Headers,
    Event: class Event { constructor(name) { this.type = name; } },
    FileReader: MockFileReader,
    Image: MockImage,
    CustomEvent: class CustomEvent { constructor(name) { this.type = name; } },
    dispatchEvent: (e) => dispatched.push(e.type),
    document: {
      getElementById: makeEl,
      querySelectorAll: () => [],
      createElement: () => ({ width: 800, height: 600, getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,compressed' })
    },
    fetch: async (route, opts) => {
      apiCalls.push({ route, method: opts?.method || 'GET' });
      return {
        ok: false,
        status: 405,
        headers: new Headers({ 'content-type': 'text/html' }),
        json: async () => { throw new Error('Unexpected token <'); }
      };
    }
  });
  f.context.window = f.context;

  vm.runInContext(contentSrc, f.context);
  f.context.initContent();
  f.context.selectContentKey('2027');

  assert.match(makeEl('contentYearTabs').innerHTML, /Pagrindinis/);
  assert.match(makeEl('contentYearTabs').innerHTML, /2026 m\./);
  assert.match(makeEl('contentYearTabs').innerHTML, /2027 m\./);

  // Add custom year 2028 via sub-tab bar
  makeEl('contentNewYearInput').value = '2028';
  await makeEl('contentAddYearBtn').handlers.click();
  makeEl('cntTitle').value = 'FEST 2028';
  makeEl('cntStory').value = 'Custom 2028 festival story';
  makeEl('cntSeoTitle').value = 'FEST 2028 SEO';

  const saved = await f.context.saveCurrentContent(false);
  assert.equal(saved, true);
  assert.equal(apiCalls.filter(c => c.route.startsWith('/api/')).length, 0, 'Static host should not emit /api/* calls');
  assert.equal(toasts.at(-1).type, 'success');
  assert.doesNotMatch(toasts.at(-1).message, /405/);
  assert.equal(f.store.get('content/2028')?.title, 'FEST 2028');
  assert.equal(f.store.get('content/2028')?.story, 'Custom 2028 festival story');
  assert.equal(f.store.get('content/2028')?.seoTitle, 'FEST 2028 SEO');
  assert.equal(f.store.get('editions/2028')?.title, 'FEST 2028');

  // Verify uploadSingleImage falls back cleanly to compact JPEG DataURL without Storage/Backend
  const fallbackUrl = await f.context.uploadSingleImage({ name: 'photo.jpg', size: 1000, type: 'image/jpeg' }, '2028', 0);
  assert.match(fallbackUrl, /^data:image\/jpeg;base64,/);
});

test('SEO metadata, canonical, og:image, twitter cards, sitemap, and valid JSON-LD across all public pages', () => {
  const publicHtmlPages = [
    '../index.html',
    '../lt/index.html',
    '../en/index.html',
    '../azuolynas-fest-2027.html',
    '../lt/azuolynas-fest-2027.html',
    '../en/azuolynas-fest-2027.html',
    '../lt/azuolynas-fest-2026.html',
    '../en/azuolynas-fest-2026.html',
    '../lt/azuolynas-festival-2026.html',
    '../lt/faq.html',
    '../en/faq.html',
    '../voting.html',
    '../live.html',
    '../lt/privatumo-politika.html',
    '../en/privacy-policy.html',
    '../lt/naudojimosi-taisykles.html',
    '../en/terms-of-service.html',
    '../privacy-policy.html',
    '../terms-of-service.html'
  ];

  for (const relPath of publicHtmlPages) {
    const html = fs.readFileSync(new URL(relPath, import.meta.url), 'utf8');
    assert.match(html, /<meta\s+name="keywords"\s+content="/i, `${relPath} should define keywords`);
    assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\/www\.azuolynasfilmfestival\.lt\//i, `${relPath} should define canonical`);
    assert.match(html, /<meta\s+property="og:image"\s+content="https:\/\//i, `${relPath} should define og:image`);
    assert.match(html, /<meta\s+name="twitter:card"\s+content="summary_large_image"/i, `${relPath} should define twitter:card`);

    const ldMatches = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    assert.ok(ldMatches.length > 0, `${relPath} should include at least one Schema.org JSON-LD block`);
    for (const m of ldMatches) {
      assert.doesNotThrow(() => JSON.parse(m[1]), `${relPath} JSON-LD must be valid JSON`);
    }
  }

  const adminHtml = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  assert.match(adminHtml, /<meta\s+name="robots"\s+content="noindex,\s*nofollow"/i);

  const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const requiredUrl of [
    'https://www.azuolynasfilmfestival.lt/lt/index.html',
    'https://www.azuolynasfilmfestival.lt/en/index.html',
    'https://www.azuolynasfilmfestival.lt/lt/azuolynas-fest-2027.html',
    'https://www.azuolynasfilmfestival.lt/en/azuolynas-fest-2027.html',
    'https://www.azuolynasfilmfestival.lt/lt/azuolynas-fest-2026.html',
    'https://www.azuolynasfilmfestival.lt/en/azuolynas-fest-2026.html',
    'https://www.azuolynasfilmfestival.lt/voting.html',
    'https://www.azuolynasfilmfestival.lt/live.html'
  ]) {
    assert.ok(sitemap.includes(requiredUrl), `sitemap.xml should include ${requiredUrl}`);
  }
  assert.equal(sitemap.includes('admin.html'), false, 'sitemap.xml must not expose admin.html');
});

test('2026 edition uses 6612 cover and all 7 new ceremony/laureate photos while preserving statuette photo', () => {
  const COVER_6612 = 'https://i.postimg.cc/vmKKp6m6/ceremonija-2026-03-6612.jpg';
  const STATUETTE_URL = 'https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da';
  const ALL_NEW_2026_PHOTOS = [
    'https://i.postimg.cc/5trrZFtv/ceremonija-2026-02.jpg',
    COVER_6612,
    'https://i.postimg.cc/25ttPB5n/ceremonija-2026-04-30-01.jpg',
    'https://i.postimg.cc/jj11GJjD/ceremonija-2026-04-30-02.jpg',
    'https://i.postimg.cc/25ttPB5q/laureatai-2026-04-30-01.jpg',
    'https://i.postimg.cc/vmKKp6mV/laureatai-2026-04-30-02.jpg',
    'https://i.postimg.cc/tgccLVgZ/laureatai-2026-04-30-03.jpg'
  ];

  const editionsJson = JSON.parse(fs.readFileSync(new URL('../data/editions.json', import.meta.url), 'utf8'));
  const ed2026 = editionsJson.editions.find(e => e.id === '2026');
  assert.ok(ed2026, 'data/editions.json must include 2026 edition');
  assert.equal(ed2026.heroImage, COVER_6612);
  assert.equal(ed2026.date, '2026 m. balandžio 30 d.');
  assert.equal(ed2026.dateEn, 'April 30, 2026');
  assert.match(ed2026.story, /What If/);
  assert.ok(ed2026.photos.some(p => p.url === STATUETTE_URL && p.album === 'prizes'));
  for (const photoUrl of ALL_NEW_2026_PHOTOS) {
    assert.ok(ed2026.photos.some(p => p.url === photoUrl), `data/editions.json 2026 missing ${photoUrl}`);
  }

  for (const relPath of [
    '../js/content.js',
    '../lt/azuolynas-fest-2026.html',
    '../en/azuolynas-fest-2026.html',
    '../lt/azuolynas-festival-2026.html'
  ]) {
    const content = fs.readFileSync(new URL(relPath, import.meta.url), 'utf8');
    assert.ok(content.includes(STATUETTE_URL), `${relPath} must preserve statuette URL`);
    assert.match(content, /What If/, `${relPath} must mention What If theme`);
    assert.doesNotMatch(content, /2026-04-17|2026 m\. balandžio 17 d\.|April 17(?:th)?,\s*2026/, `${relPath} must not use outdated April 17 date`);
    for (const photoUrl of ALL_NEW_2026_PHOTOS) {
      assert.ok(content.includes(photoUrl), `${relPath} must include ${photoUrl}`);
    }
  }

  for (const relPath of [
    '../lt/azuolynas-fest-2026.html',
    '../en/azuolynas-fest-2026.html',
    '../lt/azuolynas-festival-2026.html'
  ]) {
    const html = fs.readFileSync(new URL(relPath, import.meta.url), 'utf8');
    assert.match(html, new RegExp(`<meta\\s+property="og:image"\\s+content="${COVER_6612.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${relPath} og:image should be 6612`);
    assert.match(html, new RegExp(`id="editionHeroSection"[^>]*${COVER_6612.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${relPath} hero bg should be 6612`);
    assert.match(html, new RegExp(`id="editionGalleryGrid"[\\s\\S]*?${STATUETTE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${relPath} gallery must keep statuettes`);
    assert.match(html, /2026-04-30T15:00:00\+03:00/, `${relPath} JSON-LD startDate should be 2026-04-30`);
  }

  for (const indexRel of ['../lt/index.html', '../en/index.html']) {
    const idxHtml = fs.readFileSync(new URL(indexRel, import.meta.url), 'utf8');
    assert.ok(idxHtml.includes(COVER_6612), `${indexRel} 2026 edition card should use cover 6612`);
    assert.ok(idxHtml.includes(STATUETTE_URL), `${indexRel} must preserve statuette URL`);
    assert.match(idxHtml, /What If/, `${indexRel} should mention FEST 2026 What If theme`);
    assert.doesNotMatch(idxHtml, /2026 m\. balandžio 17 d\.|April 17th, 2026/, `${indexRel} must use April 30 date for FEST 2026`);
  }
});

test('Priority 1: ARIA tablist/tab/tabpanel semantics, keyboard navigation, and accessible lightbox dialog', () => {
  for (const rel of ['../lt/index.html', '../en/index.html']) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.match(html, /<div class="photo-albums-tabs" id="photoAlbumTabs" role="tablist"/);
    assert.match(html, /id="archivePhotosContainer"[^>]*role="tabpanel"[^>]*aria-labelledby=/);
    assert.match(html, /id="resultsFilterBar"[^>]*role="tablist"/);
    assert.match(html, /id="winnersListContainer"[^>]*role="tabpanel"/);
    assert.match(html, /id="votingTabsGroup"[^>]*role="tablist"/);
    assert.match(html, /id="filmsGalleryContainer"[^>]*role="tabpanel"/);
    assert.match(html, /id="lightboxModal"[^>]*role="dialog"[^>]*aria-modal="true"/);
  }

  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  assert.match(votingHtml, /role="tablist"/);
  assert.match(votingHtml, /role="tab"[^>]*aria-selected="true"[^>]*aria-controls="votingFilmsContainer"/);
  assert.match(votingHtml, /id="votingFilmsContainer"[^>]*role="tabpanel"/);

  const lightboxJs = fs.readFileSync(new URL('../js/photo-lightbox.js', import.meta.url), 'utf8');
  assert.match(lightboxJs, /role="tab"[^>]*aria-selected=/);
  assert.match(lightboxJs, /aria-controls="archivePhotosContainer"/);
  assert.match(lightboxJs, /ArrowLeft/);
  assert.match(lightboxJs, /ArrowRight/);
  assert.match(lightboxJs, /e\.key === "Home"/);
  assert.match(lightboxJs, /e\.key === "End"/);
  assert.match(lightboxJs, /e\.key === "Tab"/);
  assert.match(lightboxJs, /role="dialog"/);
  assert.match(lightboxJs, /aria-modal="true"/);

  const votingJs = fs.readFileSync(new URL('../js/voting-and-winners.js', import.meta.url), 'utf8');
  assert.match(votingJs, /aria-selected/);
  assert.match(votingJs, /ArrowRight/);
  assert.match(votingJs, /ArrowLeft/);
});

test('Priority 2 & 3: YouTube embeds use click-to-load facades and static pages avoid unconditional /api/* calls', async () => {
  for (const rel of ['../lt/index.html', '../en/index.html', '../lt/azuolynas-fest-2026.html', '../en/azuolynas-fest-2026.html', '../lt/azuolynas-festival-2026.html']) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<iframe[^>]+youtube(?:-nocookie)?\.com/i, `${rel} must not load eager YouTube iframes`);
  }

  const ytJs = fs.readFileSync(new URL('../js/yt-facade.js', import.meta.url), 'utf8');
  assert.match(ytJs, /<button type="button" class="yt-facade-btn"/);
  assert.match(ytJs, /youtube-nocookie\.com\/embed\//);
  assert.match(ytJs, /loading="lazy"/);
  assert.match(ytJs, /ensureYouTubePreconnect/);

  let calls = [];
  const ctx = vm.createContext({
    URL, Headers, Request,
    sessionStorage: { getItem: () => null },
    location: { href: 'https://www.azuolynasfilmfestival.lt/lt/index.html', origin: 'https://www.azuolynasfilmfestival.lt', hostname: 'www.azuolynasfilmfestival.lt' },
    fetch: async (url) => { calls.push(url); return { ok: true }; }
  });
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(new URL('../js/server-api.js', import.meta.url), 'utf8'), ctx);
  assert.equal(await ctx.FestivalApi.hasServer(), false);
  assert.equal(calls.length, 0, 'Static custom domain must not probe /health or /api/*');

  for (const rel of ['../lt/index.html', '../en/index.html', '../lt/azuolynas-fest-2026.html', '../en/azuolynas-fest-2026.html', '../voting.html', '../live.html', '../stream-overlay.html']) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /fetch\(["']\/api\/editions["']\)/, `${rel} must not call missing /api/editions`);
  }
});

test('Priority 4: public pages use modular lazy Firebase v10.8.0 (no compat SDK) with transaction support', () => {
  for (const rel of [
    '../lt/index.html', '../en/index.html', '../voting.html', '../live.html',
    '../azuolynas-fest-2027.html', '../lt/azuolynas-fest-2027.html', '../en/azuolynas-fest-2027.html',
    '../lt/azuolynas-fest-2026.html', '../en/azuolynas-fest-2026.html', '../lt/azuolynas-festival-2026.html'
  ]) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /firebase-app-compat\.js|firebase-auth-compat\.js|firebase-firestore-compat\.js/, `${rel} must not load compat SDK`);
  }
  const lazyJs = fs.readFileSync(new URL('../js/firebase-public-lazy.js', import.meta.url), 'utf8');
  assert.match(lazyJs, /firebasejs\/10\.8\.0\//);
  assert.match(lazyJs, /IntersectionObserver/);
  assert.match(lazyJs, /runTransaction:/);
  assert.match(lazyJs, /delete:\s*\(/);
  assert.doesNotMatch(lazyJs, /enableIndexedDbPersistence/);
});

test('Priority 5 & 6: public images include explicit dimensions, CSS/JS assets are minified, and pages inline critical CSS with deferred scripts', () => {
  const publicHtml = [
    '../lt/index.html', '../en/index.html',
    '../azuolynas-fest-2027.html', '../lt/azuolynas-fest-2027.html', '../en/azuolynas-fest-2027.html',
    '../lt/azuolynas-fest-2026.html', '../en/azuolynas-fest-2026.html', '../lt/azuolynas-festival-2026.html',
    '../lt/edition.html', '../en/edition.html',
    '../voting.html', '../live.html',
    '../lt/faq.html', '../en/faq.html',
    '../lt/privatumo-politika.html', '../lt/naudojimosi-taisykles.html',
    '../en/privacy-policy.html', '../en/terms-of-service.html',
    '../privacy-policy.html', '../terms-of-service.html'
  ];
  for (const rel of publicHtml) {
    const html = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.match(html, /<style id="criticalCss">/, `${rel} missing inline criticalCss`);
    assert.match(html, /style\.min\.css" media="print" onload="this\.media='all'"/, `${rel} missing async style.min.css`);
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(m[0], /width=/i, `${rel} <img> missing width: ${m[0].slice(0, 80)}`);
      assert.match(m[0], /height=/i, `${rel} <img> missing height: ${m[0].slice(0, 80)}`);
    }
    for (const s of html.matchAll(/<script\b([^>]*src="[^"]+"[^>]*)>/g)) {
      assert.match(s[1], /\bdefer\b/, `${rel} external script must be deferred: ${s[0]}`);
      if (!/https?:/.test(s[1])) {
        assert.match(s[1], /\.min\.js["']/, `${rel} local script should use .min.js: ${s[0]}`);
      }
    }
  }

  for (const [srcRel, minRel] of [
    ['../style.css', '../style.min.css'],
    ['../live.css', '../live.min.css'],
    ['../config.js', '../config.min.js'],
    ['../js/firebase-public-lazy.js', '../js/firebase-public-lazy.min.js'],
    ['../js/content-public.js', '../js/content-public.min.js'],
    ['../js/yt-facade.js', '../js/yt-facade.min.js'],
    ['../js/photo-lightbox.js', '../js/photo-lightbox.min.js'],
    ['../js/voting-and-winners.js', '../js/voting-and-winners.min.js'],
    ['../js/burger-menu.js', '../js/burger-menu.min.js'],
    ['../js/server-api.js', '../js/server-api.min.js']
  ]) {
    const rawSize = fs.statSync(new URL(srcRel, import.meta.url)).size;
    const minSize = fs.statSync(new URL(minRel, import.meta.url)).size;
    assert.ok(minSize < rawSize, `${minRel} (${minSize} B) must be smaller than ${srcRel} (${rawSize} B)`);
  }
});

test('Admin participant PDF download avoids static HTTP 405 and builds a valid client PDF fallback', async () => {
  const pdfClient = await import('../js/submission-pdf-client.js');
  const filename = pdfClient.buildReadablePdfFilename({
    directorFirstName: 'Ąžuolas',
    directorLastName: 'Žukauskas',
    filmTitle: 'Šviesa tamsoje'
  });
  assert.equal(filename, 'Azuolas_Zukauskas_-_Sviesa_tamsoje.pdf');

  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
  const pdfBytes = pdfClient.buildPdfFromJpegPages([
    { jpegBytes: fakeJpeg, pixelWidth: 1240, pixelHeight: 1754 }
  ]);
  const asciiHead = Buffer.from(pdfBytes.slice(0, 8)).toString('ascii');
  const asciiTail = Buffer.from(pdfBytes.slice(-32)).toString('ascii');
  assert.ok(asciiHead.startsWith('%PDF-1.4'), 'Client PDF must emit valid %PDF-1.4 header');
  assert.ok(asciiTail.includes('%%EOF'), 'Client PDF must terminate with %%EOF');

  const submissionsJs = fs.readFileSync(new URL('../js/submissions.js', import.meta.url), 'utf8');
  assert.match(submissionsJs, /generateClientSubmissionPdf/);
  assert.match(submissionsJs, /hasBackendServer\(\)/);
  assert.ok(submissionsJs.indexOf('hasBackendServer()') < submissionsJs.indexOf('/api/admin/submissions/pdf'));
});

test('voting.html permits voting when inVoting films exist even if settings/festival.showVoting or settings/global.votingOpen is false', () => {
  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  assert.match(votingHtml, /const hasInVotingFilms = moviesList\.some/);
  assert.match(votingHtml, /globalSettings\.votingOpen = hasInVotingFilms \|\| settingsPermitVoting \|\| primary\.showVoting === true/);
  assert.doesNotMatch(votingHtml, /data\.votingOpen !== false && data\.votingActive !== false && data\.showVoting !== false/);
});

test('Admin Jury & Winners UI keeps winners clickable/editable live with Firestore-first sync and no raw prompts', () => {
  const adminHtml = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  for (const requiredId of [
    'id="filterVotingStage"',
    'id="winnersManagerCard"',
    'id="adminSelectFilm"',
    'id="adminAwardTitle"',
    'id="adminJuryPlace"',
    'id="assignWinnerBtn"',
    'id="adminWinnersList"',
    'id="winnerEditModal"',
    'id="mJuryPlace"'
  ]) {
    assert.ok(adminHtml.includes(requiredId), `admin.html missing ${requiredId}`);
  }

  const votingAnalyticsJs = fs.readFileSync(new URL('../js/voting-analytics.js', import.meta.url), 'utf8');
  assert.match(votingAnalyticsJs, /subscribeVotingAnalytics/);
  assert.match(votingAnalyticsJs, /collection\(["']judge_evaluations["']\)\.onSnapshot/);
  assert.match(votingAnalyticsJs, /openWinnerEditModal/);
  assert.match(votingAnalyticsJs, /Keisti laureatą/);
  assert.match(votingAnalyticsJs, /btn-toggle-live-voting/);
  assert.match(votingAnalyticsJs, /collection\(["']stream_config["']\)\.doc\(["']broadcast["']\)/);
  assert.doesNotMatch(votingAnalyticsJs, /\bwindow\.prompt\(|\bprompt\(/);

  const submissionsJs = fs.readFileSync(new URL('../js/submissions.js', import.meta.url), 'utf8');
  assert.match(submissionsJs, /openWinnerEditModal/);
  assert.match(submissionsJs, /edit-winner/);
  assert.match(submissionsJs, /notifySubmissionsUpdated/);
  assert.ok(submissionsJs.indexOf('db.collection("submissions").doc(filmId).update') < submissionsJs.indexOf('/api/admin/declare-winner'));
  assert.ok(submissionsJs.indexOf('hasBackendServer()') < submissionsJs.indexOf('/api/admin/revoke-winner'));
});

test('Real finalist films & full participant names power admin graphics, stream overlay, public voting, and HTML emails', () => {
  const adminMainJs = fs.readFileSync(new URL('../js/admin-main.js', import.meta.url), 'utf8');
  assert.match(adminMainJs, /subscribeVotingAnalytics/);
  assert.match(adminMainJs, /db\.collection\(["']stream_config["']\)\.doc\(["']broadcast["']\)/);
  assert.match(adminMainJs, /directorFirstName,\s*film\.directorLastName/);

  const overlayHtml = fs.readFileSync(new URL('../stream-overlay.html', import.meta.url), 'utf8');
  assert.match(overlayHtml, /firestore\.googleapis\.com\/v1\/projects\/filmfest-509606/);
  assert.match(overlayHtml, /stream_config\/broadcast/);
  assert.match(overlayHtml, /directorFirstName,\s*film\.directorLastName/);

  const h2hJs = fs.readFileSync(new URL('../h2h-export.js', import.meta.url), 'utf8');
  assert.match(h2hJs, /directorFirstName,\s*item\.directorLastName/);

  const votingHtml = fs.readFileSync(new URL('../voting.html', import.meta.url), 'utf8');
  assert.match(votingHtml, /\[film\.directorFirstName,\s*film\.directorLastName\]/);
  assert.doesNotMatch(votingHtml, /Official festival competition selection\./);
  assert.match(votingHtml, /film\.awardTitle/);

  const votingJs = fs.readFileSync(new URL('../js/voting-and-winners.js', import.meta.url), 'utf8');
  assert.match(votingJs, /formatParticipantName/);
  assert.match(votingJs, /directorFirstName,\s*film\.directorLastName/);
  assert.match(votingJs, /juryPlace/);

  const dashboardJs = fs.readFileSync(new URL('../admin-dashboard.js', import.meta.url), 'utf8');
  assert.match(dashboardJs, /hasServer/);

  const emailCtx = vm.createContext({ module: { exports: {} }, exports: {} });
  emailCtx.window = emailCtx;
  vm.runInContext(fs.readFileSync(new URL('../email-templates.js', import.meta.url), 'utf8'), emailCtx);
  const { generateEmailHtml, generateSubmissionPlainText } = emailCtx;

  const htmlLt = generateEmailHtml('winner', 'lt', {
    directorFirstName: 'Aistė',
    directorLastName: 'Kazlauskaitė',
    filmTitle: 'Šviesos šešėlyje',
    category: 'II Kategorija (14–18 m.)',
    institution: 'Kauno gimnazija',
    awardTitle: 'Grand Prix — Geriausias filmas',
    juryPlace: 1
  });
  assert.match(htmlLt, /Aistė Kazlauskaitė/);
  assert.match(htmlLt, /Šviesos šešėlyje/);
  assert.match(htmlLt, /Grand Prix — Geriausias filmas/);
  assert.match(htmlLt, /1-oji vieta/);

  const plainLt = generateSubmissionPlainText({
    name: 'Aistė Kazlauskaitė',
    filmTitle: 'Šviesos šešėlyje',
    category: 'II Kategorija',
    email: 'aiste@example.lt',
    phone: '+37060000000',
    location: 'Kaunas, Lietuva',
    awardTitle: 'Grand Prix',
    juryPlace: 1
  });
  assert.match(plainLt, /Grand Prix/);
  assert.match(plainLt, /Komisijos vieta:\s*1/);
});

test('content-public.js resolves dynamic edition URLs, sanitizes story HTML, and updates header nav cleanly', () => {
  const navEl = { innerHTML: '' };
  const ctx = vm.createContext({
    location: { pathname: '/lt/index.html' },
    document: {
      querySelector: (sel) => (sel === 'header .header-edition-nav' ? navEl : null)
    }
  });
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(new URL('../js/content-public.js', import.meta.url), 'utf8'), ctx);
  const api = ctx.FestivalContentPublic;

  assert.equal(api.resolveEditionUrl('2027', 'lt'), 'azuolynas-fest-2027.html');
  assert.equal(api.resolveEditionUrl('2026', 'en'), 'azuolynas-fest-2026.html');
  assert.equal(api.resolveEditionUrl('2028', 'lt'), 'edition.html?year=2028');
  assert.equal(api.safeUrl('javascript:alert(1)', 'fallback.jpg'), 'fallback.jpg');

  const safeStory = api.sanitizeEditorialStory('<b>Labas</b>\n\n<script>alert(1)</script>');
  assert.match(safeStory, /<b>Labas<\/b>/);
  assert.doesNotMatch(safeStory, /<script>/);

  api.updateHeaderEditionNav({
    '2028': { year: '2028', _fromContentDoc: true },
    '2027': { year: '2027', _fromContentDoc: true },
    '2026': { year: '2026', _fromContentDoc: true }
  }, 'lt', '2028');
  assert.match(navEl.innerHTML, /href="edition\.html\?year=2028" class="header-edition-link active">2028<\/a>/);
  assert.match(navEl.innerHTML, /href="azuolynas-fest-2027\.html"/);
  assert.match(navEl.innerHTML, /href="azuolynas-fest-2026\.html"/);
});

test('firestore.rules, storage.rules, and GitHub Actions SEO sync enforce schema & zero secrets', () => {
  const firestoreRules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(firestoreRules, /match \/content\/\{contentId\}/);
  assert.match(firestoreRules, /isValidFestivalContent\(incoming\(\)\)/);

  const storageRules = fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
  assert.match(storageRules, /ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83/);
  assert.match(storageRules, /match \/content\/\{allPaths=\*\*\}/);

  const syncSeoJs = fs.readFileSync(new URL('../scripts/sync-seo.mjs', import.meta.url), 'utf8');
  assert.match(syncSeoJs, /PROJECT_ID\s*=\s*['"]filmfest-509606['"]/);
  assert.match(syncSeoJs, /DATABASE_ID\s*=\s*['"]ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83['"]/);
  assert.match(syncSeoJs, /firestore\.googleapis\.com\/v1\/projects\/\$\{PROJECT_ID\}\/databases\/\$\{DATABASE_ID\}\/documents\/content/);
  assert.doesNotMatch(syncSeoJs, /AIza|BEGIN PRIVATE KEY|SERVICE_ACCOUNT/);

  const workflowYml = fs.readFileSync(new URL('../.github/workflows/sync-seo.yml', import.meta.url), 'utf8');
  assert.match(workflowYml, /node scripts\/sync-seo\.mjs/);
  assert.doesNotMatch(workflowYml, /secrets\.[A-Z0-9_]*KEY|FIREBASE_SERVICE_ACCOUNT/);
});
