import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Persistent Data Storage
const DATA_DIR = path.join(__dirname, 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INVITATIONS_FILE = path.join(DATA_DIR, 'invitations.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Helpers: Load & Save Persistent JSON Files
// ---------------------------------------------------------------------------
function loadJson(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.warn(`Error reading ${file}:`, e.message);
  }
  return defaultVal;
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error saving ${file}:`, e.message);
  }
}

function loadLogsData() {
  const defaultLogs = [
    {
      id: "log_init_1",
      action: "SYSTEM_BOOT",
      category: "settings",
      adminEmail: "azuolynasfilmfestival@gmail.com",
      adminName: "Vyr. Administratorius",
      target: "settings/festival",
      details: "Sistemos startas ir nustatymų sinchronizacija Kauno Tarptautinė Gimnazija platformoje",
      timestamp: "2026-02-15T10:00:00.000Z",
      status: "success"
    },
    {
      id: "log_init_2",
      action: "USER_INVITED",
      category: "users",
      adminEmail: "azuolynasfilmfestival@gmail.com",
      adminName: "Vyr. Administratorius",
      target: "karina.brdar@gmail.com",
      details: "Išsiųstas pakvietimas ir suteikta administratoriaus prieiga (Karina Brdar)",
      timestamp: "2026-02-20T14:30:00.000Z",
      status: "success"
    },
    {
      id: "log_init_3",
      action: "SETTINGS_CHANGED",
      category: "settings",
      adminEmail: "azuolynasfilmfestival@gmail.com",
      adminName: "Vyr. Administratorius",
      target: "votingActive",
      details: "Balsavimo nustatymų atnaujinimas ir archyvo matomumo patikrinimas",
      timestamp: "2026-03-01T09:15:00.000Z",
      status: "success"
    }
  ];
  return loadJson(LOGS_FILE, { logs: defaultLogs });
}

function saveLogsData(data) {
  saveJson(LOGS_FILE, data);
}

function recordActivityLog({ action, category, adminEmail, adminName, target, details, status = "success" }) {
  try {
    const logsData = loadLogsData();
    if (!logsData.logs) logsData.logs = [];
    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const timestamp = new Date().toISOString();
    const newLog = {
      id: logId,
      action: action || "GENERAL_ACTION",
      category: category || "users",
      adminEmail: adminEmail || "azuolynasfilmfestival@gmail.com",
      adminName: adminName || (adminEmail ? adminEmail.split("@")[0] : "Administratorius"),
      target: target || "system",
      details: details || "",
      timestamp,
      status
    };

    logsData.logs.unshift(newLog);
    if (logsData.logs.length > 250) {
      logsData.logs = logsData.logs.slice(0, 250);
    }
    saveLogsData(logsData);

    // Sync to Firestore logs collection
    syncToFirestore('logs', logId, {
      action: { stringValue: newLog.action },
      category: { stringValue: newLog.category },
      adminEmail: { stringValue: newLog.adminEmail },
      adminName: { stringValue: newLog.adminName },
      target: { stringValue: newLog.target },
      details: { stringValue: newLog.details },
      timestamp: { timestampValue: newLog.timestamp },
      status: { stringValue: newLog.status }
    });

    return newLog;
  } catch (err) {
    console.warn("Could not record activity log:", err.message);
  }
}

function loadVotesData() {
  const d = loadJson(VOTES_FILE, { votesByFilm: {}, votersByDevice: {}, auditLog: [] });
  if (!d.votesByFilm) d.votesByFilm = {};
  if (!d.votersByDevice) d.votersByDevice = {};
  if (!d.auditLog) d.auditLog = [];
  return d;
}

function loadSettingsData() {
  return loadJson(SETTINGS_FILE, {
    votingActive: true,
    maintenanceMode: false,
    publicWinners: true,
    submissionsOpen: true,
    autoRankings: true,
    institutionNameLt: "Kauno Tarptautinė Gimnazija",
    institutionNameEn: "Kaunas International Gymnasium"
  });
}

function loadUsersData() {
  return loadJson(USERS_FILE, {
    users: [
      {
        uid: "admin_super",
        email: "azuolynasfilmfestival@gmail.com",
        name: "Festivalio",
        surname: "Administratorius",
        role: "admin",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastLogin: new Date().toISOString()
      },
      {
        uid: "admin_karina",
        email: "karina.brdar@gmail.com",
        name: "Karina",
        surname: "Brdar",
        role: "admin",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastLogin: new Date().toISOString()
      }
    ]
  });
}

function loadInvitationsData() {
  return loadJson(INVITATIONS_FILE, { invitations: [] });
}

// ---------------------------------------------------------------------------
// Firestore REST Sync Helper
// ---------------------------------------------------------------------------
const FIREBASE_API_KEY = 'AIzaSyAl-aLSlSHUdrZ4Rr4x23n3bu3QFZSYyB0';
const FIREBASE_PROJECT_ID = 'azuolynas-film-fest';

async function syncToFirestore(collection, docId, fields) {
  try {
    const patchUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    // Non-blocking background sync
  }
}

async function deleteFromFirestore(collection, docId) {
  try {
    const delUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
    await fetch(delUrl, {
      method: 'DELETE'
    });
  } catch (err) {
    // Non-blocking background sync
  }
}

// ---------------------------------------------------------------------------
// VOTING API (Secure, Per-Device & Per-Category Anti-Fraud Tracking)
// ---------------------------------------------------------------------------

// API: Get live vote totals and counts
app.get('/api/votes', (req, res) => {
  try {
    const data = loadVotesData();
    const settings = loadSettingsData();
    const totalVotes = Object.values(data.votesByFilm || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
    res.json({
      success: true,
      votingActive: settings.votingActive !== false,
      votes: data.votesByFilm || {},
      totalVotes: totalVotes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve votes' });
  }
});

// API: Check device's current votes across categories
app.get('/api/my-votes', (req, res) => {
  try {
    const deviceHash = String(req.query.deviceHash || '').trim();
    if (!deviceHash) {
      return res.json({ success: true, votedCategories: {} });
    }
    const data = loadVotesData();
    const userVotes = (data.votersByDevice && data.votersByDevice[deviceHash]) || {};
    res.json({
      success: true,
      votedCategories: userVotes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve voter status' });
  }
});

// API: Cast audience choice vote (Locks only that specific category for that visitor)
app.post('/api/vote', async (req, res) => {
  try {
    const settings = loadSettingsData();
    if (settings.votingActive === false) {
      return res.status(403).json({
        error: 'voting-closed',
        message: 'Žiūrovų balsavimas šiuo metu yra sustabdytas festivalio administracijos.'
      });
    }

    const { filmId, category, deviceHash, voterSalt } = req.body || {};
    if (!filmId || typeof filmId !== 'string') {
      return res.status(400).json({ error: 'filmId is required' });
    }

    const cleanFilmId = filmId.trim();
    const cleanCategory = (category && typeof category === 'string' && category.trim().length > 0)
      ? category.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : 'general';

    // Verify or generate high-entropy device hash
    let cleanDeviceHash = (deviceHash && typeof deviceHash === 'string' && deviceHash.trim().length >= 16)
      ? deviceHash.trim()
      : null;

    if (!cleanDeviceHash) {
      // Server fallback hash based on IP and headers
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const salt = voterSalt || 'default_salt';
      cleanDeviceHash = crypto.createHash('sha256').update(`${ip}-${userAgent}-${salt}`).digest('hex');
    }

    const votesData = loadVotesData();
    if (!votesData.votersByDevice) votesData.votersByDevice = {};
    if (!votesData.votesByFilm) votesData.votesByFilm = {};
    if (!votesData.auditLog) votesData.auditLog = [];

    const deviceRecord = votesData.votersByDevice[cleanDeviceHash] || {};

    // Check if THIS specific device has already voted in THIS SPECIFIC category
    if (deviceRecord[cleanCategory]) {
      return res.status(400).json({
        error: 'already-voted',
        category: cleanCategory,
        filmId: deviceRecord[cleanCategory].filmId,
        message: 'Jūs jau atidavėte savo balsą šioje kategorijoje.'
      });
    }

    // Increment vote count
    const currentVotes = (Number(votesData.votesByFilm[cleanFilmId]) || 0) + 1;
    votesData.votesByFilm[cleanFilmId] = currentVotes;

    // Record under this device for this specific category
    deviceRecord[cleanCategory] = {
      filmId: cleanFilmId,
      timestamp: new Date().toISOString()
    };
    votesData.votersByDevice[cleanDeviceHash] = deviceRecord;

    votesData.auditLog.push({
      filmId: cleanFilmId,
      category: cleanCategory,
      deviceHash: cleanDeviceHash,
      timestamp: new Date().toISOString()
    });

    saveVotesData(votesData);

    // Sync to Firestore in background
    (async () => {
      // 1. Update votesCount on submission
      await syncToFirestore('submissions', cleanFilmId, {
        votesCount: { integerValue: String(currentVotes) }
      });
      // 2. Record vote audit lock in votes_audit
      const auditDocId = `${cleanCategory}_${cleanDeviceHash.substring(0, 32)}`;
      await syncToFirestore('votes_audit', auditDocId, {
        filmId: { stringValue: cleanFilmId },
        category: { stringValue: cleanCategory },
        deviceHash: { stringValue: cleanDeviceHash },
        votedAt: { timestampValue: new Date().toISOString() }
      });
    })();

    return res.json({
      success: true,
      filmId: cleanFilmId,
      category: cleanCategory,
      votesCount: currentVotes,
      votedCategories: deviceRecord
    });
  } catch (err) {
    console.error('Error in /api/vote:', err);
    return res.status(500).json({ error: 'Internal server error while processing vote' });
  }
});

// ---------------------------------------------------------------------------
// ADMIN & GLOBAL SETTINGS API
// ---------------------------------------------------------------------------

// API: Get global settings and feature tumblers
app.get('/api/admin/settings', (req, res) => {
  try {
    const settings = loadSettingsData();
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// API: Update global settings and feature tumblers
app.post('/api/admin/settings', (req, res) => {
  try {
    const current = loadSettingsData();
    const updates = req.body || {};
    const updated = { ...current, ...updates };
    saveJson(SETTINGS_FILE, updated);

    // Background sync to Firestore settings/global
    syncToFirestore('settings', 'global', {
      votingActive: { booleanValue: updated.votingActive !== false },
      maintenanceMode: { booleanValue: updated.maintenanceMode === true },
      publicWinners: { booleanValue: updated.publicWinners !== false },
      submissionsOpen: { booleanValue: updated.submissionsOpen !== false },
      institutionNameLt: { stringValue: updated.institutionNameLt || "Kauno Tarptautinė Gimnazija" },
      institutionNameEn: { stringValue: updated.institutionNameEn || "Kaunas International Gymnasium" }
    });

    res.json({ success: true, settings: updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// API: Live voting results, rankings, and margin calculations
app.get('/api/admin/voting-stats', (req, res) => {
  try {
    const votesData = loadVotesData();
    const votesByFilm = votesData.votesByFilm || {};
    const auditLog = votesData.auditLog || [];

    // Calculate totals and leaders
    const entries = Object.entries(votesByFilm).map(([filmId, count]) => ({
      filmId,
      count: Number(count) || 0
    })).sort((a, b) => b.count - a.count);

    const totalVotes = entries.reduce((acc, cur) => acc + cur.count, 0);

    const leader = entries[0] || null;
    const runnerUp = entries[1] || null;
    const margin = leader && runnerUp ? leader.count - runnerUp.count : (leader ? leader.count : 0);
    const marginPct = totalVotes > 0 && leader && runnerUp 
      ? (((leader.count - runnerUp.count) / totalVotes) * 100).toFixed(1)
      : (totalVotes > 0 && leader ? "100.0" : "0.0");

    res.json({
      success: true,
      totalVotes,
      entries,
      leader,
      runnerUp,
      margin,
      marginPct,
      recentVotes: auditLog.slice(-20).reverse()
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to calculate voting statistics' });
  }
});

// ---------------------------------------------------------------------------
// USER MANAGEMENT & INVITATIONS API (RBAC)
// ---------------------------------------------------------------------------

// API: List users and pending invitations
app.get('/api/admin/users', (req, res) => {
  try {
    const usersData = loadUsersData();
    const invitesData = loadInvitationsData();
    res.json({
      success: true,
      users: usersData.users || [],
      invitations: (invitesData.invitations || []).filter(i => i.status === 'pending')
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// API: Create new invitation
app.post('/api/admin/invite', async (req, res) => {
  try {
    const { name, surname, email, role, adminEmail } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['admin', 'moderator', 'judge', 'accountant', 'viewer'].includes(role) ? role : 'moderator';
    const cleanName = (name || '').trim();
    const cleanSurname = (surname || '').trim();

    const token = crypto.randomBytes(20).toString('hex');
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const invitesData = loadInvitationsData();
    if (!invitesData.invitations) invitesData.invitations = [];

    // Expire any existing pending invite for this email
    invitesData.invitations.forEach(inv => {
      if (inv.email === cleanEmail && inv.status === 'pending') {
        inv.status = 'revoked';
      }
    });

    const newInvite = {
      token,
      code,
      name: cleanName,
      surname: cleanSurname,
      email: cleanEmail,
      role: cleanRole,
      status: 'pending',
      invitedBy: adminEmail || 'azuolynasfilmfestival@gmail.com',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    };

    invitesData.invitations.push(newInvite);
    saveJson(INVITATIONS_FILE, invitesData);

    // Also provision/link user in users list
    const usersData = loadUsersData();
    if (!usersData.users) usersData.users = [];
    const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    const existingUserIdx = usersData.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const userDoc = {
      uid: docId,
      email: cleanEmail,
      name: cleanName,
      surname: cleanSurname,
      role: cleanRole,
      status: 'active',
      canManageUsers: req.body.canManageUsers === true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      invitedBy: adminEmail || 'azuolynasfilmfestival@gmail.com'
    };
    if (existingUserIdx >= 0) {
      usersData.users[existingUserIdx] = { ...usersData.users[existingUserIdx], ...userDoc };
    } else {
      usersData.users.push(userDoc);
    }
    saveJson(USERS_FILE, usersData);

    // Sync to Firestore (invitations & users)
    syncToFirestore('invitations', token, {
      token: { stringValue: token },
      code: { stringValue: code },
      email: { stringValue: cleanEmail },
      name: { stringValue: cleanName },
      surname: { stringValue: cleanSurname },
      role: { stringValue: cleanRole },
      status: { stringValue: 'pending' },
      invitedBy: { stringValue: newInvite.invitedBy },
      createdAt: { timestampValue: newInvite.createdAt },
      expiresAt: { timestampValue: newInvite.expiresAt }
    });

    syncToFirestore('users', docId, {
      uid: { stringValue: docId },
      email: { stringValue: cleanEmail },
      name: { stringValue: cleanName },
      surname: { stringValue: cleanSurname },
      role: { stringValue: cleanRole },
      status: { stringValue: 'active' },
      canManageUsers: { booleanValue: userDoc.canManageUsers === true },
      createdAt: { timestampValue: userDoc.createdAt },
      lastLogin: { timestampValue: userDoc.lastLogin }
    });

    recordActivityLog({
      action: "USER_INVITED",
      category: "users",
      adminEmail: newInvite.invitedBy,
      target: cleanEmail,
      details: `Pakviestas naujas komandos narys (${cleanName} ${cleanSurname}), priskirta rolė: ${cleanRole.toUpperCase()}`
    });

    res.json({
      success: true,
      invitation: newInvite
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// API: Get invitation details for activation page
app.get('/api/admin/invite-info', (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    const invitesData = loadInvitationsData();
    const invite = (invitesData.invitations || []).find(i => i.token === token);
    if (!invite) {
      return res.status(404).json({ error: 'Kvietimas nerastas arba nebegalioja' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Šis kvietimas jau buvo panaudotas arba atšauktas' });
    }
    res.json({
      success: true,
      invitation: {
        email: invite.email,
        name: invite.name,
        surname: invite.surname,
        role: invite.role,
        code: invite.code,
        invitedBy: invite.invitedBy
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to verify invitation' });
  }
});

// API: Activate account via invitation code
app.post('/api/admin/activate-invite', (req, res) => {
  try {
    const { token, code, password, name, surname, uid } = req.body || {};
    if (!token || !code) {
      return res.status(400).json({ error: 'Token and code are required' });
    }

    const invitesData = loadInvitationsData();
    const invite = (invitesData.invitations || []).find(i => i.token === token && i.code === String(code).trim());
    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ error: 'Neteisingas arba nebegaliojantis kvietimo kodas' });
    }

    // Mark invitation accepted
    invite.status = 'accepted';
    invite.acceptedAt = new Date().toISOString();
    saveJson(INVITATIONS_FILE, invitesData);

    // Provision User in users list
    const usersData = loadUsersData();
    if (!usersData.users) usersData.users = [];

    const existingIdx = usersData.users.findIndex(u => u.email === invite.email);
    const userUid = uid || 'usr_' + crypto.randomBytes(8).toString('hex');

    const userProfile = {
      uid: userUid,
      email: invite.email,
      name: (name || invite.name || '').trim(),
      surname: (surname || invite.surname || '').trim(),
      role: invite.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      invitedBy: invite.invitedBy
    };

    if (existingIdx >= 0) {
      usersData.users[existingIdx] = { ...usersData.users[existingIdx], ...userProfile };
    } else {
      usersData.users.push(userProfile);
    }

    saveJson(USERS_FILE, usersData);

    // Sync to Firestore
    syncToFirestore('users', userUid, {
      uid: { stringValue: userUid },
      email: { stringValue: userProfile.email },
      name: { stringValue: userProfile.name },
      surname: { stringValue: userProfile.surname },
      role: { stringValue: userProfile.role },
      status: { stringValue: 'active' },
      createdAt: { timestampValue: userProfile.createdAt },
      lastLogin: { timestampValue: userProfile.lastLogin }
    });

    res.json({
      success: true,
      user: userProfile
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to activate account' });
  }
});

// API: Toggle user status (active / suspended)
app.post('/api/admin/users/status', (req, res) => {
  try {
    const { email, status } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const usersData = loadUsersData();
    const user = (usersData.users || []).find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.status = status === 'suspended' ? 'suspended' : 'active';
    saveJson(USERS_FILE, usersData);

    const docId = user.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    syncToFirestore('users', docId, {
      status: { stringValue: user.status }
    });

    if (user.uid && user.uid !== docId) {
      syncToFirestore('users', user.uid, {
        status: { stringValue: user.status }
      });
    }

    recordActivityLog({
      action: "USER_STATUS_TOGGLED",
      category: "users",
      adminEmail: req.body.adminEmail || "azuolynasfilmfestival@gmail.com",
      target: user.email,
      details: `Vartotojo ${user.email} prieiga pakeista į: ${user.status === 'active' ? 'AKTYVUS (Leidžiama)' : 'UŽBLOKUOTAS (Sustabdyta)'}`
    });

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// API: Update user role
app.post('/api/admin/users/role', (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!email || !role) return res.status(400).json({ error: 'Email and role are required' });

    const usersData = loadUsersData();
    const user = (usersData.users || []).find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    saveJson(USERS_FILE, usersData);

    const docId = user.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    syncToFirestore('users', docId, {
      role: { stringValue: user.role }
    });

    if (user.uid && user.uid !== docId) {
      syncToFirestore('users', user.uid, {
        role: { stringValue: user.role }
      });
    }

    recordActivityLog({
      action: "USER_ROLE_CHANGED",
      category: "users",
      adminEmail: req.body.adminEmail || "azuolynasfilmfestival@gmail.com",
      target: user.email,
      details: `Vartotojo ${user.email} rolė pakeista į: ${role.toUpperCase()}`
    });

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// API: Grant or revoke User Management Access (canManageUsers)
app.post('/api/admin/users/permission', (req, res) => {
  try {
    const { email, canManageUsers, adminEmail } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const callerEmail = String(adminEmail || '').toLowerCase();
    // Only primary superadmin can grant/revoke this permission
    if (callerEmail !== 'azuolynasfilmfestival@gmail.com') {
      return res.status(403).json({ error: 'Tik pagrindinis administratorius gali suteikti prieigą prie vartotojų valdymo skilties' });
    }

    const usersData = loadUsersData();
    const user = (usersData.users || []).find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.canManageUsers = canManageUsers === true;
    saveJson(USERS_FILE, usersData);

    const docId = user.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    syncToFirestore('users', docId, {
      canManageUsers: { booleanValue: user.canManageUsers }
    });

    if (user.uid && user.uid !== docId) {
      syncToFirestore('users', user.uid, {
        canManageUsers: { booleanValue: user.canManageUsers }
      });
    }

    recordActivityLog({
      action: "USER_PERMISSION_CHANGED",
      category: "users",
      adminEmail: callerEmail,
      target: user.email,
      details: `Vartotojui ${user.email} ${user.canManageUsers ? 'SUTEIKTA' : 'PANAIKINTA'} prieiga prie skilties „Vartotojai & Prieiga“`
    });

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user permission' });
  }
});

// API: Safely delete user account (deletes from JSON and Firestore)
app.post('/api/admin/users/delete', async (req, res) => {
  try {
    const { email, userId } = req.body || {};
    if (!email && !userId) return res.status(400).json({ error: 'Email or userId is required' });

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanEmail === 'azuolynasfilmfestival@gmail.com') {
      return res.status(403).json({ error: 'Super Administrator cannot be deleted' });
    }

    const usersData = loadUsersData();
    const targetUser = (usersData.users || []).find(u => 
      (cleanEmail && u.email.toLowerCase() === cleanEmail) || (userId && (u.uid === userId || u.id === userId))
    );

    const effectiveEmail = cleanEmail || (targetUser ? targetUser.email.toLowerCase() : '');
    const docId = effectiveEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Remove from users list
    usersData.users = (usersData.users || []).filter(u => {
      const matchEmail = effectiveEmail && u.email.toLowerCase() === effectiveEmail;
      const matchId = userId && (u.uid === userId || u.id === userId);
      return !matchEmail && !matchId;
    });
    saveJson(USERS_FILE, usersData);

    // Delete from Firestore
    if (docId) await deleteFromFirestore('users', docId);
    if (userId) await deleteFromFirestore('users', userId);
    if (targetUser && targetUser.uid) await deleteFromFirestore('users', targetUser.uid);

    // Revoke any pending invitations
    const invitesData = loadInvitationsData();
    if (invitesData.invitations) {
      invitesData.invitations.forEach(inv => {
        if (effectiveEmail && inv.email.toLowerCase() === effectiveEmail) {
          inv.status = 'revoked';
          deleteFromFirestore('invitations', inv.token);
        }
      });
      saveJson(INVITATIONS_FILE, invitesData);
    }

    recordActivityLog({
      action: "USER_DELETED",
      category: "users",
      adminEmail: req.body.adminEmail || "azuolynasfilmfestival@gmail.com",
      target: effectiveEmail || userId,
      details: `Vartotojo paskyra ${effectiveEmail || userId} visam laikui pašalinta iš sistemos ir Firestore duomenų bazės`
    });

    res.json({ success: true, message: 'User account removed permanently' });
  } catch (e) {
    console.error('Error in /api/admin/users/delete:', e);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// API: Get Activity Logs
app.get('/api/admin/logs', (req, res) => {
  try {
    const logsData = loadLogsData();
    res.json({
      success: true,
      logs: logsData.logs || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve activity logs' });
  }
});

// API: Add Activity Log
app.post('/api/admin/logs', (req, res) => {
  try {
    const { action, category, adminEmail, adminName, target, details, status } = req.body || {};
    const log = recordActivityLog({ action, category, adminEmail, adminName, target, details, status });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record activity log' });
  }
});

// Friendly aliases for Privacy Policy & Terms of Service
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms-of-service.html'));
});
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms-of-service.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
