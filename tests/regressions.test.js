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
        assert.equal(mail.from, 'azuolynasfilmfestival@gmail.com');
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

    // Oversized file (> 300 MB)
    f.context.validateSelectedVideoFile({ name: 'huge.mp4', type: 'video/mp4', size: 350 * 1024 * 1024 });
    assert.match(f.element('uploadFeedback').textContent, /300 MB/i);

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
  assert.match(pdf.filename, /^AISFF_.*sub_test_pdf_1\.pdf$/);

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

