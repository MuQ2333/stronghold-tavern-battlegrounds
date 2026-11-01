import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch, give } from './match/harness.js';
import { ALL_SPELLS, SHOP_SPELLS } from '../shared/spellCatalog.js';
import { WISDOM_OUTCOMES, helpfulRefresh } from '../server/match/spellWisdom.js';
import { uniteBattleOpts, helperStats } from '../server/match/unite.js';
import { buildBattleSpec, createBattleFromSpec } from '../server/sim/spec.js';

const card = name => ALL_SPELLS.find(c => c.name === name);
function setup(seed = 19) {
  const h = makeMatch({ fake: true, spellShop: true, humans: 2, seed });
  h.start(); h.toPrep(1);
  const ps = h.ps('p_0'); ps.bandId = null; ps.funds = 300; ps.shop.level = 6; ps.rollShop();
  return { h, ps };
}
function cast(ps, name, target = null, tile = null) {
  const held = ps.acquireItem(card(name).id, { silent: true });
  assert.equal(ps.castSpell(held.uid, target?.uid ?? null, tile).ok, true, name);
}
function deploy(h, ps, id = null) {
  const piece = give(h.m, ps, id || ps.spellChessPool(3, c => c.position === 'MELEE')[0]);
  const [key] = [...ps.deployMap()].find(([key, kind]) => kind === 'melee' && !ps.board.has(key));
  ps._detach(ps.find(piece.uid)); ps.board.set(key, piece); ps.recompute();
  return piece;
}

test('new catalog tiers/prices and permanent deletions apply to every source pool', () => {
  const { h, ps } = setup();
  for (const [name, tier, price] of [['智慧球', 6, 3], ['背靠背', 4, 1], ['回响咆哮', 3, 2], ['沉睡者之拥', 5, 3]]) {
    assert.equal(card(name).tier, tier); assert.equal(card(name).price, price);
    assert.ok(SHOP_SPELLS.includes(card(name)));
  }
  assert.ok(!card('财富悬赏令')); assert.ok(!card('黄金狂潮'));
  for (let level = 1; level <= 6; level++) {
    assert.ok(!ps.spellPool(level).some(id => ['hs_bg33_815', 'hs_bg31_872'].includes(id)));
  }
  h.m.dispose();
});

test('Back to Back scales only from earlier successful copies, persists between rounds and respects 999', () => {
  const { h, ps } = setup(); const target = deploy(h, ps);
  const ids = ps.gd.chess(target.id).bonds, before = { ...ps.layers };
  const held = ps.acquireItem(card('背靠背').id);
  assert.ok(ps.castSpell(held.uid, -1).error); assert.ok(ps.find(held.uid));
  assert.equal(ps.spellData().backToBack, undefined);
  assert.equal(ps.castSpell(held.uid, target.uid).ok, true);
  for (const id of ids) assert.equal(ps.layers[id], (before[id] || 0) + 1);
  cast(ps, '回响咆哮', target); // Other spells do not increment the Back to Back counter.
  cast(ps, '背靠背', target);
  for (const id of ids) assert.equal(ps.layers[id], (before[id] || 0) + 3);
  h.m.round = 2; ps.startRound(2); cast(ps, '背靠背', target);
  for (const id of ids) assert.equal(ps.layers[id], (before[id] || 0) + 6);
  ps.layers[ids[0]] = 998; cast(ps, '背靠背', target); assert.equal(ps.layers[ids[0]], 999);
  h.m.dispose();
});

test('Echoing Roar adds a stackable prep-end trait, uses current active membership and survives promotion', () => {
  const { h, ps } = setup(); const target = deploy(h, ps);
  const ids = ps.gd.chess(target.id).bonds;
  ps.bondCountBonus[ids[0]] = 20; ps.recompute();
  cast(ps, '回响咆哮', target); cast(ps, '回响咆哮', target);
  const before = { ...ps.layers };
  assert.equal(ps.privateView().board.find(p => p.uid === target.uid).spellEcho, 4);
  const active = ids.filter(id => ps.bonds[id]?.active);
  h.m.dispatch(ps, 'onPrepEnd', { round: 1 });
  for (const id of ids) assert.equal(ps.layers[id] || 0, (before[id] || 0) + (active.includes(id) ? 4 : 0));
  const extraBefore = ps.layers[ids[0]];
  assert.ok(h.m.dispatcher.triggerGarrisons(ps, target, 'SERVER_PREP_FIN') > 0);
  assert.equal(ps.layers[ids[0]], extraBefore + 4, 'explicit native trait retriggers include the additional trait');
  assert.equal(ps.promote(target), true); assert.equal(target.meta.spellEcho, 4);
  const old = ps.layers[ids[0]];
  ps._detach(ps.find(target.uid)); ps.temp.push(target);
  for (let i = 0; i < ps.hand.length; i++) if (!ps.hand[i]) ps.hand[i] = ps.newPiece('item', 'chess_item_1_03_e_a');
  ps.recompute();
  h.m.dispatch(ps, 'onPrepEnd', { round: 1 }); assert.equal(ps.layers[ids[0]], old, 'overflow traits do not fire');
  h.m.dispose();
});

test('Echoing Roar enchantments combine on a real triple', () => {
  const { h, ps } = setup();
  const first = ps.acquireChess('chess_char_3_03_a', { silent: true });
  cast(ps, '回响咆哮', first);
  ps.acquireChess(first.id, { silent: true });
  const elite = ps.acquireChess(first.id, { silent: true });
  assert.equal(ps.gd.isGolden(elite.id), true); assert.equal(elite.meta.spellEcho, 2);
  h.m.dispose();
});

test('Sleeper Embrace reruns actual acquisition traits and Investor, never sale/prep traits', () => {
  const { h, ps } = setup();
  const target = ps.acquireChess('chess_char_3_03_a', { silent: true });
  const coins = () => [...ps.hand, ...ps.temp].filter(p => p?.id === 'chess_item_1_03_e_a').length;
  assert.equal(coins(), 0); cast(ps, '沉睡者之拥', target); assert.equal(coins(), 1);
  ps.bondCountBonus.investShip = 20; ps.recompute();
  assert.ok(ps.bonds.investShip.active);
  cast(ps, '沉睡者之拥', target); assert.equal(coins(), 3);
  for (const name of ['德克萨斯', '凯瑟琳']) {
    const id = ps.spellChessPool(null, c => c.name === name)[0]; assert.ok(id);
    const invalid = give(h.m, ps, id), held = ps.acquireItem(card('沉睡者之拥').id);
    assert.ok(ps.castSpell(held.uid, invalid.uid).error); assert.ok(ps.find(held.uid));
  }
  h.m.dispose();
});

test('Hamuul refresh fills all operator slots and preserves equipment/spell cards including sold or frozen state', () => {
  const { h, ps } = setup(); const target = deploy(h, ps), cap = ps.gd.shopSlots(6);
  const equipment = ps.shop.slots[cap.chess], spell = ps.shop.slots[cap.chess + cap.item];
  equipment.sold = true; spell.frozen = true;
  ps.shop.slots[0] = null; ps.shop.slots[1].sold = true;
  cast(ps, '哈缪尔遗失的法杖', target);
  assert.equal(ps.shop.slots[cap.chess], equipment); assert.equal(ps.shop.slots[cap.chess + cap.item], spell);
  assert.deepEqual(ps.shop.layout, { chess: cap.chess, item: cap.item, spell: 1 });
  assert.ok(ps.shop.slots.slice(0, cap.chess).every(s => s?.kind === 'chess' && !s.sold));
  h.m.dispose();
});

test('support never joins triples and carries health/SP or knockout through the actual unite builder', () => {
  const { h, ps } = setup();
  const [key] = [...ps.deployMap()].find(([, kind]) => kind === 'melee');
  const [row, col] = key.split(',').map(Number);
  const first = ps.acquireChess('chess_char_4_17_a', { silent: true });
  ps.acquireChess(first.id, { silent: true });
  cast(ps, '支援', null, { row, col });
  const support = ps.spellState.supports[0];
  assert.equal(ps.countCopies(first.id), 2);
  assert.equal(ps.allChess().length, 2); assert.equal(ps.spellSupportViews()[0].kind, 'item');
  assert.equal(ps.spellSupportViews()[0].icon, '/assets/spells/hoshiguma_shield_illustration.png?v=4');
  const elite = ps.acquireChess(first.id, { silent: true }); assert.equal(ps.gd.isGolden(elite.id), true);
  for (const alive of [true, false]) {
    h.m.lastResults.set(ps.playerId, { unitsEnd: [{ uid: support.uid, alive, hpPct: 0.4, sp: 7 }] });
    const opts = uniteBattleOpts(h.m, { helpers: [ps], leaked: [] }, 20);
    const u = opts.players[0].units.find(u => u.uid === support.uid);
    assert.ok(u); assert.equal(u.chessId, 'chess_char_4_17_a'); assert.equal(u.skillIndex, 1);
    assert.deepEqual(u.carryState, alive ? { hpPct: 0.4, sp: 7 } : { down: true });
    assert.equal(helperStats(h.m, ps, h.m.lastResults).standing, alive ? 1 : 0);
  }
  assert.equal(ps.spellState.supports.length, 1);
  h.m.round = 2; ps.startRound(2); assert.equal(ps.spellSupportViews().length, 0);
  h.m.dispose();
});

test('Wisdomball consumes only two successful manual refreshes, stacks charges, and survives round starts', () => {
  const { h, ps } = setup(); deploy(h, ps);
  cast(ps, '智慧球'); cast(ps, '智慧球'); assert.equal(ps.spellData().wisdom, 4);
  ps.funds = 0; assert.ok(ps.refresh().error); assert.equal(ps.spellData().wisdom, 4);
  ps.shop.freeRefreshes = 1; assert.equal(ps.refresh().ok, true); assert.equal(ps.spellData().wisdom, 3);
  h.m.round = 2; ps.startRound(2); assert.equal(ps.spellData().wisdom, 3);
  ps.funds = 50;
  for (let i = 0; i < 3; i++) { assert.equal(ps.refresh().ok, true); assert.equal(ps.spellData().wisdom, 2 - i); }
  assert.equal(ps.refresh().ok, true); assert.equal(ps.spellData().wisdom, 0);
  h.m.dispose();
});

for(const mode of WISDOM_OUTCOMES)test(`manual Wisdomball ${mode} announces the actual result and remaining charges`,()=>{
  const {h,ps}=setup();deploy(h,ps);cast(ps,'智慧球');
  const sample=ps.spellSample.bind(ps);
  ps.spellSample=(list,n=1)=>list.includes(mode)?[mode]:sample(list,n);
  const labels={mirror:'复制阵容',legendary:'六星干员',golden:'精锐干员',triple:'补齐三连',bond:'同盟约干员',higher:'高本干员',identical:'同名干员',utility:'功能干员',spells:'全法术'};
  const notices=()=>h.sent.filter(([pid,m])=>pid===ps.playerId&&m.t==='m.toast'&&m.msgid?.startsWith('智慧球：')).map(([,m])=>m);
  assert.equal(ps.refresh().ok,true);assert.equal(ps.spellData().lastWisdom,mode);assert.equal(ps.spellData().wisdom,1);
  assert.equal(notices().length,1);assert.equal(notices()[0].params.count,1);
  assert.equal(notices()[0].text,`智慧球：${labels[mode]}（剩余1次）`);
  ps.rollShop();assert.equal(ps.spellData().wisdom,1);assert.equal(notices().length,1,'automatic rolls never claim a trigger');
  ps.funds=0;ps.shop.freeRefreshes=0;assert.ok(ps.refresh().error);assert.equal(ps.spellData().wisdom,1);assert.equal(notices().length,1);
  ps.shop.freeRefreshes=1;assert.equal(ps.refresh().ok,true);assert.equal(ps.spellData().wisdom,0);
  assert.equal(notices().length,2);assert.equal(notices()[1].params.count,0);
  assert.deepEqual(h.logs.error,[]);h.m.dispose();
});

test('Wisdomball golden never silently succeeds when Forge candidates have no elite form',()=>{
  const {h,ps}=setup(),normal=ps.spellChessPool(),[upgradeable,plain]=normal;
  const goldenIdOf=ps.gd.goldenIdOf.bind(ps.gd),sample=ps.spellSample.bind(ps);
  ps.gd.goldenIdOf=id=>ps.gd.baseIdOf(id)===upgradeable?goldenIdOf(id):null;
  ps.spellSample=(list,n=1)=>list.includes(plain)?[plain]:sample(list,n);
  assert.equal(helpfulRefresh(ps,'golden'),'golden');
  const gold=ps.shop.slots.find(s=>s?.spellGoldenReward);assert.ok(gold);assert.equal(gold.id,goldenIdOf(upgradeable));assert.equal(gold.heroGenerated,true);
  ps.gd.goldenIdOf=()=>null;
  const before=JSON.stringify(ps.shop);assert.equal(helpfulRefresh(ps,'golden'),null);assert.equal(JSON.stringify(ps.shop),before);
  assert.deepEqual(h.logs.error,[]);h.m.dispose();
});

test('Wisdomball borrows merchandise positions but caps the complete row at maximum shop capacity', () => {
  const { h, ps } = setup();
  const ids = ps.spellChessPool(null, c => c.position === 'MELEE').slice(0, 8);
  for (const id of ids) deploy(h, ps, id);
  assert.equal(helpfulRefresh(ps, 'mirror'), 'mirror');
  const cap = ps.gd.shopSlots(6), max = cap.chess + cap.item + 1;
  assert.equal(ps.shop.slots.length, max);
  assert.equal(ps.shop.layout.chess, max);
  assert.ok(ps.shop.slots.every(s => ids.includes(s.id)));
  assert.equal(new Set(ps.shop.slots.map(s => s.id)).size, max);
  ps.freeze(); const before = JSON.stringify(ps.shop.slots);
  ps.rollShop({ keepFrozen: true }); assert.equal(JSON.stringify(ps.shop.slots), before);
  const tail = ps.shop.slots.slice(max); ps.shop.slots[0].sold = true;
  ps.rollShop({ keepFrozen: true }); assert.equal(ps.shop.slots[0].kind, 'chess');
  assert.deepEqual(ps.shop.slots.slice(max), tail);
  ps.rollShop(); assert.equal(ps.shop.layout.chess, ps.gd.shopSlots(6).chess);
  h.m.dispose();
});

test('every Wisdomball outcome is usable, deterministic, has stock, and preserves category boundaries', () => {
  for (const mode of WISDOM_OUTCOMES) {
    const results = [];
    for (let repeat = 0; repeat < 2; repeat++) {
      const { h, ps } = setup(); const target = deploy(h, ps), before = ps.shop.slots.slice(ps.shop.layout.chess);
      assert.equal(helpfulRefresh(ps, mode), mode, mode);
      const units = ps.shop.slots.slice(0, ps.shop.layout.chess);
      if (mode === 'spells') assert.ok(ps.shop.slots.every(s => ps.gd.item(s.id) && !ps.gd.item(s.id).poolDisabled));
      else {
        assert.ok(units.length > 0); assert.ok(units.every(s => ps.gd.chess(s.id)));
        assert.deepEqual(ps.shop.slots.slice(ps.shop.layout.chess), before);
        for (const s of units) assert.ok(h.m.pool.left(ps.gd.baseIdOf(s.id)) > 0);
      }
      if (mode === 'identical') assert.equal(new Set(units.map(s => s.id)).size, 1);
      if (mode === 'mirror') assert.ok(units.some(s => s.id === target.id));
      if (mode === 'golden') assert.equal(units.filter(s => s.spellGoldenReward).length, 1);
      if (mode === 'higher') assert.ok(units.every(s => ps.gd.chess(s.id).tier === 6));
      if (mode === 'legendary') assert.ok(units.every(s => ps.gd.chess(s.id).rarity === 5));
      if (mode === 'triple') assert.ok(units.filter(s => s.id === target.id).length >= ps.gd.mergeCount(target.id) - 1);
      if (mode === 'shield') {
        assert.ok(ps.privateView().shop.slots[0].spellShield);
        assert.equal(ps.buy(0).ok, true);
        const held = ps.allChess().find(p => p.meta?.spellShield); assert.ok(held);
        const [key] = [...ps.deployMap()].find(([k]) => !ps.board.has(k) && ps._legal(held, ...k.split(',').map(Number)));
        {
          ps._detach(ps.find(held.uid)); ps.board.set(key, held); ps.recompute();
          const spec = buildBattleSpec(h.m._normalOpts(ps));
          const battle = createBattleFromSpec(JSON.parse(JSON.stringify(spec)), h.m.ds); battle.start();
          const unit = battle.allies(ps.playerId).find(u => u.uid === held.uid);
          assert.equal(unit.findBuff('spell:wisdom:shield').shieldHits, 1);
        }
      }
      results.push(JSON.stringify(ps.shop)); assert.deepEqual(h.logs.error, []); h.m.dispose();
    }
    assert.equal(results[0], results[1], mode + ' has stable seeded results');
  }
});

test('Wisdomball legendary offers ignore shop level and removed outcomes cannot be selected', () => {
  const {h,ps}=setup();ps.shop.level=1;ps.rollShop();
  assert.equal(helpfulRefresh(ps,'legendary'),'legendary');
  assert.ok(ps.shop.slots.slice(0,ps.shop.layout.chess).every(s=>ps.gd.chess(s.id).rarity===5));
  assert.ok(ps.shop.slots.slice(0,ps.shop.layout.chess).some(s=>ps.gd.chess(s.id).tier>1));
  assert.equal(helpfulRefresh(ps,'shield'),null);assert.equal(helpfulRefresh(ps,'growth'),null);
  assert.equal(WISDOM_OUTCOMES.length,9);h.m.dispose();
});

test('Wisdomball mirror leaves empty gaps when no lower-tier filler remains instead of creating invalid cards',()=>{
  const {h,ps}=setup();
  deploy(h,ps,ps.spellChessPool(6,c=>c.position==='MELEE')[0]);
  ps.shop.level=1;ps.rollShop();
  for(const id of ps.gd.visibleChess)if(ps.gd.tierOf(id)<=1)h.m.pool.take(id,h.m.pool.left(id));
  assert.equal(helpfulRefresh(ps,'mirror'),'mirror');
  assert.ok(ps.shop.slots.every(s=>s===null||s.kind!=='chess'||!!ps.gd.chess(s.id)));
  h.m.dispose();
});
