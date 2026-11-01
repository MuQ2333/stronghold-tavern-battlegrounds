import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importForge } from '../../server/plugins/forgeImport.js';
import { planForgeRecords } from '../../server/plugins/forgeRecords.js';
import { createPluginRegistry } from '../../server/plugins/registry.js';
import { buildContentSet } from '../../server/plugins/contentSet.js';
import { getData, ROOT } from '../../server/data.js';
import { tavernBands, tavernOptions } from '../../shared/tavernContent.js';
import { heroPowerId } from '../../shared/heroPowers.js';
import { createDataStore } from '../../public/js/data.js';
import { makeMatch } from '../match/harness.js';
import { powerOf } from '../../server/match/heroPowers.js';

test('Tavern declarations supply omissions, but explicit room switches always win independently', () => {
  const rules = { spellShop: 'separate', tavernHeroes: 'enabled' };
  assert.deepEqual(tavernOptions({}), { spells: false, heroes: false });
  assert.deepEqual(tavernOptions({ rules }), { spells: true, heroes: true });
  for (const spellShop of [false, true]) for (const heroMod of [false, true]) {
    assert.deepEqual(tavernOptions({ rules, spellShop, heroMod }), { spells: spellShop, heroes: heroMod });
  }
});

test('only implemented Forge hero profiles without additional unhandled behavior are accepted', () => {
  const data = getData(), skipped = [];
  const planned = planForgeRecords({
    read: file => file === 'bands' ? {
      good: { name: 'Good', buffs: [], params: { heroPower: 'toki' } },
      unknown: { params: { heroPower: 'invented' } },
      mixed: { buffs: [{ key: 'invented' }], params: { heroPower: 'toki' } },
      extra: { params: { heroPower: 'toki', invented: 100 } },
    } : {},
    table: file => data[file], allocate: (prefix, id) => `${prefix}_probe_${id}`, skip: (...args) => skipped.push(args),
  });
  assert.equal(planned.records.filter(r => r.file === 'bands').length, 1);
  assert.ok(skipped.some(row => row[0] === 'bands:unknown#params.heroPower'));
  assert.ok(skipped.some(row => row[0] === 'bands:mixed#params.heroPower'));
  assert.ok(skipped.some(row => row[0] === 'bands:extra#params.heroPower'));
});

test('a Forge hero pack selects its own catalogue, executes its power, and restores vanilla on removal', async t => {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()), 'forge-host-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'input'), pluginsDir = path.join(dir, 'plugins');
  fs.mkdirSync(input);
  fs.writeFileSync(path.join(input, 'pack.json'), JSON.stringify({ id: 'hero-probe', version: '1.0.0', content: ['bands'], combat: true,
    behaviour: [{ switch: 'spellShop', option: 'separate' }] }));
  fs.writeFileSync(path.join(input, 'bands.json'), JSON.stringify({
    band_probe: { bandId: 'band_probe', name: 'Probe', desc: '', buffs: [], params: { heroPower: 'toki' }, totalHp: 28,
      modeTypeList: ['SINGLE', 'MULTI', 'LOCAL'], bondIds: [], sortId: 100 },
  }));
  const result = await importForge(input, { root: ROOT, pluginsDir, out: path.join(pluginsDir, 'hero-probe'), officialTables: { offline: true } });
  assert.equal(result.ok, true, JSON.stringify(result.report));
  assert.ok(!result.report.skipped.some(row => row.path.startsWith('bands:') || /spellShop/.test(row.en)));
  const registry = createPluginRegistry({ publicDir: path.join(ROOT, 'public'), packsDir: path.join(ROOT, 'packs'), dataDir: path.join(ROOT, 'data'), pluginsDir }, { recheckMs: 0, log: { info() {}, warn() {} } });
  const off = buildContentSet({ registry, ids: [] });
  const on = buildContentSet({ registry, ids: ['hero-probe'] });
  assert.deepEqual(on.problems, []);
  assert.deepEqual(on.rules, { spellShop: 'separate', tavernHeroes: 'enabled' });
  const heroes = Object.values(tavernBands(on.data.bands)).filter(heroPowerId);
  assert.equal(heroes.length, 1);
  assert.equal(heroes[0].params.heroPower, 'toki');
  assert.equal(heroes[0].effectRef, undefined, 'does not borrow unrelated native strategy behavior');
  const store = createDataStore({ fetch: async () => ({ ok: true, json: async () => on.data.bands }) });
  await store.load('bands');
  assert.equal(store.list('bands').filter(heroPowerId).length, 1);
  assert.equal(store.lookup('bands', heroes[0].bandId).params.heroPower, 'toki');
  assert.equal(store.lookup('bands', 'band_hs_toki'), null);
  assert.equal(store.lookup('bands', 'constructor'), null);
  for (const spellShop of [false, true]) for (const heroMod of [false, true]) {
    const switched = makeMatch({ fake: true, mode: 'solo', data: on.data, rules: on.rules, spellShop, heroMod });
    try {
      assert.equal(switched.m.spellShop, spellShop);
      assert.equal(switched.m.gd.bandAllowed(heroes[0].bandId), heroMod);
      switched.start();
      assert.ok(switched.drive(() => switched.m.phase === 'BAND_DRAFT', { ready: false }));
      const picked = switched.m.handle('p_0', { t: 'g.band', bandId: heroes[0].bandId });
      assert.equal(picked.ok === true, heroMod, 'disabled imported heroes cannot be selected by a raw intent');
    } finally { switched.m.dispose(); }
  }
  const h = makeMatch({ fake: true, mode: 'solo', data: on.data, rules: on.rules, cs: on.cs, requireCs: true });
  t.after(() => h.m.dispose());
  h.start(); h.toPrep(1, { band: heroes[0].bandId });
  const ps = h.ps('p_0');
  assert.equal(powerOf(ps), 'toki');
  assert.equal(ps.privateView().shop.spellShop, true);
  const funds = ps.funds;
  assert.equal(h.m.handle('p_0', { t: 'g.heroPower', action: 'use' }).ok, true);
  assert.ok(ps.funds < funds);
  assert.equal(ps.heroState.usedRound, 1);
  h.invariants();
  const replacement=ps.spellStrategyPool()[0];assert.ok(replacement);
  ps.offers.unshift({source:'spell',spellStrategy:true,slots:[{kind:'band',id:replacement,price:0}]});
  assert.equal(ps.pickReward(0).ok,true);assert.equal(ps.bandId,replacement);
  h.m.finish({victory:false,reason:'abandoned'});h.m._resync(ps);
  assert.equal(h.lastTo('p_0','m.result').players[0].bandId,heroes[0].bandId,'Forge opening hero survives strategy replacement');
  const growing=makeMatch({fake:true,mode:'solo',data:on.data,rules:on.rules,growthMode:true});
  try {
    growing.start();growing.toPrep();const owner=growing.ps('p_0');
    owner.bandId=null;owner.board.clear();owner.hand.fill(null);owner.temp.fill(null);owner.layers={};owner.counters={};
    owner.bondCountBonus={visiShip:20,miraShip:20};owner.recompute();
    const before=owner.funds+owner.pendingFunds;owner.addLayers('visiShip',200);owner.addLayers('miraShip',300);
    assert.equal(owner.funds+owner.pendingFunds-before,20,'real imported Forge data shares both growth fund caps');
  } finally {growing.m.dispose();}
  const disabled = buildContentSet({ registry, ids: [] });
  assert.equal(disabled.cs, off.cs);
  assert.deepEqual(disabled.data.bands, off.data.bands);
  assert.equal(disabled.rules, undefined);
});
