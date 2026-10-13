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
function formFixture(lang, attendanceType = 'in_person', reject, storageFailure = false) {
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
  const html = fs.readFileSync(new URL(`../${lang}/index.html`, import.meta.url), 'utf8');
  const start = html.indexOf('    let verifiedVideoFile = null;');
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
    const f = formFixture(lang);
    f.context.fetch = async () => ({ok: false, json: async () => ({success: false, error: 'Queue rejected'})});
    await f.submit(); await f.uploads[0].complete();
    assert.equal(f.toasts.at(-1).type, 'error');
    assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), true);
    assert.equal(f.element('submitBtn').disabled, false);
    assert.equal(f.element('progressContainer').classList.contains('active'), false);
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
    location: {href: 'https://festival.example.test/admin.html', origin: 'https://festival.example.test'},
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
