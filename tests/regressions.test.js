import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source = fs.readFileSync(new URL('../js/firebase-client.js', import.meta.url), 'utf8');
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
  vm.runInContext(source, context);
  context.FirebaseClient.configure({ db: database, auth: authentication });
  return { client: context.FirebaseClient, context, store, database, authentication, authCalls };
}
const film = { name:'Test Participant', email:'applicant@example.test', filmTitle:'Test Film', category:'Category II',
  age:15, videoUrl:'https://example.test/film.mp4', deviceModel:'Phone', submittedAt:{sentinel:'timestamp'},
  submissionLang:'en', status:'submitted', inVoting:false, votesCount:0, attendanceType:'in_person' };

function assertMailSchema(mail) {
  assert.deepEqual(Object.keys(mail).sort(), ['createdAt', 'from', 'message', 'replyTo', 'to']);
  assert.ok(Array.isArray(mail.to) && mail.to.length > 0);
  assert.ok(mail.to.every(recipient => typeof recipient === 'string' && recipient.trim()));
  assert.equal(mail.from, 'azuolynasfilmfestival@gmail.com');
  assert.equal(mail.replyTo, 'azuolynasfilmfestival@gmail.com');
  for (const key of ['subject', 'html', 'text']) {
    assert.equal(typeof mail.message[key], 'string');
    assert.ok(mail.message[key].trim());
  }
  assert.equal(mail.createdAt.sentinel, 'timestamp');
}

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
  const uploads = [], toasts = [], errors = [];
  const document = { getElementById: element, querySelector: () => ({ value: attendanceType }),
    createElement: () => ({ duration: 120 }) };
  Object.assign(f.context, { document, firestoreDb: f.database, showToast: (message, type) => toasts.push({message, type}),
    console: { ...console, error: error => errors.push(error) },
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
  return { ...f, element, submit, uploads, toasts, errors };
}

for (const lang of ['lt', 'en']) {
  for (const attendance of ['in_person', 'remote']) {
    test(`${lang} ${attendance} form uploads and atomically queues both notifications`, async () => {
      const f = formFixture(lang, attendance);
      await f.submit();
      assert.equal(f.element('submitBtn').disabled, true);
      await f.submit();
      assert.equal(f.uploads.length, 1, 'A second submit during upload must be ignored');
      const upload = f.uploads[0];
      upload.progress({bytesTransferred: 10, totalBytes: 10});
      await upload.complete();
      const mails = [...f.store].filter(([path]) => path.startsWith('mail/'));
      assert.equal(mails.length, 2);
      mails.forEach(([, mail]) => assertMailSchema(mail));
      assert.equal(mails[0][1].to[0], film.email);
      assert.equal(mails[1][1].to[0], 'azuolynasfilmfestival@gmail.com');
      const saved = [...f.store].find(([path]) => path.startsWith('submissions/'))[1];
      assert.equal(saved.submissionLang, lang);
      assert.equal(saved.storagePath, upload.path);
      assert.equal(saved.videoUrl, film.videoUrl);
      assert.match(mails[0][1].message.subject, lang === 'en' ? /Submission Successfully Received|Live Stream Access/ : /paraiška sėkmingai gauta|transliacijos prieiga/);
      const viewers = [...f.store].filter(([path]) => path.startsWith('live_viewers/'));
      assert.equal(viewers.length, attendance === 'remote' ? 1 : 0);
      if (attendance === 'remote') assert.ok(mails[0][1].message.html.includes(saved.liveToken));
      assert.equal(f.errors.length, 0);
      assert.equal(f.element('submissionForm').classList.contains('d-none'), true);
      assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), false);
      assert.equal(f.element('progressContainer').classList.contains('active'), false);
      f.context.resetFormView();
      assert.equal(f.element('submissionForm').wasReset, true);
      assert.equal(f.element('submissionForm').classList.contains('d-none'), false);
      assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), true);
      await f.submit();
      assert.equal(f.uploads.length, 1, 'Reset must clear the previously verified video');
    });
  }
  test(`${lang} form shows mail permission failures without reporting success`, async () => {
    const f = formFixture(lang, 'remote', (_, path) => path.endsWith('_organizer'));
    await f.submit();
    await f.uploads[0].complete();
    assert.equal(f.store.size, 0);
    assert.equal(f.toasts.at(-1).type, 'error');
    assert.equal(f.element('formSuccessDisplay').classList.contains('d-none'), true);
    assert.equal(f.element('submitBtn').disabled, false);
    assert.equal(f.element('progressContainer').classList.contains('active'), false);
  });
  test(`${lang} form recovers from asynchronous upload failure`, async () => {
    const f = formFixture(lang);
    await f.submit();
    f.uploads[0].error(new Error('Upload denied'));
    assert.equal(f.store.size, 0);
    assert.equal(f.toasts.at(-1).type, 'error');
    assert.equal(f.element('submitBtn').disabled, false);
    assert.equal(f.element('progressContainer').classList.contains('active'), false);
  });
  test(`${lang} form recovers from Storage setup failure`, async () => {
    const f = formFixture(lang, 'in_person', undefined, true);
    await f.submit();
    assert.equal(f.store.size, 0);
    assert.equal(f.toasts.at(-1).type, 'error');
    assert.equal(f.element('submitBtn').disabled, false);
    assert.equal(f.element('progressContainer').classList.contains('active'), false);
  });
  test(`${lang} form rejects fields that Firestore would reject before uploading`, async () => {
    for (const [id, value] of [['participantName', '   '], ['participantName', 'x'.repeat(151)],
      ['participantEmail', 'x'.repeat(151)], ['filmTitle', 'x'.repeat(201)]]) {
      const f = formFixture(lang);
      f.element(id).value = value;
      await f.submit();
      assert.equal(f.uploads.length, 0);
      assert.equal(f.store.size, 0);
      assert.equal(f.toasts.at(-1).type, 'error');
      assert.equal(f.element('submitBtn').disabled, false);
    }
  });
}

test('email queue rejects invalid field types and empty recipient arrays before writing', async () => {
  const valid = { to: film.email, subject: 'Subject', html: '<p>Message</p>' };
  for (const invalid of [{to: []}, {to: [film.email, null]}, {to: ' '}, {subject: {}}, {subject: ' '}, {html: []}, {text: 42}]) {
    const f = fixture();
    await assert.rejects(f.client.queueEmail({...valid, ...invalid}));
    assert.equal(f.store.size, 0);
  }
  const f = fixture();
  await f.client.queueEmail({...valid, to: [' applicant@example.test ', 'organizer@example.test']});
  const mail = [...f.store.values()][0];
  assertMailSchema(mail);
  assert.equal(mail.to[0], film.email);
});

test('submission commits a film and exactly two Trigger Email documents', async () => {
  const f = fixture(); const result = await f.client.submitFilm(f.database, film);
  assert.equal(f.store.get(`submissions/${result.id}`).filmTitle, film.filmTitle);
  const mails = [...f.store].filter(([path]) => path.startsWith('mail/'));
  assert.equal(mails.length, 2);
  for (const [,mail] of mails) {
    assert.equal(mail.from, 'azuolynasfilmfestival@gmail.com');
    assert.equal(mail.replyTo, 'azuolynasfilmfestival@gmail.com');
  }
  assert.equal(mails[0][1].to[0], film.email);
  assert.equal(mails[1][1].to[0], 'azuolynasfilmfestival@gmail.com');
  for (const [,mail] of mails) { assert.ok(mail.message.subject); assert.match(mail.message.html, /Test Film/); assert.equal(mail.template, undefined); }
});
test('remote submission commits its access token and pass notification in Lithuanian', async () => {
  const f = fixture(); await f.client.submitFilm(f.database, { ...film, submissionLang:'lt', attendanceType:'remote', liveToken:'live_test', liveStreamUrl:'https://festival.example.test/live.html?token=live_test' });
  assert.equal(f.store.get('live_viewers/live_test').email, film.email);
  const receipt = [...f.store].find(([path]) => path.endsWith('_receipt'))[1];
  assert.match(receipt.message.html, /live_test/);
});
test('mail write rejection rolls back the submission batch', async () => {
  const f = fixture({}, (_,path) => path.startsWith('mail/'));
  await assert.rejects(f.client.submitFilm(f.database, film), /permission-denied/);
  assert.equal(f.store.size, 0);
});
test('admin settings merge preserves existing languages and other toggles', async () => {
  const f = fixture({ 'settings/festival':{showArchive:true, en:{topic:'Keep'}} });
  await f.client.request('settings', {method:'POST', body:{showSubmit:false}});
  const settings = f.store.get('settings/festival');
  assert.equal(settings.showSubmit, false); assert.equal(settings.showArchive, true); assert.equal(settings.en.topic, 'Keep');
});
test('film editing preserves unrelated fields and SDK sentinels', async () => {
  const f = fixture({'submissions/test':{...film, awardTitle:'Old'}});
  await f.client.request('submissions.update',{method:'POST',body:{id:'test',updates:{status:'accepted',awardTitle:{sentinel:'delete'},lastUpdated:{sentinel:'timestamp'}}}});
  const saved=f.store.get('submissions/test');
  assert.equal(saved.filmTitle,film.filmTitle); assert.equal(saved.status,'accepted'); assert.equal(saved.awardTitle,undefined); assert.equal(saved.lastUpdated.sentinel,'timestamp');
});
test('admin delete requires a successful Firestore delete', async () => {
  const f=fixture({'submissions/test':film},kind=>kind==='delete');
  await assert.rejects(f.client.request('submissions.delete',{method:'POST',body:{id:'test'}}),/permission-denied/);
  assert.ok(f.store.has('submissions/test'));
});
test('admin film voting toggles write directly to Firestore',async()=>{
  const f=fixture({'submissions/test':film});
  await f.client.request('submissions.toggle-voting',{method:'POST',body:{id:'test',inVoting:true}});
  assert.equal(f.store.get('submissions/test').inVoting,true);
});
test('email queue errors are propagated, never reported as sent',async()=>{
  const f=fixture({},(_,path)=>path.startsWith('mail/'));
  await assert.rejects(f.client.queueEmail({to:film.email,subject:'Test',html:'<p>Test</p>'}),/permission-denied/);
});
test('test and manual email use the Trigger Email message schema',async()=>{
  const f=fixture();
  await f.client.request('email.test',{method:'POST',body:{testEmail:film.email}});
  await f.client.request('send-email',{method:'POST',body:{to:film.email,template:'accepted',lang:'en',data:film}});
  assert.equal(f.store.size,2);
  for(const [,mail] of f.store) { assert.equal(mail.to[0],film.email); assert.equal(mail.from,'azuolynasfilmfestival@gmail.com'); assert.equal(mail.replyTo,'azuolynasfilmfestival@gmail.com'); assert.ok(mail.message.html); assert.ok(mail.message.subject); assert.equal(mail.template,undefined); }
});
test('invitation and its single email notification commit together',async()=>{
  const f=fixture(); const response=await f.client.request('invite',{method:'POST',body:{email:'staff@example.test',name:'Test',role:'judge',lang:'en'}});
  const {invitation}=await response.json();
  assert.equal(f.store.get(`invitations/${invitation.token}`).role,'judge');
  assert.ok(invitation.expiresAt.toMillis()>Date.now());
  const invitationMails = [...f.store].filter(([path])=>path.startsWith('mail/'));
  assert.equal(invitationMails.length,1);
  assert.equal(invitationMails[0][1].from,'azuolynasfilmfestival@gmail.com');
  assert.equal(invitationMails[0][1].replyTo,'azuolynasfilmfestival@gmail.com');
  assert.equal(f.store.get('users/staff_example_test').status,'invited');
});
test('user suspension updates email and UID profiles consistently',async()=>{
  const f=fixture({'users/staff_example_test':{email:'staff@example.test',status:'active'},'users/authuid':{email:'staff@example.test',status:'active'}});
  await f.client.request('users.status',{method:'POST',body:{email:'staff@example.test',status:'suspended'}});
  assert.equal(f.store.get('users/staff_example_test').status,'suspended');assert.equal(f.store.get('users/authuid').status,'suspended');
});
test('password resets use Firebase Auth',async()=>{
  const f=fixture();await f.client.request('users.send-password-reset',{method:'POST',body:{email:film.email}});assert.deepEqual(f.authCalls,[film.email]);
});
test('vote records category audit and increments once; duplicate is rejected',async()=>{
  const f=fixture({'submissions/test':{...film,inVoting:true},'settings/festival':{votingActive:true}});
  assert.equal((await f.client.vote({filmId:'test'})).votesCount,1);
  await assert.rejects(f.client.vote({filmId:'test'}),/already-voted/);
  assert.equal(f.store.get('submissions/test').votesCount,1);
  const audit=[...f.store].find(([path])=>path.startsWith('votes_audit/'))[1]; assert.equal(audit.filmId,'test');assert.equal(audit.category,film.category);
});
test('closed voting rejects without writing votes',async()=>{
  const f=fixture({'settings/festival':{votingActive:false},'submissions/test':{...film,inVoting:true}});
  await assert.rejects(f.client.vote({filmId:'test'}),/Voting is closed/);assert.equal(f.store.get('submissions/test').votesCount,0);
});
test('unknown operations are rejected rather than silently succeeding',async()=>{await assert.rejects(fixture().client.request('nonexistent'),/Unknown Firebase operation/);});
test('all page operations have implementations and no server transport remains',()=>{
  const roots=[new URL('../js/',import.meta.url),new URL('../',import.meta.url),new URL('../en/',import.meta.url),new URL('../lt/',import.meta.url)];
  const operations=new Set([...source.matchAll(/case '([^']+)'/g)].map(match=>match[1]));
  for(const root of roots)for(const name of fs.readdirSync(root)){
    if(!/\.(?:html|js)$/.test(name))continue;
    const text=fs.readFileSync(new URL(name,root),'utf8');
    assert.doesNotMatch(text,/\/api\/|\bfetch\(|EventSource|httpsCallable|nodemailer|SMTP_PASS|admin_jwt_token/);
    for(const [,op]of text.matchAll(/FirebaseClient\.request\("([^"]+)"/g))assert.ok(operations.has(op),`${name}: ${op}`);
  }
});


test('stream iframe URL saves to the same document read by the live page and preserves state', async () => {
  const f = fixture({'stream_config/current': {streamState:'live',isLive:true,votingActive:false}});
  const response = await f.client.request('stream.iframe-url', {method:'POST',body:{iframeUrl:'  https://player.example.test/live/iframe?autoplay=true  '}});
  const result = await response.json();
  assert.equal(result.iframeUrl, 'https://player.example.test/live/iframe?autoplay=true');
  const status = await (await f.client.request('live.status')).json();
  assert.equal(status.iframeUrl, result.iframeUrl);
  assert.equal(status.streamState, 'live');
  assert.equal(status.isLive, true);
  assert.equal(status.votingActive, false);
});
test('stream iframe URL rejects unsupported URLs and propagates denied writes', async () => {
  const f = fixture();
  for (const iframeUrl of ['', 'javascript:alert(1)', 'http://player.example.test', 'https://user:secret@player.example.test', '/relative']) {
    await assert.rejects(f.client.request('stream.iframe-url', {method:'POST',body:{iframeUrl}}));
  }
  assert.equal(f.store.size, 0);
  const denied = fixture({}, (_,path) => path.startsWith('stream_config/'));
  await assert.rejects(denied.client.request('stream.iframe-url', {method:'POST',body:{iframeUrl:'https://player.example.test/iframe'}}), /permission-denied/);
});
