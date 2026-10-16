import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch, DATA, give, giveItem } from './match/harness.js';
import { spellTarget, spellShopEnabled } from '../shared/spells.js';
import { placementContext, dropIntent, equipReplaces } from '../public/js/ui/gameLogic/placement.js';
import { validateC2S } from '../shared/protocol.js';

function setup(enabled = true) {
  const h = makeMatch({ fake: true, seed: 17, spellShop: enabled });
  h.start(); h.toPrep(1);
  const ps = h.ps('p_0');
  ps.funds = 100;
  return { h, ps };
}

test('explicit migration list excludes Doctor Projection', () => {
  assert.equal(spellShopEnabled(false), false);
  assert.equal(Object.values(DATA.items).filter(x => !x.isGolden && spellTarget(x)).length, 11);
  for (const x of Object.values(DATA.items).filter(x => x.name === '博士投影')) assert.equal(spellTarget(x), null);
});

test('spell and equipment slots stay separate across rolls, freezing, purchase and upgrades', () => {
  const { h, ps } = setup();
  for (let level = 1; level <= 6; level++) {
    ps.shop.level = level;
    for (let n = 0; n < 15; n++) {
      ps.rollShop();
      const { chess, item, spell } = ps.shop.layout;
      assert.equal(spell, 1);
      assert.equal(ps.shop.slots.length, chess + item + 1);
      assert.ok(ps.shop.slots.slice(chess, chess + item).every(s => !s || !spellTarget(h.m.gd.item(s.id))));
      const s = ps.shop.slots.at(-1);
      assert.ok(s && spellTarget(h.m.gd.item(s.id)));
      assert.ok(h.m.gd.item(s.id).tier <= level);
    }
  }
  const s = { ...ps.shop.slots.at(-1), frozen: true };
  ps.shop.slots[ps.shop.slots.length - 1] = s;
  ps.rollShop({ keepFrozen: true });
  assert.equal(ps.shop.slots.at(-1).id, s.id);
  const index = ps.shop.slots.length - 1;
  const before = ps.funds;
  const price = ps.priceOf(ps.shop.slots[index]);
  assert.equal(ps.buy(index).ok, true);
  assert.equal(ps.funds, before - price);
  assert.equal(ps.shop.slots[index].sold, true);
  assert.notEqual(ps.buy(index).ok, true);
  ps.shop.level = 1; ps.rollShop();
  const old = ps.shop.slots.at(-1);
  ps.shop.level = 2; ps._openLevelSlots();
  assert.equal(ps.shop.slots.at(-1), old);
  assert.equal(ps.privateView().shop.layout.spell, 1);
  h.invariants();
});

test('global spells cast with no operators, consume once, and bypass original Arts quota', () => {
  const { h, ps } = setup();
  for (let n = 0; n < 3; n++) {
    const it = giveItem(h.m, ps, 'chess_item_1_03_e_a');
    const before = ps.funds;
    assert.equal(ps.castSpell(it.uid).ok, true);
    assert.equal(ps.funds, before + 1);
    assert.equal(ps.find(it.uid), null);
    assert.notEqual(ps.castSpell(it.uid).ok, true);
  }
  assert.deepEqual(h.logs.error, []);
});

test('targeted spell does not replace equipment; missing target and ready phase refuse atomically', () => {
  const { h, ps } = setup();
  const id = Object.values(DATA.chess).find(x => !x.isGolden && x.tier === 1 && x.bonds?.length)?.chessId;
  const unit = give(h.m, ps, id);
  const gear = Object.values(DATA.items).filter(x => !x.isGolden && x.itemType === 'EQUIP' && x.kind === 'passive').slice(0, 2);
  for (const rec of gear) {
    const it = giveItem(h.m, ps, rec.id);
    assert.equal(ps.equip(it.uid, unit.uid).ok, true);
  }
  const equipped = unit.items.map(x => x.uid);
  const it = giveItem(h.m, ps, 'chess_item_1_04_e_a');
  assert.notEqual(ps.castSpell(it.uid).ok, true);
  assert.ok(ps.find(it.uid));
  ps.ready = true;
  assert.notEqual(ps.castSpell(it.uid, unit.uid).ok, true);
  ps.ready = false;
  const ctx = placementContext({ priv: ps.privateView(), editable: true, getItem: id => DATA.items[id], getChess: id => DATA.chess[id] });
  assert.equal(equipReplaces(ctx, it.uid, unit), false);
  const idx = ps.hand.findIndex(x => x?.uid === unit.uid);
  assert.equal(dropIntent(ctx, it.uid, { area: 'hand', idx }).t, 'g.castSpell');
  assert.equal(ps.castSpell(it.uid, unit.uid).ok, true);
  assert.deepEqual(unit.items.map(x => x.uid), equipped);
  assert.equal(ps.find(it.uid), null);
  assert.deepEqual(h.logs.error, []);
});

test('default rooms keep original slot count and refuse the mod cast intent', () => {
  const { h, ps } = setup(false);
  const { chess, item } = h.m.gd.shopSlots(ps.shop.level);
  assert.equal(ps.shop.slots.length, chess + item);
  assert.equal(ps.privateView().shop.spellShop, undefined);
  const it = giveItem(h.m, ps, 'chess_item_1_03_e_a');
  assert.notEqual(ps.castSpell(it.uid).ok, true);
  assert.ok(ps.find(it.uid));
});


test('two identical spells remain separately castable while ordinary equipment still merges', () => {
  const { h, ps } = setup();
  const id = 'chess_item_1_03_e_a';
  const first = ps.acquireItem(id);
  const second = ps.acquireItem(id);
  assert.ok(first && second && first.uid !== second.uid);
  ps.checkItemMerges();
  assert.equal(ps.find(first.uid).piece.id, id);
  assert.equal(ps.find(second.uid).piece.id, id);
  h.invariants();
  const before = ps.funds;
  assert.equal(ps.castSpell(first.uid).ok, true);
  assert.equal(ps.castSpell(second.uid).ok, true);
  assert.equal(ps.funds, before + 2);
  const gear = Object.values(DATA.items).find(x => !x.isGolden && x.mergeable && !spellTarget(x));
  ps.acquireItem(gear.id); ps.acquireItem(gear.id);
  assert.ok([...ps.hand, ...ps.temp].some(x => x?.id === gear.goldenId));
});

test('Swire acquisition grants two separate coin spells through the real garrison effect', () => {
  const { h, ps } = setup();
  ps.bandId = null;
  const coins = () => [...ps.hand, ...ps.temp].filter(p => p?.id === 'chess_item_1_03_e_a');
  assert.equal(coins().length, 0);
  // No giveItem/acquireItem fixture: acquiring Swire must run SERVER_GAIN_EQUIP itself.
  const first = ps.acquireChess('chess_char_3_03_a');
  assert.ok(first);
  assert.equal(coins().length, 1);
  const second = ps.acquireChess('chess_char_3_03_a');
  assert.ok(second);
  assert.equal(coins().length, 2);
  ps.checkItemMerges();
  const granted = coins();
  assert.equal(granted.length, 2);
  assert.notEqual(granted[0].uid, granted[1].uid);
  assert.ok(![...ps.hand, ...ps.temp].some(p => p?.id === 'chess_item_1_03_e_b'));
  const gear = Object.values(DATA.items).filter(x => !x.isGolden && x.itemType === 'EQUIP' && x.kind === 'passive').slice(0, 2);
  for (const rec of gear) {
    const item = giveItem(h.m, ps, rec.id);
    assert.equal(ps.equip(item.uid, first.uid).ok, true);
  }
  const equipped = first.items.map(p => p.uid);
  {
    for (const item of granted) {
      const view = [...ps.privateView().hand, ...ps.privateView().temp].find(p => p?.uid === item.uid);
      assert.ok(view, 'operator-granted coin reaches the client');
      assert.equal(spellTarget(DATA.items[view.id]), 'global', 'same classification as a shop purchase');
      const message = { t: 'g.castSpell', itemUid: item.uid };
      assert.equal(validateC2S(message), null);
      const funds = ps.funds;
      assert.equal(h.m._handle(ps, message).ok, true);
      assert.equal(ps.funds, funds + 1);
      assert.equal(ps.find(item.uid), null);
      assert.notEqual(h.m._handle(ps, message).ok, true, 'cannot cast the consumed coin again');
      assert.deepEqual(first.items.map(p => p.uid), equipped);
    }
  }
  h.invariants();
  assert.deepEqual(h.logs.error, []);
});

test('all eleven migrated families, including golden grants, cast through the protocol', async t => {
  for (const rec of Object.values(DATA.items).filter(spellTarget)) {
    await t.test(rec.id, () => {
      const { h, ps } = setup();
      ps.bandId = null;
      const operator = give(h.m, ps, 'chess_char_3_03_a');
      const item = giveItem(h.m, ps, rec.id);
      const msg = { t: 'g.castSpell', itemUid: item.uid, ...(spellTarget(rec) === 'chess' ? { targetUid: operator.uid } : {}) };
      assert.equal(validateC2S(msg), null);
      assert.equal(h.m._handle(ps, msg).ok, true);
      assert.equal(ps.find(item.uid), null);
      assert.deepEqual(h.logs.error, []);
      h.invariants();
    });
  }
});


test('casting a migrated spell repays upstream displayed-item stock debt once', () => {
  const { h, ps } = setup();
  try {
    const id = 'chess_item_1_03_e_a';
    const item = ps.acquireItem(id);
    assert.ok(item);
    h.m.itemPool.owe(id, 1);
    assert.equal(h.m.itemPool.debtOf(id), 1);
    assert.equal(ps.castSpell(item.uid).ok, true);
    assert.equal(h.m.itemPool.debtOf(id), 0);
    assert.notEqual(ps.castSpell(item.uid).ok, true);
    assert.equal(h.m.itemPool.debtOf(id), 0);
  } finally { h.m.dispose(); }
});
