import { db, auth } from './firebase-init.js';
import { showToast } from './ui-feedback.js';

export function initDiagnostics() {
  document.getElementById('btnRunVerification')?.addEventListener('click', loadDiagnosticsData);
}

export async function loadDiagnosticsData() {
  const container = document.getElementById('diagVerificationResults');
  if (!container) return;
  container.replaceChildren();
  const checks = [
    ['Firebase Auth', async () => {
      if (!auth?.currentUser) throw new Error('Prisijunkite prie valdymo skydo.');
      await auth.currentUser.getIdToken();
      return auth.currentUser.email;
    }],
    ['Firestore nustatymai', async () => {
      await db.collection('settings').doc('festival').get();
      return 'Nustatymai pasiekiami.';
    }],
    ['Trigger Email', async () => {
      const snapshot = await db.collection('mail').orderBy('createdAt', 'desc').limit(10).get();
      const states = snapshot.docs.map(doc => doc.data().delivery?.state || 'PENDING');
      if (states.includes('ERROR')) throw new Error('Laiško siuntimo klaida. Peržiūrėkite delivery.error Firebase konsolėje.');
      return snapshot.empty ? 'Laiškų eilė tuščia.' : states.join(', ');
    }]
  ];
  let passed = 0;
  for (const [name, check] of checks) {
    const row = document.createElement('p');
    try {
      row.textContent = `${name}: ${await check()}`;
      row.style.color = '#4ade80';
      passed++;
    } catch (error) {
      row.textContent = `${name}: ${error.message}`;
      row.style.color = '#f87171';
    }
    container.append(row);
  }
  showToast(`${passed}/${checks.length} Firebase patikros sėkmingos.`, passed === checks.length ? 'success' : 'error');
}
