import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatLayerCount } from '../public/js/ui/layerCount.js';
import { liveLayerHud } from '../public/js/ui/liveLayerHud.js';
import { liveBondLayers, compactLayerEvents } from '../server/match/liveLayers.js';
import { FieldRunner } from '../server/match/fields.js';
import { stripView, popupView } from '../public/js/ui/watchBonds.js';
import { validHostMessage } from '../server/match/host/ipc.js';
import { makeMatch, legalTileFor } from './match/harness.js';

test('stack units use one decimal, with exact thresholds and no change to the source number', () => {
  for (const [n, text] of [[0,'0'],[999,'999'],[1000,'1.0k'],[1500,'1.5k'],[21300,'21.3k'],[1000000,'1.0M'],[21300000,'21.3M'],[NaN,'0']]) assert.equal(formatLayerCount(n), text);
});
test('sampled HUD carries growth between frames and discards a different field or restarted timeline', () => {
  const layers = { p: { sargonShip: 21300 } };
  const hud = liveLayerHud(null, { fieldId: 'n:p', gt: 3, bondLayers: layers, killed: 1 });
  assert.equal(liveLayerHud(hud, { fieldId: 'n:p', gt: 4 }).bondLayers, layers);
  assert.equal(liveLayerHud(hud, { fieldId: 'n:q', gt: 4 }).bondLayers, null);
  assert.equal(liveLayerHud(hud, { fieldId: 'n:p', gt: 0 }).bondLayers, null);
  assert.equal(liveLayerHud(hud, null), null);
});
test('streamer batches rapid stack gains twice per real second and always sends the final exact counts', () => {
  const sent = [], ps = { playerId: 'p', bonds: { sargonShip: { layers: 1000 } } };
  const battle = { time: 0, finished: false, players: [ps], drainEvents: () => [], snapshot() { return { t: this.time, units: [] }; } };
  const field = { fieldId: 'n:p', players: ['p'], battle };
  const runner = new FieldRunner({ gameSpeed: 2, watchersOf: () => ['p'], sendTo: (pid, msg) => sent.push(msg), reportError: assert.fail }, [field], { onDone() {} });
  for (let i = 0; i < 20; i++) { battle.time = i / 10; ps.bonds.sargonShip.layers += 1000; runner._emit(field); }
  const samples = sent.filter(x => x.bondLayers);
  assert.equal(samples.length, 2);
  field.live = false; runner._emit(field);
  assert.equal(sent.at(-1).bondLayers.p.sargonShip, 21000);
  assert.equal(samples[0].bondLayers.p.sargonShip, 2000, 'sent maps never alias the mutable sim');
});
test('real growth Sargon skill gains are visible before settlement and watch/resync sends absolute layers', t => {
  const h = makeMatch({ mode: 'solo', growthMode: true, test: true }); t.after(() => h.m.dispose()); h.start(); h.toPrep();
  const ps = h.ps('p_0');
  const piece = ps.acquireChess('chess_char_3_06_a');
  const tile = legalTileFor(h.m, ps, piece.id);
  assert.ok(tile); assert.deepEqual(h.m.handle('p_0', { t: 'g.move', uid: piece.uid, to: { area: 'board', row: tile[0], col: tile[1] } }), { ok: true });
  ps.layers.sargonShip = 995; ps.recompute();
  const b = h.m._normalBattle(ps); b.start();
  const unit = b.allyUnits.find(x => x.uid === piece.uid);
  assert.ok(unit); unit.alive = true; unit.deployed = true;
  b.emit('skillStart', { unit });
  assert.equal(liveBondLayers(b).p_0.sargonShip, 1003);
  assert.equal(ps.layers.sargonShip, 995, 'the display read does not settle the gain');
  h.m.fields = [{ fieldId: 'n:p_0', kind: 'normal', players: ['p_0'], battle: b, live: true }];
  h.m._sendField('p_0', 'n:p_0');
  const frame = h.sent.filter(([,m]) => m.t === 'b.snap').at(-1)[1];
  assert.equal(frame.bondLayers.p_0.sargonShip, 1003);
});

test('high-frequency layer display events are merged per player/bond without mutating battle event history', () => {
  const input = [['layer','p','sargonShip',2], ['die',7], ['layer','p','sargonShip',3], ['layer','q','sargonShip',8], ['layer','p','cleverShip',1]];
  const before = structuredClone(input);
  assert.deepEqual(compactLayerEvents(input), [['layer','p','sargonShip',5], ['die',7], ['layer','q','sargonShip',8], ['layer','p','cleverShip',1]]);
  assert.deepEqual(input, before);
});


for (const growthMode of [false, true]) for (const kind of ['normal','unite','boss','hidden']) {
  test(`all stack-bearing alliances: ${growthMode ? 'growth' : 'native'} ${kind} live map, IPC, watch, popup and resync`, t => {
    const h = makeMatch({ mode: 'coop', humans: 2, growthMode, test: true }); t.after(() => h.m.dispose());
    const ids = h.m.gd.bondIds.filter(id => !h.m.gd.bond(id).noStack);
    assert.equal(ids.length, growthMode ? 20 : 19);
    const base = Object.fromEntries(ids.map(id => [id, { active: true, tier: 1, count: 1, layers: 995 }]));
    const players = ['p_0','p_1'].map(playerId => ({ playerId, bonds: structuredClone(base), units: [] }));
    const temporary = kind !== 'normal';
    const b = h.m.newBattle({ kind, fieldId: 'audit', stageId: h.m.stageId, players, spawns: [], routes: [], content: 'none', autoFinish: false,
      flags: { layerGainsEnabled: !temporary, growthMode } });
    const before = structuredClone(players);
    const expected = {};
    for (let seat = 0; seat < players.length; seat++) {
      const playerId = players[seat].playerId; expected[playerId] = {};
      for (const [i, id] of ids.entries()) {
        const add = b.addLayers(playerId, id, 1500 + seat * 100 + i, 'audit', { temporary });
        expected[playerId][id] = 995 + add;
        assert.equal(expected[playerId][id], growthMode ? 2495 + seat * 100 + i : 999, id);
      }
    }
    assert.deepEqual(players, before, 'display sampling never mutates the input or commits gains');
    const layers = liveBondLayers(b); assert.deepEqual(layers, expected);
    h.m.fields = [{ fieldId: 'audit', kind, players: ['p_0','p_1'], battle: b, live: true }];
    h.m._sendField('p_0','audit');
    const frame = h.sent.filter(([,msg]) => msg.t === 'b.snap').at(-1)[1];
    assert.ok(validHostMessage({ type: 'send', matchId: 'audit', playerId: 'p_0', msg: frame }), 'isolated Forge host accepts the sampled map');
    assert.deepEqual(frame.bondLayers, expected);
    const hud = liveLayerHud(null, frame);
    const list = Object.entries(base).map(([bondId, b]) => ({ bondId, ...b }));
    const pub = { growthMode, players: players.map(p => ({ playerId: p.playerId, name: p.playerId, fieldId: 'audit', bonds: list })) };
    const priv = { bonds: list };
    for (const playerId of ['p_0','p_1']) {
      const strip = stripView({ pub, priv, myId: 'p_0', fieldId: 'audit', field: { fieldId: 'audit', players: ['p_0','p_1'], sides: { p_0: 'L', p_1: 'R' } }, halves: true, layer: playerId === 'p_0' ? 'L' : 'R', watched: playerId, live: hud.bondLayers });
      assert.equal(strip.ownerId, playerId, 'watch selects the intended owner');
      for (const id of ids) {
        assert.equal(strip.bonds.find(b => b.bondId === id)?.layers, expected[strip.ownerId][id], id);
        const pop = popupView({ open: { id, ownerId: playerId }, pub, priv, myId: 'p_0', live: hud.bondLayers });
        assert.equal(pop.entry.layers, expected[playerId][id], `${id} popup`);
      }
    }
    if (temporary) for (const playerId of ['p_0','p_1']) assert.deepEqual(b._pp(playerId).layerGains, {}, 'temporary counters never become permanent result gains');
    for (const id of h.m.gd.bondIds.filter(id => h.m.gd.bond(id).noStack)) assert.ok(!Object.hasOwn(layers.p_0, id), `${id} remains a no-stack entry`);
  });
}
