#!/usr/bin/env python3
"""Build the single Full.zip used for GitHub Releases and net-disk distribution."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile


ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assets-from', type=Path, default=ROOT / 'mod/assets', help='directory containing public/assets/...')
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    parser.add_argument('--force', action='store_true', help='replace an existing build in the chosen output directory')
    args = parser.parse_args()
    assets_root = args.assets_from.resolve()
    subprocess.run(['node', str(ROOT / 'scripts/check-package.mjs'), '--assets-from', str(assets_root)], check=True)
    manifest = json.loads((ROOT / 'mod/install-manifest.json').read_text(encoding='utf-8'))
    assets = json.loads((ROOT / 'mod/asset-manifest.json').read_text(encoding='utf-8'))
    metadata = json.loads((ROOT / 'mod/compatibility.json').read_text(encoding='utf-8'))
    version = manifest['version']
    if not version or any(c not in '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-' for c in version):
        raise ValueError('Invalid version')
    prefix = 'Tavern-Battlegrounds-' + version
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    archive = output / (prefix + '-Full.zip')
    if archive.exists() and not args.force:
        raise FileExistsError('Build already exists; use another output directory or --force: ' + str(archive))
    files = {}
    for name in ['使用说明.txt', 'README.md', 'INSTALL.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE', 'Import.cmd', 'Uninstall.cmd', 'install.sh', 'uninstall.sh', 'install.mjs']:
        files[name] = ROOT / name
    for folder in ['docs', 'scripts']:
        for source in (ROOT / folder).rglob('*'):
            if source.is_file() and source.suffix in ['.md', '.mjs', '.py'] and '__pycache__' not in source.parts:
                if source.is_symlink():
                    raise ValueError('Linked package file: ' + str(source))
                files[source.relative_to(ROOT).as_posix()] = source
    for name in ['install-manifest.json', 'asset-manifest.json', 'compatibility.json', 'changes.patch']:
        files['mod/' + name] = ROOT / 'mod' / name
    for entry in manifest['files']:
        files['mod/payload/' + entry['path']] = ROOT / 'mod/payload' / entry['path']
    for entry in assets['files']:
        files['mod/assets/' + entry['path']] = assets_root / entry['path']
    date = tuple(map(int, metadata['releaseDate'].split('-'))) + (0, 0, 0)
    temporary = archive.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for name, source in sorted(files.items()):
            info = zipfile.ZipInfo(prefix + '/' + name, date_time=date)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (0o100755 if name.endswith('.sh') else 0o100644) << 16
            bundle.writestr(info, source.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=6)
    with zipfile.ZipFile(temporary) as bundle:
        bad = bundle.testzip()
        if bad:
            raise ValueError('ZIP CRC failure: ' + bad)
    temporary.replace(archive)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / 'SHA256SUMS.txt').write_bytes((digest + '  ' + archive.name + '\n').encode('utf-8'))
    print(json.dumps({'zip': str(archive), 'bytes': archive.stat().st_size, 'entries': len(files), 'sha256': digest}, ensure_ascii=True))


if __name__ == '__main__':
    main()
