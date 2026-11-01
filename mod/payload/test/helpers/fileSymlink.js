import fs from 'node:fs';

/** File links have no junction equivalent. Skip only when Windows denies this fixture's privilege. */
export function fileSymlink(t, target, link) {
  try { fs.symlinkSync(target, link, 'file'); return true; }
  catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    t.skip('Windows file-symlink fixture requires Developer Mode or symbolic-link privilege');
    return false;
  }
}
