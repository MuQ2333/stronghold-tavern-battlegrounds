import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeMatch, DATA, give } from './match/harness.js';
import { useHeroPower, heroEvent, heroView } from '../server/match/heroPowers.js';
import { makeBattle, chessRec } from './helpers/battleHarness.js';
import { gameData, setGameData } from '../server/sim/content/support/index.js';
const withGameData=(data,fn)=>{const previous=gameData();setGameData(data);try{return fn();}finally{setGameData(previous);}};
import { SPELL_HERO_IDS } from '../shared/heroPowers.js';
import { spellTarget } from '../shared/spells.js';
import { allowedBands } from '../public/js/screens/bandDraft.js';
import {isHandLocked,lockedCardStatus} from '../shared/lockedCards.js';
import {validateClientResult} from '../server/match/fields.js';
import {buildBattleSpec,compactResult,fitResult} from '../server/sim/spec.js';
import {validateC2S} from '../shared/protocol.js';
import {canPlace} from '../public/js/ui/gameLogic/placement.js';
import {mergeProgress} from '../public/js/ui/gameLogic/shop.js';

const bands=JSON.parse(readFileSync(new URL('../mods/hero-strategies/bands.json',import.meta.url)));
function setup(id, humans=1, spells=SPELL_HERO_IDS.includes(id)) {
  const h=makeMatch({fake:true,humans,heroMod:true,spellShop:spells,data:{...DATA,bands:{...DATA.bands,...bands}},seed:23});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.bandId=`band_hs_${id}`;ps.funds=100;
  heroEvent(ps,'onRoundStart',{});return {h,ps};
}
const use=(ps,args={})=>useHeroPower(ps,{action:'use',...args});
test('spell heroes are hidden and server refuses focus, selection and power without spell mod',()=>{
  assert.equal(allowedBands(Object.values(bands),'SINGLE').length,25);
  assert.equal(allowedBands(Object.values(bands),'SINGLE',true).length,29);
  for(const id of SPELL_HERO_IDS) {
    const {h,ps}=setup(id,1,false);
    assert.equal(h.m.gd.bandAllowed(ps.bandId),false);
    assert.equal(h.m.gd.bandIds().includes(ps.bandId),false);
    assert.equal(heroView(ps),null);
    const funds=ps.funds;
    assert.notEqual(use(ps).ok,true);assert.equal(ps.funds,funds);
    heroEvent(ps,'onBuy',{kind:'item',slot:{id:'chess_item_1_03_e_a'}});
    assert.equal(ps.heroState,undefined);
    const enabled=setup(id);
    assert.equal(enabled.h.m.gd.bandAllowed(enabled.ps.bandId),true);
    assert.equal(enabled.h.m.publicView().spellHeroesEnabled,true);
  }
});
test('Thelan third spell costs zero; failed purchase and equipment do not advance; counter survives rounds',()=>{
  const {h,ps}=setup('thelan');
  const id='chess_item_1_03_e_a';
  const buy=()=>{ps.shop.slots[0]={kind:'item',id,basePrice:3,sold:false};return ps.buy(0);};
  let before=ps.funds;assert.equal(buy().ok,true);assert.equal(ps.funds,before-3);
  assert.notEqual(ps.buy(0).ok,true);assert.equal(ps.heroState.progress,1);
  heroEvent(ps,'onBuy',{kind:'item',slot:{id:'chess_item_1_01_e_a'}});assert.equal(ps.heroState.progress,1);
  h.m.round++;heroEvent(ps,'onRoundStart',{});assert.equal(ps.heroState.progress,1);
  assert.equal(buy().ok,true);before=ps.funds;assert.equal(buy().ok,true);assert.equal(ps.funds,before);
  assert.equal(ps.heroState.progress,0);h.invariants();
});
test('Hollidae grants one eligible normal spell once, refuses full hand without charging',()=>{
  const {h,ps}=setup('hollidae'), before=ps.funds;
  const held=new Set([...ps.hand,...ps.temp].filter(Boolean).map(p=>p.uid));
  assert.equal(use(ps).ok,true);assert.equal(ps.funds,before-1);
  const gained=[...ps.hand,...ps.temp].filter(p=>p&&!held.has(p.uid));
  assert.equal(gained.length,1);const rec=ps.gd.item(gained[0].id);
  assert.ok(spellTarget(rec));assert.ok(!rec.isGolden&&rec.tier<=ps.shop.level);
  assert.notEqual(use(ps).ok,true);h.invariants();
  h.m.round++;ps.hand=ps.hand.map(()=>ps.newPiece('item','chess_item_1_01_e_a'));ps.temp=ps.temp.map(()=>ps.newPiece('item','chess_item_1_01_e_a'));
  const funds=ps.funds;assert.notEqual(use(ps).ok,true);assert.equal(ps.funds,funds);
});
test('Yogg casts at round three once without needing space; missing target fizzles',()=>{
  const {h,ps}=setup('yogg');let casts=0;
  const original=h.m.dispatchItem.bind(h.m);
  h.m.dispatchItem=(...args)=>{casts++;return original(...args);};
  // Tier one has the coin and identity card; force the first sorted data candidate to be the coin.
  const canGain=h.m.itemPool.canGain.bind(h.m.itemPool);
  h.m.itemPool.canGain=id=>id==='chess_item_1_03_e_a'&&canGain(id);
  h.m.round=2;heroEvent(ps,'onRoundStart',{});assert.equal(casts,0);
  h.m.round=3;const funds=ps.funds;heroEvent(ps,'onRoundStart',{});assert.equal(casts,1);assert.ok(ps.funds>funds);
  heroEvent(ps,'onRoundStart',{});assert.equal(casts,1);
  assert.equal([...ps.hand,...ps.temp].filter(Boolean).length,0);
  h.m.itemPool.canGain=id=>id==='chess_item_1_04_e_a';h.m.round=4;
  heroEvent(ps,'onRoundStart',{});assert.equal(casts,1);h.invariants();
});
function stocked(ps,tier=1) {return ps.gd.visibleChess.filter(id=>ps.gd.tierOf(id)===tier&&ps.poolOf(id).has(id)&&ps.poolOf(id).left(id)>0);}

test('all heroes expose serializable state without mutating views',()=>{
  for(const b of Object.values(bands)) {
    const {h,ps}=setup(b.params.heroPower);
    const before=JSON.stringify(ps.heroState);assert.ok(heroView(ps));ps.privateView();
    assert.equal(JSON.stringify(ps.heroState),before);assert.deepEqual(h.logs.error,[]);
  }
});
test('Millhouse prices, Nozdormu free refresh and Omu upgrades',()=>{
  const {ps}=setup('millhouse');let before=ps.funds;
  ps.refresh();assert.equal(ps.funds,before-2);
  before=ps.funds;const price=ps.shop.upgradePrice;ps.levelUp();assert.equal(ps.funds,before-price-1);
  ps.bandId='band_hs_nozdormu';heroEvent(ps,'onRoundStart',{});ps.heroState.freeRefresh=1;
  ps.shop.freeRefreshes=2;before=ps.funds;ps.refresh();assert.equal(ps.funds,before);assert.equal(ps.shop.freeRefreshes,2);
  ps.bandId='band_hs_omu';ps.shop.upgradePrice=0;before=ps.funds;ps.levelUp();assert.equal(ps.funds,before+2);
});
test('Nozdormu free refreshes accumulate across rounds, are granted once, and are consumed before other credits',()=>{
  const {ps,h}=setup('nozdormu');
  assert.equal(heroView(ps).freeRefresh,1);
  heroEvent(ps,'onPrepEnd',{});
  for(const round of [2,3]) {
    h.m.round=round;heroEvent(ps,'onRoundStart',{});heroEvent(ps,'onRoundStart',{});
    assert.equal(heroView(ps).freeRefresh,round);
  }
  ps.shop.freeRefreshes=1;
  const funds=ps.funds;
  ps.ready=true;assert.notEqual(ps.refresh().ok,true);assert.equal(heroView(ps).freeRefresh,3);ps.ready=false;
  for(let left=2;left>=0;left--) {
    assert.equal(ps.refresh().ok,true);assert.equal(heroView(ps).freeRefresh,left);
    assert.equal(ps.funds,funds);assert.equal(ps.shop.freeRefreshes,1);
  }
  assert.equal(ps.refresh().ok,true);assert.equal(ps.funds,funds);assert.equal(ps.shop.freeRefreshes,0);
  assert.equal(ps.refresh().ok,true);assert.equal(ps.funds,funds-ps.gd.refreshPrice);
  h.invariants();
});

test('discount does not stack with foresight and Sindragosa removes only one operator slot',()=>{
  const {ps}=setup('sindragosa');ps.rollShop();
  assert.equal(ps.shop.layout.chess,ps.gd.shopSlots(1).chess-1);
  const slot={kind:'chess',id:stocked(ps)[0],basePrice:3};
  assert.equal(ps.priceOf(slot),2);
  ps.counters['bondaddon:visi:disc']=2;assert.equal(ps.priceOf(slot),2);
  heroEvent(ps,'onPrepEnd',{});assert.ok(ps.shop.slots.filter(Boolean).every(s=>s.frozen));
});
test('Gallywix counts one sale; Flurgl zero layers falls back to coin',()=>{
  const {ps}=setup('gallywix');let n=ps.pendingFunds;
  heroEvent(ps,'onSold',{});assert.equal(ps.pendingFunds,n+1);
  ps.bandId='band_hs_flurgl';ps.layers={};for(let i=0;i<5;i++)heroEvent(ps,'onSold',{});
  assert.ok([...ps.hand,...ps.temp].some(p=>p?.id==='chess_item_1_03_e_a'));
});
test('Elise charges once, stale/duplicate choices fail and stock is consumed only on selection',()=>{
  const {ps}=setup('elise');const before=ps.funds;
  assert.equal(use(ps).ok,true);assert.equal(ps.funds,before-1);assert.equal(use(ps).ok,undefined);
  const {choices,sequence}=ps.heroState;const id=choices[0].id,n=ps.poolOf(id).left(id);
  assert.equal(useHeroPower(ps,{action:'pick',sequence:sequence+1,index:0}).ok,undefined);
  assert.equal(useHeroPower(ps,{action:'pick',sequence,index:0}).ok,true);assert.equal(ps.poolOf(id).left(id),n-1);
  assert.equal(useHeroPower(ps,{action:'pick',sequence,index:0}).ok,undefined);
});
test('Faelin locks stocked choices, disallows first-round purchases and unlocks by level',()=>{
  const {ps,h}=setup('faelin');
  assert.equal(ps.buy(0).ok,undefined);assert.equal(ps.refresh().ok,undefined);assert.equal(ps.levelUp().ok,undefined);
  for(let i=0;i<3;i++) {assert.ok(ps.heroState.choices.length);assert.equal(useHeroPower(ps,{action:'pick',sequence:ps.heroState.sequence,index:0}).ok,true);}
  assert.equal((ps.privateView().lockedCards||[]).length,3);
  h.m.round=2;ps.shop.level=6;heroEvent(ps,'onLevelUp',{});assert.equal((ps.privateView().lockedCards||[]).length,0);
});
test('Maiev locks a shop item for two rounds and duplicate use cannot charge',()=>{
  const {ps,h}=setup('maiev');const slot=ps.shop.slots.findIndex(x=>x?.kind==='chess');
  assert.equal(use(ps,{slot,expectedId:ps.shop.slots[slot].id}).ok,true);assert.equal(ps.shop.slots[slot].sold,true);
  assert.equal(use(ps,{slot}).ok,undefined);assert.equal((ps.privateView().lockedCards||[]).length,1);
  h.m.round=2;heroEvent(ps,'onRoundStart',{});assert.equal((ps.privateView().lockedCards||[]).length,1);
  h.m.round=3;heroEvent(ps,'onRoundStart',{});assert.equal((ps.privateView().lockedCards||[]).length,0);
});
test('common locked-card views expose Maiev operators and equipment with unlock round, then clear on delivery',()=>{
  for(const kind of ['chess','item']) {
    const {ps,h}=setup('maiev'),slot=ps.shop.slots.findIndex(s=>s?.kind===kind);
    assert.ok(slot>=0);const id=ps.shop.slots[slot].id;
    assert.equal(use(ps,{slot,expectedId:id}).ok,true);
    const before=JSON.stringify(ps.heroState),entry=ps.privateView().lockedCards[0];
    assert.equal(entry.kind,kind);assert.equal(entry.id,id);assert.equal(entry.sourceName,'禁锢');assert.equal(entry.unlockRound,3);
    assert.equal('reserved' in entry,false);assert.equal('reservedItem' in entry,false);
    assert.equal(JSON.stringify(ps.heroState),before);
    h.m.round=3;heroEvent(ps,'onRoundStart',{});
    assert.equal(ps.privateView().lockedCards,undefined);
  }
});
test('Faelin locked cards occupy real hand slots and unlock in place even with a full hand',()=>{
  const {ps,h}=setup('faelin');
  for(let i=0;i<3;i++)assert.equal(useHeroPower(ps,{action:'pick',sequence:ps.heroState.sequence,index:0}).ok,true);
  assert.deepEqual(ps.privateView().lockedCards.map(e=>e.unlockLevel).sort((a,b)=>a-b),[2,4,6]);
  assert.equal(ps.hand.filter(Boolean).length,3);
  ps.hand=ps.hand.map(p=>p||ps.newPiece('item','chess_item_1_01_e_a'));
  h.m.round=2;ps.shop.level=6;heroEvent(ps,'onLevelUp',{});
  assert.equal(ps.privateView().lockedCards,undefined);
  const ordinary=setup('omu').ps;assert.equal(ordinary.privateView().lockedCards,undefined);
});
test('shared lock status requires every supplied condition and never marks an unknown condition as unlocked',()=>{
  const entry={unlockRound:4,unlockLevel:3};
  assert.equal(lockedCardStatus(entry,{round:4,level:2}).waiting,false);
  assert.equal(lockedCardStatus(entry,{round:3,level:3}).waiting,false);
  assert.equal(lockedCardStatus(entry,{round:4,level:3}).waiting,true);
  assert.equal(lockedCardStatus({},{round:99,level:6}).waiting,false);
});
test('Maiev cards occupy a real slot, can move in hand, cannot deploy, sell, equip, destroy, or merge while locked',()=>{
  for(const kind of ['chess','item']) {
    const {ps,h}=setup('maiev'),slot=ps.shop.slots.findIndex(s=>s?.kind===kind),id=ps.shop.slots[slot].id;
    if(kind==='chess')for(let i=0;i<2;i++)give(h.m,ps,id);
    else ps.acquireItem(id,{source:'test'});
    assert.equal(use(ps,{slot,expectedId:id}).ok,true);
    const p=ps.hand.find(p=>p&&isHandLocked(p)),at=ps.find(p.uid).idx;
    assert.ok(p);assert.equal(ps.completesChessMerge(id),kind==='chess');
    if(kind==='chess')assert.ok(!ps.allChess().some(x=>ps.gd.isGolden(x.id)));
    const free=ps.hand.findIndex(x=>!x);assert.ok(free>=0);
    assert.equal(ps.move(p.uid,{area:'hand',idx:free}).ok,true);assert.equal(ps.hand[free].uid,p.uid);assert.equal(ps.hand[at],null);
    assert.notEqual(ps.move(p.uid,{area:'board',row:10,col:3}).ok,true);
    if(kind==='chess') {
      assert.notEqual(ps.sell(p.uid).ok,true);assert.equal(ps.promote(p),false);
      const item=ps.acquireItem('chess_item_1_04_e_a',{ignoreStock:true});assert.notEqual(ps.equip(item.uid,p.uid).ok,true);
    } else {
      assert.notEqual(ps.destroy(p.uid).ok,true);assert.notEqual(ps.castSpell(p.uid).ok,true);
      const target=give(h.m,ps,stocked(ps)[0]);assert.notEqual(ps.equip(p.uid,target.uid).ok,true);
    }
    h.invariants();h.m.round=3;heroEvent(ps,'onRoundStart',{});
    assert.equal(ps.privateView().lockedCards,undefined);
    if(kind==='chess')assert.ok(ps.allChess().some(x=>ps.gd.isGolden(x.id)));
    h.invariants();
  }
});
test('locked copies never contribute to completing a triple; other unlocked copies still merge normally',()=>{
  const {ps,h}=setup('maiev'),slot=ps.shop.slots.findIndex(s=>s?.kind==='chess'),id=ps.shop.slots[slot].id;
  assert.equal(use(ps,{slot,expectedId:id}).ok,true);
  ps.acquireChess(id);assert.equal(ps.countCopies(id),1);assert.equal(ps.completesChessMerge(id),false);
  ps.acquireChess(id);assert.equal(ps.countCopies(id),2);
  ps.acquireChess(id);assert.ok(ps.allChess().some(p=>ps.gd.isGolden(p.id)));
  assert.equal(ps.privateView().lockedCards.length,1);h.invariants();
});
test('Maiev refuses full ordinary hand before charging or reserving stock',()=>{
  const {ps}=setup('maiev'),slot=ps.shop.slots.findIndex(s=>s?.kind==='chess'),id=ps.shop.slots[slot].id;
  ps.hand=ps.hand.map(()=>ps.newPiece('item','chess_item_1_03_e_a'));
  const funds=ps.funds,left=ps.poolOf(id).left(id);
  assert.notEqual(use(ps,{slot,expectedId:id}).ok,true);assert.equal(ps.funds,funds);assert.equal(ps.poolOf(id).left(id),left);assert.equal(ps.shop.slots[slot].sold,false);
});
test('client lock gates match server: hand rearrangement is allowed, board swaps and triple previews exclude locked cards',()=>{
  const lock={unlockRound:3},locked={uid:1,kind:'chess',id:'a',handLock:lock},normal={uid:2,kind:'chess',id:'a'};
  const ctx={editable:true,pieces:new Map([[1,{piece:locked,area:'hand',idx:0}],[2,{piece:normal,area:'board'}]]),handAt:new Map([[0,{piece:locked}]]),getItem:()=>null};
  assert.equal(canPlace(ctx,1,{area:'board',row:10,col:3}).ok,false);
  assert.equal(canPlace(ctx,1,{area:'hand',idx:1}).ok,true);
  assert.equal(canPlace(ctx,2,{area:'hand',idx:0}).ok,false);
  assert.equal(mergeProgress({hand:[locked,normal]},'a',()=>({id:'a',tier:1})).copies,1);
});
test('Zephrys generated third copy never tops up pool when merging',()=>{
  const {ps}=setup('zephrys');const id=stocked(ps).find(x=>ps.gd.mergeCount(x)===3);
  give(ps.m,ps,id);give(ps.m,ps,id);const n=ps.poolOf(id).left(id);
  assert.equal(use(ps).ok,true);assert.equal(ps.poolOf(id).left(id),n);
  assert.ok(ps.allChess().some(p=>ps.gd.isGolden(p.id)));
});
test('Snake Eyes cooldown and Cenarius delayed income',()=>{
  const {ps,h}=setup('snakeeyes');const before=ps.funds;
  assert.equal(use(ps).ok,true);const n=ps.heroState.roll;assert.ok(n>=1&&n<=6);assert.equal(ps.funds,before-1+n);
  assert.equal(ps.heroState.nextRound,1+n);assert.equal(use(ps).ok,undefined);
  const c=setup('cenarius').ps;assert.equal(use(c).ok,true);const income={income:5};heroEvent(c,'onIncome',income);assert.equal(income.income,6);
  h.m.round=1+n;assert.equal(use(ps).ok,true);
});
test('Tess copies teammate lineup without stock and normally fills gaps',()=>{
  const {ps,h}=setup('tess',2);const mate=h.ps('p_1'),id=stocked(ps)[0];mate.lastHeroLineup=[id];
  const gear=ps.shop.slots.slice(ps.shop.layout.chess);assert.equal(use(ps,{playerId:mate.playerId}).ok,true);
  assert.equal(ps.shop.slots[0].heroGenerated,true);assert.deepEqual(ps.shop.slots.slice(ps.shop.layout.chess),gear);
  const n=ps.poolOf(id).left(id);ps.buy(0);assert.equal(ps.poolOf(id).left(id),n);
});
test('Tess and Scabbs rotate once each round without use, skip inactive seats, and reject forged sources',()=>{
  for(const hero of ['tess','scabbs']) {
    const {ps,h}=setup(hero,4), id=stocked(ps)[0];
    for(const mate of h.m.order)mate.lastHeroLineup=[id];
    assert.equal(heroView(ps).sourcePlayer.playerId,'p_1');
    const before=ps.funds,shop=JSON.stringify(ps.shop.slots);
    assert.notEqual(use(ps,{playerId:'p_2'}).ok,true);assert.equal(ps.funds,before);assert.equal(JSON.stringify(ps.shop.slots),shop);
    heroEvent(ps,'onRoundStart',{});assert.equal(heroView(ps).sourcePlayer.playerId,'p_1');
    h.m.round++;heroEvent(ps,'onRoundStart',{});assert.equal(heroView(ps).sourcePlayer.playerId,'p_2');
    h.ps('p_3').left=true;
    h.m.round++;heroEvent(ps,'onRoundStart',{});assert.equal(heroView(ps).sourcePlayer.playerId,'p_1');
    h.ps('p_1').alive=false;
    assert.equal(heroView(ps).disabled,true);assert.notEqual(use(ps).ok,true);assert.equal(ps.funds,before);
    h.m.round++;heroEvent(ps,'onRoundStart',{});assert.equal(heroView(ps).sourcePlayer.playerId,'p_2');
  }
});
test('rotating powers show their source but refuse empty lineups and solo use without charging',()=>{
  for(const id of ['tess','scabbs'])for(const count of [1,2]) {
    const {ps}=setup(id,count),funds=ps.funds;
    assert.equal(heroView(ps).disabled,true);assert.equal(!!heroView(ps).sourcePlayer,count===2);
    assert.notEqual(use(ps).ok,true);assert.equal(ps.funds,funds);
  }
});
test('Scabbs discovers distinct ordinary copies above shop tier, without pool stock or repeat charges',()=>{
  const {ps,h}=setup('scabbs',2),mate=h.ps('p_1'),ids=stocked(ps,6).slice(0,4);
  assert.equal(ids.length,4);mate.lastHeroLineup=[...ids,ids[0]];
  for(const id of ids)ps.poolOf(id).take(id,ps.poolOf(id).left(id));
  const before=ps.funds;assert.equal(use(ps).ok,true);assert.equal(ps.funds,before-2);
  const choices=ps.heroState.choices;assert.equal(choices.length,3);assert.equal(new Set(choices.map(e=>e.id)).size,3);
  assert.ok(choices.every(e=>e.generated&&ids.includes(e.id)));assert.notEqual(use(ps).ok,true);assert.equal(ps.funds,before-2);
  const chosen=choices[0].id,sequence=ps.heroState.sequence;
  assert.equal(useHeroPower(ps,{action:'pick',sequence,index:0}).ok,true);
  assert.ok(ps.allChess().some(p=>p.id===chosen));assert.equal(ps.poolOf(chosen).left(chosen),0);
  assert.notEqual(useHeroPower(ps,{action:'pick',sequence,index:0}).ok,true);
});
test('Scabbs offers all candidates when fewer than three distinct operators exist',()=>{
  const {ps,h}=setup('scabbs',2),id=stocked(ps)[0];h.ps('p_1').lastHeroLineup=[id,id];
  assert.equal(use(ps).ok,true);assert.equal(ps.heroState.choices.length,1);
});
test('Cookie consumes shop and owned operators, keeps each ingredient separate',()=>{
  const {ps,h}=setup('cookie');
  for(let i=0;i<3;i++) {
    h.m.round=i+1;const p=give(ps.m,ps,stocked(ps)[0]);
    assert.equal(use(ps,{uid:p.uid}).ok,true);assert.equal(ps.find(p.uid),null);
  }
  assert.equal(ps.heroState.choices.length,3);assert.equal(ps.heroState.pot.length,0);
});
test('skills refuse ready players and ordinary strategies',()=>{
  const {ps}=setup('snakeeyes');const before=ps.funds;ps.ready=true;assert.equal(use(ps).ok,undefined);assert.equal(ps.funds,before);
  ps.ready=false;ps.bandId='band_warfarin';assert.equal(use(ps).ok,undefined);
});

test('all reservations conserve stock and return on elimination',()=>{
  const {ps,h}=setup('faelin');
  for(let i=0;i<3;i++)useHeroPower(ps,{action:'pick',sequence:ps.heroState.sequence,index:0});
  h.invariants();
  const entries=ps.privateView().lockedCards.map(e=>({id:e.id,left:ps.poolOf(e.id).left(e.id)}));
  ps.eliminate(1);for(const e of entries)assert.equal(ps.poolOf(e.id).left(e.id),e.left+1);
  h.invariants();
});
test('Toki provides exactly two higher-tier positions and charges once',()=>{
  const {ps}=setup('toki');const funds=ps.funds;
  assert.equal(use(ps).ok,true);assert.equal(ps.funds,funds-1);
  for(const slot of ps.shop.slots.slice(0,2))assert.equal(ps.gd.tierOf(slot.id),2);
});
test('Eudora repeats four digs, creates an elite without touching inventory and gives promotion reward',()=>{
  const {ps,h}=setup('eudora'),before=h.m.pool.snapshot();
  for(let r=1;r<=4;r++){h.m.round=r;assert.equal(use(ps).ok,true);}
  assert.equal(ps.heroState.progress,0);assert.ok(ps.allChess().some(p=>ps.gd.isGolden(p.id)));
  assert.deepEqual(h.m.pool.snapshot(),before);assert.equal(ps.offers.length,1);h.invariants();
});
test('Guff carries excess tiers; Hoggarr refunds only purchases of foresight operators',()=>{
  const {ps}=setup('guff');const id=stocked(ps,6)[0];
  for(let i=0;i<4;i++)heroEvent(ps,'onBuy',{kind:'chess',slot:{id}});
  assert.equal(ps.heroState.progress,4);assert.equal(ps.offers.length,1);
  ps.bandId='band_hs_hoggarr';const far=ps.gd.visibleChess.find(x=>ps.gd.chess(x).bonds.includes('visiShip'));
  const funds=ps.funds;heroEvent(ps,'onBuy',{kind:'chess',slot:{id:far}});assert.equal(ps.funds,funds+1);
});
test('Mukla grants identity cards to each teammate without consuming item stock',()=>{
  const {ps,h}=setup('mukla',2),id='chess_item_1_04_e_a';
  assert.equal(h.m.itemPool.held(id),0);
  const units=p=>[...p.hand,...p.temp].filter(Boolean);
  assert.ok(units(ps).some(p=>p.id===ps.gd.item(id).goldenId));
  assert.ok(units(h.ps('p_1')).some(p=>p.id===id));
  h.invariants();
});
test('Voone reduces elite copies to ordinary and does not consume pool',()=>{
  const {ps,h}=setup('voone');const id=stocked(ps)[0];const p=generatedForTest(ps,ps.gd.goldenIdOf(id));
  const loc=ps.find(p.uid);ps._detach(loc);ps.hand[0]=p;const before=ps.poolOf(id).left(id);
  h.m.round=3;heroEvent(ps,'onPrepEnd',{});assert.ok(ps.allChess().some(x=>x.id===id));assert.equal(ps.poolOf(id).left(id),before);h.invariants();
});
function generatedForTest(ps,id){return ps.acquireChess(id,{fromPool:false,noPoolTopUp:true});}
test('Galewing is spell-gated and its short flight awards a spell costing one fund',()=>{
  const {ps,h}=setup('galewing');assert.equal(use(ps,{route:1}).ok,true);assert.notEqual(use(ps,{route:3}).ok,true);
  h.m.round=2;heroEvent(ps,'onRoundStart',{});assert.equal(ps.heroState.flight,0);
  assert.ok([...ps.hand,...ps.temp].some(p=>p?.kind==='item'&&spellTarget(ps.gd.item(p.id))&&ps.gd.itemPrice(p.id)===1));
});
test('Togwaggle rejects insufficient capacity atomically, then collects complete stock',()=>{
  const {ps}=setup('togwaggle');
  ps.hand=ps.hand.map(()=>ps.newPiece('item','chess_item_1_01_e_a'));
  ps.temp=ps.temp.map(()=>ps.newPiece('item','chess_item_1_02_e_a'));
  const funds=ps.funds,shop=JSON.stringify(ps.shop.slots);assert.notEqual(use(ps).ok,true);
  assert.equal(ps.funds,funds);assert.equal(JSON.stringify(ps.shop.slots),shop);
  ps.hand.fill(null);ps.temp.fill(null);assert.equal(use(ps).ok,true);assert.ok(ps.shop.slots.filter(Boolean).every(s=>s.sold));
});
test('Maiev rejects stale shop targets without payment',()=>{
  const {ps}=setup('maiev'),funds=ps.funds;assert.notEqual(use(ps,{slot:0,expectedId:'missing'}).ok,true);assert.equal(ps.funds,funds);
});
test('Sylvanas records owned kills even if the operator redeploys; withdraw is excluded',()=>{
  withGameData({...DATA,bands:{...DATA.bands,...bands}},()=>{
    const h=makeBattle({bandId:'band_hs_sylvanas',defs:{bands,chess:{a:chessRec({id:'a',stats:{atk:10,maxHp:100}}),b:chessRec({id:'b',stats:{atk:20,maxHp:200}})}},units:[{chessId:'a',row:10,col:3},{chessId:'b',row:10,col:4}]});
    h.b.start();const [a,b]=h.allies();h.b.kill(a);h.b.retreat(b);
    assert.equal(h.b.redeploy(a),true);h.b.kill(a);
    assert.deepEqual(h.result().perPlayer.p1.heroDeaths,[a.uid,a.uid]);
    assert.deepEqual(compactResult(h.result()).perPlayer.p1.heroDeaths,[a.uid,a.uid]);
  });
});
test('Hoggarr refunds once for any of the three eligible bonds and not for unrelated operators',()=>{
  const {ps}=setup('hoggarr');
  for(const bond of ['visiShip','miraShip','investShip']) {
    const id=ps.gd.visibleChess.find(id=>ps.gd.chess(id).bonds?.includes(bond));assert.ok(id,bond);
    const funds=ps.funds;heroEvent(ps,'onBuy',{kind:'chess',slot:{id}});assert.equal(ps.funds,funds+1);
  }
  const other=ps.gd.visibleChess.find(id=>!ps.gd.chess(id).bonds?.some(b=>['visiShip','miraShip','investShip'].includes(b)));
  const funds=ps.funds;heroEvent(ps,'onBuy',{kind:'chess',slot:{id:other}});assert.equal(ps.funds,funds);
  const lookup=ps.gd.chess.bind(ps.gd);ps.gd.chess=id=>({...lookup(id),bonds:['visiShip','miraShip','investShip']});
  heroEvent(ps,'onBuy',{kind:'chess',slot:{id:other}});assert.equal(ps.funds,funds+1);
});
test('Sylvanas keeps repeated death tickets across own and united battles and weights distinct choices',()=>{
  const {ps,h}=setup('sylvanas'),ids=stocked(ps).slice(0,4),pieces=ids.map(id=>give(h.m,ps,id));
  heroEvent(ps,'onBattleResult',{result:{heroDeaths:[pieces[0].uid,pieces[0].uid,pieces[0].uid,pieces[1].uid]},unite:{perPlayer:{[ps.playerId]:{heroDeaths:[pieces[2].uid,pieces[3].uid]}}}});
  assert.equal(ps.heroState.deaths.length,6);
  const rng=h.m.rngMeta;h.m.rngMeta=()=>0.4;h.m.round=3;
  assert.equal(use(ps).ok,true);assert.equal(ps.heroState.choices[0].id,ids[0]);
  assert.equal(new Set(ps.heroState.choices.map(e=>e.id)).size,3);h.m.rngMeta=rng;
});
test('battle result validation accepts repeated owned deaths but rejects foreign or excessive tickets',()=>{
  const {ps,h}=setup('sylvanas'),id=stocked(ps)[0];
  const spec=buildBattleSpec({battleId:'hero-deaths',fieldId:'n:p',kind:'normal',round:3,stageId:'s',timeLimit:120,
    players:[{playerId:'p',bandId:ps.bandId,units:[{uid:5,kind:'chess',chessId:id,row:9,col:3}]}],spawns:[]});
  const result={reason:'timeout',time:120,perPlayer:{p:{killed:0,total:0,leaked:[],perfect:true,layerGains:{},coins:0,deaths:2,heroDeaths:[5,5],unitsEnd:[]}}};
  const check=()=>validateClientResult(spec,result,{gd:h.m.gd});
  assert.equal(check().ok,true);
  result.perPlayer.p.heroDeaths=[5,6];assert.equal(check().ok,false);
  result.perPlayer.p.heroDeaths=[5,5,5];assert.equal(check().ok,false);
});

test('Sylvanas receives one, two or three deaths through the compact client report and offers every available identity',()=>{
  for(const count of [1,2,3]){
    const {ps,h}=setup('sylvanas'),ids=stocked(ps).slice(0,count),pieces=ids.map(id=>give(h.m,ps,id));
    const pid=ps.playerId,battleId=`sylvanas-${count}`;
    const spec=buildBattleSpec({battleId,fieldId:`n:${pid}`,kind:'normal',round:2,stageId:'s',timeLimit:120,
      players:[{playerId:pid,bandId:ps.bandId,units:pieces.map((p,i)=>({uid:p.uid,kind:'chess',chessId:p.id,row:10,col:3+i}))}],spawns:[]});
    const wire=fitResult(compactResult({reason:'timeout',time:120,perPlayer:{[pid]:{
      killed:0,total:0,leaked:[],perfect:true,layerGains:{},coins:0,deaths:count,heroDeaths:pieces.map(p=>p.uid),unitsEnd:[]}}}));
    assert.equal(validateC2S({t:'b.result',battleId,result:wire}),null);
    const checked=validateClientResult(spec,wire,{gd:h.m.gd});assert.equal(checked.ok,true,checked.reason);
    heroEvent(ps,'onBattleResult',{result:checked.result.perPlayer[pid]});
    h.m.round=3;heroEvent(ps,'onRoundStart',{});
    assert.equal(heroView(ps).disabled,false);assert.equal(use(ps).ok,true);
    assert.equal(ps.heroState.choices.length,count);
    assert.deepEqual(new Set(ps.heroState.choices.map(x=>x.id)),new Set(ids));
    h.m.dispose();
  }
});
test('in-match descriptions update counters and never include editing notes or fee headers',()=>{
  for(const b of Object.values(bands))assert.ok(!/备注|技能费用：/.test(b.desc));
  const e=setup('eudora').ps;assert.equal(use(e).ok,true);assert.ok(heroView(e).desc.includes('还要挖3次'));
  const g=setup('guff').ps;g.heroState.progress=7;assert.ok(heroView(g).desc.includes('还剩13阶'));
  const t=setup('thelan').ps;t.heroState.progress=2;assert.ok(heroView(t).desc.includes('就是这张'));
  const v=setup('voone').ps;v.m.round=3;assert.ok(heroView(v).desc.includes('就是这回合'));
});
test('Tamsin grants 100 percent stats only to own operators and only on first marked death',()=>{
  withGameData({...DATA,bands:{...DATA.bands,...bands}},()=>{
    const h=makeBattle({bandId:'band_hs_tamsin',defs:{bands,chess:{a:chessRec({id:'a',stats:{atk:10,maxHp:100}}),b:chessRec({id:'b',stats:{atk:20,maxHp:200}})}},units:[{chessId:'a',row:10,col:3},{chessId:'b',row:10,col:4}]});
    h.b.start();const [a,b]=h.allies(),atk=a.s.atk,hp=a.s.maxHp,oldAtk=b.s.atk,oldHp=b.s.maxHp;
    h.b.kill(a);assert.equal(b.s.atk,oldAtk+atk);assert.equal(b.s.maxHp,oldHp+hp);
    h.b.emit('death',{unit:a,reason:'killed'});assert.equal(b.s.atk,oldAtk+atk);
  });
});
