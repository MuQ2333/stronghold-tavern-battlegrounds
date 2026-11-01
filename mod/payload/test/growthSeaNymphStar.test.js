import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './match/harness.js';
import {makeBattle} from './helpers/battleHarness.js';
import {DataSource} from '../server/sim/simdata.js';
import {growthData,GROWTH_ROSTER} from '../shared/growthMode.js';
import {installGrowthEconomy} from '../server/match/growthCombat.js';
import {triggerDeathTraits} from '../server/sim/content/garrisons/growthTriggers.js';
import {growthTraitView,growthBattleInfo} from '../server/match/growthTraits.js';

const id=(name,elite=false)=>GROWTH_ROSTER.find(r=>r.name===name).id.replace(/_a$/,elite?'_b':'_a');
function prep(growthMode=true,options={}) {
  const h=makeMatch({growthMode,spellShop:true,heroMod:false,fake:true,mode:'solo',difficulty:'FUNNY',...options});
  h.start();h.toPrep(1);const ps=h.ps('p_0');ps.gd.modeInactiveBonds.clear();h.m.disabledBonds=[];ps.bandId=null;ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);ps.layers={};ps.recompute();
  const put=(name,r,c,elite=false)=>{const p=ps.newPiece('chess',id(name,elite),{poolCopies:0});p.dir='RIGHT';ps.board.set(`${r},${c}`,p);ps.recompute();return p;};
  return {h,ps,put};
}
function combat(t,extra={}) {
  const {ps}=t;
  const bonds=Object.fromEntries(Object.entries(ps.bonds).map(([key,v])=>[key,{...v,layers:ps.layers[key] || 0}]));
  // No Aegir devour/revival side effects in these focused replay tests.
  if(bonds.egirShip)bonds.egirShip.active=false;
  const units=[...ps.board].map(([key,p])=>{const [row,col]=key.split(',').map(Number);return {uid:p.uid,chessId:p.id,row,col,dir:p.dir};});
  const f=makeBattle({data:new DataSource(growthData(DATA,true)),flags:{growthMode:true,layerGainsEnabled:true},players:[{playerId:ps.playerId,units,bonds,...growthBattleInfo(ps,false)}],autoFinish:false,...extra});
  installGrowthEconomy(t.h.m,f.b);t.h.m.phase='COMBAT';
  f.step();return {...f,unit:p=>f.b.allyUnits.find(u=>u.uid===p.uid)};
}
function done(t,f) {f.b.forceEnd();assert.equal(f.b.result().errors,0,JSON.stringify(f.b.errors));assert.deepEqual(t.h.logs.error,[]);assert.deepEqual(t.h.logs.warn,[]);t.h.m.dispose();}

for(const elite of [false,true])test(`Star ${elite?'elite':'normal'} starts at the confirmed yield and adds that initial value per ten spent`,()=>{
 const t=prep(),p=t.put('溯光星源',10,3,elite),base=elite?2:1;
 try {
  for(const spent of [0,9,10,20]) {
   p.meta.growthStarSpent=spent;t.ps.round.spent=3;
   const want=base*(1+Math.floor(spent/10));assert.equal(growthTraitView(t.ps,p).nextValue,want);
   const before={...t.ps.layers};t.h.m.dispatcher.triggerGarrisons(t.ps,p,'SERVER_PREP_FIN');
   for(const bond of ['skillfulShip','arcaneShip'])assert.equal(t.ps.layers[bond]-(before[bond]||0),want);
  }
  const rec=t.ps.gd.garrison(t.ps.gd.chess(p.id).garrisonIds[0]);
  assert.match(rec.desc,new RegExp(`层数＋${base}；.*单次收益额外＋${base}`));
 } finally {t.h.m.dispose();}
});

test('Star yield increases per ten paid gold only on field, survives rounds, and triple inherits maximum progress',()=>{
 const t=prep(),p=t.put('溯光星源',10,3);t.ps.funds=100;
 t.ps.spend(9);t.ps._afterSpend(9,'test');assert.equal(p.meta.growthStarSpent,9);assert.equal(growthTraitView(t.ps,p).nextValue,1);
 t.ps.spend(1);t.ps._afterSpend(1,'test');assert.equal(growthTraitView(t.ps,p).nextValue,2);
 t.ps.round.spent=12;const before=t.ps.layers.skillfulShip || 0;t.h.m.dispatcher.triggerGarrisons(t.ps,p,'SERVER_PREP_FIN');assert.equal(t.ps.layers.skillfulShip,before+8);
 t.ps.board.delete('10,3');t.ps.hand[0]=p;t.ps.recompute();t.h.m.dispatch(t.ps,'onSpend',{amount:20});assert.equal(p.meta.growthStarSpent,10);
 const q=t.ps.newPiece('chess',p.id,{poolCopies:0});q.meta.growthStarSpent=23;t.ps.hand[1]=q;t.ps.acquireChess(p.id,{fromPool:false,silent:true});const elite=t.ps.allChess().find(x=>x.id===id('溯光星源',true));assert.equal(elite.meta.growthStarSpent,23);assert.equal(growthTraitView(t.ps,elite).nextValue,6);t.h.m.dispose();
});

test('Star copies the entire current excess temporarily once per field; multiple copies do not multiply it',()=>{
 const t=prep(),star=t.put('溯光星源',10,3);t.put('溯光星源',11,3);t.put('录武官',10,4);t.put('初雪',12,4);
 t.ps.layers={skillfulShip:1100,yanShip:30,kjeragShip:10,arcaneShip:800};t.ps.recompute();t.ps.addLayers('skillfulShip',50);
 assert.equal(t.ps.layers.skillfulShip,1150);assert.equal(growthTraitView(t.ps,star).overflow,151);
 const f=combat(t),p=f.b.getPlayer(t.ps.playerId);assert.equal(t.ps.layers.yanShip,30);assert.equal(p.bonds.yanShip.layers,181);
 assert.equal(p.bonds.arcaneShip.layers,800);assert.equal(p.bonds.skillfulShip.layers,1150);
 f.b.emit('battleStart',{});assert.equal(p.bonds.yanShip.layers,181);f.b.forceEnd();assert.deepEqual(f.b.result().perPlayer[t.ps.playerId].layerGains,{});
 const next=combat(t,{kind:'unite',flags:{growthMode:true,layerGainsEnabled:false}});
 assert.equal(next.b.getPlayer(t.ps.playerId).bonds.yanShip.layers,181,'unite reapplies once from persistent input, not on top of the normal temporary copy');
 assert.equal(t.ps.layers.yanShip,30);done(t,next);
});

test('Star uses next field opening layers and never turns battle-only gains into permanent resources',()=>{
 const t=prep();t.put('溯光星源',10,3);t.put('录武官',10,4);t.ps.layers={skillfulShip:995,yanShip:1200};t.ps.recompute();
 const f=combat(t),pid=t.ps.playerId;
 f.b.addLayers(pid,'skillfulShip',20,'spell',{temporary:true});
 for(const n of [2,10,3])f.b.addLayers(pid,'skillfulShip',n,'growth');
 assert.equal(f.b.getPlayer(pid).bonds.skillfulShip.layers,1030);assert.equal(f.b.getPlayer(pid).bonds.yanShip.layers,1200,'no mid-fight conversion');
 f.b.forceEnd();assert.equal(f.b.result().perPlayer[pid].layerGains.skillfulShip,15);
 t.ps.layers.skillfulShip+=15;
 const next=combat(t);assert.equal(next.b.getPlayer(pid).bonds.yanShip.layers,1211);assert.equal(t.ps.layers.yanShip,1200);done(t,next);
});

for(const elite of [false,true])test(`Sea Nymph ${elite?'elite':'normal'} spawns a real eligible Egir at her tile, inherits kits/bond buffs, never draws stock`,()=>{
 const t=prep(),p=t.put('海霓',10,3,elite),stock=t.h.m.pool.snapshot();const input=t.ps.battleInput();
 const only=id('斯卡蒂');input.growthEgirPool=[only];input.bonds.egirShip={active:true,count:1,tier:1,layers:200};input.bonds.indomShip={active:false,count:0,tier:0,layers:0};
 const f=combat(t,{players:[input]}),parent=f.unit(p);f.b.kill(parent);
 const child=f.b.allyUnits.find(u=>u.growthSummoner===parent);assert.ok(child);assert.equal(child.defId,elite?id('斯卡蒂',true):only);assert.equal(child.kind,'op');assert.ok(child.kit);assert.ok(child.skill);assert.equal(child.alive,true);assert.deepEqual([child.tileR,child.tileC],[parent.tileR,parent.tileC]);assert.ok(child.s.atk>child.base.atk);assert.equal(child.findBuff('bond:egir').mods.hpPct,undefined);assert.deepEqual(t.h.m.pool.snapshot(),stock);assert.equal(t.ps.allChess().length,1);
 const before=t.ps.shop.freeRefreshes;f.b.kill(child);assert.equal(child.removed,true);assert.equal(f.b._pp(t.ps.playerId).growthFreeRefreshes,elite?2:1);assert.equal(t.ps.shop.freeRefreshes,before);assert.equal(parent.growthSummonWait,undefined);done(t,f);
});

test('Sea Nymph waits for every repeated summon first defeat; immediate child revival counts, parent waits for original tile without reroll or overlap',()=>{
 const t=prep(),p=t.put('海霓',10,3);t.put('隐德来希',12,4);const input=t.ps.battleInput();input.growthEgirPool=[id('斯卡蒂')];input.bonds.egirShip.active=false;input.bonds.indomShip={active:true,count:2,tier:2,layers:999};
 const f=combat(t,{players:[input]}),parent=f.unit(p);f.b.kill(parent);const children=f.b.allyUnits.filter(u=>u.growthSummoner===parent);assert.equal(children.length,2);assert.equal(parent.alive,false);assert.equal(parent.growthSummonWait.children.size,2);
 f.b.kill(children[0]);assert.equal(children[0].alive,true);assert.equal(parent.growthSummonWait.children.size,1);assert.equal(parent.alive,false);
 f.b.kill(children[1]);assert.equal(children[1].alive,true);assert.equal(parent.growthSummonWait,undefined);assert.equal(parent.growthIndomPending,true);assert.equal(parent.alive,false);f.step();assert.equal(parent.alive,false);
 const dp=f.b.getPlayer(t.ps.playerId).dp;f.b.retreat(children[0],{permanent:true});f.step();assert.equal(parent.alive,true);assert.equal(parent.growthIndomPending,undefined);assert.deepEqual([parent.tileR,parent.tileC],[10,3]);assert.ok(f.b.getPlayer(t.ps.playerId).dp>=dp);done(t,f);
});

test('Sea Nymph synthetic defeat summons without an actual death or invoking her Indom; summon gain replay uses a virtual card facade',()=>{
 const t=prep(),p=t.put('海霓',10,3),g=t.put('歌蕾蒂娅',11,4),donor=t.put('角峰',11,3);const input=t.ps.battleInput();input.growthEgirPool=[id('歌蕾蒂娅')];input.bonds.egirShip.active=false;
 const f=combat(t,{players:[input]}),parent=f.unit(p);triggerDeathTraits(f.b,parent);assert.equal(parent.alive,true);assert.equal(parent.growthSummonWait,undefined);
 const child=f.b.allyUnits.find(u=>u.growthSummoner===parent);assert.ok(child);assert.equal(child.growthPiece.kind,'chess');assert.equal(t.ps.find(child.uid),null);
 const before=t.ps.shop.freeRefreshes;f.b.emit('growthGainTrait',{unit:child});assert.equal(t.ps.shop.freeRefreshes,before);
 assert.equal(t.ps.find(g.uid).piece,g);assert.equal(t.ps.find(donor.uid).piece,donor);done(t,f);
});

test('Sea Nymph eligibility follows match bans, not remaining stock, and excludes both forms of herself',()=>{
 const t=prep();t.put('海霓',10,3);const allowed=growthBattleInfo(t.ps,false).growthEgirPool;assert.ok(allowed.length);assert.ok(allowed.every(x=>!x.startsWith('chess_char_3_09_')));
 const candidate=allowed[0];t.h.m.pool.take(candidate,t.h.m.pool.left(candidate));assert.equal(t.h.m.pool.left(candidate),0);assert.ok(growthBattleInfo(t.ps,false).growthEgirPool.includes(candidate));t.h.m.pool.entries.delete(candidate);assert.ok(!growthBattleInfo(t.ps,false).growthEgirPool.includes(candidate));t.h.m.dispose();
});

test('a summoned Gladiia replays a real neighbour gain without acquiring the summon or drawing stock',()=>{
 const t=prep(),p=t.put('海霓',10,3);t.put('角峰',10,2);const input=t.ps.battleInput();input.growthEgirPool=[id('歌蕾蒂娅')];input.bonds.egirShip.active=false;
 const f=combat(t,{players:[input]}),parent=f.unit(p);f.b.kill(parent);const child=f.b.allyUnits.find(u=>u.growthSummoner===parent);const before=t.ps.layers.kjeragShip || 0;triggerDeathTraits(f.b,child);assert.equal(t.ps.layers.kjeragShip,before+2);assert.equal(t.ps.allChess().length,2);done(t,f);
});

test('growth Indom includes ranged operators and native mode still excludes them',()=>{
 const bonds={indomShip:{active:true,count:3,tier:2,layers:999}};
 for(const enabled of [false,true]) {
  const f=makeBattle({data:new DataSource(enabled?growthData(DATA,true):DATA),flags:{growthMode:enabled,layerGainsEnabled:true},units:[{chessId:id('莫斯提马'),row:10,col:3}],bonds,autoFinish:false});f.step();const u=f.b.allyUnits[0];f.b.kill(u);assert.equal(u.alive,enabled);f.b.forceEnd();assert.equal(f.b.result().errors,0);
 }
});

test('every allowed Egir summon keeps its actual kit and growth trait in both grades without sim faults',()=>{
 const sample=prep(),ids=growthBattleInfo(sample.ps,false).growthEgirPool;sample.h.m.dispose();
 for(const elite of [false,true])for(const candidate of ids) {
  const t=prep(),p=t.put('海霓',10,3,elite),input=t.ps.battleInput();input.growthEgirPool=[candidate];input.bonds.egirShip.active=false;
  const f=combat(t,{players:[input]}),parent=f.unit(p);f.b.kill(parent);const child=f.b.allyUnits.find(u=>u.growthSummoner===parent);assert.ok(child,candidate);assert.equal(child.defId,elite?candidate.replace(/_a$/,'_b'):candidate);f.step(8);f.b.kill(child);f.step(2);done(t,f);
 }
});
