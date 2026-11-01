import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importForge } from '../../server/plugins/forgeImport.js';
import { createPluginRegistry } from '../../server/plugins/registry.js';
import { buildContentSet } from '../../server/plugins/contentSet.js';
import { DataSource } from '../../server/sim/simdata.js';
import { setGameData } from '../../server/sim/content/support/index.js';
import { makeBattle, checkInvariants } from '../helpers/battleHarness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Forge import writes on Windows and composes selected data with implemented Tavern host profiles', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-tavern-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const input = path.join(temp, 'input');
  const pluginsDir = path.join(temp, 'plugins');
  fs.mkdirSync(input);
  fs.writeFileSync(path.join(input, 'pack.json'), JSON.stringify({
    id: 'tavern-boundary', version: '1.0.0', content: ['bonds', 'bands'],
    overrides: ['bonds:deputShip'], combat: true,
    behaviour: [{ switch: 'spellShop', option: 'separate' }],
  }));
  // This is a synthetic boundary probe, not a proposed gameplay balance change.
  fs.writeFileSync(path.join(input, 'bonds.json'), JSON.stringify({ deputShip: { bb: { base_def: 0.5 } } }));
  fs.writeFileSync(path.join(input, 'bands.json'), JSON.stringify({ band_hs_yogg: { name: 'Probe', params: { heroPower: 'yogg' } } }));
  const result = await importForge(input, { root, pluginsDir, out: path.join(pluginsDir, 'tavern-boundary'), officialTables: { offline: true } });
  assert.equal(result.ok, true, result.report);
  assert.equal(result.wrote, true);
  const report = result.report;
  assert.ok(!report.skipped.some(x => x.path === 'pack.json:behaviour[0]'));
  assert.ok(!report.skipped.some(x => x.path.startsWith('bands:band_hs_yogg')));
  assert.ok(fs.existsSync(path.join(pluginsDir, 'tavern-boundary/plugin.lock.json')));
  const registry = createPluginRegistry({ publicDir: path.join(root, 'public'), packsDir: path.join(root, 'packs'), dataDir: path.join(root, 'data'), pluginsDir }, { recheckMs: 0, log: { info() {}, warn() {} } });
  const off = buildContentSet({ registry, ids: [] });
  const on = buildContentSet({ registry, ids: ['tavern-boundary'] });
  assert.deepEqual(on.problems, []);
  assert.equal(on.data.bonds.deputShip.bb.base_def, 0.5);
  assert.notEqual(on.cs, off.cs);
  assert.ok(Object.values(on.data.bands).some(b => b.params?.heroPower === 'yogg'));
  assert.equal(on.rules?.spellShop, 'separate');
  assert.equal(on.rules?.tavernHeroes, 'enabled');
  setGameData(on.data);
  try {
    const battle = makeBattle({ data: new DataSource(on.data), units: [{ chessId: 'chess_char_1_02_a', row: 10, col: 5 }] });
    battle.step();
    assert.equal(battle.allies().length, 1);
    checkInvariants(battle.b);
  } finally { setGameData(null); }
  const disabled = buildContentSet({ registry, ids: [] });
  assert.equal(disabled.cs, off.cs);
  assert.equal(disabled.data.bonds.deputShip.bb.base_def, off.data.bonds.deputShip.bb.base_def);
});
