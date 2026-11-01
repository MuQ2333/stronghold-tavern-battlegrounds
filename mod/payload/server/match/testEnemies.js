// Match-only test controls. Produce ordinary BattleSpec inputs; no sim hook or mutable game data.
import { normalizeEnemy } from '../sim/simdata.js';
import { TEST_ENEMY_DEFAULTS } from '../../shared/testMode.js';

/** Adjust scheduled enemies once; leaked enemies retain their count/timing on re-entry. */
export function testEnemySpawns(spawns, settings, kind = 'normal') {
  if (!settings || kind === 'unite') return spawns;
  return spawns.map(s => s.tag === 'boss' || s.tag === 'part' ? s : ({
    ...s,
    count: Math.max(1, Math.round((s.count || 1) * settings.count)),
    time: (s.time || 0) * settings.interval,
    interval: (s.interval || 0) * settings.interval,
  }));
}

/** Base-stat overrides also reach runtime summons, without scaling leaked units a second time. */
export function testEnemyOptions(gd, opts, settings) {
  if (!settings) return opts;
  const overrides = { ...opts.enemyOverrides };
  const bossKeys = new Set((opts.spawns || []).filter(s => s.tag === 'boss').map(s => s.enemyKey));
  for (const [key, rec] of Object.entries(gd.raw.enemies || {})) {
    if (key === 'enemy_9012_acloon') continue; // friendly Yan summon
    const def = normalizeEnemy(key, rec);
    const old = overrides[key] || {};
    const stats = { ...old.stats };
    for (const [field, setting] of [['maxHp','hp'], ['atk','atk'], ['def','def'], ['res','res'], ['moveSpeed','speed']]) {
      if (field === 'maxHp' && bossKeys.has(key)) continue; // the leader uses its independent pool
      const value = stats[field] ?? (field === 'maxHp' ? stats.hp : undefined) ?? def[field];
      stats[field] = value * settings[setting];
    }
    overrides[key] = { ...old, stats };
  }
  return { ...opts, spawns: testEnemySpawns(opts.spawns || [], settings, opts.kind), enemyOverrides: overrides };
}

export function testEnemySettings(match) {
  return match.test === true ? (match.testEnemies || TEST_ENEMY_DEFAULTS) : null;
}
