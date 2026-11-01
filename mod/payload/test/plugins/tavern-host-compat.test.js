import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wireOptions } from '../../server/match/host/proxy.js';
import { dispatchOperatorTraits } from '../../server/match/operatorTraits.js';
import { EffectDispatcher } from '../../server/match/effectsMeta.js';
import { Match } from '../../server/match/Match.js';
import { VirtualScheduler } from '../../server/match/scheduler.js';
import { decodeTestTrace, replayTestMatch } from '../../server/match/testReplay.js';
import { getData } from '../../server/data.js';

test('isolated gameplay match retains both explicit Tavern flags without inventing defaults', () => {
  assert.deepEqual(wireOptions({}), {});
  for (const spellShop of [false, true]) for (const heroMod of [false, true]) {
    const sent = wireOptions({ spellShop, heroMod });
    assert.equal(sent.spellShop, spellShop);
    assert.equal(sent.heroMod, heroMod);
  }
});

test('reserved hand cards do not activate plugin traits or mask an unlocked normal copy', () => {
  const normal = { id: 'normal', kind: 'chess' };
  const elite = { id: 'elite', kind: 'chess', meta: { handLock: { unlockRound: 3 } } };
  const gd = {
    chess: id => ({ charId: 'char_test', isGolden: id === 'elite' }),
    raw: { garrisons: Object.fromEntries([false, true].map(isElite => [String(isElite), {
      garrisonId: String(isElite), operatorTrait: { charId: 'char_test', elite: isElite, pluginId: 'test', spec: { meta: { on: [] } } },
    }])) },
  };
  const calls = [];
  const dispatcher = { _call: (_ps, key) => calls.push(key) };
  const ps = { alive: true, gd, allChess: () => [elite] };
  dispatchOperatorTraits(dispatcher, ps, 'onRoundStart', {});
  assert.deepEqual(calls, []);
  ps.allChess = () => [normal, elite];
  dispatchOperatorTraits(dispatcher, ps, 'onRoundStart', {});
  assert.deepEqual(calls, ['trait:false']);
});

test('collecting the whole shop queues plugin acquisition hooks with native gains', () => {
  const dispatcher = new EffectDispatcher({}, new Map());
  const ps = { heroAcquisitionQueue: [] };
  const ev = { piece: { id: 'normal', kind: 'chess' } };
  dispatcher.dispatch(ps, 'onTraitGain', ev);
  assert.deepEqual(ps.heroAcquisitionQueue, [['onTraitGain', ev]]);
});

test('test journal and replay retain explicit Tavern switches and omit absent switches', () => {
  const data = getData();
  for (const flags of [{}, { spellShop: true, heroMod: true }, { spellShop: false, heroMod: false }, { spellShop: true, heroMod: false }, { spellShop: false, heroMod: true }]) {
    const entries = [];
    const match = new Match({
      mode: 'solo', difficulty: 'NORMAL', test: true, seed: 17, data,
      seats: [{ seat: 0, playerId: 'p', name: 'P', isBot: false, connected: true }],
      scheduler: new VirtualScheduler(), send() {}, broadcast() {}, onEnd() {}, ...flags,
      log: { info(line) { if (line.startsWith('[test-input ')) entries.push(JSON.parse(line.slice(line.indexOf(']') + 2))); }, warn() {}, error() {} },
    });
    let replay;
    try {
      const init = decodeTestTrace(entries)[0];
      for (const key of ['spellShop', 'heroMod']) {
        assert.equal(init.options[key], flags[key]);
        assert.equal(Object.hasOwn(init.options, key), Object.hasOwn(flags, key));
      }
      replay = replayTestMatch(data, entries);
      assert.equal(replay.spellShop, match.spellShop);
      assert.equal(replay.heroMod, match.heroMod);
      assert.equal(replay.gd.spellHeroesEnabled, match.gd.spellHeroesEnabled);
      assert.equal(!!replay.gd.band('band_hs_yogg'), !!match.gd.band('band_hs_yogg'));
    } finally { replay?.dispose(); match.dispose(); }
  }
});
