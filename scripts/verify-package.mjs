// Verify this source patch against an untouched archive of the pinned upstream commit.
// Usage: node scripts/verify-package.mjs <path-to-upstream-git-checkout>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mod');
const repo = path.resolve(process.argv[2] || '.');
const metadata = JSON.parse(fs.readFileSync(path.join(packageDir, 'compatibility.json'), 'utf8'));
const patch = path.join(packageDir, 'changes.patch');
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
const base = run('git', ['rev-parse', 'HEAD'], repo).toString().trim();
if (base !== metadata.commit) throw new Error(`Expected upstream ${metadata.commit}, got ${base}.`);
const patchText = fs.readFileSync(patch, 'utf8');
if (/^diff --git a\/(?:data\/assets\.json|public\/(?:assets|fonts)\/)/m.test(patchText)) {
  throw new Error('The patch includes a local asset manifest or downloaded game art.');
}

function treeDigest(root) {
  const hash = createHash('sha256');
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.git') continue;
      const relative = prefix + entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative + '/');
      else if (entry.isFile()) hash.update(relative + '\0').update(fs.readFileSync(path.join(dir, entry.name))).update('\0');
      else throw new Error(`Unexpected non-file entry: ${relative}`);
    }
  }
  walk(root);
  return hash.digest('hex');
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'spell-patch-check-'));
try {
  const archive = path.join(scratch, 'upstream.zip');
  const stage = path.join(scratch, 'stage');
  fs.mkdirSync(stage);
  run('git', ['archive', '--format=zip', '--output', archive, metadata.commit], repo);
  run('tar', ['-xf', archive, '-C', stage], scratch);
  // Isolate Git discovery from any repository containing the user's temporary directory.
  run('git', ['init', '--quiet'], stage);
  const before = treeDigest(stage);
  run('git', ['apply', '--check', patch], stage);
  run('git', ['apply', patch], stage);
  if (treeDigest(stage) === before) throw new Error('The patch made no changes.');
  run('git', ['apply', '--reverse', '--check', patch], stage);
  run('git', ['apply', '--reverse', patch], stage);
  if (treeDigest(stage) !== before) throw new Error('Uninstall did not restore the original upstream files.');
  console.log(`Verified upstream ${metadata.version} (${metadata.commit.slice(0, 12)}): install and uninstall restore every original file.`);
  console.log('Verified: no downloaded artwork or local asset manifest in the patch.');
} finally {
  // Validate the absolute cleanup target before deleting recursively on Windows.
  const tempRoot = fs.realpathSync(os.tmpdir());
  const actual = fs.realpathSync(scratch);
  const relative = path.relative(tempRoot, actual);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !path.basename(actual).startsWith('spell-patch-check-')) {
    throw new Error(`Refusing cleanup outside the task temporary directory: ${actual}`);
  }
  fs.rmSync(actual, { recursive: true, force: true });
}
