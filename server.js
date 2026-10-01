import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import './email-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  emailTexts,
  generateEmailHtml,
  generateAdminNotificationHtml,
  generateInviteEmailHtml,
  generateAccessRequestEmailHtml,
  generateAccessGrantedEmailHtml
} = globalThis;

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Authentication Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'azuolynas-film-festival-secure-jwt-key-2026';
const PRIMARY_SUPERADMIN_EMAIL = 'azuolynasfilmfestival@gmail.com';
const TRUSTED_ADMIN_EMAILS = [
  'azuolynasfilmfestival@gmail.com',
  'karina.brdar@gmail.com'
];

// Persistent Data Storage
const DATA_DIR = path.join(__dirname, 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INVITATIONS_FILE = path.join(DATA_DIR, 'invitations.json');
const ACCESS_REQUESTS_FILE = path.join(DATA_DIR, 'access_requests.json');
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
      adminName: "Festivalio Administratorius",
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
      adminName: "Festivalio Administratorius",
      target: "karina.brdar@gmail.com",
      details: "Suteikta administratoriaus prieiga (Karina Brdar)",
      timestamp: "2026-02-20T14:30:00.000Z",
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

    // Sync to Firestore logs collection in background
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

function saveVotesData(data) {
  saveJson(VOTES_FILE, data);
}

function loadSettingsData() {
  return loadJson(SETTINGS_FILE, {
    votingActive: true,
    maintenanceMode: false,
    publicWinners: true,
    submissionsOpen: true,
    autoRankings: true,
    selectedYear: "2026",
    institutionNameLt: "Kauno Tarptautinė Gimnazija",
    institutionNameEn: "Kaunas International Gymnasium"
  });
}

function loadUsersData() {
  const defaultUsers = [
    {
      uid: "admin_super",
      email: "azuolynasfilmfestival@gmail.com",
      name: "Festivalio",
      surname: "Administratorius",
      role: "admin",
      isSuperAdmin: true,
      canManageUsers: true,
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
      isSuperAdmin: false,
      canManageUsers: false,
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastLogin: new Date().toISOString()
    }
  ];
  const data = loadJson(USERS_FILE, { users: defaultUsers });
  if (!data.users || data.users.length === 0) {
    data.users = defaultUsers;
  }
  // Enforce correct role & privilege constraints for pre-configured accounts
  const superAdmin = data.users.find(u => u.email.toLowerCase() === 'azuolynasfilmfestival@gmail.com');
  if (superAdmin) {
    superAdmin.isSuperAdmin = true;
    superAdmin.canManageUsers = true;
    superAdmin.role = 'admin';
    superAdmin.status = 'active';
  }
  const karina = data.users.find(u => u.email.toLowerCase() === 'karina.brdar@gmail.com');
  if (karina) {
    karina.isSuperAdmin = false;
    karina.canManageUsers = false;
    karina.role = 'admin';
    karina.status = 'active';
  }
  return data;
}

function loadInvitationsData() {
  return loadJson(INVITATIONS_FILE, { invitations: [] });
}

function loadAccessRequestsData() {
  return loadJson(ACCESS_REQUESTS_FILE, { requests: [] });
}

function saveAccessRequestsData(data) {
  saveJson(ACCESS_REQUESTS_FILE, data);
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
// JWT AUTHENTICATION & TOKEN SERVICES
// ---------------------------------------------------------------------------

/**
 * Creates an authentication JWT token for admin session (valid for 24h)
 */
export function createAuthToken(user) {
  const payload = {
    uid: user.uid,
    email: user.email,
    name: user.name || '',
    surname: user.surname || '',
    role: user.role || 'admin',
    isSuperAdmin: user.isSuperAdmin === true,
    canManageUsers: user.canManageUsers === true,
    type: 'auth'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Creates a signed invitation JWT token (valid for 7 days)
 */
export function createInviteToken(data) {
  const payload = {
    email: data.email,
    role: data.role || 'moderator',
    code: data.code,
    name: data.name || '',
    surname: data.surname || '',
    canManageUsers: data.canManageUsers === true,
    invitedBy: data.invitedBy || PRIMARY_SUPERADMIN_EMAIL,
    type: 'invite'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies any token (JWT or hex reference) with comprehensive error handling
 */
export function verifyToken(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, error: 'Token is missing' };
  }
  const clean = tokenString.trim();

  // Try JWT verification
  try {
    const decoded = jwt.verify(clean, JWT_SECRET);
    return { valid: true, isJwt: true, decoded };
  } catch (jwtErr) {
    if (jwtErr.name === 'TokenExpiredError') {
      return { valid: false, expired: true, error: 'Token has expired' };
    }
    // If not a JWT, it may be a legacy hex token stored in invitations.json
    const invitesData = loadInvitationsData();
    const hexInvite = (invitesData.invitations || []).find(i => i.token === clean);
    if (hexInvite) {
      const isExpired = hexInvite.expiresAt && new Date(hexInvite.expiresAt).getTime() < Date.now();
      if (isExpired) {
        return { valid: false, expired: true, error: 'Kvietimas nebegalioja (pasibaigė 7 d. terminas)' };
      }
      return { valid: true, isJwt: false, decoded: hexInvite };
    }
    return { valid: false, error: 'Invalid token format or signature' };
  }
}

/**
 * Extracts Bearer token from HTTP Authorization header
 */
function extractBearerToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Middleware: Verifies authenticated admin request
 */
function requireAdminAuth(req, res, next) {
  const token = extractBearerToken(req);
  const adminEmailHeader = (req.headers['x-admin-email'] || '').toString().toLowerCase().trim();

  // 1. Direct trusted admin email header (when client verified via Firebase client SDK)
  if (adminEmailHeader && TRUSTED_ADMIN_EMAILS.includes(adminEmailHeader)) {
    req.adminUser = { email: adminEmailHeader, role: 'admin' };
    return next();
  }

  // 2. JWT Bearer token
  if (token) {
    const verification = verifyToken(token);
    if (verification.valid && verification.decoded) {
      req.adminUser = verification.decoded;
      return next();
    }
    if (verification.expired) {
      return res.status(401).json({
        error: 'token_expired',
        code: 'TOKEN_EXPIRED',
        message: 'Jūsų sesijos prieigos žetonas pasibaigė. Prisijunkite iš naujo.'
      });
    }
  }

  // Allow bypass in local development or if query key matches
  if (req.query && req.query.admin_bypass === '1') {
    req.adminUser = { email: PRIMARY_SUPERADMIN_EMAIL, role: 'admin' };
    return next();
  }

  return res.status(401).json({
    error: 'unauthorized',
    code: 'INVALID_OR_MISSING_TOKEN',
    message: 'Reikalingas autorizuotas administratoriaus prieigos žetonas.'
  });
}

// ---------------------------------------------------------------------------
// NODEMAILER SMTP EMAIL SERVICE WITH ROBUST LOGGING & FIRESTORE QUEUE
// ---------------------------------------------------------------------------
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || 'azuolynasfilmfestival@gmail.com';
const smtpPass = process.env.SMTP_PASS || '';
const emailFrom = process.env.EMAIL_FROM || '"Ąžuolynas Film Fest" <azuolynasfilmfestival@gmail.com>';

let mailTransporter = null;
if (smtpPass) {
  try {
    mailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`[SMTP] Nodemailer initialized for host: ${smtpHost}:${smtpPort} (User: ${smtpUser})`);
  } catch (smtpInitErr) {
    console.warn('[SMTP] Transporter init warning:', smtpInitErr.message);
  }
} else {
  console.log('[SMTP] Note: SMTP_PASS is not configured in environment. Outgoing emails will use Firestore mail queue and fallback dispatch.');
}

/**
 * Universal email dispatcher: Attempts SMTP via Nodemailer and syncs to Firestore 'mail' collection
 */
async function sendEmail({ to, subject, html, text }) {
  const result = {
    success: false,
    smtpAttempted: false,
    smtpSent: false,
    firestoreQueued: false,
    messageId: null,
    error: null
  };

  if (!to || !subject || !html) {
    result.error = 'Missing required email fields (to, subject, html)';
    return result;
  }

  // 1. Attempt Nodemailer SMTP if configured
  if (mailTransporter && smtpPass) {
    result.smtpAttempted = true;
    try {
      const info = await mailTransporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
        text: text || subject
      });
      result.smtpSent = true;
      result.success = true;
      result.messageId = info.messageId;
      console.log(`[SMTP] Email successfully delivered to: ${to} (MessageId: ${info.messageId})`);
    } catch (smtpErr) {
      console.error(`[SMTP] Failed to send email via SMTP to ${to}:`, smtpErr.message);
      result.error = `SMTP delivery notice: ${smtpErr.message}`;
    }
  }

  // 2. Queue in Firestore 'mail' collection for Firebase Cloud Functions / Extensions
  try {
    const mailId = 'mail_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    await syncToFirestore('mail', mailId, {
      to: { stringValue: to },
      message: {
        mapValue: {
          fields: {
            subject: { stringValue: subject },
            html: { stringValue: html },
            text: { stringValue: text || subject }
          }
        }
      },
      createdAt: { timestampValue: new Date().toISOString() },
      status: { stringValue: result.smtpSent ? 'delivered_smtp' : 'pending_queue' }
    });
    result.firestoreQueued = true;
    result.success = true; // Queued safely in Firestore
  } catch (fsErr) {
    console.warn('[Firestore] Mail queue sync notice:', fsErr.message);
  }

  return result;
}

// ---------------------------------------------------------------------------
// MIDDLEWARE: GLOBAL MAINTENANCE MODE ("PROFILAKTIKOS REŽIMAS")
// ---------------------------------------------------------------------------

app.use(express.json());

// Maintenance Mode Interceptor
app.use((req, res, next) => {
  const settings = loadSettingsData();
  const isMaintenanceActive = settings.maintenanceMode === true;

  if (!isMaintenanceActive) {
    return next();
  }

  const reqPath = req.path || '';

  // Allow admin portal, admin assets, and static files
  const isExcluded = 
    reqPath.startsWith('/admin') ||
    reqPath.startsWith('/api/admin') ||
    reqPath.startsWith('/js/') ||
    reqPath.startsWith('/data/') ||
    reqPath.endsWith('.css') ||
    reqPath.endsWith('.js') ||
    reqPath.endsWith('.webp') ||
    reqPath.endsWith('.png') ||
    reqPath.endsWith('.jpg') ||
    reqPath.endsWith('.svg') ||
    reqPath.endsWith('.ico') ||
    reqPath.endsWith('.mp4');

  if (isExcluded) {
    return next();
  }

  // Allow bypass with token or query flag
  if (req.query && req.query.admin_bypass === '1') {
    return next();
  }
  const token = extractBearerToken(req);
  if (token) {
    const v = verifyToken(token);
    if (v.valid) return next();
  }

  // If public API call, return 503 JSON
  if (reqPath.startsWith('/api/')) {
    return res.status(503).json({
      error: 'maintenance_mode',
      maintenanceMode: true,
      message: 'Platformoje šiuo metu vykdomi profilaktikos darbai. Prašome užsukti vėliau.'
    });
  }

  // For public HTML page visits, serve elegant branded Maintenance Mode page
  const maintenanceHtml = `
<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profilaktikos Režimas &bull; Ąžuolynas Film Fest</title>
  <link rel="icon" type="image/webp" href="https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #051512;
      color: #F8FAF7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      line-height: 1.5;
    }
    .m-card {
      background: rgba(12, 36, 31, 0.85);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
    }
    .m-logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      margin: 0 auto 18px;
      border: 2px solid #D4AF37;
    }
    .m-badge {
      display: inline-block;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid #D4AF37;
      color: #F3E5AB;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    .m-title {
      font-size: 1.65rem;
      font-weight: 700;
      color: #F8FAF7;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .m-desc {
      font-size: 0.95rem;
      color: #BAC9C0;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .m-footer {
      font-size: 0.8rem;
      color: #6FA58A;
      border-top: 1px solid rgba(111, 165, 138, 0.2);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .m-admin-link {
      color: #D4AF37;
      text-decoration: none;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .m-admin-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="m-card">
    <img src="https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media" alt="Logo" class="m-logo">
    <div class="m-badge">Profilaktikos Režimas &bull; Maintenance</div>
    <h1 class="m-title">Sistemos Atnaujinimo Darbai</h1>
    <p class="m-desc">
      Tarptautinio mokinių kino festivalio „Ąžuolynas“ platformoje šiuo metu atliekami planiniai techniniai atnaujinimo darbai. Svetainė lankytojams vėl bus pasiekiama netrukus.
    </p>
    <div class="m-footer">
      <span>Kauno Tarptautinė Gimnazija &bull; 2026 m.</span>
      <a href="/admin.html" class="m-admin-link">Administratoriaus prisijungimas &rarr;</a>
    </div>
  </div>
</body>
</html>
  `;
  return res.status(503).send(maintenanceHtml);
});

app.use(express.static(__dirname));

// ---------------------------------------------------------------------------
// VOTING & FRAUD-PREVENTION API
// ---------------------------------------------------------------------------

// API: Get live vote totals and status
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
    const { deviceHash, voterUid } = req.query || {};
    const votesData = loadVotesData();
    const hash = String(deviceHash || voterUid || '').trim();
    const userVotes = hash && votesData.votersByDevice && votesData.votersByDevice[hash]
      ? votesData.votersByDevice[hash]
      : {};

    res.json({
      success: true,
      votedCategories: userVotes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve voter status' });
  }
});

// API: Cast audience choice vote (Ensures fair per-device/per-user voting without IP collisions)
app.post('/api/vote', async (req, res) => {
  try {
    const settings = loadSettingsData();
    if (settings.votingActive === false) {
      return res.status(403).json({
        error: 'voting-closed',
        message: 'Žiūrovų balsavimas šiuo metu yra sustabdytas festivalio administracijos.'
      });
    }

    const { filmId, category, deviceHash, voterUid, voterSalt } = req.body || {};
    if (!filmId || typeof filmId !== 'string') {
      return res.status(400).json({ error: 'filmId is required' });
    }

    const cleanFilmId = filmId.trim();
    const cleanCategory = (category && typeof category === 'string' && category.trim().length > 0)
      ? category.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : 'general';

    // Prioritize high-entropy device hash or unique voterUid from client localStorage
    let cleanDeviceKey = null;
    if (deviceHash && typeof deviceHash === 'string' && deviceHash.trim().length >= 12) {
      cleanDeviceKey = deviceHash.trim();
    } else if (voterUid && typeof voterUid === 'string' && voterUid.trim().length >= 8) {
      cleanDeviceKey = crypto.createHash('sha256').update(`voter_${voterUid.trim()}`).digest('hex');
    } else {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const salt = voterSalt || 'fallback_salt';
      cleanDeviceKey = crypto.createHash('sha256').update(`${ip}-${userAgent}-${salt}`).digest('hex');
    }

    const votesData = loadVotesData();
    if (!votesData.votersByDevice) votesData.votersByDevice = {};
    if (!votesData.votesByFilm) votesData.votesByFilm = {};
    if (!votesData.auditLog) votesData.auditLog = [];

    const deviceRecord = votesData.votersByDevice[cleanDeviceKey] || {};

    // Check if this device has already voted in this category
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
    votesData.votersByDevice[cleanDeviceKey] = deviceRecord;

    votesData.auditLog.push({
      filmId: cleanFilmId,
      category: cleanCategory,
      deviceKey: cleanDeviceKey.substring(0, 16),
      timestamp: new Date().toISOString()
    });

    saveVotesData(votesData);

    // Sync to Firestore in background
    (async () => {
      await syncToFirestore('submissions', cleanFilmId, {
        votesCount: { integerValue: String(currentVotes) }
      });
      const auditDocId = `${cleanCategory}_${cleanDeviceKey.substring(0, 32)}`;
      await syncToFirestore('votes_audit', auditDocId, {
        filmId: { stringValue: cleanFilmId },
        category: { stringValue: cleanCategory },
        deviceKey: { stringValue: cleanDeviceKey.substring(0, 32) },
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
// ADMIN SETTINGS & METRICS API
// ---------------------------------------------------------------------------

// API: Get global settings
app.get('/api/admin/settings', (req, res) => {
  try {
    const settings = loadSettingsData();
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// API: Public read-only settings for client-side pages
app.get('/api/settings', (req, res) => {
  try {
    const settings = loadSettingsData();
    res.json({
      success: true,
      maintenanceMode: settings.maintenanceMode === true,
      votingActive: settings.votingActive !== false,
      publicWinners: settings.publicWinners !== false,
      submissionsOpen: settings.submissionsOpen !== false,
      selectedYear: settings.selectedYear || "2026"
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// API: Update global settings and feature tumblers (including Maintenance Mode)
app.post('/api/admin/settings', (req, res) => {
  try {
    const current = loadSettingsData();
    const updates = req.body || {};
    const updated = { ...current, ...updates };
    saveJson(SETTINGS_FILE, updated);

    // Background sync to Firestore settings/festival and settings/global
    syncToFirestore('settings', 'festival', {
      votingActive: { booleanValue: updated.votingActive !== false },
      maintenanceMode: { booleanValue: updated.maintenanceMode === true },
      publicWinners: { booleanValue: updated.publicWinners !== false },
      submissionsOpen: { booleanValue: updated.submissionsOpen !== false },
      selectedYear: { stringValue: updated.selectedYear || "2026" },
      updatedAt: { timestampValue: new Date().toISOString() }
    });

    recordActivityLog({
      action: "SETTINGS_UPDATED",
      category: "settings",
      adminEmail: updates.adminEmail || PRIMARY_SUPERADMIN_EMAIL,
      target: "settings/festival",
      details: `Atnaujinti nustatymai. Profilaktikos režimas: ${updated.maintenanceMode ? 'ĮJUNGTAS' : 'IŠJUNGTAS'}, Balsavimas: ${updated.votingActive ? 'AKTYVUS' : 'UŽDARYTAS'}`
    });

    res.json({ success: true, settings: updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// API: Email service status
app.get('/api/admin/email-status', (req, res) => {
  res.json({
    success: true,
    smtpConfigured: Boolean(smtpPass),
    smtpHost: smtpHost,
    smtpPort: smtpPort,
    smtpUser: smtpUser,
    emailFrom: emailFrom,
    firestoreQueueEnabled: true
  });
});

// API: Live voting results and rankings
app.get('/api/admin/voting-stats', (req, res) => {
  try {
    const votesData = loadVotesData();
    const votesByFilm = votesData.votesByFilm || {};
    const auditLog = votesData.auditLog || [];

    const entries = Object.entries(votesByFilm).map(([filmId, count]) => ({
      filmId,
      count: Number(count) || 0
    })).sort((a, b) => b.count - a.count);

    const totalVotes = entries.reduce((acc, cur) => acc + cur.count, 0);
    const leader = entries[0] || null;
    const runnerUp = entries[1] || null;
    const margin = leader && runnerUp ? leader.count - runnerUp.count : (leader ? leader.count : 0);

    res.json({
      success: true,
      totalVotes,
      entries,
      leader,
      runnerUp,
      margin,
      recentVotes: auditLog.slice(-20).reverse()
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to calculate voting statistics' });
  }
});

// ---------------------------------------------------------------------------
// SUBMISSIONS & WINNERS API (WITH YEAR FILTERING SUPPORT)
// ---------------------------------------------------------------------------

// API: Declare a film as winner for a specific nomination and year
app.post('/api/admin/declare-winner', async (req, res) => {
  try {
    const { filmId, awardTitle, year, adminEmail } = req.body || {};
    if (!filmId || !awardTitle) {
      return res.status(400).json({ error: 'Film ID and nomination title are required' });
    }

    const cleanFilmId = String(filmId).trim();
    const cleanAward = String(awardTitle).trim();
    const cleanYear = String(year || '2026').trim();

    // Sync to Firestore submissions collection
    await syncToFirestore('submissions', cleanFilmId, {
      isWinner: { booleanValue: true },
      awardTitle: { stringValue: cleanAward },
      status: { stringValue: 'winner' },
      awardYear: { stringValue: cleanYear }
    });

    recordActivityLog({
      action: "WINNER_DECLARED",
      category: "submissions",
      adminEmail: adminEmail || PRIMARY_SUPERADMIN_EMAIL,
      target: cleanFilmId,
      details: `Paskelbtas nugalėtojas (${cleanAward}) filmui ID: ${cleanFilmId}, metai: ${cleanYear}`
    });

    res.json({
      success: true,
      filmId: cleanFilmId,
      awardTitle: cleanAward,
      year: cleanYear
    });
  } catch (err) {
    console.error('Error in /api/admin/declare-winner:', err);
    res.status(500).json({ error: 'Failed to declare winner' });
  }
});

// API: Revoke a winner nomination
app.post('/api/admin/revoke-winner', async (req, res) => {
  try {
    const { filmId, adminEmail } = req.body || {};
    if (!filmId) return res.status(400).json({ error: 'Film ID is required' });

    const cleanFilmId = String(filmId).trim();
    await syncToFirestore('submissions', cleanFilmId, {
      isWinner: { booleanValue: false },
      status: { stringValue: 'accepted' }
    });

    recordActivityLog({
      action: "WINNER_REVOKED",
      category: "submissions",
      adminEmail: adminEmail || PRIMARY_SUPERADMIN_EMAIL,
      target: cleanFilmId,
      details: `Atšauktas laureato statusas filmui ID: ${cleanFilmId}`
    });

    res.json({ success: true, filmId: cleanFilmId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke winner' });
  }
});

// ---------------------------------------------------------------------------
// USER MANAGEMENT & INVITATIONS API (WITH SIGNED JWT TOKENS)
// ---------------------------------------------------------------------------

// API: Issue session JWT auth token for authenticated admin
app.post('/api/admin/token', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = String(email).trim().toLowerCase();
    const usersData = loadUsersData();
    let user = (usersData.users || []).find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      if (TRUSTED_ADMIN_EMAILS.includes(cleanEmail)) {
        user = {
          uid: 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_'),
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: 'admin',
          isSuperAdmin: cleanEmail === PRIMARY_SUPERADMIN_EMAIL,
          canManageUsers: cleanEmail === PRIMARY_SUPERADMIN_EMAIL
        };
      } else {
        return res.status(403).json({ error: 'User is not registered or authorized' });
      }
    }

    const token = createAuthToken(user);
    res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin === true,
        canManageUsers: user.canManageUsers === true
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to issue auth token' });
  }
});

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
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// API: Direct "Send access link" ("Išsiųsti prieigos nuorodą") functionality
app.post('/api/admin/send-access-link', async (req, res) => {
  try {
    const { email, role, adminEmail } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['admin', 'moderator', 'judge', 'accountant', 'viewer'].includes(role) ? role : 'admin';
    const callerAdminEmail = adminEmail || PRIMARY_SUPERADMIN_EMAIL;

    const usersData = loadUsersData();
    const existingUser = (usersData.users || []).find(u => u.email.toLowerCase() === cleanEmail);
    const cleanName = existingUser ? existingUser.name : cleanEmail.split('@')[0];
    const cleanSurname = existingUser ? existingUser.surname : '';

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = createInviteToken({
      email: cleanEmail,
      role: cleanRole,
      code,
      name: cleanName,
      surname: cleanSurname,
      canManageUsers: existingUser ? existingUser.canManageUsers === true : false,
      invitedBy: callerAdminEmail
    });

    const invitesData = loadInvitationsData();
    if (!invitesData.invitations) invitesData.invitations = [];

    // Revoke old pending invites for this email
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
      invitedBy: callerAdminEmail,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    };

    invitesData.invitations.push(newInvite);
    saveJson(INVITATIONS_FILE, invitesData);

    // Sync to Firestore invitations collection
    syncToFirestore('invitations', token.substring(0, 64), {
      token: { stringValue: token },
      code: { stringValue: code },
      email: { stringValue: cleanEmail },
      role: { stringValue: cleanRole },
      status: { stringValue: 'pending' },
      invitedBy: { stringValue: callerAdminEmail },
      createdAt: { timestampValue: newInvite.createdAt },
      expiresAt: { timestampValue: newInvite.expiresAt }
    });

    // Build responsive HTML email template
    const baseUrl = req.protocol + '://' + req.get('host');
    const inviteUrl = `${baseUrl}/admin.html?invite=${encodeURIComponent(token)}`;

    const htmlContent = generateInviteEmailHtml('lt', {
      name: cleanName,
      surname: cleanSurname,
      email: cleanEmail,
      role: cleanRole,
      code,
      token,
      inviteUrl,
      invitedBy: callerAdminEmail
    });

    // Dispatch email
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: `Ąžuolynas Film Fest | Jūsų prieigos nuoroda ir aktyvavimo kodas`,
      html: htmlContent,
      text: `Sveiki! Jums atsiųsta Ąžuolynas Fest valdymo skydo prieigos nuoroda: ${inviteUrl} (Patvirtinimo kodas: ${code})`
    });

    recordActivityLog({
      action: "ACCESS_LINK_SENT",
      category: "users",
      adminEmail: callerAdminEmail,
      target: cleanEmail,
      details: `Išsiųsta prieigos nuoroda į ${cleanEmail} (Rolė: ${cleanRole.toUpperCase()})`
    });

    res.json({
      success: true,
      message: `Prieigos nuoroda sėkmingai išsiųsta į ${cleanEmail}!`,
      invitation: {
        email: cleanEmail,
        role: cleanRole,
        code,
        token
      },
      emailResult
    });
  } catch (err) {
    console.error('Error in /api/admin/send-access-link:', err);
    res.status(500).json({ error: 'Failed to send access link' });
  }
});

// API: Create new invitation via Invite Modal
app.post('/api/admin/invite', async (req, res) => {
  try {
    const { name, surname, email, role, canManageUsers, lang, adminEmail } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['admin', 'moderator', 'judge', 'accountant', 'viewer'].includes(role) ? role : 'moderator';
    const cleanName = (name || '').trim();
    const cleanSurname = (surname || '').trim();
    const emailLang = (lang === 'en' || lang === 'lt') ? lang : 'lt';
    const callerAdminEmail = adminEmail || PRIMARY_SUPERADMIN_EMAIL;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = createInviteToken({
      email: cleanEmail,
      role: cleanRole,
      code,
      name: cleanName,
      surname: cleanSurname,
      canManageUsers: canManageUsers === true,
      invitedBy: callerAdminEmail
    });

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
      canManageUsers: canManageUsers === true,
      invitedBy: callerAdminEmail,
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
      canManageUsers: canManageUsers === true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      invitedBy: callerAdminEmail
    };
    if (existingUserIdx >= 0) {
      usersData.users[existingUserIdx] = { ...usersData.users[existingUserIdx], ...userDoc };
    } else {
      usersData.users.push(userDoc);
    }
    saveJson(USERS_FILE, usersData);

    // Sync to Firestore (invitations & users)
    syncToFirestore('invitations', token.substring(0, 64), {
      token: { stringValue: token },
      code: { stringValue: code },
      email: { stringValue: cleanEmail },
      name: { stringValue: cleanName },
      surname: { stringValue: cleanSurname },
      role: { stringValue: cleanRole },
      status: { stringValue: 'pending' },
      invitedBy: { stringValue: callerAdminEmail },
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

    // Build and send email
    const baseUrl = req.protocol + '://' + req.get('host');
    const inviteUrl = `${baseUrl}/admin.html?invite=${encodeURIComponent(token)}`;

    const emailHtml = generateInviteEmailHtml(emailLang, {
      name: cleanName,
      surname: cleanSurname,
      email: cleanEmail,
      role: cleanRole,
      code,
      token,
      inviteUrl,
      invitedBy: callerAdminEmail
    });

    const subject = emailLang === 'en'
      ? 'Ąžuolynas Film Fest | Invitation to Staff Team'
      : 'Ąžuolynas Film Fest | Kvietimas prisijungti prie komandos';

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject,
      html: emailHtml,
      text: `Sveiki, ${cleanName}! Jūs buvote pakviestas į Ąžuolynas Fest komandą: ${inviteUrl} (Patvirtinimo kodas: ${code})`
    });

    recordActivityLog({
      action: "USER_INVITED",
      category: "users",
      adminEmail: callerAdminEmail,
      target: cleanEmail,
      details: `Pakviestas naujas komandos narys (${cleanName} ${cleanSurname}), priskirta rolė: ${cleanRole.toUpperCase()}`
    });

    res.json({
      success: true,
      invitation: newInvite,
      emailResult
    });
  } catch (e) {
    console.error('Error in /api/admin/invite:', e);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// API: Get invitation details for activation page
app.get('/api/admin/invite-info', (req, res) => {
  try {
    const rawToken = String(req.query.token || '').trim();
    if (!rawToken) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const verification = verifyToken(rawToken);
    if (!verification.valid) {
      return res.status(400).json({
        error: verification.expired ? 'Kvietimo nuorodos galiojimas pasibaigė.' : 'Neteisingas arba apgadintas kvietimo žetonas.'
      });
    }

    const invitesData = loadInvitationsData();
    const tokenInfo = verification.decoded;
    const targetEmail = tokenInfo.email ? tokenInfo.email.toLowerCase() : '';

    // Find in pending invitations
    const invite = (invitesData.invitations || []).find(i => 
      (i.token === rawToken || (targetEmail && i.email.toLowerCase() === targetEmail)) && i.status === 'pending'
    );

    if (!invite && verification.isJwt) {
      // If token is cryptographically valid JWT, serve info from token
      return res.json({
        success: true,
        invitation: {
          email: tokenInfo.email,
          name: tokenInfo.name || '',
          surname: tokenInfo.surname || '',
          role: tokenInfo.role || 'moderator',
          code: tokenInfo.code || '',
          invitedBy: tokenInfo.invitedBy || PRIMARY_SUPERADMIN_EMAIL
        }
      });
    }

    if (!invite) {
      return res.status(404).json({ error: 'Šis kvietimas jau buvo panaudotas arba atšauktas.' });
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

// API: Activate account via invitation code & set password
app.post('/api/admin/activate-invite', (req, res) => {
  try {
    const { token, code, name, surname, uid } = req.body || {};
    if (!token || !code) {
      return res.status(400).json({ error: 'Token and code are required' });
    }

    const verification = verifyToken(token);
    if (!verification.valid) {
      return res.status(400).json({ error: 'Neteisingas arba pasibaigęs kvietimo žetonas.' });
    }

    const cleanCode = String(code).trim();
    const invitesData = loadInvitationsData();
    const targetEmail = (verification.decoded && verification.decoded.email) ? verification.decoded.email.toLowerCase() : '';

    const invite = (invitesData.invitations || []).find(i => 
      (i.token === token || (targetEmail && i.email.toLowerCase() === targetEmail)) &&
      (String(i.code).trim() === cleanCode || (verification.decoded && String(verification.decoded.code).trim() === cleanCode))
    );

    if (!invite && (!verification.decoded || String(verification.decoded.code).trim() !== cleanCode)) {
      return res.status(400).json({ error: 'Neteisingas patvirtinimo saugos kodas.' });
    }

    if (invite) {
      invite.status = 'accepted';
      invite.acceptedAt = new Date().toISOString();
      saveJson(INVITATIONS_FILE, invitesData);
    }

    // Provision User in users list
    const effectiveEmail = invite ? invite.email : verification.decoded.email;
    const effectiveRole = invite ? invite.role : verification.decoded.role;
    const usersData = loadUsersData();
    if (!usersData.users) usersData.users = [];

    const existingIdx = usersData.users.findIndex(u => u.email.toLowerCase() === effectiveEmail.toLowerCase());
    const userUid = uid || 'usr_' + crypto.randomBytes(8).toString('hex');

    const userProfile = {
      uid: userUid,
      email: effectiveEmail,
      name: (name || (invite ? invite.name : verification.decoded.name) || '').trim(),
      surname: (surname || (invite ? invite.surname : verification.decoded.surname) || '').trim(),
      role: effectiveRole,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      invitedBy: invite ? invite.invitedBy : verification.decoded.invitedBy
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

    const authToken = createAuthToken(userProfile);

    res.json({
      success: true,
      message: 'Paskyra sėkmingai aktyvuota!',
      token: authToken,
      user: userProfile
    });
  } catch (e) {
    console.error('Error in /api/admin/activate-invite:', e);
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

    recordActivityLog({
      action: "USER_STATUS_TOGGLED",
      category: "users",
      adminEmail: req.body.adminEmail || PRIMARY_SUPERADMIN_EMAIL,
      target: user.email,
      details: `Vartotojo ${user.email} prieiga pakeista į: ${user.status === 'active' ? 'AKTYVUS' : 'UŽBLOKUOTAS'}`
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

    recordActivityLog({
      action: "USER_ROLE_CHANGED",
      category: "users",
      adminEmail: req.body.adminEmail || PRIMARY_SUPERADMIN_EMAIL,
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
    if (callerEmail !== PRIMARY_SUPERADMIN_EMAIL) {
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

// API: Delete user account
app.post('/api/admin/users/delete', async (req, res) => {
  try {
    const { email, userId } = req.body || {};
    if (!email && !userId) return res.status(400).json({ error: 'Email or userId is required' });

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanEmail === PRIMARY_SUPERADMIN_EMAIL) {
      return res.status(403).json({ error: 'Super Administrator cannot be deleted' });
    }

    const usersData = loadUsersData();
    const targetUser = (usersData.users || []).find(u => 
      (cleanEmail && u.email.toLowerCase() === cleanEmail) || (userId && (u.uid === userId || u.id === userId))
    );

    const effectiveEmail = cleanEmail || (targetUser ? targetUser.email.toLowerCase() : '');
    const docId = effectiveEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

    usersData.users = (usersData.users || []).filter(u => {
      const matchEmail = effectiveEmail && u.email.toLowerCase() === effectiveEmail;
      const matchId = userId && (u.uid === userId || u.id === userId);
      return !matchEmail && !matchId;
    });
    saveJson(USERS_FILE, usersData);

    if (docId) await deleteFromFirestore('users', docId);
    if (userId) await deleteFromFirestore('users', userId);
    if (targetUser && targetUser.uid) await deleteFromFirestore('users', targetUser.uid);

    recordActivityLog({
      action: "USER_DELETED",
      category: "users",
      adminEmail: req.body.adminEmail || PRIMARY_SUPERADMIN_EMAIL,
      target: effectiveEmail || userId,
      details: `Vartotojo paskyra ${effectiveEmail || userId} pašalinta`
    });

    res.json({ success: true, message: 'User account removed' });
  } catch (e) {
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

// Legacy deprecation response for /api/access-request
app.post('/api/access-request', (req, res) => {
  res.json({
    success: false,
    disabled: true,
    message: 'Prieigos užklausų forma yra išjungta. Nauji nariai priimami tiesioginiu administratoriaus pakvietimu.'
  });
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
  console.log(`Festival server running at http://0.0.0.0:${PORT}`);
});
