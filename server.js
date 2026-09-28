import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Persistent Votes Data Store
const DATA_DIR = path.join(__dirname, 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadVotesData() {
  try {
    if (fs.existsSync(VOTES_FILE)) {
      const raw = fs.readFileSync(VOTES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading votes file:', e.message);
  }
  return { votesByFilm: {}, voters: {}, auditLog: [] };
}

function saveVotesData(data) {
  try {
    fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving votes file:', e.message);
  }
}

// API: Get live vote counts for all films
app.get('/api/votes', (req, res) => {
  try {
    const data = loadVotesData();
    const totalVotes = Object.values(data.votesByFilm || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
    res.json({
      success: true,
      votes: data.votesByFilm || {},
      totalVotes: totalVotes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve votes' });
  }
});

// API: Cast an audience choice vote securely
app.post('/api/vote', async (req, res) => {
  try {
    const { filmId, voterUid } = req.body || {};
    if (!filmId || typeof filmId !== 'string') {
      return res.status(400).json({ error: 'filmId is required' });
    }
    const cleanFilmId = filmId.trim();
    const cleanVoterUid = (voterUid && typeof voterUid === 'string' && voterUid.trim().length > 0)
      ? voterUid.trim()
      : 'voter_' + Math.random().toString(36).substring(2, 10);

    const votesData = loadVotesData();
    if (!votesData.votesByFilm) votesData.votesByFilm = {};
    if (!votesData.voters) votesData.voters = {};
    if (!votesData.auditLog) votesData.auditLog = [];

    // Check if voter has already cast a vote
    if (votesData.voters[cleanVoterUid]) {
      const existingVote = votesData.voters[cleanVoterUid];
      return res.status(400).json({
        error: 'already-voted',
        message: 'Vote already recorded for this visitor',
        filmId: existingVote.filmId
      });
    }

    // Increment vote count
    const currentVotes = (Number(votesData.votesByFilm[cleanFilmId]) || 0) + 1;
    votesData.votesByFilm[cleanFilmId] = currentVotes;
    votesData.voters[cleanVoterUid] = {
      filmId: cleanFilmId,
      timestamp: new Date().toISOString()
    };
    votesData.auditLog.push({
      filmId: cleanFilmId,
      voterUid: cleanVoterUid,
      timestamp: new Date().toISOString()
    });

    // Save locally
    saveVotesData(votesData);

    // Background sync attempt to Firestore (non-blocking)
    const apiKey = 'AIzaSyAl-aLSlSHUdrZ4Rr4x23n3bu3QFZSYyB0';
    const projectId = 'azuolynas-film-fest';
    (async () => {
      try {
        const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/submissions/${cleanFilmId}?updateMask.fieldPaths=votesCount&key=${apiKey}`;
        await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              votesCount: { integerValue: String(currentVotes) }
            }
          })
        });
      } catch (syncErr) {
        // Silent background fallback
      }
    })();

    return res.json({
      success: true,
      filmId: cleanFilmId,
      votesCount: currentVotes
    });
  } catch (err) {
    console.error('Error in /api/vote:', err);
    return res.status(500).json({ error: 'Internal server error while processing vote' });
  }
});

// API: Reset vote for testing purposes
app.post('/api/vote/test-reset', (req, res) => {
  try {
    const { voterUid, clearAll } = req.body || {};
    const votesData = loadVotesData();
    if (clearAll === true) {
      votesData.votesByFilm = {};
      votesData.voters = {};
      votesData.auditLog = [];
      saveVotesData(votesData);
      return res.json({ success: true, message: 'All votes reset' });
    }
    if (voterUid && votesData.voters[voterUid]) {
      const votedFilmId = votesData.voters[voterUid].filmId;
      if (votesData.votesByFilm[votedFilmId] > 0) {
        votesData.votesByFilm[votedFilmId]--;
      }
      delete votesData.voters[voterUid];
      saveVotesData(votesData);
      return res.json({ success: true, message: `Vote reset for voter ${voterUid}` });
    }
    res.json({ success: true, message: 'No action needed' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
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
