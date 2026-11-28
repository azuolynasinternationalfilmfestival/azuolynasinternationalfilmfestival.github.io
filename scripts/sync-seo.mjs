/**
 * sync-seo.mjs
 * Reads public `content` documents from Firestore REST API (zero secrets required)
 * and updates static HTML <title>, <meta name="description">, OpenGraph, and Twitter SEO tags.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const PROJECT_ID = 'filmfest-509606';
const DATABASE_ID = 'ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/content`;

function decodeValue(v) {
  if (!v || typeof v !== 'object') return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) {
    const obj = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
      obj[k] = decodeValue(val);
    }
    return obj;
  }
  return undefined;
}

function decodeDoc(doc) {
  const id = path.basename(doc.name || '');
  const out = { id };
  for (const [k, val] of Object.entries(doc.fields || {})) {
    out[k] = decodeValue(val);
  }
  return out;
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applySeoToHtmlFile(relPath, seoTitle, seoDesc) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) return false;

  let html = fs.readFileSync(filePath, 'utf8');
  const orig = html;

  if (seoTitle && seoTitle.trim()) {
    const safeTitle = escapeAttr(seoTitle.trim());
    html = html.replace(/(<title\b[^>]*>)[^<]*(<\/title>)/i, `$1${safeTitle}$2`);
    html = html.replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/i,
      `$1${safeTitle}$2`
    );
    html = html.replace(
      /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i,
      `$1${safeTitle}$2`
    );
  }

  if (seoDesc && seoDesc.trim()) {
    const safeDesc = escapeAttr(seoDesc.trim());
    html = html.replace(
      /(<meta\s+name="description"[^>]*\s+content=")[^"]*(")/i,
      `$1${safeDesc}$2`
    );
    html = html.replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/i,
      `$1${safeDesc}$2`
    );
    html = html.replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i,
      `$1${safeDesc}$2`
    );
  }

  if (html !== orig) {
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  const res = await fetch(FIRESTORE_URL);
  if (!res.ok) {
    console.warn(`[sync-seo] Firestore returned HTTP ${res.status} — skipping update cleanly.`);
    return;
  }

  const json = await res.json();
  const docs = Array.isArray(json.documents) ? json.documents.map(decodeDoc) : [];
  if (docs.length === 0) {
    console.log('[sync-seo] No documents in content collection yet.');
    return;
  }

  const byId = new Map(docs.map((d) => [d.id, d]));
  const targets = [
    { docId: 'home', file: 'index.html', lang: 'lt' },
    { docId: 'home', file: 'lt/index.html', lang: 'lt' },
    { docId: 'home', file: 'en/index.html', lang: 'en' },
    { docId: '2027', file: 'lt/azuolynas-fest-2027.html', lang: 'lt' },
    { docId: '2027', file: 'en/azuolynas-fest-2027.html', lang: 'en' },
    { docId: '2026', file: 'lt/azuolynas-fest-2026.html', lang: 'lt' },
    { docId: '2026', file: 'en/azuolynas-fest-2026.html', lang: 'en' }
  ];

  let updatedCount = 0;
  for (const t of targets) {
    const doc = byId.get(t.docId);
    if (!doc) continue;
    const title = t.lang === 'en' ? (doc.seoTitleEn || doc.seoTitle) : (doc.seoTitle || doc.seoTitleEn);
    const desc = t.lang === 'en' ? (doc.seoDescriptionEn || doc.seoDescription) : (doc.seoDescription || doc.seoDescriptionEn);
    if (applySeoToHtmlFile(t.file, title, desc)) {
      updatedCount++;
      console.log(`[sync-seo] Updated ${t.file}`);
    }
  }
  console.log(`[sync-seo] Finished (${updatedCount} HTML files updated).`);
}

main().catch((err) => {
  console.error('[sync-seo] Error:', err?.message || err);
  process.exit(1);
});
