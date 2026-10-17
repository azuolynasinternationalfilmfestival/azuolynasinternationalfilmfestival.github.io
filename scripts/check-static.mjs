import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'festival-syntax-'));
function check(file) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
}
try {
  for (const name of ['server.js', 'config.js', 'email-templates.js']) check(path.join(root, name));
  for (const name of fs.readdirSync(path.join(root,'js'))) {
    if (!name.endsWith('.js')) continue;
    const file=path.join(root,'js',name); check(file);
    for (const [,target] of fs.readFileSync(file,'utf8').matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)) assert.ok(fs.existsSync(path.resolve(path.dirname(file),target)), `${file}: ${target}`);
  }
  for (const dir of [root,path.join(root,'en'),path.join(root,'lt')]) {
    for(const name of fs.readdirSync(dir)) {
      if(!name.endsWith('.html'))continue;
      const file=path.join(dir,name), text=fs.readFileSync(file,'utf8');
      for(const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        const [,attributes,code]=match;
        const src=attributes.match(/src=["']([^"']+)/)?.[1];
        if(src && !/^https?:/.test(src))assert.ok(fs.existsSync(path.resolve(dir,src)), `${name}: ${src}`);
        if(!src&&!attributes.includes('application/ld+json')) { const inline=path.join(scratch,'inline.js');fs.writeFileSync(inline,code);check(inline); }
      }
    }
  }
  console.log('Static scripts, module imports and inline JavaScript passed.');
} finally { fs.rmSync(scratch,{recursive:true,force:true}); }
