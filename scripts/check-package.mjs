import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mod = path.join(root, 'mod');
const args = process.argv.slice(2);
if (args.some((arg, i) => arg !== '--with-assets' && arg !== '--assets-from' && args[i - 1] !== '--assets-from')) {
  throw new Error('Usage: node scripts/check-package.mjs [--with-assets | --assets-from <assets directory>]');
}
const at = args.indexOf('--assets-from');
if (at !== -1 && (!args[at + 1] || args[at + 1].startsWith('--'))) throw new Error('--assets-from needs a directory');
const assetsRoot = at === -1 ? path.join(mod, 'assets') : path.resolve(args[at + 1]);
const withAssets = args.includes('--with-assets') || at !== -1;
const readJson = name => JSON.parse(fs.readFileSync(path.join(mod, name), 'utf8'));
const manifest = readJson('install-manifest.json');
const assets = readJson('asset-manifest.json');
const metadata = readJson('compatibility.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = value => /^[a-f0-9]{64}$/.test(value);
function safe(base, name) {
  if (typeof name !== 'string' || !name || path.isAbsolute(name) || name.includes('\\') || name.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Unsafe manifest path: ' + name);
  const target = path.resolve(base, name);
  for (let cursor = target; cursor !== base; cursor = path.dirname(cursor)) {
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Linked package file: ' + name);
  }
  return target;
}
function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const name = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error('Linked package path: ' + name);
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), name + '/') : [name];
  });
}
if (manifest.version !== metadata.bundleVersion || manifest.gameVersion !== metadata.version || manifest.upstreamCommit !== metadata.commit) throw new Error('Version metadata does not agree');
const names = new Set();
for (const entry of manifest.files) {
  if (names.has(entry.path) || !sha(entry.after) || !(entry.before === null || sha(entry.before))) throw new Error('Invalid/duplicate source manifest entry: ' + entry.path);
  if (/^(?:public\/(?:assets|vendor|fonts)\/|node_modules\/|\.cache\/|data\/assets\.json)/.test(entry.path)) throw new Error('Unexpected asset or build output in source manifest: ' + entry.path);
  names.add(entry.path);
  if (hash(fs.readFileSync(safe(path.join(mod, 'payload'), entry.path))) !== entry.after) throw new Error('Source hash mismatch: ' + entry.path);
}
const actual = listFiles(path.join(mod, 'payload'));
if (actual.length !== names.size || actual.some(name => !names.has(name))) throw new Error('Unlisted file in mod/payload');
if (!Array.isArray(metadata.patchFiles) || metadata.patchFiles.length !== names.size || metadata.patchFiles.some(name => !names.has(name))) throw new Error('Patch file list does not agree');
const patch = fs.readFileSync(path.join(mod, 'changes.patch'));
if (hash(patch) !== metadata.patchSha256) throw new Error('Patch hash mismatch');
if (/^diff --git a\/(?:public\/(?:assets|vendor|fonts)\/|data\/assets\.json)/m.test(patch.toString('utf8'))) throw new Error('Art/build output in patch');
const assetNames = new Set();
for (const entry of assets.files) {
  if (assetNames.has(entry.path) || !sha(entry.after) || !/^public\/assets\/(?:bob|spells|heroes)\//.test(entry.path)) throw new Error('Invalid asset manifest entry: ' + entry.path);
  assetNames.add(entry.path);
  const file = safe(assetsRoot, entry.path);
  if (withAssets && hash(fs.readFileSync(file)) !== entry.after) throw new Error('Asset hash mismatch: ' + entry.path);
}
const documents = ['README.md', 'INSTALL.md', 'CHANGELOG.md', 'CONTRIBUTING.md', ...listFiles(path.join(root, 'docs')).filter(name => name.endsWith('.md')).map(name => 'docs/' + name)];
let links = 0;
for (const name of documents) {
  const text = fs.readFileSync(path.join(root, name), 'utf8');
  if (/tavern-instances[\\/]|[A-Z]:[\\/](?:Users|桌面|下载)[\\/]/.test(text)) throw new Error('Personal deployment detail in public doc: ' + name);
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    let target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    target = decodeURIComponent(target);
    if (!fs.existsSync(path.resolve(root, path.dirname(name), target))) throw new Error(`Broken document link: ${name} -> ${target}`);
    links++;
  }
}
console.log(`Package ${manifest.version}: ${names.size} source hashes; patch and versions agree.`);
console.log(`${assets.files.length} asset records${withAssets ? ' and bytes verified' : ' checked (bytes are in Full.zip)'}. ${links} local documentation links resolve.`);
