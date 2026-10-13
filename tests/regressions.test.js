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
        classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
        addEventListener(event, handler) { this.handlers[event] = handler; }, reset() { this.wasReset = true; }
      });
    }
    return elements.get(id);
  }
  const fields = { participantName: film.name, participantEmail: film.email, participantAge: '15',
    participantCategory: film.category, countryCity: 'Test City', institution: 'Test School',
    filmTitle: film.filmTitle, deviceModel: film.deviceModel, synopsis: 'Test Synopsis' };
  Object.entries(fields).forEach(([id, value]) => { element(id).value = value; });
  const uploads = [], toasts = [], errors = [], apiCalls = [];
  const document = { getElementById: element, querySelector: () => ({ value: attendanceType }),
    createElement: () => ({ duration: 120 }) };
  Object.assign(f.context, { document, firestoreDb: f.database, showToast: (message, type) => toasts.push({message, type}),
    console: { ...console, error: error => errors.push(error) },
    fetch: async (route, options) => { apiCalls.push({route, body: JSON.parse(options.body)}); return {ok: true, json: async () => ({success: true})}; },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
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
    AUTHORIZED_ADMIN_EMAILS: ['azuolynasfilmfestival@gmail.com','karina.brdar@gmail.com','dominikphotofficial.t@gmail.com','dominikphotofficial.lt@gmail.com'],
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
