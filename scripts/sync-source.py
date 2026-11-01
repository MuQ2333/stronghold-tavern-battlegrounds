#!/usr/bin/env python3
"""Sync a reviewed game checkout into this local 0.3.1 candidate (no assets)."""
import argparse
import hashlib
import io
import tarfile
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = 'f07b8965061bbc311ad7aa815879b09264a1e47d'
VERSION = '0.2.4-beta.1'
HIDDEN = {'creationflags': subprocess.CREATE_NO_WINDOW} if hasattr(subprocess, 'CREATE_NO_WINDOW') else {}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    source = args.source.resolve()
    def git(*argv):
        return subprocess.check_output(['git', '-c', 'core.quotepath=false', *argv], cwd=source, **HIDDEN)
    if git('ls-files', '-u').strip():
        raise ValueError('Resolve all source conflicts before syncing')
    pending = git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0').split('\0')
    if any(p.startswith(('docs/', 'mods/', 'public/', 'server/', 'shared/', 'tools/', 'types/', 'schemas/')) for p in pending):
        raise ValueError('Stage reviewed new source files first; untracked source files would be omitted')
    paths = git('diff', '--name-only', '-z', BASE, '--').decode().strip('\0').split('\0')
    paths = sorted(p for p in paths if p and p != 'data/assets.json')
    if not paths:
        raise ValueError('No changes relative to pinned upstream')
    allowed = ('docs/', 'mods/', 'public/', 'server/', 'shared/', 'test/', 'tools/', 'types/', 'schemas/')
    for name in paths:
        if (not name.startswith(allowed) and name != 'scripts/make-windows-bundle.mjs') or name.startswith(('public/assets/', 'public/vendor/', 'public/fonts/')):
            raise ValueError('Unexpected source path: ' + name)
        if not (source / name).is_file():
            raise ValueError('Deleted files are unsupported: ' + name)
    payload = ROOT / 'mod/payload'
    # Only obsolete files in this script's dedicated payload directory are removed.
    for file in payload.rglob('*'):
        if file.is_file() and file.relative_to(payload).as_posix() not in paths:
            file.unlink()
    sha = lambda data: hashlib.sha256(data).hexdigest()
    base_paths = set(git('ls-tree', '-r', '--name-only', '-z', BASE).decode().strip('\0').split('\0'))
    existing = [name for name in paths if name in base_paths]
    originals = {}
    if existing:
        with tarfile.open(fileobj=io.BytesIO(git('archive', '--format=tar', BASE, '--', *existing))) as archive:
            originals = {item.name: archive.extractfile(item).read() for item in archive if item.isfile()}
    entries = []
    for name in paths:
        data = (source / name).read_bytes().replace(b'\r\n', b'\n')
        before = sha(originals[name]) if name in originals else None
        target = payload / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        entries.append(dict(path=name, before=before, after=sha(data)))
    # Git's textual diff canonicalizes CRLF consistently with the payload above.
    patch = git('diff', '--binary', '--no-ext-diff', BASE, '--', *paths)
    (ROOT / 'mod/changes.patch').write_bytes(patch)
    def write(name, value):
        (ROOT / 'mod' / name).write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    write('install-manifest.json', dict(version=VERSION, gameVersion='0.3.3', upstreamCommit=BASE, files=entries))
    metadata = json.loads((ROOT / 'mod/compatibility.json').read_text(encoding='utf-8'))
    metadata.update(version='0.3.3', bundleVersion=VERSION, commit=BASE, versionBase='0.3.3', patchSha256=sha(patch), patchFiles=paths, releaseDate='2026-11-01')
    metadata['notes'] = [f'{VERSION} is a local-use test build based on upstream 0.3.3. Forge imports are partial; see the import report. No dedicated server distribution.']
    write('compatibility.json', metadata)
    print(f'Local candidate {VERSION}: {len(entries)} source files; base {BASE}; patch {sha(patch)}')

if __name__ == '__main__':
    main()
