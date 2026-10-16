import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle } from './helpers/battleHarness.js';
import { makeMatch, give } from './match/harness.js';
import * as spellContent from '../server/sim/content/spells.js';
import { ALL_SPELLS } from '../shared/spellCatalog.js';
import { buildBattleSpec, createBattleFromSpec } from '../server/sim/spec.js';

const spell = ALL_SPELLS.find(c => c.name === '诺兹多姆的子嗣');

test('Nozdormu doubles white ATK before flat, percent, final, multiplicative and cultivate modifiers', () => {
  const h = makeBattle({
    units: [{ chessId: 'chess_char_1_01_a', row: 10, col: 5, uid: 1 }],
    content: 'none', extraContent: [spellContent],
    playerEffects: [{ id: 'spell_shop_battle', data: { attack: 1, attackUid: 1 } }],
  });
  const u = h.unit(1), originalDef = JSON.stringify(u.def);
  u.base.atk = 100;
  u.markDirty();
  h.b.on('deploy', ({ unit }) => {
    if (unit !== u) return;
    h.b.addBuff(u, { key: 'test:pct', mods: { atkPct: 0.5 }, persist: true });
    assert.equal(u.s.atk, 150);
  });
  h.b.start();
  assert.equal(u.base.atk, 200);
  assert.equal(u.s.atk, 300);
  h.b.addBuff(u, { key: 'test:all', mods: { atkFlat: 20, atkFinal: 10, atkMul: 1.2 }, persist: true });
  u.cultMul = { atk: 1.1, def: 1, hp: 1 }; u.markDirty();
  assert.equal(u.s.atk, ((200 + 20) * 1.5 + 10) * 1.2 * 1.1);
  assert.equal(JSON.stringify(u.def), originalDef, 'shared unit definition stays unchanged');
  h.b.start();
  assert.equal(u.base.atk, 200, 'starting an already-started battle does not double again');
});

test('Nozdormu selection is rightmost column, then bottommost row in owner coordinates', () => {
  const h = makeMatch({ fake: true, spellShop: true, seed: 17, humans: 2 });
  try {
    h.start(); h.toPrep(1);
    const ps = h.ps('p_0');
    const units = [
      { uid: 1, kind: 'chess', row: 9, col: 4 },
      { uid: 2, kind: 'chess', row: 12, col: 8 },
      { uid: 3, kind: 'chess', row: 10, col: 8 },
      { uid: 4, kind: 'token', row: 9, col: 10 },
    ];
    const input = ps.spellBattleInput({ units, bonds: {}, playerEffects: [] });
    assert.equal(input.playerEffects[0].data.attackUid, 3);
  } finally { h.m.dispose(); }
});

test('real BattleSpec applies the white bonus once, does not mutate a piece or the following round, and limits casts', () => {
  const h = makeMatch({ fake: true, spellShop: true, seed: 17, humans: 2 });
  try {
    h.start(); h.toPrep(1);
    const ps = h.ps('p_0');
    const op = give(h.m, ps, 'chess_char_1_01_a');
    const tile = [...ps.deployMap()].find(([, type]) => type === 'melee')[0];
    ps._detach(ps.find(op.uid)); ps.board.set(tile, op); ps.recompute();
    const held = ps.acquireItem(spell.id), extra = ps.acquireItem(spell.id);
    assert.equal(ps.castSpell(held.uid, null).ok, true);
    assert.ok(ps.castSpell(extra.uid, null).error);
    assert.ok(ps.find(extra.uid), 'blocked second copy is not consumed');
    const originalPiece = JSON.stringify(op);
    ps.spellCommitBattle();
    const spec = buildBattleSpec(h.m._normalOpts(ps));
    const originalSpec = JSON.stringify(spec);
    const battle = createBattleFromSpec(spec, h.m.ds);
    const target = battle.allyUnits.find(u => u.uid === op.uid);
    const base = target.base.atk;
    battle.start();
    assert.equal(target.base.atk, base * 2);
    assert.equal(JSON.stringify(spec), originalSpec, 'BattleSpec is immutable during spell resolution');
    assert.equal(JSON.stringify(op), originalPiece);
    const repeat = createBattleFromSpec(spec, h.m.ds); repeat.start();
    assert.equal(repeat.allies(ps.playerId).find(u => u.uid === op.uid).base.atk, base * 2, 'replay does not compound the prior Battle');
    const continued = ps.battleInput({ reached: true });
    assert.equal(continued.playerEffects.find(e => e.id === 'spell_shop_battle').data.attack, 0);
    h.m.round = 2; ps.startRound(2); ps.spellCommitBattle();
    const next = createBattleFromSpec(buildBattleSpec(h.m._normalOpts(ps)), h.m.ds); next.start();
    assert.equal(next.allies(ps.playerId).find(u => u.uid === op.uid).base.atk, base);
    assert.equal(ps.castSpell(extra.uid, null).ok, true, 'a new round restores the allowance');
  } finally { h.m.dispose(); }
});
