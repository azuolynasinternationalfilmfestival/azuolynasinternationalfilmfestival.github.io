import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// API: Query submission status securely by participant email
app.get('/api/submission-status', async (req, res) => {
  try {
    const rawEmail = req.query.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    const cleanEmail = rawEmail.trim();
    const lowerEmail = cleanEmail.toLowerCase();
    if (!lowerEmail.includes('@') || lowerEmail.length < 5) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    const apiKey = 'AIzaSyAl-aLSlSHUdrZ4Rr4x23n3bu3QFZSYyB0';
    const projectId = 'azuolynas-film-fest';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

    async function runEmailQuery(targetEmail) {
      const payload = {
        structuredQuery: {
          from: [{ collectionId: 'submissions' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'email' },
              op: 'EQUAL',
              value: { stringValue: targetEmail }
            }
          }
        }
      };

      const resp = await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        return [];
      }

      const list = await resp.json();
      const items = [];
      if (Array.isArray(list)) {
        for (const row of list) {
          if (row.document && row.document.fields) {
            const f = row.document.fields;
            const docId = row.document.name.split('/').pop();
            items.push({
              id: docId,
              filmTitle: f.filmTitle?.stringValue || 'Nenurodytas filmas',
              name: f.name?.stringValue || '',
              category: f.category?.stringValue || '',
              institution: f.institution?.stringValue || '',
              deviceModel: f.deviceModel?.stringValue || '',
              status: f.status?.stringValue || 'submitted',
              inVoting: f.inVoting?.booleanValue === true,
              isWinner: f.isWinner?.booleanValue === true,
              awardTitle: f.awardTitle?.stringValue || '',
              submittedAt: f.submittedAt?.timestampValue || row.document.createTime || null
            });
          }
        }
      }
      return items;
    }

    let entries = await runEmailQuery(lowerEmail);
    if (entries.length === 0 && cleanEmail !== lowerEmail) {
      entries = await runEmailQuery(cleanEmail);
    }

    return res.json({
      success: true,
      email: lowerEmail,
      count: entries.length,
      entries
    });
  } catch (error) {
    console.error('Submission status lookup error:', error);
    return res.status(500).json({ error: 'Server error retrieving status' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
