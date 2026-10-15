import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMatch} from './match/harness.js';
import {heroEvent,heroView,useHeroPower,strategyPool,replaceHeroStrategy,finishHeroChoices} from '../server/match/heroPowers.js';
import {HERO_BANDS} from '../shared/heroCatalog.js';
import {NGUYEN_HERO_BANS} from '../shared/heroPowerPools.js';
import {heroDiscoveryOffer} from '../public/js/ui/heroDiscovery.js';
import {ALL_SPELLS} from '../shared/spellCatalog.js';

function setup({round=6,spells=true,humans=2}={}) {
  const h=makeMatch({fake:true,heroMod:true,spellShop:spells,humans,seed:51});h.start();h.toPrep(round);
  const ps=h.ps('p_0');ps.bandId='band_hs_nguyen';ps.shop.level=6;ps.funds=100;heroEvent(ps,'onRoundStart',{});
  return {h,ps};
}
function choose(ps,id) {
  assert.ok(strategyPool(ps,true).includes(id),id);
  ps.heroState.choices=[{kind:'band',id,nguyen:true}];ps.nguyenState.choices=ps.heroState.choices;
  return useHeroPower(ps,{action:'pick',index:0,sequence:ps.heroState.sequence});
}
function next(h,ps) {h.m.round++;ps.startRound(h.m.round);heroEvent(ps,'onRoundStart',{});}

test('Nguyen offers two distinct eligible powers once each round, with stale and forged choices refused',()=>{
  const {h,ps}=setup();const first=heroView(ps),before=ps.funds;
  assert.equal(first.choices.length,2);assert.equal(new Set(first.choices.map(x=>x.id)).size,2);
  assert.ok(first.choices.every(x=>x.kind==='band'&&strategyPool(ps,true).includes(x.id)));
  heroEvent(ps,'onRoundStart',{});assert.equal(heroView(ps).sequence,first.sequence);
  assert.ok(useHeroPower(ps,{action:'pick',index:0,sequence:first.sequence-1}).error);
  ps.ready=true;assert.ok(useHeroPower(ps,{action:'pick',index:0,sequence:first.sequence}).error);ps.ready=false;
  assert.equal(ps.funds,before);assert.equal(choose(ps,'band_hs_omu').ok,true);
  assert.equal(ps.privateView().bandId,'band_hs_nguyen');assert.equal(h.m.publicView().players.find(p=>p.playerId===ps.playerId).bandId,'band_hs_nguyen');
  assert.equal(ps.battleInput().bandId,'band_hs_omu');
  assert.ok(useHeroPower(ps,{action:'pick',index:0,sequence:first.sequence}).error);
  next(h,ps);assert.equal(ps.bandId,'band_hs_nguyen');assert.equal(heroView(ps).choices.length,2);
  assert.ok(heroView(ps).sequence>first.sequence);assert.ok(heroView(ps).choices.every(x=>x.id!=='band_hs_omu'));
  h.m.dispose();
});

test('permanent and temporary imported pools differ, honor mode switches and preserve the native policy',()=>{
  const {h,ps}=setup();const identity=strategyPool(ps),temporary=strategyPool(ps,true);
  for(const id of Object.keys(HERO_BANDS)) {
    if(id==='band_hs_nguyen'||id==='band_hs_faelin')assert.ok(!identity.includes(id),id);
    else assert.ok(identity.includes(id),id);
  }
  for(const id of NGUYEN_HERO_BANS)assert.ok(!temporary.includes('band_hs_'+id),id);
  for(const id of ['omu','gallywix','nozdormu','maiev','toki','hollidae','scabbs','yogg'])assert.ok(temporary.includes('band_hs_'+id),id);
  for(const id of ['band_pith','band_lmlee','band_paganini','band_yu','band_quintus'])assert.ok(!identity.includes(id)&&!temporary.includes(id),id);
  ps.shop.level=3;assert.ok(!strategyPool(ps,true).includes('band_hs_alexstrasza'));assert.ok(strategyPool(ps).includes('band_hs_alexstrasza'));
  h.m.dispose();
  const off=setup({spells:false});for(const id of ['thelan','hollidae','yogg','galewing'])assert.ok(!strategyPool(off.ps).includes('band_hs_'+id));off.h.m.dispose();
});

test('temporary passive applies immediately, expires before income/shop, and never overwrites earned funds or layers',()=>{
  const {h,ps}=setup();ps.layers.kjeragShip=20;
  assert.equal(choose(ps,'band_hs_nozdormu').ok,true);assert.equal(heroView(ps).freeRefresh,1);
  const before=ps.funds;assert.equal(ps.refresh().ok,true);assert.equal(ps.funds,before);
  assert.equal(ps.refresh().ok,true);assert.equal(ps.funds,before-1);
  const saved=ps.layers.kjeragShip;next(h,ps);
  assert.equal(ps.heroState.freeRefresh,0);assert.equal(ps.layers.kjeragShip,saved);
  assert.equal(choose(ps,'band_hs_millhouse').ok,true);assert.equal(ps.privateView().shop.refreshPrice,2);
  next(h,ps);assert.equal(ps.privateView().shop.refreshPrice,1);
  h.m.dispose();
});

test('changing powers restores Sindragosa slots while retaining equipment and spells',()=>{
  const {h,ps}=setup();ps.rollShop();const size=ps.shop.layout.chess,tail=ps.shop.slots.slice(size);
  assert.equal(choose(ps,'band_hs_sindragosa').ok,true);assert.equal(ps.shop.layout.chess,size-1);
  assert.deepEqual(ps.shop.slots.slice(size-1),tail);
  replaceHeroStrategy(ps,'band_hs_omu');assert.equal(ps.shop.layout.chess,size);
  assert.deepEqual(ps.shop.slots.slice(size),tail);assert.equal(ps.nguyenState,undefined);
  h.m.dispose();
});

test('temporary Maiev locks stay physical and unlock normally after the temporary skill expires',()=>{
  const {h,ps}=setup();assert.equal(choose(ps,'band_hs_maiev').ok,true);
  const slot=ps.shop.slots.findIndex(s=>s?.kind==='chess');
  assert.equal(useHeroPower(ps,{action:'use',slot,expectedId:ps.shop.slots[slot].id}).ok,true);
  const locked=ps.hand.find(p=>p?.meta?.handLock);assert.ok(locked);const unlock=locked.meta.handLock.unlockRound;
  next(h,ps);assert.ok(ps.find(locked.uid));next(h,ps);assert.equal(h.m.round,unlock);assert.ok(!ps.hand.some(p=>p?.meta?.handLock));
  h.invariants();h.m.dispose();
});

test('native temporary strategy uses normal battle hooks; default selection resolves before prep-end effects',()=>{
  const {h,ps}=setup();assert.equal(choose(ps,'band_amiya').ok,true);
  assert.equal(heroView(ps).passive,true);assert.equal(ps.battleInput().bandId,'band_amiya');
  next(h,ps);ps.heroState.choices=[{kind:'band',id:'band_amiya',nguyen:true}];
  finishHeroChoices(ps);assert.equal(ps.bandId,'band_amiya');assert.deepEqual(ps.heroState.choices,[]);h.m.dispose();
});

test('Identity replaces into and out of Nguyen permanently and clears old progress without resetting LP',()=>{
  const {h,ps}=setup();assert.equal(choose(ps,'band_hs_elise').ok,true);
  ps.heroState.uses=8;ps.heroState.usedRound=h.m.round;ps.lp=4;const funds=ps.funds;
  ps.offers=[{source:'spell',spellStrategy:true,slots:[{kind:'band',id:'band_hs_nozdormu',price:0}]}];
  assert.equal(ps.pickReward(0).ok,true);assert.equal(ps.nguyenState,undefined);assert.equal(ps.heroState.uses,0);
  assert.equal(ps.heroState.freeRefresh,1);assert.equal(ps.lp,4);assert.equal(ps.funds,funds);
  ps.offers=[{source:'spell',spellStrategy:true,slots:[{kind:'band',id:'band_hs_nguyen',price:0}]}];
  assert.equal(ps.pickReward(0).ok,true);assert.equal(heroView(ps).choices.length,2);const seq=heroView(ps).sequence;
  heroEvent(ps,'onRoundStart',{});assert.equal(heroView(ps).sequence,seq);h.m.dispose();
});

test('switching into teammate discovery initializes the source and does not replay round-start gifts',()=>{
  const {h,ps}=setup();const mate=h.ps('p_1');mate.lastHeroLineup=['chess_char_1_01_a'];
  replaceHeroStrategy(ps,'band_hs_scabbs');assert.equal(heroView(ps).sourcePlayer.playerId,mate.playerId);
  const before=[...ps.hand,...ps.temp].filter(Boolean).length;
  replaceHeroStrategy(ps,'band_hs_mukla');assert.equal([...ps.hand,...ps.temp].filter(Boolean).length,before);
  h.m.dispose();
});

test('Identity defers replacement until an earned hero reward is resolved, and retains the offer',()=>{
  const {h,ps}=setup();replaceHeroStrategy(ps,'band_hs_elise');assert.equal(useHeroPower(ps,{action:'use'}).ok,true);
  ps.offers=[{source:'spell',spellStrategy:true,slots:[{kind:'band',id:'band_hs_omu',price:0}]}];
  assert.ok(ps.pickReward(0).error);assert.equal(ps.offers.length,1);finishHeroChoices(ps);
  assert.equal(ps.pickReward(0).ok,true);assert.equal(ps.bandId,'band_hs_omu');h.m.dispose();
});

test('permanent earned income survives power replacement; a spell really discovers from the imported pool',()=>{
  const {h,ps}=setup();replaceHeroStrategy(ps,'band_hs_cenarius');assert.equal(useHeroPower(ps,{action:'use'}).ok,true);
  replaceHeroStrategy(ps,'band_hs_omu');const ev={income:5};heroEvent(ps,'onIncome',ev);assert.equal(ev.income,6);
  const rec=ALL_SPELLS.find(x=>x.name==='身份揭晓'),item=ps.acquireItem(rec.id,{silent:true});
  assert.equal(ps.castSpell(item.uid).ok,true);assert.equal(ps.offers[0].slots.length,3);
  assert.ok(ps.offers[0].slots.every(x=>strategyPool(ps).includes(x.id)));h.m.dispose();
});

test('two-choice band discovery adapter keeps strategy cards and does not consume inventory slots',()=>{
  const {h,ps}=setup();const offer=heroDiscoveryOffer(heroView(ps),()=>null);
  assert.equal(offer.slots.length,2);assert.ok(offer.slots.every(x=>x.kind==='band'&&x.spellBandChoice&&x.temporaryPower));
  ps.hand=ps.hand.map(()=>ps.newPiece('item','chess_item_1_01_e_a'));ps.temp=ps.temp.map(()=>ps.newPiece('item','chess_item_1_01_e_a'));
  assert.equal(choose(ps,'band_hs_omu').ok,true);h.m.dispose();
});
