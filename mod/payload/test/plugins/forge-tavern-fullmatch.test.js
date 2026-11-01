// Opt-in acceptance against the actual exported Forge ZIPs. No generated substitutes or FakeBattle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { importForge } from '../../server/plugins/forgeImport.js';
import { createPluginRegistry } from '../../server/plugins/registry.js';
import { buildContentSet } from '../../server/plugins/contentSet.js';
import { ROOT } from '../../server/data.js';
import { heroPowerId } from '../../shared/heroPowers.js';
import { spellTarget } from '../../shared/spells.js';
import { makeMatch } from '../match/harness.js';
import { gameData, setGameData } from '../../server/sim/content/support/index.js';

const heroPackage = process.env.SP_FORGE_HERO_PACKAGE, spellPackage = process.env.SP_FORGE_SPELL_PACKAGE;
const enabled = !!heroPackage && !!spellPackage;

function startWithBand(h, band, heroes) {
  h.start();
  assert.ok(h.drive(() => h.m.phase === 'BAND_DRAFT', { ready: false }));
  while (h.m.phase === 'BAND_DRAFT') { // loop-cap: one draft turn per finite seat list
    const pid = h.m.draftTurn();
    if (pid && !h.ps(pid).isBot) {
      const taken = h.m.order.map(p => p.bandId);
      const id = pid === 'p_0' ? band.bandId : heroes.find(b => b.modeTypeList.includes('MULTI') && !taken.includes(b.bandId))?.bandId;
      assert.equal(h.m.handle(pid, { t: 'g.band', bandId: id }).ok, true);
    } else assert.ok(h.sched.runNext());
  }
  h.runToPhase('PREP', 1);
}

test('real Forge hero + spell ZIPs: selected content completes solo/coop with real client and server simulations', {
  skip: !enabled, timeout: 600000,
}, async t => {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()), 'forge-fullmatch-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const pluginsDir = path.join(dir, 'plugins');
  for (const [input, id] of [[heroPackage, 'hero-strategies'], [spellPackage, 'spell-shop']]) {
    const result = await importForge(input, { root: ROOT, pluginsDir, out: path.join(pluginsDir, id), officialTables: { offline: true } });
    assert.equal(result.ok, true, JSON.stringify(result.report));
    assert.ok(!result.report.skipped.some(row => row.path.startsWith('bands:') || /Unknown switch.*spellShop/.test(row.en)));
    t.diagnostic(`${id}: sha256=${createHash('sha256').update(fs.readFileSync(input)).digest('hex')}`);
  }
  const registry = createPluginRegistry({ publicDir: path.join(ROOT, 'public'), packsDir: path.join(ROOT, 'packs'), dataDir: path.join(ROOT, 'data'), pluginsDir }, { recheckMs: 0, log: { info() {}, warn() {} } });
  const set = buildContentSet({ registry, ids: ['hero-strategies', 'spell-shop'] });
  assert.deepEqual(set.problems, []);
  const heroes = Object.values(set.data.bands).filter(heroPowerId);
  assert.equal(heroes.length, 29, 'the real source package has 29 profiles');
  const previous = gameData(); setGameData(set.data);
  t.after(() => setGameData(previous));
  // Explicit selection and real intent paths for every imported profile, including disabled combinations.
  for (const band of heroes) {
    const mode = band.modeTypeList.includes('SINGLE') ? 'solo' : 'coop';
    const h = makeMatch({ mode, data: set.data, rules: set.rules, cs: set.cs, requireCs: true });
    try {
      startWithBand(h, band, heroes);
      assert.equal(h.ps('p_0').privateView().heroPower.id, band.params.heroPower);
      h.invariants();
    } finally { h.m.dispose(); }
  }
  for (const options of [
    { mode: 'solo', humans: 1, bots: 0, profile: 'toki', clientCombat: true, seed: 7 },
    { mode: 'coop', humans: 2, bots: 0, profile: 'hollidae', clientCombat: true, seed: 11 },
    { mode: 'solo', humans: 1, bots: 0, profile: 'tamsin', clientCombat: false, seed: 19 },
  ]) {
    const h = makeMatch({ ...options, difficulty: 'FUNNY', data: set.data, rules: set.rules, cs: set.cs, requireCs: true,
      captureFrames: false, checkFrames: true, perPlayer: { p_0: { withCs: true }, p_1: { withCs: true } } });
    try {
      const band = heroes.find(b => b.params.heroPower === options.profile);
      startWithBand(h, band, heroes);
      const ps = h.ps('p_0');
      assert.equal(ps.privateView().heroPower.id, options.profile);
      const actions = { powers: 0, spellBuys: 0, casts: 0 };
      // Endurance fixture only: keep the match alive through the Final Assault; operators/enemies/economy are unchanged.
      for (const p of h.m.order) p.lp = 400;
      for (const p of h.m.order) if (!p.isBot) assert.equal(h.m.handle(p.playerId, { t: 'g.autoplay', on: true }).ok, true);
      let phase = '';
      h.run(() => {
        const next = `${h.m.phase}:${h.m.round}`;
        if (next !== phase) {
          phase = next; h.invariants();
          if (h.m.phase === 'PREP' && ps.alive && !ps.ready) {
            if (options.profile !== 'tamsin' && h.m.handle('p_0', { t: 'g.heroPower', action: 'use' }).ok) actions.powers++;
            const slot = ps.shop.slots.findIndex(s => s?.kind === 'item' && !s.sold && spellTarget(ps.gd.item(s.id)) === 'global' && ps.gd.itemPrice(s.id) <= ps.funds);
            if (slot >= 0) {
              const id = ps.shop.slots[slot].id;
              if (h.m.handle('p_0', { t: 'g.buy', slot, expectedId: id }).ok) actions.spellBuys++;
            }
            for (const piece of [...ps.hand, ...ps.temp]) if (piece?.kind === 'item' && spellTarget(ps.gd.item(piece.id)) === 'global') {
              if (h.m.handle('p_0', { t: 'g.castSpell', itemUid: piece.uid, targetUid: null }).ok) actions.casts++;
            }
          }
        }
        return !!h.ended;
      }, { maxSteps: 5e6 });
      assert.ok(h.ended, `stalled at ${h.m.phase} R${h.m.round}; ${JSON.stringify(h.logs.error)}`);
      assert.equal(h.endedCount, 1);
      assert.ok(h.ended.roundsPassed >= 8, 'passed ordinary rounds and reached the boss');
      assert.ok(actions.spellBuys > 0 && actions.casts > 0, 'real shop purchases and successful casts occurred');
      if (options.profile !== 'tamsin') assert.ok(actions.powers > 0);
      assert.equal(h.m.phase, 'RESULT');
      assert.equal(h.m.errorCount, 0);
      assert.equal(h.m.dispatcher.errors, 0);
      assert.deepEqual(h.logs.error, []);
      assert.deepEqual(h.sched.errors, []);
      assert.deepEqual(h.badFrames, []);
      if (options.clientCombat) {
        assert.equal(h.m.verifyStats.rejected, 0);
        assert.equal(h.m.verifyStats.takeovers, 0);
        for (const client of h.clients.values()) assert.ok(client.log.some(row => row.t === 'b.result'));
      }
      h.invariants();
      t.diagnostic(JSON.stringify({ ...options, actions, roundsPassed: h.ended.roundsPassed, cs: set.cs, rejected: h.m.verifyStats.rejected }));
    } finally { h.clients?.closeAll(); h.m.dispose(); }
  }
});
