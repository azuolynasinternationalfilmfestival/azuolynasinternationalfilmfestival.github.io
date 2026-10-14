import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import express from 'express';
import jwt from 'jsonwebtoken';
import '../email-templates.js';

const root = path.resolve(import.meta.dirname, '..');
const admins = ['azuolynasfilmfestival@gmail.com', 'karina.brdar@gmail.com',
  'dominikphotofficial.lt@gmail.com', 'dominikcute4@gmail.com'];
const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

async function serverFixture(t, {smtp = false, rejectQueue = false, rejectSmtp = false, envSmtp = false} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'festival-api-'));
  fs.mkdirSync(path.join(directory, 'data'));
  const staleAdmins = admins.map((email, index) => ({email, uid: `uid${index}`, role: 'viewer', status: 'suspended', canManageUsers: false}));
  fs.writeFileSync(path.join(directory, 'data/users.json'), JSON.stringify({users: [...staleAdmins,
    {email: 'editor@example.test', uid: 'editor', role: 'editor', status: 'active'},
    {email: 'suspended@example.test', uid: 'suspended', role: 'admin', status: 'suspended'}]}));
  fs.writeFileSync(path.join(directory, 'data/settings.json'), JSON.stringify({votingActive: true,
    ...(envSmtp ? {} : {smtp: {host: 'smtp.example.test', user: 'sender@example.test', pass: smtp ? 'synthetic-password' : '', from: 'Festival <sender@example.test>'}})}));
  const writes = [], messages = [];
  const externalFetch = async (url, options = {}) => {
    if (url.startsWith('https://identitytoolkit.googleapis.com/')) {
      const token = JSON.parse(options.body).idToken;
      const email = token.startsWith('fixture:') ? token.slice(8) : null;
      return new Response(JSON.stringify(email ? {users: [{email, localId: 'auth_' + email}]} : {}), {status: email ? 200 : 400});
    }
    if (!url.startsWith('https://firestore.googleapis.com/')) throw new Error(`Unexpected external request: ${url}`);
    if (options.body) writes.push({url, data: JSON.parse(options.body)});
    const denied = (typeof rejectQueue === 'function' ? rejectQueue(url, options, writes) : rejectQueue) && url.includes('/mail/');
    return new Response(JSON.stringify(denied ? {error: 'denied'} : {}), {status: denied ? 403 : 200});
  };
  const transporter = { sendMail: async message => {
    if (rejectSmtp) throw new Error('SMTP rejected');
    messages.push(message); return {messageId: 'synthetic-message'};
  }, verify: async () => true };
  const processFixture = {...process, on() {}, env: {PORT: '0', JWT_SECRET: 'synthetic-session-secret',
    FIREBASE_PROJECT_ID: 'demo-filmfest', FIREBASE_API_KEY: 'synthetic-api-key',
    SMTP_HOST: 'smtp.example.test', SMTP_USER: 'sender@example.test', EMAIL_FROM: 'Festival <sender@example.test>',
    SMTP_PASS: envSmtp ? 'synthetic-environment-password' : ''}, cwd: () => directory};
  const code = source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')
    .replace('fileURLToPath(import.meta.url)', JSON.stringify(path.join(directory, 'server.js')));
  const body = code.slice(0, code.lastIndexOf('app.listen('));
  const create = new Function('dotenv', 'express', 'path', 'fs', 'crypto', 'fileURLToPath', 'jwt', 'nodemailer', 'process', 'fetch', 'console',
    body + '\nreturn {app, sendEmail, loadUsersData};');
  const server = create({config() {}}, express, path, fs, crypto, fileURLToPath, jwt,
    {createTransport: () => transporter}, processFixture, externalFetch, {log() {}, warn() {}, error() {}});
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const base = `http://127.0.0.1:${listener.address().port}`;
  t.after(async () => {listener.closeAllConnections(); await new Promise(resolve => listener.close(resolve)); fs.rmSync(directory, {recursive: true, force: true});});
  async function request(route, email, body) {
    const headers = {};
    if (email) headers.Authorization = `Bearer fixture:${email}`;
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(base + route, {method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined});
  }
  return {...server, base, request, writes, messages, directory};
}

for (const email of admins) {
  test(`${email} regains full server admin and user-management access`, async t => {
    const f = await serverFixture(t);
    const tokenResponse = await f.request('/api/admin/token', email, {email});
    assert.equal(tokenResponse.status, 200);
    const result = await tokenResponse.json();
    assert.equal(result.user.role, 'admin');
    assert.equal(result.user.canManageUsers, true);
    assert.equal(jwt.decode(result.token).type, 'auth');
    const listed = await f.request('/api/admin/users', email).then(r => r.json());
    const restored = listed.users.find(user => user.email === email);
    assert.equal(restored.status, 'active');
    assert.equal(restored.role, 'admin');
    assert.equal(restored.permissions.settings.edit, true);
    assert.equal(restored.permissions.manageUsers, true);
    const settings = await f.request('/api/admin/settings', email, {selectedYear: '2027'});
    assert.equal(settings.status, 200);
    const iframe = await f.request('/api/admin/stream/iframe-url', email, {iframeUrl: 'https://example.test/player'});
    assert.equal(iframe.status, 200);
    assert.equal((await f.request('/api/live/status').then(r => r.json())).iframeUrl, 'https://example.test/player');
  });
}

test('admin APIs reject spoofed emails, unknown and suspended identities, and cross-account session requests', async t => {
  const f = await serverFixture(t);
  assert.equal((await fetch(f.base + '/api/admin/users', {headers: {'x-admin-email': admins[0]}})).status, 401);
  assert.equal((await f.request('/api/admin/users', 'outside@example.test')).status, 403);
  assert.equal((await f.request('/api/admin/users', 'suspended@example.test')).status, 403);
  assert.equal((await f.request('/api/admin/token', admins[1], {email: admins[0]})).status, 403);
  assert.equal((await f.request('/api/admin/settings', 'editor@example.test', {selectedYear: '9999'})).status, 403);
});

test('server settings keep SMTP credentials private and exclude them from Firestore sync', async t => {
  const f = await serverFixture(t, {smtp: true});
  const publicSettings = await f.request('/api/settings').then(r => r.json());
  assert.equal(publicSettings.settings.smtp, undefined);
  assert.equal((await f.request('/data/settings.json')).status, 404);
  assert.equal((await f.request('/data%2Fsettings.json')).status, 404);
  const response = await f.request('/api/admin/settings', admins[2], {selectedYear: '2027'});
  assert.equal(response.status, 200);
  const synced = f.writes.find(write => write.url.includes('/settings/festival'));
  assert.equal(synced.data.fields.smtp, undefined);
});

test('restored dispatcher sends via SMTP without creating a duplicate extension trigger', async t => {
  const f = await serverFixture(t, {smtp: true});
  const result = await f.sendEmail({to: 'applicant@example.test', subject: 'Test', html: '<p>Message</p>'});
  assert.equal(result.smtpSent, true);
  assert.equal(result.firestoreQueued, false);
  assert.equal(f.messages.length, 1);
  assert.equal(f.writes.filter(write => write.url.includes('/mail/')).length, 0);
});

test('SMTP failure falls back to a correctly structured extension mail document', async t => {
  const f = await serverFixture(t, {smtp: true, rejectSmtp: true});
  const result = await f.sendEmail({to: 'applicant@example.test', subject: 'Test', html: '<p>Message</p>'});
  assert.equal(result.smtpSent, false);
  assert.equal(result.firestoreQueued, true);
  const fields = f.writes.find(write => write.url.includes('/mail/')).data.fields;
  assert.equal(fields.to.arrayValue.values[0].stringValue, 'applicant@example.test');
  assert.equal(fields.message.mapValue.fields.subject.stringValue, 'Test');
  assert.equal(fields.message.mapValue.fields.html.stringValue, '<p>Message</p>');
  assert.equal(typeof fields.from.stringValue, 'string');
  assert.equal(typeof fields.replyTo.stringValue, 'string');
});

test('a rejected Firestore queue write is not reported as sent or queued', async t => {
  const f = await serverFixture(t, {rejectQueue: true});
  const result = await f.sendEmail({to: 'applicant@example.test', subject: 'Test', html: '<p>Message</p>'});
  assert.equal(result.success, false);
  assert.equal(result.firestoreQueued, false);
});

for (const lang of ['lt', 'en']) {
  for (const attendanceType of ['in_person', 'remote']) {
    test(`${lang}/${attendanceType} server submission sends exactly two notifications`, async t => {
      const f = await serverFixture(t);
      const response = await f.request('/api/submissions/record', null, {id: 'test', name: 'Test Participant',
        email: 'applicant@example.test', filmTitle: 'Test Film', submissionLang: lang, attendanceType,
        videoUrl: 'https://example.test/test.mp4', liveToken: 'synthetic-live-token'});
      assert.equal(response.status, 200);
      const mails = f.writes.filter(write => write.url.includes('/mail/'));
      assert.equal(mails.length, 2);
      assert.equal(mails[0].data.fields.to.arrayValue.values[0].stringValue, 'applicant@example.test');
      assert.equal(mails[1].data.fields.to.arrayValue.values[0].stringValue, admins[0]);
      if (attendanceType === 'remote') assert.match(mails[0].data.fields.message.mapValue.fields.html.stringValue, /synthetic-live-token/);
    });
  }
}

test('failed submission notifications return an error after the film has been recorded', async t => {
  const f = await serverFixture(t, {rejectQueue: true});
  const response = await f.request('/api/submissions/record', null, {id: 'test', name: 'Test Participant', email: 'applicant@example.test', filmTitle: 'Test Film'});
  assert.equal(response.status, 502);
  assert.equal((await response.json()).success, false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.directory, 'data/submissions.json'))).submissions.length, 1);
});


test('environment SMTP credentials work before any SMTP settings are saved', async t => {
  const f = await serverFixture(t, {envSmtp: true});
  const result = await f.sendEmail({to: 'applicant@example.test', subject: 'Test', html: '<p>Message</p>'});
  assert.equal(result.smtpSent, true);
  assert.equal(f.messages[0].from, 'Festival <sender@example.test>');
  assert.equal(f.writes.filter(write => write.url.includes('/mail/')).length, 0);
});

test('submission retry does not resend either successful notification', async t => {
  const f = await serverFixture(t);
  const data = {id: 'retry_film', name: 'Test Participant', email: 'applicant@example.test', filmTitle: 'Retry film'};
  for (let index = 0; index < 2; index++) assert.equal((await f.request('/api/submissions/record', null, data)).status, 200);
  assert.equal(f.writes.filter(write => write.url.includes('/mail/')).length, 2);
  assert.equal(JSON.parse(fs.readFileSync(f.directory + '/data/submissions.json')).submissions.length, 1);
});

test('partial submission retry only retries the failed recipient', async t => {
  let denyOrganizer = true;
  const f = await serverFixture(t, {rejectQueue: (url, options) => {
    const to = JSON.parse(options.body || '{}').fields?.to?.arrayValue?.values?.[0]?.stringValue;
    return denyOrganizer && to === admins[0];
  }});
  const data = {id: 'partial_retry', name: 'Test Participant', email: 'applicant@example.test', filmTitle: 'Partial film'};
  assert.equal((await f.request('/api/submissions/record', null, data)).status, 502);
  denyOrganizer = false;
  assert.equal((await f.request('/api/submissions/record', null, data)).status, 200);
  const mails = f.writes.filter(write => write.url.includes('/mail/'));
  assert.equal(mails.length, 3); // First receipt, denied organizer, retried organizer.
  assert.equal(mails.filter(write => write.data.fields.to.arrayValue.values[0].stringValue === data.email).length, 1);
});

test('server normalizes recipient lists and rejects malformed mail fields', async t => {
  const f = await serverFixture(t);
  assert.equal((await f.sendEmail({to: 'a@example.test, b@example.test', subject: 'Test', html: '<p>Test</p>'})).success, true);
  const values = f.writes.find(write => write.url.includes('/mail/')).data.fields.to.arrayValue.values;
  assert.deepEqual(values.map(value => value.stringValue), ['a@example.test', 'b@example.test']);
  assert.equal((await f.sendEmail({to: ['a@example.test', 5], subject: 'Test', html: '<p>Test</p>'})).success, false);
  assert.equal((await f.sendEmail({to: 'a@example.test', subject: {}, html: '<p>Test</p>'})).success, false);
});
