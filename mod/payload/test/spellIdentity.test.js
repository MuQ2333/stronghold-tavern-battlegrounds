import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch } from './match/harness.js';
import { ALL_SPELLS } from '../shared/spellCatalog.js';
import { shopBlockReason } from '../public/js/ui/gameLogic/shop.js';
import { buildBattleSpec } from '../server/sim/spec.js';
import { spellBandPool, SPELL_NATIVE_BANDS } from '../shared/spellBands.js';

const card = name => ALL_SPELLS.find(c => c.name === name);
function setup(approved = null) {
  const h = makeMatch({ fake: true, spellShop: true, humans: 2, seed: 31 });
  h.start(); h.toPrep(6);
  const ps = h.ps('p_0'); ps.bandId = 'band_bldsk'; ps.shop.level = 5; ps.funds = 200;
  h.ps('p_1').bandId = 'band_harold';
  // Mechanism tests can supply a fixture approval policy; production uses only the user-confirmed native list.
  if (approved) ps.spellStrategyPool = () => spellBandPool(ps.gd, { round: h.m.round, level: ps.shop.level,
    current: ps.bandId, taken: h.m.order.filter(p => p !== ps && p.alive).map(p => p.bandId) }, { approvedNative: approved });
  return { h, ps };
}
function cast(ps, name, target = null) {
  const item = ps.acquireItem(card(name).id, { silent: true });
  assert.ok(item);
  assert.equal(ps.castSpell(item.uid, target?.uid || null).ok, true);
}
function offer(ps, id) {
  ps.offers.unshift({ source: 'spell', spellStrategy: true, label: '身份揭晓', slots: [{ kind: 'band', id, price: 0 }] });
}
function items(ps, id) { return [...ps.hand, ...ps.temp].filter(p => p?.kind === 'item' && p.id === id); }

test('native strategy discovery follows all 40 maintainer spreadsheet decisions and discovers three valid choices', () => {
  const { h, ps } = setup();
  const excluded = ['歌利亚', '老鲤', '潘格尼尼', '昆图斯', '余', 'Pith', 'Touch'];
  assert.equal(SPELL_NATIVE_BANDS.length, 33);
  assert.deepEqual(ps.gd.bandIds().filter(id => !SPELL_NATIVE_BANDS.includes(id)).map(id => ps.gd.band(id).name).sort(), excluded.sort());
  const early = spellBandPool(ps.gd, { round: 1, level: 1 });
  assert.deepEqual([...early].sort(), [...SPELL_NATIVE_BANDS].sort());
  const pool = ps.spellStrategyPool();
  assert.equal(pool.length, 31);
  for (const id of ['band_pith', 'band_bldsk', 'band_harold', 'band_amedic', 'band_sarkazb', 'band_lmlee', 'band_quintus', 'band_yu', 'band_paganini']) assert.ok(!pool.includes(id), id);
  for (let i = 0; i < 20; i++) {
    cast(ps, '身份揭晓');
    const o = ps.offers.shift();
    assert.equal(o.slots.length, 3);
    assert.equal(new Set(o.slots.map(s => s.id)).size, 3);
    assert.ok(o.slots.every(s => s.kind === 'band' && pool.includes(s.id)));
  }
  ps.shop.level = 6;
  assert.ok(!ps.spellStrategyPool().includes('band_pepe'));
  assert.ok(!ps.spellStrategyPool().includes('band_cathy'));
  h.m.round = 14;
  for (const id of ['band_justin', 'band_jesica', 'band_fang', 'band_yu', 'band_quintus']) {
    // Justin still has an immediately usable round-one gift; other missed dated-only rewards are excluded.
    if (id !== 'band_justin') assert.ok(!ps.spellStrategyPool().includes(id), id);
  }
  h.m.dispose();
});

test('discovery shortens to one strategy or refuses without consuming when no approved strategy remains', () => {
  const { h, ps } = setup(['band_dusk', 'band_mlyss']);
  ps.bandId = 'band_dusk'; cast(ps, '身份揭晓');
  assert.deepEqual(ps.offers[0].slots.map(s => s.id), ['band_mlyss']);
  ps.offers.shift(); h.ps('p_1').bandId = 'band_mlyss';
  const item = ps.acquireItem(card('身份揭晓').id, { silent: true });
  assert.ok(ps.castSpell(item.uid).error);
  assert.ok(ps.find(item.uid)); assert.equal(ps.offers.length, 0);
  h.m.dispose();
});

test('replacement preserves earned state, removes old counters/hooks and starts new spending progress', () => {
  const { h, ps } = setup(['band_kirara']);
  ps.bandId = 'band_sciurus'; ps.lp = 7; ps.pendingFunds = 4; ps.layers.kjeragShip = 23;
  ps.counters = { 'band:sciurus:r': 3, 'band:pepe:special': 2, 'band:kirara:acc': 19, 'item:earned': 6 };
  const slot = { kind: 'chess', id: 'chess_char_3_20_a', basePrice: 3 };
  assert.equal(ps.priceOf(slot), 1);
  offer(ps, 'band_kirara'); assert.equal(ps.pickReward(0).ok, true);
  assert.equal(ps.bandId, 'band_kirara'); assert.equal(ps.lp, 7);
  assert.equal(ps.pendingFunds, 4); assert.equal(ps.layers.kjeragShip, 23);
  assert.deepEqual(ps.counters, { 'item:earned': 6 });
  assert.equal(ps.priceOf(slot), 3, 'old price effect is gone');
  const before = ps.allChess().length;
  h.m.dispatch(ps, 'onSpend', { amount: 1, reason: 'buy' });
  assert.equal(ps.allChess().length, before, 'old progress cannot trigger the new strategy');
  h.m.dispatch(ps, 'onSpend', { amount: 19, reason: 'buy' });
  assert.equal(ps.allChess().length, before + 1);
  assert.equal(ps.battleInput().bandId, 'band_kirara');
  assert.equal(h.m.publicView().players.find(p => p.playerId === ps.playerId).bandId, 'band_kirara');
  h.m.dispose();
});

test('starting gifts are granted once immediately, even with full hand, and not replayed next round', () => {
  for (const [band, id] of [['band_dusk', 'chess_item_6_02_m'], ['band_mlyss', 'chess_item_5_06_e_b'], ['band_malkie', 'chess_item_5_07_e_a'], ['band_justin', 'chess_item_3_12_e_a']]) {
    const { h, ps } = setup();
    while (ps.hand.some(p => !p)) assert.ok(ps.acquireItem(card('尖利箭矢').id, { silent: true }));
    offer(ps, band);
    const slot = ps.privateView().shop.rewardOffer.slots[0];
    assert.equal(slot.kind, 'band');
    assert.equal(shopBlockReason('reward', { priv: ps.privateView(), editable: true, slot }), null);
    const before = items(ps, id).length;
    assert.equal(ps.pickReward(0).ok, true);
    assert.equal(items(ps, id).length, before + 1);
    assert.ok(ps.temp.some(p => p?.id === id));
    assert.ok(ps.pickReward(0).error);
    h.m.round = 7; ps.startRound(7);
    assert.equal(items(ps, id).length, before + 1);
    h.m.dispose();
  }
});

test('team duplicate or ready-state rejection retains the strategy offer and changes nothing', () => {
  const { h, ps } = setup(['band_amiya']);
  offer(ps, 'band_amiya'); h.ps('p_1').bandId = 'band_amiya';
  assert.equal(ps.privateView().shop.rewardOffer.slots[0].unavailable, true);
  assert.ok(ps.pickReward(0).error); assert.equal(ps.bandId, 'band_bldsk'); assert.equal(ps.offers.length, 1);
  h.ps('p_1').bandId = 'band_harold'; ps.ready = true;
  assert.ok(ps.pickReward(0).error); assert.equal(ps.offers.length, 1);
  ps.ready = false; assert.equal(ps.pickReward(0).ok, true);
  const spec = buildBattleSpec(h.m._normalOpts(ps));
  assert.equal(spec.players[0].bandId, 'band_amiya');
  h.m.dispose();
});

test('new values apply to actual purchases, seafood repeats and Perfect Form can lower layers to 30', () => {
  const { h, ps } = setup();
  const id = ps.spellChessPool(3)[0], target = ps.acquireChess(id, { silent: true });
  const bonds = ps.gd.chess(id).bonds;
  ps.shop.slots = [{ kind: 'chess', id, basePrice: 3, sold: false }];
  cast(ps, '富足之杖'); assert.equal(ps.privateView().shop.slots[0].purchaseBonus, 1);
  const before = bonds.map(b => ps.layers[b] || 0);
  assert.equal(ps.buy(0).ok, true);
  for (const [i, b] of bonds.entries()) assert.equal(ps.layers[b], before[i] + 1);
  const n = 1 + ps.gd.bondIds.filter(b => ps.bonds[b]?.active).length;
  const old = bonds.map(b => ps.layers[b]); cast(ps, '海鲜乱炖', target);
  for (const [i, b] of bonds.entries()) assert.equal(ps.layers[b], old[i] + n);
  for (const b of bonds) ps.layers[b] = 70;
  cast(ps, '完美形象', target);
  for (const b of bonds) assert.equal(ps.layers[b], 30);
  h.m.dispose();
});
