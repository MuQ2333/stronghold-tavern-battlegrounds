import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch } from './match/harness.js';
import { parseTestArgs, TEST_ENEMY_DEFAULTS } from '../shared/testMode.js';
import { testEnemyOptions, testEnemySpawns } from '../server/match/testEnemies.js';
import { normalizeEnemy } from '../server/sim/simdata.js';

function fixture(t, options = {}) {
  const h = makeMatch({ mode: 'solo', test: true, ...options });
  t.after(() => h.m.dispose()); h.start(); h.toPrep(); h.p = h.ps('p_0');
  h.cmd = (cmd, args = {}) => h.m.handle('p_0', { t: 'g.test', cmd, args });
  return h;
}
const ok = r => assert.deepEqual(r, { ok: true });

test('enemy settings validate bounded finite decimals and reset as a complete configuration', () => {
  assert.deepEqual(parseTestArgs('enemies', {}).args, TEST_ENEMY_DEFAULTS);
  assert.equal(parseTestArgs('enemies', { hp: 2.5, atk: 0 }).args.hp, 2.5);
  for (const hp of [0, -1, Infinity, NaN, '2', 1e7]) assert.equal(parseTestArgs('enemies', { hp }).error, 'BAD_TARGET');
  assert.equal(parseTestArgs('enemies', { count: 6 }).error, 'BAD_TARGET');
  assert.equal(parseTestArgs('enemies', { file: 'x' }).error, 'BAD_MSG');
  for (const count of [0, 10, 1.5, '3']) assert.equal(parseTestArgs('chess', { id: 'x', count }).error, 'BAD_TARGET');
});

test('batch cards run real triple acquisition and spell grants without spending funds', t => {
  const h = fixture(t, { spellShop: true, growthMode: true });
  const id = h.m.gd.visibleChess.find(id => h.m.gd.goldenIdOf(id));
  const gold = h.m.gd.goldenIdOf(id), funds = h.p.funds;
  ok(h.cmd('chess', { id, count: 3 }));
  assert.ok(h.p.allChess().some(p => p.id === gold));
  ok(h.cmd('item', { id: 'hs_bg33_101', count: 2 }));
  assert.equal([...h.p.hand, ...h.p.temp].filter(p => p?.id === 'hs_bg33_101').length, 2);
  assert.equal(h.p.funds, funds); assert.equal(h.m.errorCount, 0);
});

test('enemy command is host/test only, refuses live edits, persists across rounds, and resets', t => {
  const h = fixture(t);
  ok(h.cmd('enemies', { hp: 3, count: 2, interval: 0.5 }));
  assert.equal(h.m.publicView().testEnemies.hp, 3);
  const original = JSON.stringify(h.m.wave);
  const settings = h.m.testEnemies;
  const raw = h.m._normalOpts(h.p);
  const adjusted = testEnemyOptions(h.m.gd, raw, settings);
  const field = h.m._ccField({ fieldId: 'test', kind: 'normal', players: ['p_0'], opts: raw });
  assert.deepEqual(field.spec.spawns, adjusted.spawns);
  assert.deepEqual(field.spec.enemyOverrides, adjusted.enemyOverrides);
  assert.equal(JSON.stringify(h.m.wave), original);
  ok(h.cmd('timers', { on: false })); ok(h.cmd('round', { round: 2 }));
  assert.equal(h.m.publicView().testEnemies.hp, 3);
  ok(h.cmd('enemies', {})); assert.deepEqual(h.m.testEnemies, TEST_ENEMY_DEFAULTS);
  h.m.phase = 'COMBAT'; assert.equal(h.cmd('enemies', { hp: 4 }).error, 'WRONG_PHASE');
  assert.deepEqual(h.m.testEnemies, TEST_ENEMY_DEFAULTS);
  const normal = fixture(t, { test: false });
  assert.equal(normal.cmd('enemies', { hp: 5 }).error, 'TEST_FORBIDDEN');
  assert.equal(normal.m.publicView().testEnemies, undefined);
});

test('all enemy base stats compose with round overrides; summon and unite do not compound the multiplier', t => {
  const h = fixture(t);
  const raw = h.m._normalOpts(h.p), key = raw.spawns[0].enemyKey;
  const settings = { ...TEST_ENEMY_DEFAULTS, hp: 2, atk: 3, def: 4, res: 5, speed: 0.5, count: 2, interval: 0.5 };
  const original = structuredClone(raw);
  const out = testEnemyOptions(h.m.gd, raw, settings);
  assert.deepEqual(raw, original);
  const base = normalizeEnemy(key, h.m.gd.enemy(key));
  assert.equal(out.enemyOverrides[key].stats.maxHp, (raw.enemyOverrides?.[key]?.stats?.maxHp ?? base.maxHp) * 2);
  assert.equal(out.enemyOverrides[key].stats.atk, (raw.enemyOverrides?.[key]?.stats?.atk ?? base.atk) * 3);
  const b = h.m.newBattle({ ...raw, spawns: [] });
  // Explicit spawn stands in for runtime summon. The same opts in unite preserve the original scaling once.
  const u = b.spawnEnemy(key, { mods: raw.spawns[0].mods });
  h.m.testEnemies = settings;
  const tuned = h.m.newBattle({ ...raw, spawns: [] });
  const v = tuned.spawnEnemy(key, { mods: raw.spawns[0].mods });
  assert.equal(v.maxHp, u.maxHp * 2); assert.equal(v.s.atk, u.s.atk * 3);
  const reentry = h.m.newBattle({ ...raw, kind: 'unite', spawns: [] });
  const w = reentry.spawnEnemy(key, { mods: v.mods });
  assert.equal(w.maxHp, v.maxHp); assert.equal(w.s.atk, v.s.atk);
  assert.ok(Object.keys(out.enemyOverrides).length > 100, 'includes runtime summon templates');
});

test('scheduled count/time edits exclude leaders and parts and do not multiply united leaks', () => {
  const source = [{ enemyKey: 'x', count: 3, time: 4, interval: 2 }, { enemyKey: 'b', count: 1, time: 0, tag: 'boss' }, { enemyKey: 'p', count: 1, tag: 'part' }];
  const settings = { ...TEST_ENEMY_DEFAULTS, count: 2, interval: 0.5 };
  const out = testEnemySpawns(source, settings);
  assert.deepEqual([out[0].count, out[0].time, out[0].interval], [6, 2, 1]);
  assert.deepEqual(out.slice(1), source.slice(1));
  assert.equal(testEnemySpawns(source, settings, 'unite'), source);
  assert.equal(testEnemyOptions({}, source, null), source);
});

test('leader pool multiplier stays separate from ordinary enemy HP and reaches the actual pool', t => {
  const h = fixture(t);
  ok(h.cmd('timers', { on: false }));
  ok(h.cmd('enemies', { hp: 100, bossHp: 2 }));
  ok(h.cmd('round', { round: h.m.gd.bossRound }));
  h.p.lp = 999;
  h.m.startFinalAssault(false);
  assert.ok(h.m.bossPool.maxHp > 0);
  const pool = h.m.bossPool.maxHp;
  const other = fixture(t);
  other.p.lp = 999;
  ok(other.cmd('round', { round: other.m.gd.bossRound }));
  other.m.startFinalAssault(false);
  assert.equal(pool, other.m.bossPool.maxHp * 2);
});
