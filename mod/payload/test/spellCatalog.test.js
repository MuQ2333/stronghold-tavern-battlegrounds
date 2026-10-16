import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch, give } from './match/harness.js';
import { SHOP_SPELLS, ALL_SPELLS, customSpell } from '../shared/spellCatalog.js';
import { buildBattleSpec, createBattleFromSpec } from '../server/sim/spec.js';
import { validateC2S } from '../shared/protocol.js';
import { placementContext, dropIntent, canPlace } from '../public/js/ui/gameLogic/placement.js';
import { shopBlockReason } from '../public/js/ui/gameLogic/shop.js';

function setup(options = {}) {
  const h = makeMatch({ fake: true, spellShop: true, seed: 17, humans: 2, ...options });
  h.start(); h.toPrep(1);
  const ps = h.ps('p_0'); ps.funds = 200; ps.shop.level = 6; ps.rollShop();
  return { h, ps };
}
const card = name => ALL_SPELLS.find(c => c.name === name);
test('battle-start spells each allow one successful cast per round and retain blocked copies', () => {
  const { h, ps } = setup();
  const tiles = [...ps.deployMap()].filter(([, type]) => type === 'melee').map(([k]) => k.split(',').map(Number));
  const tile = ([row, col]) => ({ row, col });
  for (const name of ['支援', '诺兹多姆的子嗣', '分享关爱']) {
    const rec = card(name);
    const first = ps.acquireItem(rec.id, { silent: true });
    const second = ps.acquireItem(rec.id, { silent: true });
    if (name === '支援') {
      assert.ok(ps.castSpell(first.uid, null, { row: -1, col: -1 }).error);
      assert.ok(ps.find(first.uid), 'failed cast retains card');
      assert.ok(!ps.privateView().shop.spellUsed.includes(rec.id), 'failed cast does not spend round allowance');
    }
    assert.equal(ps.castSpell(first.uid, null, name === '支援' ? tile(tiles[0]) : null).ok, true);
    const before = JSON.stringify(ps.spellState);
    assert.ok(ps.castSpell(second.uid, null, name === '支援' ? tile(tiles[1]) : null).error);
    assert.ok(ps.find(second.uid));
    assert.equal(JSON.stringify(ps.spellState), before);
    assert.ok(ps.privateView().shop.spellUsed.includes(rec.id));
    if (name === '支援') {
      const ctx = placementContext({ priv: ps.privateView(), stage: h.m.stage, editable: true, getItem: id => ps.gd.item(id), getChess: id => ps.gd.chess(id) });
      assert.equal(canPlace(ctx, second.uid, { area: 'board', ...tile(tiles[1]) }).ok, false);
    }
  }
  h.m.round = 2; ps.startRound(2);
  assert.deepEqual(ps.privateView().shop.spellUsed, []);
  for (const name of ['支援', '诺兹多姆的子嗣', '分享关爱']) {
    const second = [...ps.hand, ...ps.temp].find(p => p?.id === card(name).id);
    assert.ok(second);
    assert.equal(ps.castSpell(second.uid, null, name === '支援' ? tile(tiles[1]) : null).ok, true);
  }
  h.m.dispose();
});
test('headhunting audits every current shop operator by acquisition event, not effect name', () => {
  const { h, ps } = setup();
  const acquireNames = ps.gd.visibleChess.filter(id => ps.gd.chess(id).garrisonIds.some(gid => ps.gd.garrison(gid)?.eventType === 'SERVER_GAIN')).map(id => ps.gd.chess(id).name);
  assert.ok(acquireNames.includes('耶拉'));
  assert.ok(acquireNames.includes('卡涅利安'));
  assert.ok(!acquireNames.includes('德克萨斯'));
  assert.ok(!acquireNames.includes('凯瑟琳'));
  // Capture the production predicate and evaluate every visible normal identity at each shop level.
  ps.spellChessPool = (tier, predicate) => {
    assert.equal(tier, null);
    const candidates = ps.gd.visibleChess.filter(id => ps.gd.chess(id).tier <= ps.shop.level);
    const actual = candidates.filter(id => predicate(ps.gd.chess(id)));
    const expected = candidates.filter(id => acquireNames.includes(ps.gd.chess(id).name));
    assert.deepEqual(actual, expected);
    return actual;
  };
  for (let level = 1; level <= 6; level++) {
    ps.shop.level = level;
    for (let i = 0; i < 20; i++) {
      cast(ps, '猎头招聘');
      const offer = ps.offers.shift();
      assert.ok(offer.slots.length > 0 && offer.slots.length <= 3);
      for (const slot of offer.slots) {
        const c = ps.gd.chess(slot.id);
        assert.ok(c.tier <= level);
        assert.ok(c.garrisonIds.some(id => ps.gd.garrison(id)?.eventType === 'SERVER_GAIN'), c.name);
        assert.ok(!['德克萨斯', '凯瑟琳'].includes(c.name));
      }
    }
  }
  h.m.dispose();
});
test('buying a Touch of Gold operator grants exactly one native promotion offer', () => {
  const { h, ps } = setup(); ps.shop.level = 3;
  const id = ps.spellChessPool(3)[0];
  ps.shop.slots = [{ kind: 'chess', id, basePrice: 3, sold: false }];
  cast(ps, '点金之触');
  assert.equal(ps.shop.slots[0].id, ps.gd.goldenIdOf(id));
  assert.equal(ps.privateView().shop.slots[0].spellGoldenReward, true);
  assert.equal(ps.offers.length, 0, 'casting alone gives no reward');
  ps.funds = 0; assert.ok(ps.buy(0).error);
  assert.equal(ps.offers.length, 0, 'failed buy gives no reward');
  ps.funds = 20; assert.equal(ps.buy(0).ok, true);
  assert.equal(ps.offers.length, 1);
  assert.equal(ps.offers[0].source, 'merge');
  assert.equal(ps.offers[0].tier, 4);
  assert.equal(ps.offers[0].slots.length, 3);
  assert.ok(ps.buy(0).error); assert.equal(ps.offers.length, 1);
  h.m.dispose();
});

test('devouring a Touch of Gold operator does not grant a purchase promotion reward', () => {
  const { h, ps } = setup(); const target = operator(h, ps);
  ps.shop.slots = [{ kind: 'chess', id: target.id, basePrice: 3, sold: false }];
  cast(ps, '点金之触'); cast(ps, '腐化糕点', target);
  assert.equal(ps.offers.length, 0);
  h.m.dispose();
});
test('temperature shift grants current shop identities and completes their normal triples', () => {
  for (const charId of ['char_4013_kjera', 'char_426_billro']) {
    const { h, ps } = setup();
    const id = ps.gd.visibleChess.find(id => ps.gd.chess(id).charId === charId);
    assert.ok(id);
    if (charId === 'char_4013_kjera') assert.equal(ps.gd.chess(id).tier, 3);
    ps.shop.slots = [0, 1].map(() => ({ kind: 'chess', id, basePrice: 3, sold: false }));
    assert.equal(ps.buy(0).ok, true); assert.equal(ps.buy(1).ok, true);
    cast(ps, '寒热骤变');
    assert.equal(ps.allChess().filter(p => p.id === ps.gd.goldenIdOf(id)).length, 1);
    assert.equal(ps.allChess().filter(p => p.id === id).length, 0);
    assert.ok(ps.allChess().every(p => !p.id.startsWith('chess_char_4_03_')));
    assert.ok(ps.allChess().some(p => ps.gd.chess(p.id).charId === 'char_4013_kjera'));
    assert.ok(ps.allChess().some(p => ps.gd.chess(p.id).charId === 'char_426_billro'));
    h.m.dispose();
  }
});
test('ring and both time choices grow inactive bonds; teapot still requires activation', () => {
  const { h, ps } = setup();
  const target = deploy(h, ps);
  const id = ps.gd.chess(target.id).bonds.find(b => !ps.bonds[b]?.active);
  assert.ok(id, 'fixture has an inactive associated bond');
  const before = ps.layers[id] || 0;
  cast(ps, '闪亮的戒指');
  assert.equal(ps.layers[id], before + 1);
  cast(ps, '乱放的茶具');
  assert.equal(ps.layers[id], before + 1);
  cast(ps, '时间管理'); assert.equal(ps.pickReward(0).ok, true);
  assert.equal(ps.layers[id], before + 3);
  cast(ps, '时间管理'); assert.equal(ps.pickReward(1).ok, true);
  h.m.round = 2; ps.spellRoundStart(2);
  assert.equal(ps.layers[id], before + 7);
  assert.equal(ps.bonds[id]?.active, false);
  h.m.dispose();
});
function cast(ps, name, target = null, tile = null) {
  const it = ps.acquireItem(card(name).id, { silent: true });
  assert.ok(it, name + ' granted');
  const result = ps.castSpell(it.uid, target?.uid ?? null, tile);
  assert.deepEqual(result, { ok: true }, name + ': ' + JSON.stringify(result));
  assert.equal(ps.find(it.uid), null, name + ' consumed once');
  return it;
}
function operator(h, ps) {
  return give(h.m, ps, ps.spellChessPool(3).find(id => ps.gd.chess(id).position === 'MELEE') || ps.spellChessPool(3)[0]);
}
function deploy(h, ps) {
  const p = operator(h, ps);
  const tile = [...ps.deployMap()].filter(([,type]) => type === 'melee').map(([k]) => k.split(',').map(Number)).find(([r,c]) => !ps.board.has(`${r},${c}`));
  ps._detach(ps.find(p.uid)); ps.board.set(tile.join(','), p); ps.recompute();
  return p;
}

test('every implemented catalog spell can be cast and each choose-one exposes exactly two actionable options', async t => {
  assert.equal(ALL_SPELLS.length, 46);
  for (const c of ALL_SPELLS) await t.test(c.name, () => {
    const { h, ps } = setup();
    const target = c.name === '沉睡者之拥' ? give(h.m, ps, ps.spellChessPool(null, r => r.garrisonIds.some(id => ps.gd.garrison(id)?.eventType === 'SERVER_GAIN'))[0]) : deploy(h, ps);
    const mate = h.ps('p_1'); const mateOp = deploy(h, mate);
    const bond = ps.gd.chess(mateOp.id).bonds[0]; mate.bondCountBonus[bond] = 20; mate.layers[bond] = 25; mate.recompute();
    ps.bondCountBonus[ps.gd.chess(target.id).bonds[0]] = 20; ps.recompute();
    const tile = [...ps.deployMap()].filter(([,type]) => type === 'melee').map(([k]) => k.split(',').map(Number)).find(([r,c]) => !ps.board.has(`${r},${c}`));
    cast(ps, c.name, c.spellTarget === 'chess' ? target : null, c.spellTarget === 'tile' ? { row: tile[0], col: tile[1] } : null);
    if (c.choices) {
      assert.equal(ps.offers[0].slots.length, 2);
      assert.ok(ps.privateView().shop.rewardOffer.slots.every(s => s.spellChoice && customSpell(s.id)));
      assert.deepEqual(ps.pickReward(0), { ok: true });
    }
    assert.deepEqual(h.logs.error, []);
    h.invariants(); h.m.dispose();
  });
});

test('the five temporarily removed spells never enter shop or discover pools; effects remain available to held cards', () => {
  const { h, ps } = setup();
  const removed = ['防御者的仪式', '森林秘宝', '暴风城之力', '时间管理', '鲜血宝石弹幕'].map(name => card(name).id);
  assert.equal(SHOP_SPELLS.length, 41);
  for (let tier = 1; tier <= 6; tier++) {
    assert.ok(ps.spellPool(tier).every(id => !removed.includes(id)));
    assert.ok(ps.spellPool(tier, true).every(id => !removed.includes(id)));
  }
  for (let i = 0; i < 50; i++) { ps.rollShop(); assert.ok(ps.shop.slots.every(s => !s || !removed.includes(s.id))); }
  h.m.dispose();
});

test('purchase rewards stack visibly, trigger once on buy and devour, and never run on acquire/replay', () => {
  const { h, ps } = setup(); const op = operator(h, ps), id = op.id, bonds = ps.gd.chess(id).bonds;
  ps.shop.slots = [0,1,2].map(() => ({ kind: 'chess', id, basePrice: 2, sold: false }));
  ps.shop.layout = { chess: 3, item: 0, spell: 0 };
  cast(ps, '富足之杖'); cast(ps, '鲜血宝石弹幕'); cast(ps, '意外之果'); cast(ps, '乘借东风');
  assert.deepEqual(ps.privateView().shop.slots.map(s => s.purchaseBonus), [4,4,7]);
  const before = Object.fromEntries(bonds.map(b => [b, ps.layers[b] || 0]));
  ps.acquireChess(id, { silent: true });
  assert.deepEqual(Object.fromEntries(bonds.map(b => [b, ps.layers[b] || 0])), before);
  assert.equal(ps.buy(2).ok, true);
  for (const b of bonds) assert.equal(ps.layers[b] - before[b], 7);
  assert.equal(ps.buy(2).error, 'SOLD_OUT');
  // Devour uses the purchased identities and a snapshot of the rightmost reward.
  const after = Object.fromEntries(bonds.map(b => [b, ps.layers[b]]));
  const target = ps.allChess()[0];
  cast(ps, '腐化糕点', target);
  for (const b of bonds) assert.equal(ps.layers[b] - after[b], 11 + 3); // 4+7 rewards, floor((3+3)/2)
  assert.ok(ps.shop.slots.every(s => s.sold));
  assert.deepEqual(h.logs.error, []); h.m.dispose();
});

test('health purchase is atomic, costs three life without funds, and UI agrees', () => {
  const { h, ps } = setup(); const rec = card('拼命发掘');
  ps.shop.slots = [{ kind: 'item', id: rec.id, basePrice: 3 }]; ps.funds = 0; ps.lp = 3;
  assert.ok(ps.buy(0).error); assert.equal(ps.lp, 3); assert.ok(!ps.shop.slots[0].sold);
  assert.ok(shopBlockReason('buy', { priv: ps.privateView(), editable: true, slot: ps.privateView().shop.slots[0] }));
  ps.lp = 4; assert.equal(ps.buy(0).ok, true); assert.equal(ps.lp, 1); assert.equal(ps.funds, 0);
  const it = ps.allChess(); assert.ok(Array.isArray(it));
  const held = [...ps.hand, ...ps.temp].find(p => p?.id === rec.id);
  assert.equal(ps.castSpell(held.uid).ok, true); assert.equal(ps.funds, 1); h.m.dispose();
});

test('life purchases absorb armor first and reject lethal payment atomically in server and UI',()=>{
  for(const [lp,armor,allowed,nextLp,nextArmor]of [[1,3,true,1,0],[2,2,true,1,0],[3,1,true,1,0],[2,1,false,2,1],[1,2,false,1,2]]){
    const {h,ps}=setup(),rec=card('拼命发掘');ps.lp=lp;ps.spellData().armor=armor;ps.funds=0;
    ps.shop.slots=[{kind:'item',id:rec.id,basePrice:3}];
    const view=ps.privateView();assert.equal(shopBlockReason('buy',{priv:view,editable:true,slot:view.shop.slots[0]})===null,allowed);
    assert.equal(ps.buy(0).ok===true,allowed);assert.equal(ps.lp,nextLp);assert.equal(ps.spellData().armor,nextArmor);assert.equal(ps.funds,0);
    assert.equal(!!ps.shop.slots[0].sold,allowed);h.m.dispose();
  }
});

test('discover lock allows bench rearrangement but not deployment, sale or early merge', () => {
  const { h, ps } = setup(); ps.shop.level = 3;
  cast(ps, '搜寻时光'); const id = ps.offers[0].slots[0].id;
  assert.equal(ps.pickReward(0).ok, true);
  const held = ps.allChess().find(p => p.id === id && p.meta.spellLockUntil);
  assert.ok(held); assert.ok(ps.sell(held.uid).error);
  const empty = ps.hand.findIndex(p => !p);
  const context = () => placementContext({ priv: ps.privateView(), stage: h.m.stage, editable: true, getItem: id => ps.gd.item(id), getChess: id => ps.gd.chess(id) });
  assert.equal(canPlace(context(), held.uid, { area: 'hand', idx: empty }).ok, true);
  assert.equal(ps.move(held.uid, { area: 'hand', idx: empty }).ok, true);
  assert.equal(ps.find(held.uid).idx, empty);
  ps.acquireChess(id, { silent: true }); ps.acquireChess(id, { silent: true });
  assert.ok(ps.find(held.uid)); assert.equal(ps.countCopies(id), 2);
  const unlocked = ps.allChess().find(p => p.uid !== held.uid);
  const oldIdx = ps.find(unlocked.uid).idx;
  assert.equal(canPlace(context(), unlocked.uid, { area: 'hand', idx: ps.find(held.uid).idx }).ok, true);
  assert.equal(ps.move(unlocked.uid, { area: 'hand', idx: ps.find(held.uid).idx }).ok, true);
  assert.equal(ps.find(held.uid).idx, oldIdx);
  assert.equal(ps.privateView().hand[oldIdx].spellLocked, true);
  const field = deploy(h, ps), fieldLoc = ps.find(field.uid);
  const [row, col] = fieldLoc.key.split(',').map(Number);
  assert.equal(canPlace(context(), held.uid, { area: 'board', row, col }).ok, false);
  assert.ok(ps.move(held.uid, { area: 'board', row, col }).error);
  assert.equal(canPlace(context(), field.uid, { area: 'hand', idx: oldIdx }).ok, false);
  assert.ok(ps.move(field.uid, { area: 'hand', idx: oldIdx }).error, 'board swaps cannot deploy locked occupants');
  h.invariants();
  h.m.round = 2; ps.startRound(2); assert.equal(ps.countCopies(id), 0);
  assert.ok(ps.allChess().some(p => p.id === ps.gd.goldenIdOf(id))); h.invariants(); h.m.dispose();
});

test('choose one works at full hand and infinite potential only offers operators or spells', () => {
  for (const idx of [0,1]) {
    const { h, ps } = setup(); cast(ps, '无限潜力');
    while (ps.hand.some(p => !p)) ps.acquireItem(card('尖利箭矢').id, { silent: true });
    const slot = ps.privateView().shop.rewardOffer.slots[idx];
    assert.equal(shopBlockReason('reward', { priv: ps.privateView(), editable: true, slot }), null);
    assert.equal(ps.pickReward(idx).ok, true);
    assert.ok(ps.offers[0].slots.every(s => idx === 0 ? s.kind === 'chess' && ps.gd.chess(s.id).tier === 6 : s.kind === 'item' && customSpell(s.id)));
    h.m.dispose();
  }
});

test('recurring coin only rewards due overflow; manual destruction and casting never grant income', () => {
  const { h, ps } = setup(); const rec = card('腐蚀的盟约之币');
  cast(ps, rec.name); assert.equal(ps.spellData().income, 0);
  const manual = ps.acquireItem(rec.id); ps.destroy(manual.uid); assert.equal(ps.spellData().income, 0);
  while (ps.hand.some(p => !p)) ps.acquireItem(card('尖利箭矢').id, { silent: true });
  const overflow = ps.acquireItem(rec.id); assert.equal(ps.find(overflow.uid).area, 'temp');
  assert.equal(ps.privateView().canReady, true); ps.resolveTemp(); assert.equal(ps.spellData().income, 2);
  ps.resolveTemp(); assert.equal(ps.spellData().income, 2);
  const ev = { income: 10 }; ps.spellHook('onIncome', ev); assert.equal(ev.income, 12); h.m.dispose();
});

test('support is a spell marker until combat, uses normal S2 Hoshiguma, and expires next round', () => {
  const { h, ps } = setup();
  const [row, col] = [...ps.deployMap()].find(([,type]) => type === 'melee')[0].split(',').map(Number);
  const held = ps.acquireItem(card('支援').id);
  const priv = ps.privateView();
  const ctx = placementContext({ priv, stage: h.m.stage, editable: true, getItem: id => ps.gd.item(id), getChess: id => ps.gd.chess(id) });
  const intent = dropIntent(ctx, held.uid, { area: 'board', row, col });
  assert.equal(intent.t, 'g.castSpell'); assert.equal(validateC2S({ t: intent.t, ...intent.fields }), null);
  assert.equal(h.m.handle(ps.playerId, { t: intent.t, ...intent.fields }).ok, true);
  assert.equal(ps.spellState.supports.length, 1);
  const support = ps.spellState.supports[0];
  for (const dir of ['UP', 'DOWN', 'RIGHT', 'LEFT']) {
    const msg = { t: 'g.move', uid: support.uid, to: { area: 'board', row, col }, dir };
    assert.equal(validateC2S(msg), null);
    assert.equal(h.m.handle(ps.playerId, msg).ok, true);
    assert.equal(ps.spellSupportViews()[0].dir, dir);
  }
  assert.ok(ps.move(support.uid, { area: 'hand', idx: 0 }, 'RIGHT').error);
  assert.ok(ps.move(support.uid, { area: 'board', row, col: col + 1 }, 'RIGHT').error);
  assert.ok(h.ps('p_1').move(support.uid, { area: 'board', row, col }, 'RIGHT').error);
  const before = JSON.stringify(ps.spellState);
  assert.deepEqual(ps.battleInput(), ps.battleInput()); assert.equal(JSON.stringify(ps.spellState), before);
  ps.spellCommitBattle();
  const spec = buildBattleSpec(h.m._normalOpts(ps));
  assert.equal(ps.spellSupportViews()[0].kind, 'item');
  assert.equal(ps.spellSupportViews()[0].golden, false);
  const u = spec.players[0].units.find(x => x.chessId === 'chess_char_4_17_a');
  assert.ok(u); assert.equal(u.skillIndex, 1); assert.equal(u.potential, 6); assert.equal(u.cultivate, 3);
  assert.equal(u.dir, 'LEFT'); assert.equal(u.moduleId, 'none');
  const battle = createBattleFromSpec(spec, h.m.ds); battle.start();
  const live = battle.allies(ps.playerId).find(x => x.uid === u.uid); assert.ok(live?.alive); assert.ok(live.s.taunt > 0);
  assert.equal(ps.battleInput({ reached: true }).units.length, 0);
  h.m.round = 2; ps.startRound(2); assert.equal(ps.battleInput().units.length, 0); h.m.dispose();
});

test('temporary sharing preserves room below the permanent cap and is absent from earned layer gains', () => {
  const { h, ps } = setup(); const mate = h.ps('p_1');
  ps.layers.yanShip = 990; mate.layers.yanShip = 50; mate.bondCountBonus.yanShip = 20; mate.recompute();
  cast(ps, '分享关爱'); ps.spellCommitBattle();
  const state = JSON.stringify(ps.spellState); const input = ps.battleInput();
  assert.equal(input.bonds.yanShip.layers, 1040); assert.equal(ps.layers.yanShip, 990);
  ps.battleInput(); assert.equal(JSON.stringify(ps.spellState), state);
  const battle = createBattleFromSpec(buildBattleSpec(h.m._normalOpts(ps)), h.m.ds); battle.start();
  assert.equal(battle.addLayers(ps.playerId, 'yanShip', 5, 'test'), 5);
  assert.equal(battle.getPlayer(ps.playerId).bonds.yanShip.layers, 1045);
  assert.equal(battle.addLayers(ps.playerId, 'yanShip', 20, 'test'), 4);
  assert.equal(battle.addLayers(ps.playerId, 'yanShip', 1, 'test'), 0);
  assert.equal(battle._pp(ps.playerId).layerGains.yanShip, 9);
  h.m.dispose();
});

test('bundle passes only the unchosen candidates to teammates next round; solo pool excludes it', () => {
  const { h, ps } = setup(); const mate = h.ps('p_1');
  cast(ps, '折价合集'); const ids = ps.offers[0].slots.map(s => s.id);
  assert.equal(ps.pickReward(0).ok, true);
  assert.deepEqual(mate.spellData().pending.map(x => x.id).sort(), ids.slice(1).sort());
  assert.equal(mate.allChess().length, 0);
  h.m.round = 2; mate.startRound(2);
  assert.deepEqual(mate.allChess().map(x => x.id).sort(), ids.slice(1).sort()); h.m.dispose();
  const solo = setup({ mode: 'solo', humans: 1 });
  assert.ok(!solo.ps.spellPool().includes(card('折价合集').id));
  assert.ok(!solo.ps.spellPool().includes(card('分享关爱').id)); solo.h.m.dispose();
});

test('delayed choices and battle outcome payouts resolve once and survive into the next prep', () => {
  const { h, ps } = setup(); const target = deploy(h, ps), id = ps.gd.chess(target.id).bonds[0];
  ps.bondCountBonus[id] = 20; ps.recompute();
  cast(ps, '时间管理'); ps.pickReward(1);
  cast(ps, '赢家的面包', target); cast(ps, '自负');
  const before = ps.layers[id];
  ps.spellHook('onBattleResult', { perfect: true, lpLoss: 0, unite: null });
  ps.spellHook('onBattleResult', { perfect: true, lpLoss: 0, unite: null });
  assert.equal(ps.pendingFunds, 3);
  h.m.round = 2; ps.startRound(2);
  assert.equal(ps.layers[id], before + 10); // delayed +2 twice, bread +6
  const after = ps.layers[id]; ps.spellRoundStart(2); assert.equal(ps.layers[id], after);
  cast(ps, '自负'); ps.spellHook('onBattleResult', { perfect: false, lpLoss: 0, unite: {} });
  assert.equal(ps.pendingFunds, 1); h.m.dispose();
});

test('special shop refreshes preserve frozen cards and return to the standard layout on manual refresh', () => {
  const { h, ps } = setup(); const count = ps.shop.slots.length;
  cast(ps, '顶尖好酒'); assert.equal(ps.shop.layout.spell, count);
  assert.ok(ps.shop.slots.every(s => s.kind === 'item'));
  ps.freeze(); const before = ps.shop.slots.map(s => s.id); ps.rollShop({ keepFrozen: true });
  assert.deepEqual(ps.shop.slots.map(s => s.id), before);
  ps.rollShop(); assert.equal(ps.shop.layout.spell, 1); assert.equal(ps.shop.layout.item, 1);
  const target = operator(h, ps); cast(ps, '哈缪尔遗失的法杖', target);
  assert.ok(ps.shop.slots.slice(0, ps.shop.layout.chess).every(s => s.kind === 'chess' && ps.gd.chess(s.id).bonds.some(id => ps.gd.chess(target.id).bonds.includes(id))));
  assert.equal(ps.shop.layout.item, 1); assert.equal(ps.shop.layout.spell, 1);
  assert.equal(ps.privateView().shop.spellShop, true);
  ps.rollShop(); assert.equal(ps.shop.layout.spell, 1); h.m.dispose();
});

test('targeted refresh fills current-level capacity after upgrading an already special shop', () => {
  const { h, ps } = setup(); ps.shop.level = 1; ps.rollShop();
  cast(ps, '顶尖好酒');
  const oldCount = ps.shop.slots.length;
  ps.shop.level = 6; ps._openLevelSlots();
  assert.equal(ps.shop.slots.length, oldCount, 'special layout has not expanded yet');
  const cap = ps.gd.shopSlots(6), count = cap.chess + cap.item + 1;
  assert.ok(count > oldCount);
  ps.shop.slots[0] = null; ps.shop.slots[1].sold = true;
  cast(ps, '顶尖好酒');
  assert.equal(ps.shop.slots.length, count);
  assert.ok(ps.shop.slots.every(s => s && !s.sold && s.kind === 'item'));
  ps.shop.slots.length = 2;
  const target = operator(h, ps); cast(ps, '哈缪尔遗失的法杖', target);
  assert.equal(ps.shop.slots.length, count);
  assert.ok(ps.shop.slots.slice(0, cap.chess).every(s => s && !s.sold && s.kind === 'chess'));
  assert.equal(ps.shop.slots[cap.chess].kind, 'item'); assert.equal(ps.shop.slots[cap.chess + 1].kind, 'item');
  h.m.dispose();
});

test('armor is set rather than stacked; normal and boss life losses consume it first', () => {
  const { h, ps } = setup(); cast(ps, '护甲储备'); cast(ps, '护甲储备');
  assert.equal(ps.spellAbsorb(3), 0); assert.equal(ps.spellData().armor, 2);
  assert.equal(ps.spellAbsorb(4), 2); assert.equal(ps.spellData().armor, 0);
  cast(ps, '护甲储备'); h.m.teamLp = 20; h.m._teamLpLoss(3);
  assert.equal(h.m.teamLp, 20); assert.equal(ps.spellData().armor, 2); h.m.dispose();
});
