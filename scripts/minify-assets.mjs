import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');

export function minifyCss(source) {
  let out = '';
  let i = 0;
  const len = source.length;
  let quote = '';
  let prevSpace = false;

  while (i < len) {
    const ch = source[i];
    const next = source[i + 1];

    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < len) {
        out += source[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) quote = '';
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      if (prevSpace && out && !/[{:;,(\s]$/.test(out)) out += ' ';
      prevSpace = false;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      prevSpace = true;
      continue;
    }

    if (/\s/.test(ch)) {
      prevSpace = true;
      i += 1;
      continue;
    }

    if (ch === '}' && out.endsWith(';')) {
      out = out.slice(0, -1);
    }

    if ('{}:;,'.includes(ch)) {
      out += ch;
      prevSpace = false;
      i += 1;
      continue;
    }

    if (prevSpace && out.length > 0) {
      const last = out[out.length - 1];
      if (!'{}:;,('.includes(last) && ch !== ')') {
        out += ' ';
      }
    }
    prevSpace = false;
    out += ch;
    i += 1;
  }

  return out.trim();
}

function isIdentChar(ch) {
  return /[A-Za-z0-9_$\u00C0-\u024F]/.test(ch);
}

export function minifyJs(source) {
  let out = '';
  let i = 0;
  const len = source.length;
  let canRegex = true;
  let lastWord = '';
  let pendingSpace = false;
  let pendingNewline = false;
  const templateBraceStack = [];

  const REGEX_PRECEDING_WORDS = new Set([
    'return', 'throw', 'case', 'delete', 'void', 'typeof',
    'in', 'instanceof', 'new', 'else', 'do', 'yield', 'await', 'export', 'default'
  ]);

  function flushSeparator(nextCh) {
    if (!out) {
      pendingSpace = false;
      pendingNewline = false;
      return;
    }
    const prevCh = out[out.length - 1];
    if (pendingNewline) {
      if (!'({[;,=?:'.includes(prevCh) && !')}]'.includes(nextCh)) {
        out += '\n';
      } else if (isIdentChar(prevCh) && isIdentChar(nextCh)) {
        out += ' ';
      }
    } else if (pendingSpace) {
      if (
        (isIdentChar(prevCh) && isIdentChar(nextCh)) ||
        (prevCh === '+' && nextCh === '+') ||
        (prevCh === '-' && nextCh === '-') ||
        (prevCh === '/' && nextCh === '/') ||
        (prevCh === 'return' && nextCh === '/')
      ) {
        out += ' ';
      } else if (REGEX_PRECEDING_WORDS.has(lastWord) && nextCh === '/') {
        out += ' ';
      }
    }
    pendingSpace = false;
    pendingNewline = false;
  }

  while (i < len) {
    const ch = source[i];
    const next = source[i + 1];

    // Inside a template literal body
    if (templateBraceStack.length > 0 && templateBraceStack[templateBraceStack.length - 1] === -1) {
      if (ch === '\\' && i + 1 < len) {
        out += ch + source[i + 1];
        i += 2;
        continue;
      }
      if (ch === '$' && next === '{') {
        out += '${';
        templateBraceStack[templateBraceStack.length - 1] = 1;
        canRegex = true;
        lastWord = '';
        i += 2;
        continue;
      }
      if (ch === '`') {
        out += '`';
        templateBraceStack.pop();
        canRegex = false;
        lastWord = '';
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }

    // Comments
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < len && source[i] !== '\n') i += 1;
      pendingNewline = true;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      pendingSpace = true;
      continue;
    }

    // Whitespace
    if (ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      pendingNewline = true;
      i += 1;
      continue;
    }
    if (ch === ' ' || ch === '\t') {
      pendingSpace = true;
      i += 1;
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      flushSeparator(ch);
      const q = ch;
      out += q;
      i += 1;
      while (i < len) {
        const c = source[i];
        out += c;
        if (c === '\\' && i + 1 < len) {
          out += source[i + 1];
          i += 2;
          continue;
        }
        i += 1;
        if (c === q) break;
      }
      canRegex = false;
      lastWord = '';
      continue;
    }

    // Template literal start
    if (ch === '`') {
      flushSeparator(ch);
      out += '`';
      templateBraceStack.push(-1);
      i += 1;
      continue;
    }

    // Regex literal
    if (ch === '/' && canRegex) {
      flushSeparator(ch);
      out += '/';
      i += 1;
      let inClass = false;
      while (i < len) {
        const c = source[i];
        out += c;
        if (c === '\\' && i + 1 < len) {
          out += source[i + 1];
          i += 2;
          continue;
        }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        i += 1;
        if (c === '/' && !inClass) break;
      }
      while (i < len && /[a-z]/i.test(source[i])) {
        out += source[i];
        i += 1;
      }
      canRegex = false;
      lastWord = '';
      continue;
    }

    // Closing brace returning to template literal
    if (ch === '}' && templateBraceStack.length > 0 && templateBraceStack[templateBraceStack.length - 1] >= 1) {
      templateBraceStack[templateBraceStack.length - 1] -= 1;
      if (templateBraceStack[templateBraceStack.length - 1] === 0) {
        flushSeparator('}');
        out += '}';
        templateBraceStack[templateBraceStack.length - 1] = -1;
        i += 1;
        continue;
      }
    } else if (ch === '{' && templateBraceStack.length > 0 && templateBraceStack[templateBraceStack.length - 1] >= 1) {
      templateBraceStack[templateBraceStack.length - 1] += 1;
    }

    // Identifiers / Numbers
    if (isIdentChar(ch)) {
      flushSeparator(ch);
      let word = '';
      while (i < len && isIdentChar(source[i])) {
        word += source[i];
        i += 1;
      }
      out += word;
      lastWord = word;
      canRegex = REGEX_PRECEDING_WORDS.has(word);
      continue;
    }

    // Operators / Punctuation
    flushSeparator(ch);
    out += ch;
    lastWord = '';
    if (ch === '>' && out.endsWith('=>')) {
      canRegex = true;
    } else if ('([{:;,=!+-*%&|^~?'.includes(ch)) {
      canRegex = true;
    } else if (')]}'.includes(ch)) {
      canRegex = false;
    }
    i += 1;
  }

  return out.trim() + '\n';
}

const CSS_FILES = ['style.css', 'live.css'];
const JS_FILES = [
  'config.js',
  'error-reporting.js',
  'email-templates.js',
  'js/server-api.js',
  'js/firebase-public-lazy.js',
  'js/yt-facade.js',
  'js/social-share.js',
  'js/voting-and-winners.js',
  'js/photo-lightbox.js',
  'js/burger-menu.js',
  'js/countdown.js',
  'js/mail-client.js'
];

export function runMinification() {
  let cssSaved = 0;
  let jsSaved = 0;

  for (const rel of CSS_FILES) {
    const srcPath = path.join(root, rel);
    const outPath = srcPath.replace(/\.css$/, '.min.css');
    const raw = fs.readFileSync(srcPath, 'utf8');
    const min = minifyCss(raw);
    fs.writeFileSync(outPath, min, 'utf8');
    cssSaved += Buffer.byteLength(raw) - Buffer.byteLength(min);
  }

  for (const rel of JS_FILES) {
    const srcPath = path.join(root, rel);
    const outPath = srcPath.replace(/\.js$/, '.min.js');
    const raw = fs.readFileSync(srcPath, 'utf8');
    const min = minifyJs(raw);
    fs.writeFileSync(outPath, min, 'utf8');
    const chk = spawnSync(process.execPath, ['--check', outPath], { encoding: 'utf8' });
    assert.equal(chk.status, 0, `Syntax check failed for ${outPath}: ${chk.stderr}`);
    jsSaved += Buffer.byteLength(raw) - Buffer.byteLength(min);
  }

  console.log(`Minified CSS saved ${(cssSaved / 1024).toFixed(1)} KiB; JS saved ${(jsSaved / 1024).toFixed(1)} KiB.`);
  return { cssSaved, jsSaved };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMinification();
}
