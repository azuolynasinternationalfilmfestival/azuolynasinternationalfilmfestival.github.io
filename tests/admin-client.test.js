import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const admins = ['azuolynasfilmfestival@gmail.com', 'karina.brdar@gmail.com',
  'dominikphotofficial.t@gmail.com', 'dominikphotofficial.lt@gmail.com'];
const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const stripModules = text => text.replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
function dom() {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) {
      const classes = new Set(['d-none']);
      elements.set(id, {value: '', style: {}, classList: {add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value)},
        addEventListener() {}, setAttribute() {}, reset() {}, focus() {}});
    }
    return elements.get(id);
  };
  return {readyState: 'loading', addEventListener() {}, getElementById};
}

for (const email of admins) {
  test(`${email} enters the panel as admin despite a stale reduced or suspended profile`, async () => {
    let authCallback, accepted, synced, signedOut = false;
    const document = dom(), session = new Map();
    const user = {email: email.toUpperCase(), uid: 'synthetic-uid'};
    const auth = {currentUser: user, onAuthStateChanged: callback => {authCallback = callback;}, signOut: () => {signedOut = true;}};
    const db = {collection: () => ({doc: () => ({get: async () => ({exists: true, data: () => ({role: 'viewer', status: 'suspended'})}), set: async data => {synced = data;}})})};
    const create = new Function('defaultAuth', 'getFirebaseAuth', 'db', 'AUTHORIZED_ADMIN_EMAILS', 'PRIMARY_SUPERADMIN_EMAIL', 'auth', 'document', 'window', 'sessionStorage', 'showToast',
      stripModules(read('js/auth.js')) + '\nreturn initAuth;');
    const init = create(auth, () => auth, db, admins, admins[0], auth, document, {location: {search: ''}},
      {setItem: (key, value) => session.set(key, value), getItem: key => session.get(key)}, () => {});
    init({onLoginSuccess: value => {accepted = value;}});
    await authCallback(user);
    assert.equal(signedOut, false);
    assert.equal(accepted, user);
    assert.equal(session.get('admin_user_role'), 'admin');
    assert.equal(synced.role, 'admin');
    assert.equal(synced.canManageUsers, true);
    assert.equal(document.getElementById('panelSection').classList.contains('d-none'), false);
  });
  test(`${email} can see the settings invitation controls`, () => {
    const document = dom();
    const evaluate = new Function('AUTHORIZED_ADMIN_EMAILS', 'document',
      stripModules(read('js/settings.js')) + '\nreturn evaluateAdminPrivileges;')(admins, document);
    evaluate({email: email.toUpperCase()});
    assert.equal(document.getElementById('adminInviteCard').classList.contains('d-none'), false);
  });
  test(`${email} can see the user-management tab`, async () => {
    const document = dom();
    const access = new Function('db', 'auth', 'PRIMARY_SUPERADMIN_EMAIL', 'AUTHORIZED_ADMIN_EMAILS', 'document',
      stripModules(read('js/users.js')) + '\nreturn evaluateUserManagementAccess;')(null, null, admins[0], admins, document);
    assert.equal(await access({email: email.toUpperCase()}), true);
    assert.equal(document.getElementById('tabUsersBtn').classList.contains('d-none'), false);
    assert.equal(await access({email: 'outside@example.test'}), false);
  });
}

test('client module, page config, backend and Firestore whitelist contain the same historical accounts', () => {
  for (const name of ['config.js', 'js/firebase-init.js', 'server.js', 'firestore.rules']) {
    const text = read(name);
    for (const email of admins) assert.ok(text.includes(email), `${name} missing ${email}`);
  }
  assert.match(read('js/users.js'), /TRUSTED_MANAGEMENT_EMAILS = AUTHORIZED_ADMIN_EMAILS/);
});
